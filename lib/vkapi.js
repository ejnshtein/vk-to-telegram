const axios = require('axios')
const origin = 'https://api.vk.com/method/'
module.exports = (token) => {
    const vkToken = token
    const defaultParams = {
        access_token: vkToken,
        v: '5.71'
    }
    return {
        video: {
            
            /**
             * @param {Number[]} videos 
             */
            get (videos) {
                if (!Array.isArray(videos)) {
                    videos = [videos]
                }
                return new Promise((resolve, reject) => {
                    axios.get(`${origin}video.get`, {
                            params: Object.assign(defaultParams, { videos: videos.join(','), extended: 1 })
                        })
                        .then(response => {
                            if (response.status !== 200) { return reject(response)}
                            const video = response.data
                            resolve(video)
                        })
                        .catch(reject)
                })
            }
        },
        docs: {
            
            /**
             * @param {Number[]} docs 
             */
            getById (docs) {
                if (!Array.isArray('number')) {
                    docs = [docs]
                }
                return new Promise((resolve, reject) => {
                    axios.get(`${origin}docs.getById`, {
                            params: Object.assign(defaultParams, { docs: docs.join(',') })
                        })
                        .then(response => {
                            if (response.status !== 200) { return reject(response)}
                            const doc = response.data
                            resolve(doc)
                        })
                        .catch(reject)
                })
            }
        },
        users: {

            /**
             * @param {Number[]} users 
             */
            get (users) {
                if (!Array.isArray(users)) {
                    users = [users]
                }
                return new Promise((resolve, reject) => {
                    axios.get(`${origin}users.get`, {
                            params: Object.assign(defaultParams, { user_ids: users.join(','), fields: 'first_name,last_name' })
                        })
                        .then(response => {
                            if (response.status !== 200) { return reject(response)}
                            const doc = response.data
                            resolve(doc)
                        })
                        .catch(reject)
                })
            }
        },
        wall: {

            /**
             * @param {String[]} walls
             */
            getById (walls, params = {}) {
                if (!Array.isArray(walls)) {
                    walls = [walls]
                }
                return new Promise((resolve, reject) => {
                    axios.get(`${origin}wall.getById`, {
                        params: Object.assign(defaultParams, { posts: walls.join(',') }, params)
                    })
                    .then(response => {
                        if (response.status !== 200) { return reject(response)}
                        const wall = response.data
                        resolve(wall)
                    })
                    .catch(reject)
                })
            }
        }
    }
}