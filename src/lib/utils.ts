module.exports = {
  photo: {
    getHQ (photo, criedHalfBea = false) {
      if (photo.sizes) {
        if (criedHalfBea) {
          const zSize = photo.sizes.find(el => el.type === 'z')
          if (zSize) {
            return zSize.url
          }
        }
        return photo.sizes.pop().url
      }
      let photoUrl
      if (criedHalfBea && typeof photo.photo_2560 === 'string') {
        delete photo.photo_2560
      }
      switch ('string') {
        case typeof photo.photo_2560:
          photoUrl = photo.photo_2560
          break
        case typeof photo.photo_1280:
          photoUrl = photo.photo_1280
          break
        case typeof photo.photo_807:
          photoUrl = photo.photo_807
          break
        case typeof photo.photo_604:
          photoUrl = photo.photo_604
          break
        case typeof photo.photo_130:
          photoUrl = photo.photo_130
          break
        case typeof photo.photo_75:
          photoUrl = typeof photo.photo_75
          break
      }
      return photoUrl
    }
  },
  video: {
    getPreview (video) {
      let photoUrl
      switch ('string') {
        case typeof video.photo_800:
          photoUrl = video.photo_800
          break
        case typeof video.photo_640:
          photoUrl = video.photo_640
          break
        case typeof video.photo_320:
          photoUrl = video.photo_320
          break
        case typeof video.photo_130:
          photoUrl = video.photo_130
          break
      }
      return photoUrl
    }
  },
  isAlbum (media) {
    if (media.length >= 2) {
      return media.every(el => el.type === 'photo')
    }
    return false
  },
  getMediaGroup (groupId) {
    let groupName
    switch (groupId) {
      case 1:
      case 2:
      case 6:
      case 7:
      case 8:
        groupName = 'document'
        break
      case 3:
        groupName = 'animation'
        break
      case 4:
        groupName = 'photo'
        break
    }
    return groupName
  }
}
