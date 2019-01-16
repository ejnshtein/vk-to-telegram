const { Telegram } = require('telegraf')
const utils = require('./utils')
const defaultConfig = require('./default-config')
const Sender = require('./sender')
const Entities = require('html-entities').AllHtmlEntities
const { decode } = new Entities()
/* eslint no-extend-native:0 */

/**
 * Makes string capitalized.
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
    mediaText = mediaText.replace(/\[(\S+)\|([\S\s]*?)\]/ig, '<a href="https://vk.com/$1">$2</a>') // parse vk markdown to html [vkId|Text] => <a href=vk.com/vkId>Text</a>
    mediaText = decode(mediaText)
    const messageExtra = defaultConfig()
    if (config.customVkButton) {
      messageExtra.reply_markup.inline_keyboard.push([{
        text: config.customVkButton,
        url: `https://vk.com/wall${post.owner_id}_${post.id}`
      }])
    }
    let {
      attachments
    } = post
    const attachmentLink = []
    if (attachments && attachments.length) {
      if (attachments.some(el => el.type === 'link')) {
        attachments.filter(el => el.type === 'link').forEach(({
          link
        }) => {
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
        const {
          poll
        } = attachments.find(el => el.type === 'poll')
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
          media: utils.photo.getHQ(attachment.photo),
          caption: mediaText,
          parse_mode: 'HTML'
        })
        mediaText = ''
      }
      if (messageExtra.reply_markup.inline_keyboard.length > 0) {
        let attachmentsExtraText = messageExtra.reply_markup.inline_keyboard.map(el => el.text)
        if (attachmentsArray[0].caption.length + attachmentsExtraText.join('\n\n').length < 1000) {
          attachmentsExtraText = messageExtra.reply_markup.inline_keyboard.map(el => `<a href="${el[0].url}">${el[0].text}</a>`)
          attachmentsArray[0].caption += `\n\n${attachmentsExtraText.join('\n\n')}`
        }
      }
      return telegram.sendMediaGroup(chatId, attachmentsArray)
    } else if (attachments.every(el => el.type === 'album')) {
      const attachmentsArray = []
      for (const attachment of attachments) {
        attachmentsArray.push({
          type: 'photo',
          media: utils.photo.getHQ(attachment.album.thumb),
          caption: `<a href="https://vk.com/album${attachment.album.owner_id}_${attachment.album.id}">${decode(attachment.album.title)}</a>`,
          parse_mode: 'HTML'
        })
      }
      return [await telegram.sendMessage(chatId, mediaText, messageExtra), await telegram.sendMediaGroup(chatId, attachmentsArray)]
    } else {
      attachments = attachments.filter(el => el.type !== 'link')

      let mediaExtra = messageExtra
      const mediaPoster = async message => {
        const messages = message ? [message] : []
        for (let i = 0; i < attachments.length; i++) {
          if (messages.length) {
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
                  media: utils.photo.getHQ(attachments[i].photo),
                  caption: attachments[i].photo.text.length < 1000 ? decode(attachments[i].photo.text) : '',
                  parse_mode: 'HTML'
                })
                i++
              }
              if (photosArray.length === 1) {
                messages.push(await telegram.sendPhoto(chatId, photosArray[0].media.url, mediaExtra))
              } else {
                messages.push(await telegram.sendMediaGroup(chatId, photosArray))
              }
              break
            case 'doc':
              messages.push(await sendDocument(attachments[i].doc, null, mediaExtra))
              break
            case 'video':
              messages.push(await sendVideo(attachments[i].video, null, mediaExtra))
              break
            case 'album':
              mediaExtra.reply_markup.inline_keyboard.unshift([{
                text: decode(attachments[i].album.title),
                url: `https://vk.com/album${attachments[i].album.owner_id}_${attachments[i].album.id}`
              }])
              mediaExtra.disable_web_page_preview = false
              messages.push(await sendPhoto(attachments[i].album.thumb, null, mediaExtra))
              break
          }
        }
        return messages
      }
      if (mediaText) {
        messageExtra.disable_web_page_preview = true
        // console.log(JSON.stringify(messageExtra))
        return mediaPoster(await telegram.sendMessage(chatId, mediaText, messageExtra))
      } else {
        if (attachmentLink.length) {
          messageExtra.disable_web_page_preview = false
          return mediaPoster(await telegram.sendMessage(chatId, `<a href="${attachmentLink[0].url}">&#160;</a>${attachmentLink.map(link => `<a href="${link.url}">${decode(link.title).capitalize()}</a>`).join('\n')}`, messageExtra))
        } else {
          return mediaPoster()
        }
      }
    }
  }
}
