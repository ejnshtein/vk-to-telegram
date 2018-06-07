const Telegraf = require('telegraf'),
    helps = require('./routes/helps')

class Sender {
    /**
     * @param {object} options
     * @param {string} options.botToken - Telegram bot token from @botfather
     * @param {string} options.chatName - Telegram chat name with @
     * @param {string} options.vkConfirmation - Confirmation token from VK group
     * @param {string} options.vkToken - Your VK API token
     * @param {string} options.ownerId - Your telegram id (@getidsbot)
     * @param {string} [options.fromId=false] - VK group id
     */
    constructor(options) {
        this.token = options.botToken
        this.chatName = /^@/ig.test(options.chatName) ? options.chatName : `@${options.chatName}`
        this.vkConfirmation = options.vkConfirmation
        this.ownerId = options.ownerId
        this.vkToken = options.vkToken
        this.fromId = options.fromId || false
        this.send = (req, res) => startSending(this, req, res)
    }
}

function startSending(params, req, res) {
    const bot = new Telegraf(params.token)
    helps.setToken(params.vkToken)
    bot.telegram.getChat(params.chatName).then(dada => {
        params.chatid = dada.id
        let myObj = {}
        try {
            myObj = JSON.parse(JSON.stringify(req.body))
            console.log(myObj)
        } catch (e) {
            bot.telegram.sendMessage(params.ownerId, `${Date()}\n\nHere's an error: \n\n${req.body}\n${req.ip}\n${req.baseUrl}`)
            return
        }
        if (myObj.type == "confirmation") {
            res.status(200).send(params.vkConfirmation)
        } else {
            res.status(200).send('ok')
        }
        if (params.fromId ? myObj.object.from_id == params.fromId : true) {
            if (myObj.type == "wall_post_new") {
                if (myObj.object.post_type == "post") {
                    vkPost(myObj.object)
                        .then(() => {
                            if (myObj.object.copy_history) {
                                let cophhis = myObj.object.copy_history,
                                    last = cophhis.length - 1
                                vkPost(cophhis[last])
                                    .then(() => console.log('All sent!'))
                                    .catch(console.log)
                            }
                        })
                        .catch(console.log)
                }
            }
        }

        function vkPost(media) {
            return new Promise((resolved, rejected) => {
                let mediaText
                //console.log(media) // Debug here
                if (media.text) {
                    mediaText = media.text
                } else {
                    mediaText = ''
                }
                //console.log(mediaText)
                mediaText = mediaText.replace(/\[([\S]*)\|([\S\s]*?)\]/ig, `<a href="https://vk.com/$1">$2</a>`)
                //console.log(mediaText)
                if (media.attachments) { // Post generator start
                    media = media.attachments
                    let array = [],
                        yes = false,
                        link,
                        keyboardStr
                    for (let a = 0; a < media.length; a++) {
                        array.push(media[a].type)
                    }
                    if (array.indexOf('link') != -1) {
                        yes = true
                        link = array.indexOf('link')
                        keyboardStr = {
                            inline_keyboard: [
                                [{
                                    text: media[link].link.title,
                                    url: media[link].link.url
                                }]
                            ]
                        }
                    }
                    media = media.filter(res => res.type != 'audio' || res.type != 'poll')
                    if (
                        (media.length == 1 && media[0].type == 'video') ||
                        (media.length == 2 && media[0].type == 'video' && media[1].type == 'link')
                    ) {
                        if (media[0].type == 'video') {
                            helps.vkApi.video.get({
                                    owner: media[0].video.owner_id,
                                    id: media[0].video.id
                                })
                                .then(video =>
                                    bot.telegram.sendMessage(params.chatid, `<a href="${video.player}">&#160;</a>${mediaText}\n\n<a href="${video.player}">${video.title}</a>`, {
                                        parse_mode: 'HTML',
                                        disable_web_page_preview: false,
                                        reply_markup: yes ? keyboardStr : ''
                                    })
                                    .then(msg => {
                                        console.log(msg)
                                        if (!msg.response) {
                                            resolved()
                                        } else {
                                            rejected(msg.response)
                                        }
                                    })
                                )
                                .catch(rejected)
                        }
                    } else if (
                        (media.length == 1 && media[0].type == 'photo' || media[0].type == 'doc' || media[0].type == 'album') ||
                        (media.length == 2 && media[0].type == 'photo' || media[0].type == 'doc' || media[0].type == 'album' && media[1].type == 'link')
                    ) {
                        switch (media[0].type) {
                            case 'photo':
                                if (mediaText.length < 190 && !!mediaText) {
                                    bot.telegram.sendPhoto(params.chatid, helps.getImgHiRes(media[0].photo), {
                                        caption: `<a>${mediaText}</a>`,
                                        parse_mode: 'HTML',
                                        reply_markup: yes ? keyboardStr : '',
                                        disable_web_page_preview: true
                                    }).then(msg => {
                                        if (!msg.response) {
                                            resolved()
                                        } else {
                                            rejected(msg.response)
                                        }
                                    })
                                } else if (!mediaText && media[0].photo.text.length < 190) {
                                    mediaText = media[0].photo.text
                                    bot.telegram.sendPhoto(params.chatid, helps.getImgHiRes(media[0].photo), {
                                        caption: `<a>${mediaText}</a>`,
                                        parse_mode: 'HTML',
                                        reply_markup: yes ? keyboardStr : '',
                                        disable_web_page_preview: true
                                    }).then(msg => {
                                        if (!msg.response) {
                                            resolved()
                                        } else {
                                            rejected(msg.response)
                                        }
                                    })
                                } else if (mediaText.length > 190) {
                                    bot.telegram.sendMessage(params.chatid, `<a href="${helps.getImgHiRes(media[0].photo)}">&#160;</a>${mediaText}`, {
                                        parse_mode: 'HTML',
                                        reply_markup: yes ? keyboardStr : '',
                                        disable_web_page_preview: false
                                    }).then(msg => {
                                        if (!msg.response) {
                                            resolved()
                                        } else {
                                            rejected(msg.response)
                                        }
                                    })
                                }
                                break
                            case 'doc':
                                helps.vkApi.doc.getById({
                                        owner: media[0].doc.owner_id,
                                        id: media[0].doc.id
                                    })
                                    .then(vkDocument => {
                                        if (!vkDocument) {
                                            vkDocument = {
                                                url: media[0].doc.url,
                                                title: media[0].doc.title,
                                                size: media[0].doc.size
                                            }
                                        }
                                        if (vkDocument.size < 50000000) {
                                            if (mediaText.length < 190) {
                                                bot.telegram.sendDocument(params.chatid, {
                                                    url: vkDocument.url,
                                                    filename: vkDocument.title
                                                }, {
                                                    caption: `<a>${mediaText}</a>`,
                                                    reply_markup: yes ? keyboardStr : '',
                                                    parse_mode: 'HTML',
                                                    disable_web_page_preview: true
                                                }).then(msg => {
                                                    if (!msg.response) {
                                                        resolved()
                                                    } else {
                                                        rejected(msg.response)
                                                    }
                                                })
                                            } else {
                                                bot.telegram.sendMessage(params.chatid, mediaText)
                                                    .then((msg) => {
                                                        if (!msg.response) {
                                                            resolved()
                                                        } else {
                                                            rejected(msg.response)
                                                        }
                                                        bot.telegram.sendDocument(params.chatid, {
                                                            url: vkDocument.url,
                                                            filename: vkDocument.title
                                                        }, {
                                                            caption: `<a>${mediaText}</a>`,
                                                            reply_markup: yes ? keyboardStr : '',
                                                            parse_mode: 'HTML',
                                                            disable_web_page_preview: true
                                                        }).then(msg1 => {
                                                            if (!msg1.response) {
                                                                resolved()
                                                            } else {
                                                                rejected(msg1.response)
                                                            }
                                                        })
                                                    })
                                            }
                                        } else {
                                            bot.telegram.sendMessage(params.chatid, `${mediaText}\n\n<a href="${vkDocument.url}>${vkDocument.title}</a>`, {
                                                reply_markup: yes ? keyboardStr : '',
                                                parse_mode: 'HTML',
                                                disable_web_page_preview: false
                                            }).then(msg => {
                                                if (!msg.response) {
                                                    resolved()
                                                } else {
                                                    rejected(msg.response)
                                                }
                                            })
                                        }
                                    })
                                    .catch(rejected)

                                break
                            case 'album':
                                if (!mediaText && media[0].album.description.length < 190) {
                                    mediaText = media[0].album.description
                                }
                                keyboardStr = {
                                    inline_keyboard: [
                                        [{
                                            text: media[0].album.title,
                                            url: 'https://vk.com/album' + media[0].album.owner_id + '_' + media[0].album.id
                                        }]
                                    ]
                                }
                                bot.telegram.sendMessage(params.chatid, `<a href="${helps.getImgHiRes(media[0].album.thumb)}">&#160;</a><a>${mediaText}</a>`, {
                                    parse_mode: 'HTML',
                                    reply_markup: keyboardStr,
                                    disable_web_page_preview: false,
                                }).then(msg => {
                                    if (!msg.response) {
                                        resolved()
                                    } else {
                                        rejected(msg.response)
                                    }
                                })
                                break
                        }
                    } else if (media.length == 1 && media[0].type == 'link') {
                        //console.log(media[0].link)
                        bot.telegram.sendMessage(params.chatid, `<a href="${media[0].link.url}">&#160;</a>${mediaText}\n\n<a href="${media[0].link.url}">Link</a>`, {
                                disable_web_page_preview: false,
                                parse_mode: 'HTML'
                            })
                            .then(msg => {
                                if (!msg.response) {
                                    resolved()
                                } else {
                                    rejected(msg.response)
                                }
                            })
                    } else if (mediaText.length < 190 && helps.isAlbum(media)) {
                        let arr = []
                        for (key in media) {
                            arr.push({
                                type: 'photo',
                                media: {
                                    url: helps.getImgHiRes(media[key].photo)
                                },
                                caption: mediaText ? `<a>${mediaText}</a>` : '',
                                parse_mode: 'HTML'
                            })
                            mediaText = null
                        }
                        bot.telegram.sendMediaGroup(params.chatid, arr)
                            .then(msg => {
                                if (!msg.response) {
                                    resolved()
                                } else {
                                    rejected(msg.response)
                                }
                            })
                    } else {
                        media = media.filter(res => res.type != 'link')
                        let i = 0
                        if (mediaText) {
                            bot.telegram.sendMessage(params.chatid, `<a>${mediaText}</a>`, {
                                reply_markup: yes ? keyboardStr : '',
                                disable_web_page_preview: true,
                                parse_mode: 'HTML'
                            }).then((msg) => {
                                if (!msg.response) {
                                    yes = false
                                    mediaPoster()
                                } else {
                                    rejected(msg.response)
                                }
                            })
                        } else {
                            mediaPoster()
                        }

                        function mediaPoster() {
                            if (i < media.length) {
                                switch (media[i].type) {
                                    case 'photo':
                                        let arr = []
                                        while (i < media.length && media[i].type == 'photo') {
                                            arr.push({
                                                type: 'photo',
                                                media: {
                                                    url: helps.getImgHiRes(media[i].photo)
                                                },
                                                caption: media[i].photo.text.length < 190 ? media[i].photo.text : ''
                                            })
                                            i++
                                        }
                                        bot.telegram.sendMediaGroup(params.chatid, arr)
                                            .then(msg => {
                                                if (!msg.response) {
                                                    mediaPoster()
                                                } else {
                                                    rejected(msg.response)
                                                }
                                            })
                                        break
                                    case 'video':
                                        helps.vkApi.video.get({
                                                owner: media[i].video.owner_id,
                                                id: media[i].video.id
                                            })
                                            .then(video =>
                                                bot.telegram.sendMessage(params.chatid, `<a href="${video.player}">${video.title}</a>`, {
                                                    parse_mode: 'HTML',
                                                    disable_web_page_preview: false,
                                                    reply_markup: yes ? keyboardStr : ''
                                                }).then((msg) => {
                                                    if (!msg.response) {
                                                        yes = false
                                                        i++
                                                        mediaPoster()
                                                    } else {
                                                        rejected(msg.response)
                                                    }
                                                })
                                            )
                                            .catch(rejected)
                                        break
                                    case 'doc':
                                        helps.vkApi.doc.getById({
                                                owner: media[i].doc.owner_id,
                                                id: media[i].doc.id
                                            })
                                            .then(vkDocument => {
                                                if (!vkDocument) {
                                                    vkDocument = {
                                                        url: media[i].doc.url,
                                                        title: media[i].doc.title,
                                                        size: media[i].doc.size
                                                    }
                                                }
                                                if (vkDocument.size < 50000000) {
                                                    bot.telegram.sendDocument(params.chatid, {
                                                        url: vkDocument.url,
                                                        filename: vkDocument.title
                                                    }, {
                                                        reply_markup: yes ? keyboardStr : '',
                                                        parse_mode: 'HTML',
                                                        disable_web_page_preview: true
                                                    }).then((msg) => {
                                                        if (!msg.response) {
                                                            yes = false
                                                            i++
                                                            mediaPoster()
                                                        } else {
                                                            rejected(msg.response)
                                                        }
                                                    })
                                                } else {
                                                    bot.telegram.sendMessage(params.chatid, `<a href="${vkDocument.url}>${vkDocument.title}</a>`, {
                                                        reply_markup: yes ? keyboardStr : '',
                                                        parse_mode: 'HTML',
                                                        disable_web_page_preview: false
                                                    }).then((msg) => {
                                                        if (!msg.response) {
                                                            yes = false
                                                            i++
                                                            mediaPoster()
                                                        } else {
                                                            rejected(msg.response)
                                                        }
                                                    })
                                                }
                                            })
                                            .catch(rejected)
                                        break
                                    case 'album':
                                        let keyboard = {
                                            inline_keyboard: [
                                                [{
                                                    text: media[i].album.title,
                                                    url: 'https://vk.com/album' + media[i].album.owner_id + '_' + media[i].album.id
                                                }]
                                            ]
                                        }
                                        bot.telegram.sendPhoto(params.chatid, helps.getImgHiRes(media[i].album.thumb), {
                                            reply_markup: keyboard
                                        }).then((msg) => {
                                            if (!msg.response) {
                                                i++
                                                mediaPoster()
                                            } else {
                                                rejected(msg.response)
                                            }
                                        })
                                        break
                                }
                            } else {
                                resolved()
                            }
                        }
                    }
                } else {
                    if (mediaText) {
                        bot.telegram.sendMessage(params.chatid, `${mediaText}`, {
                            parse_mode: 'HTML',
                            disable_web_page_preview: false
                        }).then((msg) => {
                            if (!msg.response) {
                                resolved()
                            } else {
                                rejected(msg.response)
                            }
                        })
                    } else {
                        resolved()
                    }
                }
            }) // Promise end
        } // vkPost end
    }) // Post generator end
}
module.exports = Sender