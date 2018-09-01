const forward = require('./lib/forwarder')
const Telegram = require('telegraf/telegram')
const vkApi = require('./lib/vkapi')
const util = require('util')
const herokuPosts = {}

module.exports = class Forwarder {

    /**
     * @param {object} options
     * @param {string} options.botToken - Telegram bot token from @botfather
     * @param {string} options.chatName - Telegram chat name starts with @
     * @param {String} [options.chatId] - Telegram chat id (will replace chatName)
     * @param {string} options.vkConfirmation - Confirmation token from VK group
     * @param {string} options.vkToken - Your VK API token (needs for media, like video or docs)
     * @param {string} options.ownerId - Your telegram id (@getidsbot)
     * @param {string} [options.fromId=null] - VK group id
     * @param {Boolean} [options.debug] - Debug requests?
     * @param {String} [options.customVkButton] - if empty no button will be appended
     * @param {String} [options.customPollTitle] - Custom title before poll title ?
     * @param {String} [options.customLongPostText] - If Post text too long for telegram(max 4096 char) send this text
     * @param {Boolean} [options.heroku] - Heroku mode?
     * @param {Number} [options.herokuTimeout] - Heroku posts timeout
     * @param {String} [options.signed] - Show signer in post? (if available)
     */
    constructor(options) { 
        this.token = options.botToken
        this.chatName = /^@/ig.test(options.chatName) ? options.chatName : `@${options.chatName}`
        this.vkConfirmation = options.vkConfirmation
        this.ownerId = options.ownerId
        this.vkToken = options.vkToken
        this.fromId = options.fromId || null
        this.chatId = options.chatId || null
        this.debug = options.debug || false
        this.customVkButton = options.customVkButton || null
        this.customPollTitle = options.customPollTitle || null
        this.customLongPostText = options.customLongPostText || '[Read full post in VK]'
        this.heroku = options.heroku || null
        this.herokuTimeout = options.herokuTimeout || 10000
        this.signed = options.signed || null
        this.send = this.send.bind(this)
        this.handleError = (err) => {
            util.log(err)
            throw err
        }
    }
    get (name) {
        return this[name]
    }
    set (name, value) {
        this[name] = value
        return this
    }
    send (request, response) {
        let body
        
        let telegram
        let vkapi
        const messages = []
        let forwarder
        
        return new Promise((resolve, reject) => {
                try {
                    body = JSON.parse(JSON.stringify(request.body))
                    if (this.debug) { util.log(body) }
                } catch (e) {
                    return reject(`Here's an error: \n\n${request.body}\n${request.ip}`)
                }
                if (body.type === 'confirmation') {
                    response.send(this.vkConfirmation)
                    return
                } else {
                    response.send('ok')
                }
                if (this.debug) { util.log(herokuPosts) }
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
                            return reject(`Double post detected ${JSON.stringify(body.object)}`)
                        } else {
                            herokuPosts[body.group_id][newPost.id] = { date: newPost.date }
                        }
                    } else {
                        herokuPosts[body.group_id] = {
                            [newPost.id]: { date: newPost.date }
                        }
                    }
                }
                if (this.debug) { util.log(herokuPosts) }
                telegram = new Telegram(this.token)
                vkapi = vkApi(this.vkToken)
                resolve()
            })
            .then(() => this.chatId ? { id: this.chatId } : telegram.getChat(this.chatName))
            .then(chat => {
                if (this.debug) { util.log(chat) }
                this.chatId = chat.id
                forwarder = forward(this)
                if ((this.fromId ? body.object.from_id === this.fromId : true) && body.type === 'wall_post_new' && body.object.post_type === 'post') {
                    if (body.object.text.length > 4090) {
                        body.object.text = this.get('customLongPostText').replace(/\[([\S\s]*?)\]/ig, `<a href="https://vk.com/wall${body.object.owner_id}_${body.object.id}">$1</a>`)
                    }
                    if (this.signed && body.object.signer_id) {
                        return vkapi.users.get(body.object.signer_id)
                            .then(response => response.response[0])
                            .then(signer => {
                                if (signer) {
                                    body.object.text += `\n\n[id${signer.id}|${this.signed} ${signer.first_name} ${signer.last_name ? signer.last_name : ''}]`
                                }
                                return forwarder(body.object)
                            })
                    } else {
                        return forwarder(body.object)
                    }
                } else {
                    throw `post not sent ${body.object}`
                }
            })
            .then(message => {
                if (message) {
                    messages.push({type:'post', post: message})
                }
                return
            })
            .then(() => {
                if (body.object.copy_history) {
                    const repost = body.object.copy_history[body.object.copy_history.length - 1]
                    if (repost.text.length > 4090) {
                        repost.text = this.get('customLongPostText').replace(/\[([\S\s]*?)\]/ig, `<a href="https://vk.com/wall${body.object.owner_id}_${body.object.id}">$1</a>`)
                    }
                    if (this.signed && repost.signer_id) {
                        return vkapi.users.get(repost.signer_id)
                            .then(response => response.response[0])
                            .then(signer => {
                                if (signer) {
                                    repost.text += `\n\n[id${signer.id}|${this.signed} ${signer.first_name} ${signer.last_name ? signer.last_name : ''}]` // 👨
                                }
                                return forwarder(repost)
                            })
                    } else {
                        return forwarder(repost)
                    }
                } else {
                    return null
                }
            })
            .then(message => {
                if (message) { messages.push({type:'repost', repost: message}) }
                return messages
            })
    }
    
    catch (handler) {
        this.handleError = handler
        return this
    }
}