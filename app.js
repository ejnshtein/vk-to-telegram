
class Sender {
    constructor (options){
        this.token = options.botToken
        this.chatName = options.chatName.includes('@') ? options.chatName.replace('@','') : options.chatName
        this.vkConfirmation = options.vkConfirmation
        this.ownerId = options.ownerId
        this.vkToken = options.vkToken
        this.fromId = options.fromId || false
        this.send = (req, res) => startSending(this, req, res)
    }
}
function startSending(allParams, req, res){
    const Telegraf = require('telegraf'),
        helps = require('./routes/helps'),
        bot = new Telegraf(allParams.token),
        S = require('string')
    bot.telegram.getChat('@' + allParams.chatName).then(dada => {
        allParams.chatid = dada.id
        let myObj = {}
        try {
            myObj = JSON.parse(JSON.stringify(req.body))
            console.log(myObj)
        } catch (e) {
            bot.telegram.sendMessage(allParams.ownerId, `${Date()}\n\nHere's an error: \n\n${req.body}\n${req.ip}\n${req.baseUrl}`)
            return
        }
        if (myObj.type == "confirmation") {
            res.send(allParams.vkConfirmation)
        } else {
            res.send('ok').statusCode = '200'
        }
        if (allParams.fromId ? myObj.object.from_id == allParams.fromId : true){
            if (myObj.type == "wall_post_new") {
                if (myObj.object.post_type == "post") {
                    vkPost(myObj.object, () => {
                        if (myObj.object.copy_history) {
                            let cophhis = myObj.object.copy_history,
                                last = cophhis.length - 1
                            vkPost(cophhis[last], () => {
                                console.log('All sent!')
                            })
                        }
                    })
                }
            }
        }
        function vkPost(media, output) {
            let mediaText
            //console.log(media) // Debug here
            if (media.text) {
                mediaText = media.text
            } else {
                mediaText = ''
            }
            while (mediaText.includes('[') && mediaText.includes('|') && mediaText.includes(']')){
                let parse = S(mediaText).between('[',']').s,
                    startedLetter = mediaText.indexOf('['),
                    finishLetter = mediaText.indexOf(']'),
                    urlVk = `https://vk.com/${S(parse).between('','|').s}`,
                    nameVk = `${S(parse).between('|').s}`.link(urlVk)
                mediaText = mediaText.replace(`[${parse}]`, `</a>${nameVk}<a>`)
                mediaText = `${mediaText}`
            }
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
                media = media.filter(res => res.type != 'audio')
                media = media.filter(res => res.type != 'poll')
                if (
                    ((media.length == 1) && (media[0].type == 'video')) ||
                    ((media.length == 2) && (media[0].type == 'video') && (media[1].type == 'link') && (media[1].type != 'video' || media[1].type != 'photo' || media[1].type != 'doc' || media[1].type != 'album'))
                ) {
                    if (media[0].type == 'video') {
                        helps.VkApiVideoGet(allParams.vkToken, media[0].video.owner_id, media[0].video.id, function (res) {
                            bot.telegram.sendMessage(allParams.chatid, `<a href="${res.player}">&#160;</a><a>${mediaText}</a>\n\n<a href="${res.player}">${res.title}</a>`, {
                                parse_mode: 'HTML',
                                disable_web_page_preview: false,
                                reply_markup: yes ? keyboardStr : ''
                            }).then(() => {
                                output()
                            })
                        })
                    }
                } else if (
                    (media.length == 1) && (media[0].type == 'photo' || media[0].type == 'doc' || media[0].type == 'album') ||
                    (media.length == 2) && (media[0].type == 'photo' || media[0].type == 'doc' || media[0].type == 'album') && (media[1].type == 'link') && (media[1].type != 'photo' || media[1].type != 'video')
                    ){
                    switch (media[0].type){
                        case 'photo':
                            if (mediaText.length < 200 && !!mediaText) {
                                bot.telegram.sendPhoto(allParams.chatid, helps.getImgRes(media[0].photo), {
                                    caption: `<a>${mediaText}</a>`,
                                    parse_mode: 'HTML',
                                    reply_markup: yes ? keyboardStr : '',
                                    disable_web_page_preview: true
                                }).then(output())
                            } else if (!mediaText && media[0].photo.text.length < 200) {
                                mediaText = media[0].photo.text
                                bot.telegram.sendPhoto(allParams.chatid, helps.getImgRes(media[0].photo), {
                                    caption: `<a>${mediaText}</a>`,
                                    parse_mode: 'HTML',
                                    reply_markup: yes ? keyboardStr : '',
                                    disable_web_page_preview: true
                                }).then(output())
                            } else if (mediaText.length > 200){
                                bot.telegram.sendMessage(allParams.chatid,`<a href="${helps.getImgRes(media[0].photo)}">&#160;</a><a>${mediaText}</a>` ,{
                                    parse_mode: 'HTML',
                                    reply_markup: yes ? keyboardStr : '',
                                    disable_web_page_preview: false
                                })
                            }
                            break
                        case 'doc':
                            helps.VkApiDocGetById(allParams.vkToken, media[0].doc.owner_id, media[0].doc.id, (res) => {
                                if (!res) {
                                    res = {}
                                    res.url = media[0].doc.url,
                                        res.title = media[0].doc.title,
                                        res.size = media[0].doc.size
                                }
                                if (res.size < 50000000) {
                                    if (mediaText.length < 200){
                                        bot.telegram.sendDocument(allParams.chatid, {
                                            url: res.url,
                                            filename: res.title
                                        }, {
                                            caption: `<a>${mediaText}</a>`,
                                            reply_markup: yes ? keyboardStr : '',
                                            parse_mode: 'HTML',
                                            disable_web_page_preview: true
                                        }).then(output())
                                    } else {
                                        bot.telegram.sendMessage(allParams.chatid, mediaText).then(()=>{
                                            bot.telegram.sendDocument(allParams.chatid, {
                                                url: res.url,
                                                filename: res.title
                                            }, {
                                                caption: `<a>${mediaText}</a>`,
                                                reply_markup: yes ? keyboardStr : '',
                                                parse_mode: 'HTML',
                                                disable_web_page_preview: true
                                            }).then(output())
                                        })
                                    }
                                } else {
                                    bot.telegram.sendMessage(allParams.chatid, `<a>${mediaText}</a>\n\n<a href="${res.url}>${res.title}</a>`, {
                                        reply_markup: yes ? keyboardStr : '',
                                        parse_mode: 'HTML',
                                        disable_web_page_preview: false
                                    }).then(output())
                                }
                            })
                            break
                        case 'album':
                            if (!mediaText && media[0].album.description.length < 200) {
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
                            bot.telegram.sendMessage(allParams.chatid, `<a href="${helps.getImgRes(media[0].album.thumb)}">&#160;</a><a>${mediaText}</a>`, {
                                parse_mode: 'HTML',
                                reply_markup: keyboardStr,
                                disable_web_page_preview: false,
                            }).then(() => {
                                output()
                            })
                            break
                    }
                } else if ((media.length == 1) && (media[0].type == 'link')) {
                    //console.log(media[0].link)
                    bot.telegram.sendMessage(allParams.chatid, `<a href="${media[0].link.url}">&#160;</a><a>${mediaText}</a>\n\n<a href="${media[0].link.url}">Link</a>`, {
                        disable_web_page_preview: false,
                        parse_mode: 'HTML'
                    }).then(() => {
                        output()
                    })
                } else if (mediaText.length < 200 && helps.isAlbum(media)) {
                    let arr = []
                    for (key in media) {
                        arr.push({
                            type: 'photo',
                            media: {
                                url: helps.getImgRes(media[key].photo)
                            },
                            caption: mediaText ? `<a>${mediaText}</a>` : '',
                            parse_mode: 'HTML'
                        })
                        mediaText = false
                    }
                    bot.telegram.sendMediaGroup(allParams.chatid, arr).then(output())
                } else {
                    media = media.filter(res => res.type != 'link')
                    let i = 0
                    if (mediaText) {
                        bot.telegram.sendMessage(allParams.chatid, `<a>${mediaText}</a>`, {
                            reply_markup: yes ? keyboardStr : '',
                            disable_web_page_preview: true,
                            parse_mode: 'HTML'
                        }).then(()=>{
                            yes = false
                            mediaPoster()
                        })
                    } else {
                        mediaPoster()
                    }
                    function mediaPoster() {
                        if (i < media.length) {
                            switch (media[i].type){
                                case 'photo':
                                    let arr = []
                                    while (i < media.length && media[i].type == 'photo') {
                                        arr.push({
                                            type: 'photo',
                                            media: {
                                                url: helps.getImgRes(media[i].photo)
                                            },
                                            caption: media[i].photo.text.length < 200 ? media[i].photo.text : ''
                                        })
                                        i++
                                    }
                                    i--
                                    bot.telegram.sendMediaGroup(allParams.chatid, arr).then(() => {
                                        i++
                                        mediaPoster()
                                    })
                                    break
                                case 'video':
                                    helps.VkApiVideoGet(allParams.vkToken, media[i].video.owner_id, media[i].video.id, function (res) {
                                        bot.telegram.sendMessage(allParams.chatid, `<a href="${res.player}">${res.title}</a>`, {
                                            parse_mode: 'HTML',
                                            disable_web_page_preview: false,
                                            reply_markup: yes ? keyboardStr : ''
                                        }).then(() => {
                                            yes = false
                                            i++
                                            mediaPoster()
                                        })
                                    })
                                    break
                                case 'doc':
                                    helps.VkApiDocGetById(allParams.vkToken, media[i].doc.owner_id, media[i].doc.id, (res) => {
                                        if (!res) {
                                            res = {}
                                            res.url = media[i].doc.url,
                                                res.title = media[i].doc.title,
                                                res.size = media[i].doc.size
                                        }
                                        if (res.size < 50000000) {
                                            bot.telegram.sendDocument(allParams.chatid, {
                                                url: res.url,
                                                filename: res.title
                                            }, {
                                                reply_markup: yes ? keyboardStr : '',
                                                parse_mode: 'HTML',
                                                disable_web_page_preview: true
                                            }).then(() => {
                                                yes = false
                                                i++
                                                mediaPoster()
                                            })
                                        } else {
                                            bot.telegram.sendMessage(allParams.chatid, `<a href="${res.url}>${res.title}</a>`, {
                                                reply_markup: yes ? keyboardStr : '',
                                                parse_mode: 'HTML',
                                                disable_web_page_preview: false
                                            }).then(() => {
                                                yes = false
                                                i++
                                                mediaPoster()
                                            })
                                        }
                                    })
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
                                    bot.telegram.sendPhoto(allParams.chatid, helps.getImgRes(media[i].album.thumb), {
                                        reply_markup: keyboard
                                    }).then(() => {
                                        i++
                                        mediaPoster()
                                    })
                                    break
                            }
                        } else {
                            output()
                        }
                    }
                }
            } else {
                if (mediaText) {
                    bot.telegram.sendMessage(allParams.chatid, `<a>${mediaText}</a>`, {
                        parse_mode: 'HTML',
                        disable_web_page_preview: false
                    }).then(output())
                } else {
                    output()
                }
            }
        }
    }) // Post generator end
}
module.exports = Sender