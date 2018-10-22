const forwarder = require('./lib/forwarder')
const debug = require('debug')('Forwarder')
const Telegram = require('telegraf/telegram')
const vkApi = require('./lib/vkapi')
const Filter = require('./lib/filter')
// const util = require('util')
const herokuPosts = {}

module.exports = class Forwarder {

    /**
     * @param {Object} options
     * @param {String} options.botToken - Telegram bot token from @botfather
     * @param {String} [options.chatName] - Telegram chat name starts with @
     * @param {Number} [options.chatId] - Telegram chat id (will replace chatName)
     * @param {String} options.vkConfirmation - Confirmation token from VK group
     * @param {String} options.vkToken - Your VK API token (needs for media, like video or docs)
     * @param {Number} options.ownerId - Your telegram id (@getidsbot)
     * @param {String} [options.fromId=null] - VK group id
     * @param {Boolean} [options.debug=false] - Debug requests?
     * @param {String} [options.customVkButton=''] - if empty no button will be appended
     * @param {String} [options.customPollTitle=''] - Custom title before poll title ?
     * @param {String} [options.customLongPostText='[Read full post in VK]'] - If Post text too long for telegram(max 4096 char) send this text
     * @param {Boolean} [options.heroku=false] - Heroku mode?
     * @param {Number} [options.herokuTimeout=10000] - Heroku posts timeout
     * @param {String} [options.signed='👨'] - Show signer in post? (if available)
     * @param {String} [options.secret] - Secret key from your vk community
     * @param {String} [options.filterByWord] - Filter posts by key word(s) (use '-' in start to invert)
     * @param {String} [options.filterByHashtag] - Filter posts by hashtag (use '-' in start to invert)
     */
    constructor(options) { 
        this.token = options.botToken
        this.chatName =  options.chatName ? options.chatName.startsWith('@') ? options.chatName : `@${options.chatName}` : ''
        this.vkConfirmation = options.vkConfirmation
        this.ownerId = options.ownerId
        this.vkToken = options.vkToken
        this.fromId = options.fromId || null
        this.chatId = options.chatId || null
        this.debug = options.debug || false
        this.customVkButton = options.customVkButton || ''
        this.customPollTitle = options.customPollTitle || ''
        this.customLongPostText = options.customLongPostText || '[Read full post in VK]'
        this.heroku = options.heroku || false
        this.herokuTimeout = options.herokuTimeout || 10000
        this.signed = options.signed || '👨'
        this.secret = options.secret
        this.filterByWord = options.filterByWord ? options.filterByWord.split(',') : []
        this.filterByHashtag = options.filterByHashtag ? options.filterByHashtag.split(',') : []
        this.send = this.send.bind(this)
    }
    async send (ctx, res) {
        let body
        const request = () => {
            if (ctx.message) {
                return ctx.request
            } else {
                return ctx
            }
        }
        const callback = async data => {
            if (ctx.message) {
                ctx.body = data
            } else {
                res.send(data)
            }
        }
        try {
            body = JSON.parse(JSON.stringify(request().body))
        } catch (e) {
            throw `Error with body from vk: \n\n${request().body}\n${request().ip}`
        }
        debug('Post body: %b', body) 
        if (body.type === 'confirmation') {
            await callback(this.vkConfirmation)
            return
        } else {
            await callback('ok')
        }
        if (this.secret) {
            if (!body.secret || body.secret !== this.secret) {
                throw 'Secret field do not match'
            }
        }
        const telegram = new Telegram(this.token)
        const vkapi = vkApi(this.vkToken)
        const filter = new Filter({
            words: this.filterByWord,
            tags: this.filterByHashtag
        })

        if (this.debug) {debug('heroku Obj: %p', herokuPosts) }
        if (this.heroku) {
            const newPost = { id: body.object.id, date: Date.now() }
            if (herokuPosts[body.group_id] && Object.keys(herokuPosts[body.group_id]).length > 0) {
                for (const id in herokuPosts[body.group_id]) {
                    const post = herokuPosts[body.group_id][id]
                    if (Date.now() - post.date > this.herokuTimeout) {
                        delete herokuPosts[body.group_id][id]
                    }
                }
                const post = herokuPosts[body.group_id][newPost.id]
                if (post) {

                    throw `Double post detected ${JSON.stringify(body.object)}`
                } else {
                    herokuPosts[body.group_id][newPost.id] = { date: newPost.date }
                }
            } else {
                herokuPosts[body.group_id] = {
                    [newPost.id]: { date: newPost.date }
                }
            }
        }
        if (this.debug) {debug('heroku Obj: %p', herokuPosts) }
        
        if (this.fromId ? body.object.from_id !== this.fromId : false) {
            throw `Wrong post from_id: ${body.object.from_id} !== ${this.fromId}`
        }
        if (body.type !== 'wall_post_new') {
            throw 'Not a event.type wall_post_new'
        }
        if (body.object.post_type !== 'post') {
            throw 'Not a post.type post'
        }
        const { response } = await vkapi.wall.getById(`${body.object.owner_id}_${body.object.id}`, {
                copy_history_depth: 1
            })

        if (response.length) {
            const messages = []
            const post = response[0]
            if (post.text) {
                if (post.text.length > 4090) {
                    post.text = this.get('customLongPostText').replace(/\[([\S\s]*?)\]/ig, `<a href="https://vk.com/wall${post.owner_id}_${post.id}">$1</a>`)
                } else {
                    filter(post.text)
                }
            }
            const chatId = this.chatId ? this.chatId : (await telegram.getChat(this.chatName)).id
            if (this.debug) { debug('chatId: %c', chatId) }
            this.chatId = chatId
            const forward = forwarder(this)
            if (this.signed && post.signer_id) {
                const signer = (await vkapi.users.get(post.signer_id)).response[0]
                post.text += `\n\n[id${signer.id}|${this.signed} ${signer.first_name} ${signer.last_name ? signer.last_name : ''}]`
            }
            messages.push({type:'post', post: await forward(post)})
            if (post.copy_history) {
                const repost = post.copy_history[post.copy_history.length - 1]
                if (repost.text) {
                    if (repost.text.length > 4090) {
                        repost.text = this.customLongPostText.replace(/\[([\S\s]*?)\]/ig, `<a href="https://vk.com/wall${repost.owner_id}_${repost.id}">$1</a>`)
                    } else {
                        filter(repost.text)
                    }
                }
                if (this.signed && repost.signer_id) {
                    const repostSigner = (await vkapi.users.get(repost.signer_id)).response[0]
                    repost.text += `\n\n[id${repostSigner.id}|${this.signed} ${repostSigner.first_name} ${repostSigner.last_name ? repostSigner.last_name : ''}]`
                }
                messages.push({type: 'repost', post: await forward(repost)})
            }
            return messages
        }
    }
}