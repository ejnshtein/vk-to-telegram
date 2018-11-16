const Telegram = require('telegraf/telegram')
const debug = require('debug')('forwarder')
const utils = require('./utils')
const defaultConfig = require('./default-config')
const Sender = require('./sender')
// const util = require('util')
const Entities = require('html-entities').AllHtmlEntities
const { decode } = new Entities()
// const audioParser = require('./audio-parser') // work in progress

/**
 * @desc Makes string capitalized.
 */
String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

module.exports = (config) => {
    const telegram = new Telegram(config.token)
    const { sendDocument, sendPhoto, sendVideo } = Sender(config)
    return async post => {
        const chatId = config.chatId
        let mediaText = post.text || ''
        if (config.debug) {
            debug('Forwarding post: %m', post)
        }
        mediaText = mediaText.replace(/\[(\S+)\|([\S\s]*?)\]/ig, '<a href="https://vk.com/$1">$2</a>') // parse vk markdown to html [vkId|Text] => <a href=vk.com/vkId>Text</a>
        mediaText = decode(mediaText)
        const messageExtra = defaultConfig()
        if (config.customVkButton) {
            messageExtra.reply_markup.inline_keyboard.push([{
                text: config.customVkButton,
                url: `https://vk.com/wall${post.owner_id}_${post.id}`
            }])
        }
        let { attachments } = post
        const attachmentLink = []
        if (attachments && attachments.length) {
            if (attachments.some(el => el.type === 'link')) {
                attachments.filter(el => el.type === 'link').forEach(({ link }) => {
                    if (/^[\d?\s]*$/ig.test(link.title)) {
                        link.title = 'Read more'
                    }
                    attachmentLink.push(link)
                    messageExtra.reply_markup.inline_keyboard.unshift([{
                        text: decode(link.title).capitalize(),
                        url: link.url
                    }])
                })
                attachments = attachments.filter(el => el.type !== 'link')
            }
            if (attachments.some(el => el.type === 'poll')) {
                const { poll } = attachments.find(el => el.type === 'poll')
                messageExtra.reply_markup.inline_keyboard.unshift([{
                    text: config.customPollTitle ? `${config.customPollTitle} - ${decode(poll.question)}` : decode(poll.question),
                    url: `https://vk.com/poll${post.owner_id}_${post.id}`
                }])
            }
        } else {
            if (mediaText) {
                return telegram.sendMessage(chatId, mediaText.toString(), messageExtra)
            }
            return 'Nothing to forward'
        }
        attachments = attachments.filter(el => el.type !== 'audio' && el.type !== 'poll') // audio disabled by VK
        if (attachments.length === 0 && attachmentLink.length) {
            messageExtra.disable_web_page_preview = false
            return telegram.sendMessage(chatId, `<a href="${attachmentLink[0].url}">&#160;</a>${mediaText ? `${mediaText}\n\n` : ''}${attachmentLink.map(link => `<a href="${link.url}">${decode(link.title).capitalize()}</a>`).join('\n')}`, messageExtra)
        } else if (attachments.length === 1 && (attachments[0].type === 'photo' || attachments[0].type === 'doc' || attachments[0].type === 'album' || attachments[0].type === 'video')) {
            switch (attachments[0].type) {
                case 'video':
                    return sendVideo(attachments[0].video, mediaText, messageExtra)
                case 'photo':
                    return sendPhoto(attachments[0].photo, mediaText, messageExtra)
                case 'doc':
                    return sendDocument(attachments[0].doc, mediaText, messageExtra)
                case 'album':
                    if (!mediaText && attachments[0].album.description.length < 1000) {
                        mediaText = decode(attachments[0].album.description)
                    }
                    messageExtra.reply_markup.inline_keyboard.unshift([{
                        text: decode(attachments[0].album.title),
                        url: `https://vk.com/album${attachments[0].album.owner_id}_${attachments[0].album.id}`
                    }])
                    messageExtra.disable_web_page_preview = false
                    return telegram.sendMessage(chatId, `<a href="${utils.photo.getHQ(attachments[0].album.thumb)}">&#160;</a><a>${mediaText}</a>`, messageExtra)
            }
        } else if (mediaText.length < 1000 && utils.isAlbum(attachments)) {
            const attachmentsArray = []
            for (const attachment of attachments) {
                attachmentsArray.push({
                    type: 'photo',
                    media: {
                        url: utils.photo.getHQ(attachment.photo)
                    },
                    caption: mediaText ? mediaText : '',
                    parse_mode: 'HTML'
                })
                mediaText = ''
            }

            if (messageExtra.reply_markup.inline_keyboard.length > 0) {
                let attachmentsExtraText = []
                messageExtra.reply_markup.inline_keyboard.forEach(el => attachmentsExtraText.push(el.text))
                if (attachmentsArray[0].caption.length + attachmentsExtraText.join('\n\n').length < 1000) {
                    attachmentsExtraText = []
                    messageExtra.reply_markup.inline_keyboard.forEach(el => attachmentsExtraText.push(`<a href="${el[0].url}">${el[0].text}</a>`))
                    attachmentsArray[0].caption += `\n\n${attachmentsExtraText.join('\n\n')}`
                }
            }
            return telegram.sendMediaGroup(chatId, attachmentsArray)
        } else if (attachments.every(el => el.type === 'album')) {
            const attachmentsArray = []
            for (const attachment of attachments) {
                attachmentsArray.push({
                    type: 'photo',
                    post: {
                        url: utils.photo.getHQ(attachment.album.thumb)
                    },
                    caption: `<a href="https://vk.com/album${attachment.album.owner_id}_${attachment.album.id}">${decode(attachment.album.title)}</a>`,
                    parse_mode: 'HTML'
                })
            }
            return Promise.all([telegram.sendMessage(chatId, mediaText, messageExtra), telegram.sendMediaGroup(chatId, attachmentsArray)])
        } else {
            attachments = attachments.filter(el => el.type !== 'link')

            let mediaExtra = messageExtra
            const mediaPoster = async post => {
                const posts = post ? [post] : []
                if (config.debug) {
                    debug('Forwarding posts')
                }
                for (let i = 0; i < attachments.length; i++) {
                    if (posts.length) {
                        mediaExtra = defaultConfig()
                    }
                    const attachment = attachments[i]
                    switch (attachment.type) {
                        case 'poll':
                            // here code for pools
                            // someday i will write it...
                            i++
                            mediaPoster()
                            break
                        case 'photo':
                            const photosArray = []
                            while (i < attachments.length && attachments[i].type === 'photo') {
                                photosArray.push({
                                    type: 'photo',
                                    post: {
                                        url: utils.photo.getHQ(attachments[i].photo)
                                    },
                                    caption: attachments[i].photo.text.length < 1000 ? decode(attachments[i].photo.text) : '',
                                    parse_mode: 'HTML'
                                })
                                i++
                            }
                            if (photosArray.length === 1) {
                                posts.push(telegram.sendPhoto(chatId, photosArray[0].post.url, mediaExtra))
                            } else {
                                posts.push(telegram.sendMediaGroup(chatId, photosArray))
                            }
                            break
                        case 'doc':
                            posts.push(sendDocument(attachments[i].doc, null, mediaExtra))
                            break
                        case 'video':
                            posts.push(sendVideo(attachments[i].video, null, mediaExtra))
                            break
                        case 'album':
                            mediaExtra.reply_markup.inline_keyboard.unshift([{
                                text: decode(attachments[i].album.title),
                                url: `https://vk.com/album${attachments[i].album.owner_id}_${attachments[i].album.id}`
                            }])
                            mediaExtra.disable_web_page_preview = false
                            posts.push(sendPhoto(attachments[i].album.thumb, null, mediaExtra))
                            break
                    }
                }
                return Promise.all(posts)
            }
            if (mediaText) {
                messageExtra.disable_web_page_preview = true
                // console.log(JSON.stringify(messageExtra))
                return mediaPoster(telegram.sendMessage(chatId, mediaText, messageExtra))
            } else {
                if (attachmentLink.length) {
                    messageExtra.disable_web_page_preview = false
                    return mediaPoster(telegram.sendMessage(chatId, `<a href="${attachmentLink[0].url}">&#160;</a>${attachmentLink.map(link => `<a href="${link.url}">${decode(link.title).capitalize()}</a>`).join('\n')}`, messageExtra))
                } else {
                    return mediaPoster()
                }
            }
        }
    }
}