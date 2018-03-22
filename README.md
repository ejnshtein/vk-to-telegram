# vk to telegram forwarder
Powered by [Telegraf](https://github.com/telegraf/telegraf)  
## What is this?  
It is a tool for express which using [VK callback api](https://vk.com/dev/callback_api) forwards posts from group in channel or chat in Telegram!  
Be careful, it doesn't send **audio and poll's**(maybe fix soon).
## Where I can see how it looks?
For example, this sending posts from [Tavern of Heroes | Overwatch](https://vk.com/tavernofoverwatch) to Telegram channel [Tavern of Overwatch | News](https://t.me/tavernofoverwatchnews),  
[Oleg Livanov - One man army](https://vk.com/oleglivanovgaming) trought [Heroku](https://heroku.com/) to Telegram channel [Oleg Livanov - One man army](https://t.me/oleglivanovgaming)
## Installation
    npm install vk-to-telegram@latest --save
### Example
```js
const app = require('express')(),
    bodyParser = require('body-parser'),
    vkToTelegram = require('vk-to-telegram'),
    vkToTg = new vkToTelegram({
        botToken: token,
        chatName: chatName,
        ownerId: ownerId,
        vkConfirmation: vkConfirmation,
        vkToken: vkToken
    })
app.use(bodyParser.json()) // Must needed
app.post('/', vkToTg.send) // Now when any content will be posted to this path it's gone to sent to Telegram

app.listen(80,()=>{
  console.log('listening on port 80')
})  
```
### Variables
| Variable | Required | Description |
| - |-| - |
| `token` | **Yes** | Bot token from [Botfather](https://t.me/botfather)    |
| `chatName` | **Yes**  | Telegram channel or group link, like '[@tavernofheroes](https://t.me/tavernofoverwatchnews)' |
| `ownerId`|**Yes** | Your telegram id for sending error if they are. U can get know it from [@getidsbot](https://t.me/getidsbot) |
| `vkConfirmation` | **Yes** | Confirmation string from ur group callback api server: ![](docs/vkcallback.png)  |
| `vkToken` | **Yes** | Follow the instructions below:|
|||1. Create Standalone application here: [https://vk.com/apps?act=manage](https://vk.com/apps?act=manage) |
|||2. Open settings in created application and copy application id |
|||3. Open this link with replace your application id: |
|||https://oauth.vk.com/authorize?client_id=YOUR APPLICATION ID&display=page&redirect_uri=http://vk.com/&scope=offline,video,docs&response_type=token&v=5.73|
|||4. Click allow all that need's and it's all! Your token is in query url, do not copy all link, only token without other params.  |
|`fromId` | Optional | VK group id with '-'in start or nothing, if you don't need check. |

### Why?

For example, because I had a lot of bot's and when fixing the bug is inconvenient to update the code in all bots.  
Also, I have an idea to add discord channel support, but it's just idea. ᕦ( ͡° ͜ʖ ͡°)ᕤ

### Contact
Here's a telegram group ¯\\_(ツ)_/¯ https://t.me/vktotgforwarder  
Also u can write to me directly in [Telegram](https://t.me/ejnshtein) or by [mail](mailto:ejnshtein@dsgstng.com)