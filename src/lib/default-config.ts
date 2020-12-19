import { ExtraReplyMessage } from "telegraf/typings/telegram-types";
export const defaultConfig: ExtraReplyMessage = {
  parse_mode: "HTML",
  disable_web_page_preview: true,
  reply_markup: {
    inline_keyboard: [],
  },
};
