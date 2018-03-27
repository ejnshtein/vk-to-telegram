const vkToTelegram = require('../'),
    vkToTg = new vkToTelegram({
        botToken: 'your bot token',
        chatName: 'telegram chat/channel name',
        vkConfirmation: 'group confirmation',
        ownerId: 'your telegram id',
        fromId: 'your group id',
        vkToken: 'your very long token from vk api'
    }),
    app = require('express')(),
    bodyParser = require('body-parser')
app.use(bodyParser.json())
app.post('/', vkToTg.send)

app.listen(80, () => { // For heroku users - process.env.PORT https://scotch.io/tutorials/how-to-deploy-a-node-js-app-to-heroku
    console.log('listening on port 80')
})