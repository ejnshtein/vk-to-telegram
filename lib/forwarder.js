const Telegram = require('telegraf/telegram')
const utils = require('./utils')
const DefaultConfig = require('./default-config')
const Sender = require('./sender')
const util = require('util')
const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()
// const audioParser = require('./audio-parser') // work in progress

/**
 * @desc Makes string capitalized.
 */
String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

module.exports = (config) => {
    const telegram = new Telegram(config.token)
    const sender = Sender(config.token, config.vkToken)
    sender.setChatId = config.get('chatId')
    return (media) => new Promise((resolve, reject) => {
        let mediaText = media.text || ''
        if (config.get('debug')) {
            util.log(media)
        }
        mediaText = mediaText.replace(/\[(\S+)\|([\S\s]*?)\]/ig, '<a href="https://vk.com/$1">$2</a>') // parse vk markdown to html [vkId|Text] => <a href=vk.com/vkId>Text</a>
        mediaText = entities.decode(mediaText)
        const messageExtra = DefaultConfig()
        if (config.get('customVkButton')) {
            messageExtra.reply_markup.inline_keyboard.push([{
                text: config.get('customVkButton'),
                url: `https://vk.com/wall${media.owner_id}_${media.id}`
            }])
        }
        let { attachments } = media
        const attachmentLink = []
        let poll
        if (attachments) {
            if (attachments.some(el => el.type === 'link')) {
                attachments.filter(el => el.type === 'link').forEach(({ link }) => {
                    if (/^[\d?\s]*$/ig.test(link.title)) {
                        link.title = 'Read more'
                    }
                    attachmentLink.push(link)
                    messageExtra.reply_markup.inline_keyboard.unshift([{
                        text: entities.decode(link.title).capitalize(),
                        url: link.url
                    }])
                })
                attachments = attachments.filter(el => el.type !== 'link')
            }
            if (attachments.some(el =>  el.type === 'poll')) {
                poll = attachments.find(el => el.type === 'poll').poll
                messageExtra.reply_markup.inline_keyboard.unshift([{
                    text: config.get('customPollTitle') ? `${config.get('customPollTitle')} - ${entities.decode(poll.question)}` : entities.decode(poll.question),
                    url: `https://vk.com/poll${media.owner_id}_${media.id}`
                }])
            }
        } else {
            if (mediaText) {
                telegram.sendMessage(config.get('chatId'), mediaText.toString(), messageExtra)
                    .then(resolve)
                    .catch(reject)
            } else {
                resolve()
            }
            return
        }

        attachments = attachments.filter(el => el.type !== 'audio' && el.type !== 'poll') // audio disabled by VK
        
        if (attachments.length === 0 && attachmentLink.length) {
            messageExtra.disable_web_page_preview = false
            telegram.sendMessage(config.get('chatId'), `<a href="${attachmentLink[0].url}">&#160;</a>${mediaText ? `${mediaText}\n\n` : ''}${attachmentLink.map(link => `<a href="${link.url}">${entities.decode(link.title).capitalize()}</a>`).join('\n')}`, messageExtra)
                .then(resolve)
                .catch(reject)
        } else if (attachments.length === 1 && (attachments[0].type === 'photo' || attachments[0].type === 'doc' || attachments[0].type === 'album' || attachments[0].type === 'video')) {
            switch (attachments[0].type) {
                case 'video':
                    sender.sendVideo(attachments[0].video, mediaText, messageExtra)
                        .then(resolve)
                        .catch(reject)
                    break
                case 'photo':
                    sender.sendPhoto(attachments[0].photo, mediaText, messageExtra)
                        .then(resolve)
                        .catch(reject)
                    break
                case 'doc':
                    sender.sendDocument(attachments[0].doc, mediaText, messageExtra)
                        .then(resolve)
                        .catch(reject)
                    break
                case 'album':
                    if (!mediaText && attachments[0].album.description.length < 190) {
                        mediaText = entities.decode(attachments[0].album.description)
                    }
                    messageExtra.reply_markup.inline_keyboard.unshift([{
                        text: entities.decode(attachments[0].album.title),
                        url: `https://vk.com/album'${attachments[0].album.owner_id}_${attachments[0].album.id}`
                    }])
                    messageExtra.disable_web_page_preview = false
                    telegram.sendMessage(config.get('chatId'), `<a href="${utils.photo.getHQ(attachments[0].album.thumb)}">&#160;</a><a>${mediaText}</a>`, messageExtra)
                        .then(resolve)
                        .catch(reject)
                    break
            }
        } else if (mediaText.length < 190 && utils.isAlbum(attachments)) {
            const attachmentsArray = []
            for (const key in attachments) {
                attachmentsArray.push({
                    type: 'photo',
                    media: {
                        url: utils.photo.getHQ(attachments[key].photo)
                    },
                    caption: mediaText ? mediaText : '',
                    parse_mode: 'HTML'
                })
                mediaText = null
            }
            
            if (messageExtra.reply_markup.inline_keyboard.length > 0) {
                let attachmentsExtraText = []
                messageExtra.reply_markup.inline_keyboard.forEach(el => attachmentsExtraText.push(el.text))
                if (attachmentsArray[0].caption.length + attachmentsExtraText.join('\n\n').length < 190) {
                    attachmentsExtraText = []
                    messageExtra.reply_markup.inline_keyboard.forEach(el => attachmentsExtraText.push(`<a href="${el[0].url}">${el[0].text}</a>`))
                    attachmentsArray[0].caption += `\n\n${attachmentsExtraText.join('\n\n')}`
                }
            }
            telegram.sendMediaGroup(config.get('chatId'), attachmentsArray)
                .then(resolve)
                .catch(reject)
        } else if (attachments.every(el => el.type === 'album')) {
            const attachmentsArray = []
            for (const key in attachments) {
                attachmentsArray.push({
                    type: 'photo',
                    media: {
                        url: utils.photo.getHQ(attachments[key].album.thumb)
                    },
                    caption: `<a href="https://vk.com/album${attachments[key].album.owner_id}_${attachments[key].album.id}">${entities.decode(attachments[key].album.title)}</a>`,
                    parse_mode: 'HTML'
                })
            }
            telegram.sendMessage(config.get('chatId'), mediaText, messageExtra)
                .then(msg => {
                    
                telegram.sendMediaGroup(config.get('chatId'), attachmentsArray)
                .then(album => {
                    resolve([msg, album])
                })
                .catch(reject)
                })
        } else {
            attachments = attachments.filter(el => el.type !== 'link')

            let i = 0
            let mediaExtra = messageExtra
            const posts = []
            const mediaPoster = (post) => {
                if (post) { posts.push(post) }
                if (post && config.get('debug')) { util.log(post) }
                if (posts.length) { mediaExtra = DefaultConfig() }
                if (i < attachments.length) {
                    switch (attachments[i].type) {
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
                                    media: {
                                        url: utils.photo.getHQ(attachments[i].photo)
                                    },
                                    caption: attachments[i].photo.text.length < 190 ? entities.decode(attachments[i].photo.text) : '',
                                    parse_mode: 'HTML'
                                })
                                i++
                            }
                            if (photosArray.length === 1) {
                                telegram.sendPhoto(config.get('chatId'), photosArray[0].media.url, mediaExtra)
                                    .then(msg => mediaPoster(msg))
                                    .catch(reject)
                            } else {
                                telegram.sendMediaGroup(config.get('chatId'), photosArray)
                                    .then(msg => mediaPoster(msg))
                                    .catch(reject)
                            }
                            break
                        case 'doc':
                            sender.sendDocument(attachments[i].doc, null, mediaExtra)
                                .then(msg => {
                                    i++
                                    mediaPoster(msg)
                                })
                            
                            break
                        case 'video':
                            sender.sendVideo(attachments[i].video, null, mediaExtra)
                                .then(msg => {
                                    i++
                                    mediaPoster(msg)
                                })
                                .catch(reject)
                            break
                        case 'album':
                            mediaExtra.reply_markup.inline_keyboard.unshift([{
                                text: entities.decode(attachments[i].album.title),
                                url: `https://vk.com/album${attachments[i].album.owner_id}_${attachments[i].album.id}`
                            }])
                            mediaExtra.disable_web_page_preview = false
                            sender.sendPhoto(attachments[i].album.thumb, null, mediaExtra)
                                .then(msg => {
                                    i++
                                    mediaPoster(msg)
                                })
                                .catch(reject)
                            break
                        // case 'audio':
                        //     // console.log(attachments[i])
                        //     const audioArray = []
                        //     while (i < attachments.length && attachments[i].type === 'audio') {
                        //         const artist = attachments[i].audio.artist
                        //         const title = attachments[i].audio.title
                        //         audioArray.push(`${artist} - ${title}`)
                        //         i++
                        //     }
                        //     audioParser.getAudios(audioArray)
                        //         .then(audios => {
                        //             let a = 0
                        //             const msgs = []
                        //             const recursive = (audio) => {
                        //                 console.log(audio)
                        //                 mediaExtra = Object.assign(mediaExtra, { 
                        //                     performer: entities.decode(audio.artist),
                        //                     title: entities.decode(audio.title),
                        //                     duration: audio.duration,
                        //                     parse_mode: 'HTML'
                        //                 })
                        //                 audioParser.audioData(audio.download)
                        //                     .then(audioBuffer => sender.sendAudio({ source: new Buffer(audioBuffer), filename: `${entities.decode(audio.artist)} - ${entities.decode(audio.title)}.mp3` }, null, mediaExtra))
                        //                     .then(msg => {
                        //                         msgs.push(msg)
                        //                         a++
                        //                         if (a < audios.length) {
                        //                             recursive(audios[a])
                        //                         } else {
                        //                             mediaPoster(msgs)
                        //                         }
                        //                     })
                        //             }
                        //             recursive(audios[a])
                        //         })
                        //         .catch(reject)
                        //     break
                    }
                } else {
                    resolve(posts)
                }
            }
            if (mediaText) {
                messageExtra.disable_web_page_preview = true
                // console.log(JSON.stringify(messageExtra))
                telegram.sendMessage(config.get('chatId'), mediaText, messageExtra)
                    .then(msg => mediaPoster(msg))
                    .catch(reject)
            } else {
                if (attachmentLink.length) {
                    messageExtra.disable_web_page_preview = false
                    
                    telegram.sendMessage(config.get('chatId'), `<a href="${attachmentLink[0].url}">&#160;</a>${attachmentLink.map(link => `<a href="${link.url}">${entities.decode(link.title).capitalize()}</a>`).join('\n')}`, messageExtra)
                        .then(msg => mediaPoster(msg))
                        .catch(reject)
                } else {
                    mediaPoster()
                }
            }
        }
    })
}