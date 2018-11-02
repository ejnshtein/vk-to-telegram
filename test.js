const vkToTelegram = require('./')
const config = require('./config.json')
const vkToTg = new vkToTelegram({
        ...config,
        filterByWord: 'someword',
        filterByHashtag: '#jojo',
        signed: '👨',
        heroku: false,
        debug: true,
        prependText: '#overwatch',
        appendText: '#hollycow',
        ads: false,
        repostAds: false
    })
const Koa = require('koa')
const route = require('koa-route')
const bodyParser = require('koa-bodyparser')
const app = new Koa()
app.use(bodyParser())
app.use(route.post('/', async ctx => {
    vkToTg.send(ctx)
    // vkToTg.send({body: ctx.request.body, ip: ctx.request.ip }, { async send (data) {ctx.body = data} })
    .then(console.log)
    .catch(console.log)
}))
// app.post('/', (req, res) => {
//     vkToTg.send(req, res)
//         .then(messages => {
//             console.log('sucs',JSON.stringify(messages))
//         })
//         .catch(err => {
//             console.log('err:', err)
//         })
// })
app.listen(80, () => {
    console.log('listening on port 80')
})
