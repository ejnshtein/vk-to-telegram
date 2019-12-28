const VkToTelegram = require('./')
const config = require('./config.json')
const VkToTg = new VkToTelegram({
  ...config,
  signed: '👨',
  heroku: false,
  debug: true,
  // prependText: '#overwatch',
  // appendText: '#hollycow',
  ads: false,
  repostAds: false,
  // sendNativePoll: false
})
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())
app.use((req, res) => {
  // console.log(req)
  VkToTg.send(req, res)
    .then(result => {
      console.log('done', result)
    })
    .catch(err => {
      console.log(err)
    })
})
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
