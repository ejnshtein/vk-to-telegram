# vk to telegram forwarder

[![NPM Version](https://img.shields.io/npm/v/vk-to-telegram.svg?style=flat-square)](https://www.npmjs.com/package/vk-to-telegram)
[![node](https://img.shields.io/node/v/vk-to-telegram.svg?style=flat-square)](https://www.npmjs.com/package/vk-to-telegram)

## Installation

    npm i vk-to-telegram --save

### Example

```js
const app = require('express')()
const bodyParser = require('body-parser')
const vkToTelegram = require('vk-to-telegram')
const vkToTg = new vkToTelegram({
  botToken: 'your bot token',
  chatName: 'telegram chat/channel name',
  ownerId: 'your telegram id', // number
  vkToken: 'your very long token from vk api',
  vkConfirmation: 'group confirmation'
})
app.use(bodyParser.json())
app.post('/', (req, res) => {
  vkToTg.send(req, res)
    .then(() => console.log('Done!'))
    .catch((err) => {
      console.log('Something went wrong')
      console.log(err)
    })
})

app.listen(80, ()=>{
  console.log('listening on port 80')
})
```

## What is this

It is a tool for express which using [VK callback api](https://vk.com/dev/callback_api) forwards posts from group in channel or chat in Telegram!  

## async/await

Here's example with koa2

```js
app.use(bodyParser())
app.use(async ctx => {
  const result = await vkToTg.send(ctx)
  console.log(result)
})
```

## Used by:

| [<img src="https://i.imgur.com/UYV2cfV.png" height="120">](https://vk.com/advance_empire) | [<img src="https://i.imgur.com/2RR0fXh.png" height="120">](https://vk.com/panzer_sofa) | [<img src="https://i.imgur.com/51DrStx.jpg" height="120">](https://vk.com/oleglivanovgaming) | [<img src="https://i.imgur.com/FnBpfyl.jpg" height="120">](https://vk.com/ongoing_research) |  
|-|-|-|-|
| [AlexandriA (AAR)](https://t.me/advance_emp) | [PanzerSofa](https://t.me/PanzerSofa) | [Олег Ливанов](https://t.me/oleglivanovgaming) | [ongoing research](https://t.me/ongoings) |
| [<img src="https://i.imgur.com/7wydIxN.png"  height="120">](https://vk.com/anireact) | [<img src="https://i.imgur.com/Y0kda79.png"  height="120">](https://vk.com/otakusquad) | [<img src="https://i.imgur.com/yu6BNFj.png"  height="120">](https://vk.com/dsgtng) |[<img src="https://i.imgur.com/IBKqHUj.jpg"  height="120">](https://vk.com/fondspeedwagona)|
| [аниреакт](https://t.me/telereact) | [Otaku Squad](https://t.me/otakusquadt) | [disgusting otaku](https://t.me/dsgstngotakunews) | [Fond SpeedWagona](https://t.me/jojomemesss)|

## What content does it forward

| Content type | Works fully? |  
| - | - |  
| Photo(s) | `Yes` |
| Video(s) | `Yes` |  
| Document(s) | `Yes` |
| Link | `Yes` |  
| Application Content | `Yes` |
| Poll | `Yes` |
| Audio(s) | **NO.** Why? [Read here](https://vk.com/dev/audio). |
| Album(s) | `Yes` |
| Graffiti | `Not tested.` |
| Wiki Page | `Not tested.` |
| Market item | `Not tested.` |
| Sticker | `Not tested.` |

## Free usage

If you want to test this code, or use on a regular basis (via heroku), please [contact](#contact) me for setup.

## Variables

|Variable|Type|Required|Description|
|-|-|-|-|
| `token`|`String`|**Yes**|Bot token from [Botfather](https://t.me/botfather)|
| `chatName`|`String` | **Yes**  | Telegram channel or group link, like '[@tavernofheroes](https://t.me/tavernofoverwatchnews)'|
| `ownerId`|`Number`|**Yes** | Your telegram id for sending error if they are. U can get know it from [@getidsbot](https://t.me/getidsbot)|
| `vkConfirmation`|`String`|**Yes**|Confirmation string from ur group callback api server: <img src="https://i.imgur.com/Gq1bly4.png" width="600">|
| `vkToken` |`String`| **Yes** | Follow the instructions below:|
||||1. Create Standalone application here: [https://vk.com/apps?act=manage](https://vk.com/apps?act=manage) |
||||2. Open settings in created application and copy application id |
||||3. Open this link with replace your application id: |
||||https://oauth.vk.com/authorize?client_id=YOUR APPLICATION ID&display=page&redirect_uri=http://vk.com/&scope=offline,video,docs&response_type=token&v=5.81|
||||4. Click allow all that need's and it's all! Your token is in query url, do not copy all link, only token without other params.  |
|`chatId`|`Number`|**Optional**|If you know your chat/channel id, put it here, it will replace `chatName` parameter|
|`fromId` |`Number`| **Optional** | VK group id with '-'in start or nothing, if you don't need check. |
|`customVkButton`|`String`|**Optional**|Title for button which will be added to each post to open it in VK|
|`customPollTitle`|`String`|**Optional**|Custom template string in the title of button with URL to poll("Open poll" -> "Open poll - ${poll.question}")|
|`customLongPostText`|`String`|**Optional**|Custom template string that replace full post text, because it's too long for Telegram(max 4096 characters) ("Too long post... [Read full]" -> "Too long post... \<a href="https://vk.com/poll${poll.owner_id}_${poll.id}">Read full</a>" and parse as HTML)|
|`signed`|`String`|**Optional**|Custom template string that add post signer in the end of Telegram message ("Post By" -> "\n\nPost by \<a href="https://vk.com/id${post.signer_id}">${signer.first_name} ${signer.last_name}</a>" and parse as HTML) |
|`heroku`|`Boolean`|**Optional**|Add filter that stops forwarder if detect that post repeats(Because of app [sleeping](https://devcenter.heroku.com/articles/free-dyno-hours))|
|`herokuTimeout`|`Number`|**Optional**|Heroku post delay between same posts|
|`secret`|`String`|**Optional**|Secret field from vk admin panel to verify that post has come from VK|
|`filterByWord`|`String`|**Optional**|Filter posts by key word(s) (use ',' as separator) (use '-' in begin of word to invert)|
|`filterByHashtag`|`String`|**Optional**|Filter posts by hashtag (use ',' as separator) (use '-' in begin of word to invert)|
|`ads`|`Boolean`|**Optional**|Forward posts marked as ads? (By default `true`)|
|`repostAds`|`Boolean`|**Optional**|Forward reposts marked as ads? (By default `true`)|
|`appendText`|`String`|**Optional**|Append text to forwarded post (can be used for hashtags for channel navigation)|
|`prependText`|`String`|**Optional**|Same as `appendText` but it's will prepend it in the start of post text|
|`repost`|`Boolean`|**Optional**|Allow to forward post with repost (By default `true`)|  
|`sendNativePoll`|`Boolean`|**Optional**|Use native [Telegram poll](https://core.telegram.org/bots/api#april-14-2019) instead of link to poll in VK, set `false` to use poll in VK|
|`criedHalfBea`|`Boolean`|**Optional**|Use Z sized pictures as max. (Reduces pictures aliasing)|

* DON'T forget to pick in your vk group api dashboard event type 'WALL POST - NEW'.
* Recommend to use vk api **v5.103**

## Contact

[Telegram group](https://t.me/vktotgforwarder), [Telegram](https://t.me/ejnshtein), [Mail](mailto:ejnshtein@dsgstng.com)
