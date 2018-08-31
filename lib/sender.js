const Telegram = require('telegraf/telegram')
const DefaultConfig = require('./default-config.js')
const utils = require('./utils')
const vkApi = require('./vkapi')
const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()
module.exports = (tgToken, vkToken) => {
    const telegram = new Telegram(tgToken)
    const vkapi = vkApi(vkToken)
    let chatId
    return {
        set setChatId(token) {
            chatId = token
        },
        sendDocument(doc, text = null, extra = DefaultConfig()) {
            return new Promise((resolve, reject) => {
                const postArray = []
                vkapi.docs.getById([`${doc.owner_id}_${doc.id}`])
                    .then(doc => {
                        doc = doc.response[0]
                        // console.log(JSON.stringify(doc))
                        if (doc.ext === 'gif' && doc.preview && doc.preview.video && doc.preview.video.file_size < 50000000) {
                            extra.width = doc.preview.video.width
                            extra.height = doc.preview.video.height
                            extra.supports_streaming = true
                            if (doc.preview.photo && doc.preview.photo.sizes) {
                                extra.thumb = utils.photo.getMaxSizes(doc.preview.photo.sizes).url
                            }
                            if (text === null || !text) {
                                telegram.sendAnimation(chatId, {
                                        url: doc.preview.video.src,
                                        filename: entities.decode(doc.title)
                                    }, extra)
                                    .then(msg => {
                                        postArray.push(msg)
                                        resolve(postArray)
                                    })
                                    .catch(reject)
                            } else if (text && text.length < 190) {
                                extra.caption = `${text}\n\n<a href="${doc.url}">Open original</a>`
                                extra.disable_web_page_preview = true
                                telegram.sendAnimation(chatId, {
                                        url: doc.preview.video.src,
                                        filename: entities.decode(doc.title)
                                    }, extra)
                                    .then(msg => {
                                        postArray.push(msg)
                                        resolve(postArray)
                                    })
                                    .catch(reject)
                            } else {
                                extra.disable_web_page_preview = false
                                telegram.sendMessage(chatId, text, extra)
                                    .then(msg => {
                                        postArray.push(msg)
                                        extra.caption = `<a href="${doc.url}">Open original</a>`
                                        return telegram.sendAnimation(chatId, {
                                            url: doc.preview.video.src,
                                            filename: entities.decode(doc.title)
                                        }, extra)
                                    })
                                    .then(msg => {
                                        postArray.push(msg)
                                        resolve(postArray)
                                    })
                                    .catch(reject)
                            }
                        } else if (doc.ext === 'mp4' && doc.size < 50000000) {
                            extra.supports_streaming = true
                            if (text === null || !text) {
                                telegram.sendVideo(chatId, {
                                        url: doc.url,
                                        filename: entities.decode(doc.title)
                                    }, extra)
                                    .then(msg => {
                                        postArray.push(msg)
                                        resolve(postArray)
                                    })
                                    .catch(reject)
                            } else if (text && text.length < 190) {
                                extra.caption = `${text}\n\n<a href="${doc.url}">Open original</a>`
                                extra.disable_web_page_preview = true
                                telegram.sendVideo(chatId, {
                                        url: doc.url,
                                        filename: entities.decode(doc.title)
                                    }, extra)
                                    .then(msg => {
                                        postArray.push(msg)
                                        resolve(postArray)
                                    })
                                    .catch(reject)
                            } else {
                                extra.disable_web_page_preview = false
                                telegram.sendMessage(chatId, text, extra)
                                    .then(msg => {
                                        postArray.push(msg)
                                        extra.caption = `<a href="${doc.url}">Open original</a>`
                                        return telegram.sendVideo(chatId, {
                                            url: doc.url,
                                            filename: entities.decode(doc.title)
                                        }, extra)
                                    })
                                    .then(msg => {
                                        postArray.push(msg)
                                        resolve(postArray)
                                    })
                                    .catch(reject)
                            }
                        } else if (doc.size < 50000000) {
                            if (text === null || !text) {
                                telegram.sendDocument(chatId, {
                                        url: doc.url,
                                        filename: entities.decode(doc.title)
                                    }, extra)
                                    .then(msg => {
                                        postArray.push(msg)
                                        resolve(postArray)
                                    })
                                    .catch(reject)
                            } else if (text && text.length < 190) {
                                extra.caption = text
                                telegram.sendDocument(chatId, {
                                        url: doc.url,
                                        filename: entities.decode(doc.title)
                                    }, extra)
                                    .then(msg => {
                                        postArray.push(msg)
                                        resolve(postArray)
                                    })
                                    .catch(reject)
                            } else {
                                extra.disable_web_page_preview = false
                                telegram.sendMessage(chatId, text, extra)
                                    .then(msg => {
                                        postArray.push(msg)
                                        extra.disable_web_page_preview = true
                                        return telegram.sendDocument(chatId, {
                                            url: doc.url,
                                            filename: entities.decode(doc.title)
                                        }, extra)
                                    })
                                    .then(msg => {
                                        postArray.push(msg)
                                        resolve(postArray)
                                    })
                                    .catch(reject)
                            }
                        } else {
                            extra.disable_web_page_preview = false
                            extra.reply_markup.inline_keyboard.push([{
                                text: `Open in browser: ${entities.decode(doc.title)}`,
                                url: doc.url
                            }])
                            telegram.sendMessage(chatId, text, extra)
                                .then(msg => {
                                    postArray.push(msg)
                                    resolve(postArray)
                                })
                                .catch(reject)
                        }
                    })
            })
        },
        sendPhoto(photo, text = null, extra = DefaultConfig()) {
            return new Promise((resolve, reject) => {
                if (text === null) {
                    telegram.sendPhoto(chatId, utils.photo.getHQ(photo), extra)
                        .then(resolve)
                        .catch(reject)
                } else if (!text && photo.text.length < 190) {
                    extra.caption = photo.text
                    telegram.sendPhoto(chatId, utils.photo.getHQ(photo), extra)
                        .then(resolve)
                        .catch(reject)
                } else if (text && text.length < 190) {
                    extra.caption = text
                    telegram.sendPhoto(chatId, utils.photo.getHQ(photo), extra)
                        .then(resolve)
                        .catch(reject)
                } else  {
                    extra.disable_web_page_preview = false
                    telegram.sendMessage(chatId, `<a href="${utils.photo.getHQ(photo)}">&#160;</a>${text}`, extra)
                        .then(resolve)
                        .catch(reject)
                }
            })
        },
        sendVideo(video, text = null, extra = DefaultConfig()) {
            return new Promise((resolve, reject) => {
                vkapi.video.get([`${video.owner_id}_${video.id}`])
                    .then(response => {
                        const video = response.response.items[0]
                        let vk = false
                        switch (video.platform) {
                            case 'YouTube': // https://www.youtube.com/embed/qLQr0VrMVQk?__ref=vk.api -> https://www.youtube.com/watch?v=tyHAI-70DSg
                                video.player = `https://youtube.com/watch?v=${video.player.match(/https:\/\/www\.youtube\.com\/embed\/(\S+)\?/i)[1]}`
                                break
                            case 'Vimeo': // https://player.vimeo.com/video/231140379?__ref=vk.api -> https://vimeo.com/231140379
                                video.player = `https://vimeo.com/${video.player.match(/https:\/\/player\.vimeo\.com\/video\/(\S+)\?/i)[1]}`
                                break
                            case undefined: // vk
                                vk = true
                                video.player = `https://vk.com/video${video.owner_id}_${video.id}`
                                break
                            default:
                                vk = true
                                video.player = `https://vk.com/video${video.owner_id}_${video.id}`
                                break
                        }
                        extra.disable_web_page_preview = false
                        if (vk) {
                            extra.reply_markup.inline_keyboard.unshift([{
                                text: 'Open video in VK',
                                url: video.player
                            }])
                        }
                        return telegram.sendMessage(chatId, 
                        `<a href="${vk ? utils.video.getPreview(video) : video.player}">&#160;</a>
                        ${text ? `${text}\n\n` : ''}<a href="${video.player}">${video.title}</a>`,
                         extra)
                    })
                    .then(resolve)
                    .catch(reject)
            })
        },
        // sendAudio(audio, text = null, extra = DefaultConfig()) {
        //     return new Promise((resolve, reject) => {
        //         if (text && text.length < 190) {
        //             extra.caption = text
        //             telegram.sendAudio(chatId, audio, extra)
        //                 .then(resolve)
        //                 .catch(reject)
        //         } else if (text && text.length > 190) {
        //             const postArray = []
        //             telegram.sendMessage(chatId, text, extra)
        //                 .then(msg => {
        //                     postArray.push(msg)
        //                     return telegram.sendAudio(chatId, audio)
        //                 })
        //                 .then(resolve)
        //                 .catch(reject)
        //         } else {
        //             telegram.sendAudio(chatId, audio, extra)
        //                 .then(resolve)
        //                 .catch(reject)
        //         }
        //     })
        // }
    }
}