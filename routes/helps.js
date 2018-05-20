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
            if (res && res.player){
                if (/https:\/\/vk\.com/i.test(res.player)) {
                    res.player = `https://vk.com/video${owner}_${id}`
                }
                if (/https:\/\/player\.vimeo\.com\/video/i.test(res.player)) {
                    res.player = res.player.replace(/player\./, '').replace(/video\//, '')
                }
                if (/https:\/\/www\.youtube\.com\/embed/i.test(res.player)){
                    res.player = res.player.replace(/embed\//, 'watch?v=')
                }
                return output(res)//https://vk.com/video-102087446_456241089
            } else {
                return output({player: `https://vk.com/video${owner}_${id}`,title: 'Link'})
            }
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