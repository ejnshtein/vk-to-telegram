const vkToTelegram = require('../'),
    vkToTg = new vkToTelegram({
        botToken: 'your bot token',
        chatName: 'telegram chat/channel name',
        vkConfirmation: 'group confirmation',
        ownerId: 'your telegram id',
        fromId: 'your group id(example: -103208430)', // optional
        vkToken: 'your very long token from vk api'
    }),
    app = require('express')(),
    bodyParser = require('body-parser')
app.use(bodyParser.json())
app.post('/', (req, res) => {
    vkToTg.send(req, res)
        .then(() => console.log('Done!'))
        .catch((err) => {
            console.log('Something went wrong')
            console.log(err)
        })
})

app.listen(80, () => {
    console.log('listening on port 80')
})