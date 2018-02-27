# VK TO TELEGRAM

### Readme and code will be rewrited soon!!!
Powered by [Telegraf](https://github.com/telegraf/telegraf)  
## Installation
    npm install git+https://github.com/ejnshtein/vk-to-telegram.git
Soon i'll push it to npm package, but soon
### And now a bit example
```js
    const vkTotTelegram = require('vk-to-telegram'),
      sender = new vkTotTelegram({
        botToken: token,
        chatName: chatName,
        ownerId: ownerId,
        vkConfirmation: vkConfirmation,
        vkToken: vkToken
      })
    sender.startListen()
```
### Variables from example
| Variable | Required | Description |
| - |-| - |
| `token` | Yes | bot token from [Botfather](https://t.me/botfather)    |
| `chatName` | Yes  | telegram channel or group link, like '[@tavernofheroes](https://t.me/tavernofoverwatchnews)'       |
| `ownerId`| Yes | Your telegram id for sending error if they are. U can get know it from [@getidsbot](https://t.me/getidsbot) |
| `vkConfirmation` | Yes | confirmation string from ur group callback api server: ![](https://i.imgur.com/f9KDETa.png?2)  |
| `vkToken` | Yes | Follow the instructions below:|
|||1. Create Standalone application here: [https://vk.com/apps?act=manage](https://vk.com/apps?act=manage) |
|||2. Open settings in created application and copy application id |
|||3. Open this link with replace <this> to your application id: |
|||https://oauth.vk.com/authorize?client_id=<YOUR APPLICATION ID>&display=page&redirect_uri=http://vk.com/&scope=offline,video,docs&response_type=code&v=5.73 |
|||4. Click allow all that need's and it's all! Your token is in query url, do not copy all link, only token without other params!!!  |
|`fromId` | Optional | VK group id with '-'in start or nothing, if you don't need check. |
|`path` | Optional | default: '/' |
| `port` | Optional | default: 80  |

### Why?

For example, because I had a lot of bot's and when fixing the bug is inconvenient to update the code in all bots.
