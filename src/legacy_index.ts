import Forwarder from "./lib/forwarder";
import { Telegram } from "telegraf";
import vkApi from "./lib/vkapi";
import Filter from "./lib/filter";
import * as express from 'express'
let herokuPosts = {};

export class VkToTelegram {
  token: any;
  chatName: any;
  vkConfirmation: any;
  ownerId: any;
  vkToken: any;
  fromId: any;
  chatId: any;
  customVkButton: any;
  customPollTitle: any;
  customLongPostText: any;
  heroku: any;
  herokuTimeout: any;
  signed: any;
  secret: any;
  filterByWord: any;
  filterByHashtag: any;
  ads: any;
  repostAds: any;
  appendText: any;
  prependText: any;
  repost: any;
  sendNativePoll: any;
  criedHalfBea: any;
  constructor(options) {
    this.token = options.botToken;
    this.chatName = options.chatName
      ? options.chatName.startsWith("@")
        ? options.chatName
        : `@${options.chatName}`
      : "";
    this.vkConfirmation = options.vkConfirmation;
    this.ownerId = options.ownerId;
    this.vkToken = options.vkToken;
    this.fromId = options.fromId || null;
    this.chatId = options.chatId || null;
    // this.debug = options.debug || false
    this.customVkButton = options.customVkButton || "";
    this.customPollTitle = options.customPollTitle || "";
    this.customLongPostText =
      typeof options.customLongPostText === "string"
        ? options.customLongPostText
        : "[Read full post in VK]";
    this.heroku = options.heroku || false;
    this.herokuTimeout = options.herokuTimeout || 10000;
    this.signed = options.signed || "👨";
    this.secret = options.secret || "";
    this.filterByWord = options.filterByWord
      ? options.filterByWord.split(",")
      : [];
    this.filterByHashtag = options.filterByHashtag
      ? options.filterByHashtag.split(",")
      : [];
    this.ads = typeof options.ads === "boolean" ? options.ads : true;
    this.repostAds =
      typeof options.repostAds === "boolean" ? options.repostAds : true;
    this.appendText = options.appendText || "";
    this.prependText = options.prependText || "";
    this.repost = typeof options.repost === "boolean" ? options.repost : true;
    this.sendNativePoll =
      typeof options.sendNativePoll === "boolean"
        ? options.sendNativePoll
        : true;
    this.criedHalfBea =
      typeof options.criedHalfBea === "boolean" ? options.criedHalfBea : false;

    this.send = this.send.bind(this);
  }

  async send(ctx, res) {
    let body;
    let request;
    if (ctx.request) {
      request = ctx.request;
    } else {
      request = ctx;
    }
    const callback = async (data) => {
      if (ctx.request) {
        ctx.body = data;
      } else {
        res.send(data);
      }
    };
    try {
      body = JSON.parse(JSON.stringify(request.body));
    } catch (e) {
      throw new Error(
        `Error with body from vk: \n\n${request.body}\n${request.ip}`
      );
    }
    if (body.type === "confirmation") {
      await callback(this.vkConfirmation);
      return;
    } else {
      await callback("ok");
    }
    if (this.secret) {
      if (!body.secret || body.secret !== this.secret) {
        throw new Error("Secret field do not match");
      }
    }
    const telegram = new Telegram(this.token);
    const vkapi = vkApi(this.vkToken);
    const filter = new Filter({
      words: this.filterByWord,
      tags: this.filterByHashtag,
    });

    if (this.heroku) {
      const { originalUrl } = request;
      const newPost = {
        id: body.object.id,
        owner: body.object.owner_id,
        date: Date.now(),
      };
      if (
        herokuPosts[originalUrl] &&
        Object.keys(herokuPosts[originalUrl]).length
      ) {
        for (const owner in herokuPosts[originalUrl]) {
          const group = herokuPosts[originalUrl][owner];
          if (Object.keys(group).length) {
            for (const postId in group) {
              const post = group[postId];
              if (Date.now() - post.date > this.herokuTimeout) {
                delete group[postId];
              }
            }
          }
        }
        let post;
        try {
          post = herokuPosts[originalUrl][newPost.owner][newPost.id];
        } catch (e) {
          herokuPosts = {
            ...herokuPosts,
            [originalUrl]: {
              ...herokuPosts[originalUrl],
              [newPost.owner]: {
                ...herokuPosts[originalUrl][newPost.owner],
                [newPost.id]: {
                  date: newPost.date,
                },
              },
            },
          };
          // herokuPosts[originalUrl][newPost.owner][newPost.id] = {
          //   date: newPost.date
          // }
        }
        if (post) {
          throw new Error(
            `Double post detected: path - "${originalUrl}", post url - https://vk.com/wall${newPost.owner}_${newPost.id}`
          );
        }
      } else {
        herokuPosts[originalUrl] = {
          [newPost.owner]: {
            [newPost.id]: {
              date: newPost.date,
            },
          },
        };
      }
    }
    if (this.fromId ? body.object.from_id !== this.fromId : false) {
      throw new Error(
        `Wrong post from_id: ${body.object.from_id} !== ${this.fromId}`
      );
    }
    if (body.type !== "wall_post_new") {
      throw new Error("Not a event.type wall_post_new" + ` ${body.type}`);
    }
    if (body.object.post_type !== "post") {
      throw new Error("Not a post.type post");
    }
    const { response } = await vkapi.wall.getById(
      `${body.object.owner_id}_${body.object.id}`,
      {
        copy_history_depth: 1,
      }
    );
    if (response.length) {
      if (!this.repost) {
        if (response[0].copy_history) {
          throw new Error(
            `Post contains repost: ${JSON.stringify(response[0])}`
          );
        }
      }
      const messages = [];
      const post = response[0];
      if (!this.ads) {
        if (
          typeof post.marked_as_ads === "number" &&
          post.marked_as_ads !== 0
        ) {
          throw new Error("This is an ad. Rejecting.");
        }
      }
      if (post.text) {
        if (post.text.length > 4090) {
          post.text = this.get("customLongPostText").replace(
            /\[([\S\s]*?)\]/gi,
            `<a href="https://vk.com/wall${post.owner_id}_${post.id}">$1</a>`
          );
        } else {
          await filter(post.text);
        }
      }
      const chatId = this.chatId
        ? this.chatId
        : (await telegram.getChat(this.chatName)).id;
      this.chatId = chatId;
      const forward = forwarder(this);
      if (this.signed && post.signer_id) {
        const signer = (await vkapi.users.get(post.signer_id)).response[0];
        post.text += `\n\n[id${signer.id}|${this.signed} ${signer.first_name} ${
          signer.last_name ? signer.last_name : ""
        }]`;
      }
      if (this.prependText) {
        post.text = `${this.prependText}${post.text ? "\n" + post.text : ""}`;
      }
      if (this.appendText) {
        post.text = `${post.text ? post.text + "\n" : ""}${this.appendText}`;
      }
      messages.push({
        type: "post",
        post: await forward(post),
      });
      if (post.copy_history) {
        const repost = post.copy_history[post.copy_history.length - 1];
        if (!this.repostAds) {
          if (
            typeof repost.marked_as_ads === "number" &&
            repost.marked_as_ads !== 0
          ) {
            throw new Error("Ad in repost. Rejecting.");
          }
        }
        if (repost.text) {
          if (repost.text.length > 4090) {
            repost.text = this.customLongPostText.replace(
              /\[([\S\s]*?)\]/gi,
              `<a href="https://vk.com/wall${repost.owner_id}_${repost.id}">$1</a>`
            );
          } else {
            await filter(repost.text);
          }
        }
        if (this.signed && repost.signer_id) {
          const repostSigner = (await vkapi.users.get(repost.signer_id))
            .response[0];
          repost.text += `\n\n[id${repostSigner.id}|${this.signed} ${
            repostSigner.first_name
          } ${repostSigner.last_name ? repostSigner.last_name : ""}]`;
        }
        messages.push({
          type: "repost",
          post: await forward(repost),
        });
      }
      return messages;
    }
  }
  get(arg0: string) {
    throw new Error("Method not implemented.");
  }
}

export default VkToTelegram;
