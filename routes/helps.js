const request = require('request')

exports.getImgRes = function (data) {
    if (data.photo_2560 !== undefined) {
        return data.photo_2560
    }
    if (data.photo_1280 !== undefined) {
        return data.photo_1280
    }
    if (data.photo_807 !== undefined) {
        return data.photo_807
    }
    if (data.photo_604 !== undefined) {
        return data.photo_604
    }
    if (data.photo_130 !== undefined) {
        return data.photo_130
    }
    if (data.photo_75 !== undefined) {
        return data.photo_75
    }
}
exports.VkApiVideoGet = function (token, owner, id, output) {
    request.get(`https://api.vk.com/method/video.get?videos=${owner}_${id}&access_token=${token}&v=5.71`,
        function (req, res) {
            res = JSON.parse(res.body)
            res = res.response.items[0]
            if (res.player.includes('https://vk.com')) {
                res.player = `https://vk.com/video${owner}_${id}`
            }
            if (res.player.includes('https://player.vimeo.com/video')) {
                res.player = res.player.replace('player.', '').replace('video/', '')
            }
            return output(res)
        })
}
exports.VkApiDocGetById = function (token, owner, id, output) {
    request.get(`https://api.vk.com/method/docs.getById?docs=${owner}_${id}&access_token=${token}&v=5.71`,
        (req, res) => {
            res = JSON.parse(res.body)
            return output(res.response[0])
        })
}
exports.isAlbum = function (media) {
    if (media.length >= 2) {
        return media.every((el => el.type == 'photo'))
    }
    return false
}