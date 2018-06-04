const request = require('request')
let vkToken = ''

function setToken(token) {
    vkToken = token
}

function getImg(data) {
    if (typeof data.photo_2560 == 'string') {
        return data.photo_2560
    }
    if (typeof data.photo_1280 == 'string') {
        return data.photo_1280
    }
    if (typeof data.photo_807 == 'string') {
        return data.photo_807
    }
    if (typeof data.photo_604 == 'string') {
        return data.photo_604
    }
    if (typeof data.photo_130 == 'string') {
        return data.photo_130
    }
    if (typeof data.photo_75 == 'string') {
        return data.photo_75
    }
}

function VkApiVideoGet(data) {
    return new Promise((res, rej) => {
        request.get(`https://api.vk.com/method/video.get?videos=${data.owner}_${data.id}&access_token=${vkToken}&v=5.71`,
            function (err, response) {
                if (err) return rej(err)
                let body
                try {
                    body = JSON.parse(response.body).response.items[0]
                } catch (e) {
                    rej('error parse data from VK API')
                }
                if (body && body.player) {
                    if (/https:\/\/vk\.com/i.test(body.player)) {
                        body.player = `https://vk.com/video${data.owner}_${data.id}`
                    }
                    if (/https:\/\/player\.vimeo\.com\/video/i.test(body.player)) {
                        body.player = body.player.replace(/player\./, '').replace(/video\//, '')
                    }
                    if (/https:\/\/www\.youtube\.com\/embed/i.test(body.player)) {
                        body.player = body.player.replace(/embed\//, 'watch?v=')
                    }
                    return res({
                        player: body.player,
                        title: body.title
                    }) //https://vk.com/video-102087446_456241089
                } else {
                    return res({
                        player: `https://vk.com/video${data.owner}_${data.id}`,
                        title: 'VK video url'
                    })
                }
            })
    })
}

function VkApiDocGetById(data) {
    return new Promise((res, rej) => {
        request.get(`https://api.vk.com/method/docs.getById?docs=${data.owner}_${data.id}&access_token=${vkToken}&v=5.71`,
            (req, response) => {
                console.log(response.body)
                body = JSON.parse(response.body)
                res(body.response[0])
            })
    })
}

function isAlbum(media) {
    if (media.length >= 2) {
        return media.every((el => el.type == 'photo'))
    }
    return false
}

module.exports = {
    setToken: setToken,
    getImgHiRes: getImg,
    isAlbum: isAlbum,
    vkApi: {
        video: {
            get: VkApiVideoGet
        },
        doc: {
            getById: VkApiDocGetById
        }
    }
}