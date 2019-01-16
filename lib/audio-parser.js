const puppeteer = require('puppeteer')
const EventEmitter = require('./event')
const events = new EventEmitter()


// work in progress

module.exports = {

  /**
   * get Audio List
   * @param {String[]} audioList
   */
  getAudios (audioList) {
    return new Promise((resolve, reject) => {
      events.emit('audioData', audioList, (err, result) => err ? reject(err) : resolve(result))
    })
  },
  audioData (url) {
    return new Promise((resolve, reject) => {
      events.emit('audioDowndload', url, (err, result) => err ? reject(err) : resolve(result))
    })
  }
}
async function start () {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--profile-directory="Default"']
  })
  const page = await browser.newPage()
  await page.goto('https://datmusic.xyz', {
    timeout: 5000,
    waitUntil: 'domcontentloaded',
  })
  await page.waitForSelector('#result > div.list-group')
  events.on('audioData', async (audios, callback) => {
    const result = []
    for (let i = 0; i < audios.length; i++) {
      let audioData
      try {
        audioData = await page.evaluate((audio) => {
          return fetch(`https://api-2.datmusic.xyz/search?q=${audio}`).then(response => response.json())
        }, audios[i])
      } catch (e) {
        return callback(e)
      }
      result.push(audioData.data[0])
    }
    callback(null, result)
  })
  // events.on('audioDowndload', async (audio, callback) => {
  //     const page = await browser.newPage()
  //     console.log(audio)
  //     try {
  //         await page.goto(audio)
  //     } catch (e) {
  //         return callback(e)
  //     }
  //     return callback(null, audioBuffer)

  // })
}
start()