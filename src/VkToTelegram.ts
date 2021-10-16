import { VK } from 'vk-io';

export interface VKToTelegramOptions {
  /**
   * Telegram bot token
   */
  token: string

  /**
   * VK group confirmation string
   */
  groupConfirmation: string

  /**
   * Telegram owner account id (use [@getidsbot](https://t.me/getidsbot) for that)
   */
  ownerId: number

  /**
   * VK api token
   */
  apiToken: string

  /**
   * Telegram chat/channel id or a username string (with `@` at the start)
   *
   * @example
   * ```
   * {
   *  chatId: 123456
   * }
   *
   * or
   *
   * {
   *  chatId: '@mycoolchannelname'
   * }
   * ```
   */
  chatId: string | number

  /**
   * Secret field from VK group admin panel to verify that post has come from VK
   */
  secret?: string

  postCustomization?: {
    /**
     * Allows to customize button title or disable button
     *
     * Set to `false` if you don't want attaching this button to the post
     */
    linkToVkPostButton?: string | boolean

    /**
     * Custom template string that replace full post text,
     * because it's too long for Telegram (max 4096 characters)
     *
     * Available variables: https://vk.com/dev/objects/poll
     *
     * You can use variables by an example: "my text ${poll.variable_name}"
     *
     * Any HTML that you use will be parsed later by telegram.
     *
     * @default "Too long post... [Read full]"
     */
    longPostText?: string

    /**
     * Custom template string that add post signer in the end of Telegram message
     *
     * Available variables: https://vk.com/dev/objects/user
     *
     * @default ``` "\n\nPost by <a href="https://vk.com/id${post.signer_id}">{signer.first_name} ${signer.last_name}</a>" ```
     */
    signature?: string

    /**
     * Append text to the end of forwarded post (can be used for hashtags for channel navigation)
     */
    appendText?: string

    /**
     * Append text to the top of forwarded post (can be used for hashtags for channel navigation)
     */
    prependText?: string

    /**
     * Use native [Telegram poll](https://core.telegram.org/bots/api#poll) instead of link to poll in VK
     *
     * @default true
     */
    useNativePoll?: boolean

    /**
     * Use Z sized pictures as max. (Reduces pictures aliasing)
     *
     * @default true
     */
    criedHalfBea?: boolean
  }

  filters?: {
    /**
     * Filter posts by group id
     *
     * @example -168864010
     */
    byGroupId?: number

    /**
     * Filter posts by key words
     *
     * - Use ',' as separator
     * - Use '-' in begin of word to invert
     *
     * @example 'filter,me'
     *
     * @example '-include_me,even_if_im_here'
     */
    byWord?: string

    /**
     * Filter posts by hashtag
     *
     * - Use ',' as separator
     * - Use '-' in begin of word to invert
     *
     * @example '#filter,#me'
     *
     * @example '-#include_me,#even_if_im_here'
     */
    byHashtag?: string

    /**
     * Filter posts marked as ads
     *
     * @default false
     */
    ads?: boolean
  }

  /**
   * Forward reposts marked as ads?
   *
   * @default true
   */
  repostAds?: boolean

  /**
   * Forward post with repost
   *
   * @default true
   */
  repostReposts?: boolean

  /**
   * If `true` will append buttons to the post itself.
   * Otherwise comments won't work in Telegram.
   */
  commentsMode?: boolean
}

export interface ForwardSuccessful {
  ok: true
}

export interface ForwardFailed {
  ok: false
  reason: string
}

export type ForwardResult = ForwardSuccessful | ForwardFailed

export enum FAILED_FORWARD_REASONS {
  CONTAINS_REPOST = 'Post contains repost',
  AD = 'This post is an ad'
}

const failedForward = (reason: FAILED_FORWARD_REASONS): ForwardFailed => ({ ok: false, reason })

export class VKToTelegram {
  VK: VK;
  constructor(
    private options: VKToTelegramOptions
  ) {
    this.VK = new VK({
      token: options.apiToken
    })

    this.filter = new Filter({
      words:
    })
  }

  async forwardPost(groupId: number, postId: number): Promise<ForwardResult> {
    const posts = await this.VK.api.wall.getById({
      posts: `${groupId}_${postId}`
    })

    if (posts.length > 0) {
      const [post] = posts;

      if ((typeof this.options.repostReposts === 'undefined' || !this.options.repostReposts)
      && (post.copy_history && post.copy_history.length > 0)) {
        return failedForward(FAILED_FORWARD_REASONS.CONTAINS_REPOST)
      }

      if (this.options.filters.ads && post.marked_as_ads === 1) {
        return failedForward(FAILED_FORWARD_REASONS.AD)
      }
    }
  }
}