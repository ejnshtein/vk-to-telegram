module.exports = function ({ tags, words }) {
  return text => {
    if (words.length) {
      words.forEach(word => {
        const containKeyWord = word.startsWith('-')
          ? !text.split(/[,.\s]/).some(textWord => word.replace('-', '').toLowerCase() === textWord.toLowerCase())
          : text.split(/[,.\s]/).some(textWord => word.toLowerCase() === textWord.toLowerCase())

        if (containKeyWord) {
          throw new Error(`Post text ${word.startsWith('-') ? 'not' : ''} contain keyword ${word.replace('-', '')}`)
        }
      })
      console.log(text, tags, words)
      if (/#\S+/ig.test(text)) {
        tags.forEach(tag => {
          const containKeyTag = tag.startsWith('-')
            ? !text.match(/#\S+/ig).some(textTag => tag.replace('-', '').toLowerCase() === textTag.toLowerCase())
            : text.match(/#\S+/ig).some(textTag => tag.toLowerCase() === textTag.toLowerCase())
          if (containKeyTag) {
            throw new Error(`Post text${tag.startsWith('-') ? ' not' : ' '} contain keyhashtag ${tag.replace('-', '')}`)
          }
        })
      }
    }
  }
}
