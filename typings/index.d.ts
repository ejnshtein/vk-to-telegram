/// <reference types="node" />

import { Message } from 'telegram-typings'
import { IncomingMessage, ServerResponse } from 'http'

export interface Forwarder {
  /**
   * Menhod to forward data from vk trought your callback path.  
   * Works with Koa2 and Express.
   */
  send(req: IncomingMessage, res?: ServerResponse): Promise<ResponseMessage[]>
}
export interface ForwarderOptions {
  /**
   * Telegram bot token from @botfather
   */
  botToken: string 

  /**
   * Telegram chat name, starts with @
   */
  chatName?: string

  /**
   * Telegram chat id (will replace chatName)
   */
  chatId?: number

  /**
   * Confirmation token from VK group
   */
  vkConfirmation: string

  /**
   * Your VK API token (needs for media, like video or docs)
   */
  vkToken: string

  /**
   * Your telegram id ([@getidsbot](https://t.me/getidsbot))
   */
  ownerId: number

  /** 
   * VK group id
   */
  fromId?: number

  /**
   * Custom text for button with post link.
   */
  customVkButton?: string

  /**
   * Custom title before poll title
   */
  customPollTitle?: string

  /**
   * If Post text too long for telegram(max 4096 char) send this text
   */
  customLongPostText?: string

  /**
   * Heroku mode
   * It will filter posts to don't sent it twice or more times.
   */
  heroku?: boolean

  /**
   * Heroku posts filter timeout
   */
  herokuTimeout?: number

  /**
   * Show signer in post (if available)
   * @example
   * signed='👨' -> '👨 <signer.first_name> <signer.last_name>'
   */
  signed?: string

  /**
   * Secret key from your vk community
   */
  secret?: string

  /**
   * Filter posts by key word(s) (use '-' in start to invert)
   */
  filterByWord?: string

  /**
   * Filter posts by hashtag (use '-' in start to invert)
   */
  filterByHashtag?: string

  /**
   * Forward posts marked as ads (By default `true`)
   */
  ads?: boolean

  /**
   * Forward reposts marked as ads (By default `true`)
   */
  repostAds?: boolean

  /**
   * Append text to forwarded post (can be used for hashtags for channel navigation)
   */
  appendText?: string

  /**
   * Prepend text to forwarded post (can be used for hashtags for channel navigation)
   */
  prependText?: string

  /**
   * Forward posts with repost (By default `true`)
   */
  repost?: boolean
}
interface ResponseMessage {
  type: 'post' | 'repost',
  repost: Message | Message[]
}

export interface VkToTelegram {
  new (options: ForwarderOptions): Forwarder
}

export const VkToTelegram: VkToTelegram

export default VkToTelegram