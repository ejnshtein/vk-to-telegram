const vkToTelegram = require('./index'),
    app = require('express')(),
    bodyParser = require('body-parser'),
    config = require('./config.json'),
    vkToTg = new vkToTelegram({
        botToken: config.botToken,
        chatName: config.chatName,
        vkConfirmation: config.vkConfirmation,
        ownerId: config.ownerId,
        vkToken: config.vkToken,
        customVkButton: config.customVkButton,
        customPollTitle: config.customPollTitle,
        customLongPostText: config.customLongPostText,
        signed: '👨',
        heroku: true
    })
    // vkToTg.debug = true
app.use(bodyParser.json())
app.post('/', (req, res) => {
    vkToTg.send(req, res)
        .then(messages => {
            console.log(JSON.stringify(messages))
        })
        .catch(err => {
            console.log(err)
        })
})
app.listen(80, () => {
    console.log('listening on port 80')
})