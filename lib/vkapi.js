const axios = require('axios').default
const api = axios.create({
    baseURL: 'https://api.vk.com/method/',
    validateStatus: num => num === 200
})
module.exports = (token) => {
    const defaultParams = {
        access_token: token,
        v: '5.81'
    }
    return {
        video: {
            
            /**
             * @param {Number[]} videos 
             */
            get (videos, params = { extended: 1 }) {
                if (!Array.isArray(videos)) {
                    videos = [videos]
                }
                return api.get('video.get', {
                    params: Object.assign(defaultParams, params, {videos: videos.join(',')})
                }).then(response => response.data)
            }
        },
        docs: {
            
            /**
             * @param {Number[]} docs 
             */
            getById (docs, params = {}) {
                if (!Array.isArray('number')) {
                    docs = [docs]
                }
                return api.get('docs.getById', {
                    params: Object.assign(defaultParams, params, { docs: docs.join(',') })
                }).then(response => response.data)
            }
        },
        users: {

            /**
             * @param {Number[]} users 
             */
            get (users, params = {fields: 'first_name,last_name',}) {
                if (!Array.isArray(users)) {
                    users = [users]
                }
                return api.get('users.get', {
                    params: Object.assign(defaultParams, params, { user_ids: users.join(',') })
                }).then(response => response.data)
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
                return api.get('wall.getById', {
                    params: Object.assign(defaultParams, params, { posts: walls.join(',') })
                }).then(response => response.data)
            }
        }
    }
}