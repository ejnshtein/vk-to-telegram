const Telegram = require('telegraf/telegram')
const defaultConfig = require('./default-config.js')
const utils = require('./utils')
const vkApi = require('./vkapi')
const { AllHtmlEntities } = require('html-entities')
const { decode } = new AllHtmlEntities()
module.exports = ({ token, vkToken, chatId }) => {
  const telegram = new Telegram(token)
  const vkapi = vkApi(vkToken)
  return {
    async sendDocument (document, text = '', extra = defaultConfig()) {
      const messages = []
      let doc = (await vkapi.docs.getById(`${document.owner_id}_${document.id}`)).response[0]
      if (!doc) doc = document
      if (doc.ext === 'gif' && doc.preview && doc.preview.video && doc.preview.video.file_size < 50000000) {
        extra.width = doc.preview.video.width
        extra.height = doc.preview.video.height
        extra.supports_streaming = true
        if (doc.preview.photo) {
          extra.thumb = utils.photo.getHQ(doc.preview.photo)
        }
        if (!text) {
          messages.push(await telegram.sendAnimation(chatId, doc.preview.video.src, extra))
        } else if (text && text.length < 1000) {
          extra.caption = `${text}\n\n<a href="${doc.url}">Open original</a>`
          extra.disable_web_page_preview = true
          messages.push(await telegram.sendAnimation(chatId, doc.preview.video.src, extra))
        } else {
          extra.disable_web_page_preview = false
          messages.push(await telegram.sendMessage(chatId, text, extra))
          extra.caption = `<a href="${doc.url}">Open original</a>`
          messages.push(await telegram.sendAnimation(chatId, doc.preview.video.src, extra))
        }
      } else if (doc.ext === 'mp4' && doc.size < 50000000) {
        extra.supports_streaming = true
        if (!text) {
          messages.push(await telegram.sendVideo(chatId, doc.url, extra))
        } else if (text && text.length < 1000) {
          extra.caption = `${text}\n\n<a href="${doc.url}">Open original</a>`
          extra.disable_web_page_preview = true
          messages.push(await telegram.sendVideo(chatId, doc.url, extra))
        } else {
          extra.disable_web_page_preview = false
          messages.push(await telegram.sendMessage(chatId, text, extra))
          extra.caption = `<a href="${doc.url}">Open original</a>`
          messages.push(await telegram.sendVideo(chatId, doc.url, extra))
        }
      } else if (doc.size < 50000000) {
        if (!text) {
          messages.push(await telegram.sendDocument(chatId, doc.url, extra))
        } else if (text && text.length < 1000) {
          extra.caption = text
          messages.push(await telegram.sendDocument(chatId, doc.url, extra))
        } else {
          extra.disable_web_page_preview = false
          messages.push(await telegram.sendMessage(chatId, text, extra))
          extra.disable_web_page_preview = true
          messages.push(await telegram.sendDocument(chatId, doc.url, extra))
        }
      } else {
        extra.disable_web_page_preview = false
        extra.reply_markup.inline_keyboard.push([{
          text: `Open in browser: ${decode(doc.title)}`,
          url: doc.url
        }])
        messages.push(await telegram.sendMessage(chatId, text, extra))
      }
      return messages
    },
    async sendPhoto (photo, text = '', extra = defaultConfig()) {
      if (!text) {
        return telegram.sendPhoto(chatId, utils.photo.getHQ(photo), extra)
      } else if (!text && photo.text.length < 1000) {
        extra.caption = photo.text
        return telegram.sendPhoto(chatId, utils.photo.getHQ(photo), extra)
      } else if (text && text.length < 1000) {
        extra.caption = text
        return telegram.sendPhoto(chatId, utils.photo.getHQ(photo), extra)
      } else {
        extra.disable_web_page_preview = false
        return telegram.sendMessage(chatId, `<a href="${utils.photo.getHQ(photo)}">&#160;</a>${text}`, extra)
      }
    },
    async sendVideo (video, text = null, extra = defaultConfig()) {
      const apivideo = (await vkapi.video.get(`${video.owner_id}_${video.id}`)).response.items[0]
      if (apivideo) {
        switch (apivideo.platform) {
          case 'YouTube': // https://www.youtube.com/embed/qLQr0VrMVQk?__ref=vk.api -> https://www.youtube.com/watch?v=tyHAI-70DSg
            video.player = `https://youtube.com/watch?v=${apivideo.player.match(/https:\/\/www\.youtube\.com\/embed\/(\S+)\?/i)[1]}`
            break
          case 'Vimeo': // https://player.vimeo.com/video/231140379?__ref=vk.api -> https://vimeo.com/231140379
            video.player = `https://vimeo.com/${apivideo.player.match(/https:\/\/player\.vimeo\.com\/video\/(\S+)\?/i)[1]}`
            break
          default:
            video.player = `https://vk.com/video${apivideo.owner_id}_${apivideo.id}`
            break
        }
      } else {
        video.player = `https://vk.com/video${video.owner_id}_${video.id}`
      }
      extra.disable_web_page_preview = false
      if (video.player.match(/^https:\/\/vk\.com\/video/i)) {
        extra.reply_markup.inline_keyboard.unshift([{
          text: `[Video] ${video.title}`,
          url: video.player
        }])
      }
      return telegram.sendMessage(chatId, `<a href="${video.player.match(/^https:\/\/vk\.com\/video/i)
        ? utils.video.getPreview(video)
        : video.player}">&#160;</a>${text
        ? `${text}\n\n`
        : ''}<a href="https://vk.com/video${video.owner_id}_${video.id}">${video.title
        ? video.title
        : `video${video.owner_id}_${video.id}`}</a>`, extra)
    }
  }
}
