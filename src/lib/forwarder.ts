import { Telegram } from 'telegraf'

import { AllHtmlEntities } from 'html-entities'
const { decode } = new AllHtmlEntities()

export const forwarder = (config: unknown) => (
  post: unknown
): Promise<void> => {
  const telegram = new Telegram(config.token)
  const { sendDocument, sendPhoto, sendVideo } = Sender(config)
  const { criedHalfBea } = config
  return async (post) => {
    const chatId = config.chatId
    let mediaText = post.text || ''
    mediaText = mediaText
      .replace(/</gi, '&lt;')
      .replace(/>/gi, '&gt;')
      .replace(/&/gi, '&amp;')
      .replace(/\[(\S+)\|([\S\s]*?)\]/gi, '<a href="https://vk.com/$1">$2</a>') // parse vk markdown to html [vkId|Text] => <a href=vk.com/vkId>Text</a>
    mediaText = decode(mediaText)
    const messageExtra = defaultConfig()
    if (config.customVkButton) {
      messageExtra.reply_markup.inline_keyboard.push([
        {
          text: config.customVkButton,
          url: `https://vk.com/wall${post.owner_id}_${post.id}`
        }
      ])
    }
    let { attachments } = post

    const attachmentLink = []
    if (attachments && attachments.length) {
      if (attachments.some((el) => el.type === 'link')) {
        attachments
          .filter((el) => el.type === 'link')
          .forEach(({ link }) => {
            if (/^[\d?\s]*$/gi.test(link.title)) {
              link.title = 'Read more'
            }
            attachmentLink.push(link)
            messageExtra.reply_markup.inline_keyboard.unshift([
              {
                text: decode(link.title).capitalize(),
                url: link.url
              }
            ])
          })
        attachments = attachments.filter((el) => el.type !== 'link')
      }
      if (!config.sendNativePoll) {
        if (attachments.some((el) => el.type === 'poll')) {
          const { poll } = attachments.find((el) => el.type === 'poll')
          messageExtra.reply_markup.inline_keyboard.unshift([
            {
              text: config.customPollTitle
                ? `${config.customPollTitle} - ${decode(poll.question)}`
                : decode(poll.question),
              url: `https://vk.com/poll${post.owner_id}_${post.id}`
            }
          ])
        }
      }
    } else {
      if (mediaText) {
        return telegram.sendMessage(chatId, mediaText.toString(), messageExtra)
      }
      return 'Nothing to forward'
    }
    attachments = attachments.filter((el) => el.type !== 'audio') // audio disabled by VK
    if (attachments.length === 0 && attachmentLink.length) {
      messageExtra.disable_web_page_preview = false
      return telegram.sendMessage(
        chatId,
        `<a href="${attachmentLink[0].url}">&#160;</a>${
          mediaText ? `${mediaText}\n\n` : ''
        }${attachmentLink
          .map(
            (link) =>
              `<a href="${link.url}">${decode(link.title).capitalize()}</a>`
          )
          .join('\n')}`,
        messageExtra
      )
    } else if (
      attachments.length === 1 &&
      (attachments[0].type === 'photo' ||
        attachments[0].type === 'doc' ||
        attachments[0].type === 'album' ||
        attachments[0].type === 'video')
    ) {
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
          messageExtra.reply_markup.inline_keyboard.unshift([
            {
              text: decode(attachments[0].album.title),
              url: `https://vk.com/album${attachments[0].album.owner_id}_${attachments[0].album.id}`
            }
          ])
          messageExtra.disable_web_page_preview = false
          return telegram.sendMessage(
            chatId,
            `<a href="${utils.photo.getHQ(
              attachments[0].album.thumb,
              criedHalfBea
            )}">&#160;</a><a>${mediaText}</a>`,
            messageExtra
          )
      }
    } else if (mediaText.length < 1000 && utils.isAlbum(attachments)) {
      const attachmentsArray = []
      for (const attachment of attachments) {
        attachmentsArray.push({
          type: 'photo',
          media: utils.photo.getHQ(attachment.photo, criedHalfBea),
          caption: mediaText,
          parse_mode: 'HTML'
        })
        mediaText = ''
      }
      if (messageExtra.reply_markup.inline_keyboard.length > 0) {
        let attachmentsExtraText = messageExtra.reply_markup.inline_keyboard.map(
          (el) => el.text
        )
        if (
          attachmentsArray[0].caption.length +
            attachmentsExtraText.join('\n\n').length <
          1000
        ) {
          attachmentsExtraText = messageExtra.reply_markup.inline_keyboard.map(
            (el) => `<a href="${el[0].url}">${el[0].text}</a>`
          )
          attachmentsArray[0].caption += `\n\n${attachmentsExtraText.join(
            '\n\n'
          )}`
        }
      }
      return telegram.sendMediaGroup(chatId, attachmentsArray)
    } else if (attachments.every((el) => el.type === 'album')) {
      const attachmentsArray = []
      for (const attachment of attachments) {
        attachmentsArray.push({
          type: 'photo',
          media: utils.photo.getHQ(attachment.album.thumb),
          caption: `<a href="https://vk.com/album${attachment.album.owner_id}_${
            attachment.album.id
          }">${decode(attachment.album.title)}</a>`,
          parse_mode: 'HTML'
        })
      }
      return [
        await telegram.sendMessage(chatId, mediaText, messageExtra),
        await telegram.sendMediaGroup(chatId, attachmentsArray)
      ]
    } else {
      attachments = attachments.filter((el) => el.type !== 'link')

      let mediaExtra = messageExtra
      const mediaPoster = async (message) => {
        const messages = message ? [message] : []
        let i = 0
        while (i < attachments.length) {
          if (messages.length) {
            mediaExtra = defaultConfig()
          }
          switch (attachments[i].type) {
            case 'poll':
              if (config.sendNativePoll) {
                messages.push(
                  await telegram.sendPoll(
                    chatId,
                    config.customPollTitle
                      ? `${config.customPollTitle} - ${decode(
                          attachments[i].poll.question
                        )}`
                      : decode(attachments[i].poll.question),
                    attachments[i].poll.answers.map((answer) => answer.text),
                    {
                      reply_markup: mediaExtra.reply_markup
                        ? mediaExtra.reply_markup
                        : {}
                    }
                  )
                )
              }
              i++
              break
            case 'photo':
              const photosArray = []
              while (
                i < attachments.length &&
                attachments[i].type === 'photo'
              ) {
                photosArray.push({
                  type: 'photo',
                  media: utils.photo.getHQ(attachments[i].photo, criedHalfBea),
                  caption:
                    attachments[i].photo.text.length < 1000
                      ? decode(attachments[i].photo.text)
                      : '',
                  parse_mode: 'HTML'
                })
                i++
              }
              i = i - 1
              if (photosArray.length === 1) {
                messages.push(
                  await telegram.sendPhoto(
                    chatId,
                    photosArray[0].media,
                    mediaExtra
                  )
                )
              } else {
                messages.push(
                  await telegram.sendMediaGroup(chatId, photosArray)
                )
              }
              break
            case 'doc':
              messages.push(
                await sendDocument(attachments[i].doc, null, mediaExtra)
              )
              break
            case 'video':
              messages.push(
                await sendVideo(attachments[i].video, null, mediaExtra)
              )
              break
            case 'album':
              mediaExtra.reply_markup.inline_keyboard.unshift([
                {
                  text: decode(attachments[i].album.title),
                  url: `https://vk.com/album${attachments[i].album.owner_id}_${attachments[i].album.id}`
                }
              ])
              mediaExtra.disable_web_page_preview = false
              messages.push(
                await sendPhoto(attachments[i].album.thumb, null, mediaExtra)
              )
              break
          }
          i++
        }
        return messages
      }
      if (mediaText) {
        messageExtra.disable_web_page_preview = true
        return mediaPoster(
          await telegram.sendMessage(chatId, mediaText, messageExtra)
        )
      } else {
        if (attachmentLink.length) {
          messageExtra.disable_web_page_preview = false
          return mediaPoster(
            await telegram.sendMessage(
              chatId,
              `<a href="${
                attachmentLink[0].url
              }">&#160;</a>${attachmentLink
                .map(
                  (link) =>
                    `<a href="${link.url}">${decode(
                      link.title
                    ).capitalize()}</a>`
                )
                .join('\n')}`,
              messageExtra
            )
          )
        } else {
          return mediaPoster()
        }
      }
    }
  }
}
