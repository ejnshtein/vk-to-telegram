const request = require('./request')

const api = async (method, options) => {
  try {
    const response = await request(`https://api.vk.com/method/${method}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.87 Safari/537.36'
      },
      json: true,
      ...options
    }).then(({ data }) => data)

    return response
  } catch (e) {
    console.log(e)
  }
}

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
      get (videos, params = {
        extended: 1
      }) {
        if (!Array.isArray(videos)) {
          videos = [videos]
        }
        return api('video.get', {
          params: Object.assign(defaultParams, params, {
            videos: videos.join(',')
          })
        })
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
        return api('docs.getById', {
          params: Object.assign(defaultParams, params, {
            docs: docs.join(',')
          })
        })
      }
    },
    users: {

      /**
       * @param {Number[]} users
       */
      get (users, params = {
        fields: 'first_name,last_name'
      }) {
        if (!Array.isArray(users)) {
          users = [users]
        }
        return api('users.get', {
          params: Object.assign(defaultParams, params, {
            user_ids: users.join(',')
          })
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
        return api('wall.getById', {
          params: Object.assign(defaultParams, params, {
            posts: walls.join(',')
          })
        })
      }
    }
  }
}
