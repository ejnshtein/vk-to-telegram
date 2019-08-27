module.exports = function ({ tags, words }) {
  return async text => {    
    if (words.length) {
      const containWords = tags.filter(word => !word.startsWith('-'))
      if (containWords.length) {
        if (!containWords.some(word => text.split(/[,.\s]/).some(textWord => word.toLowerCase() === textWord.toLowerCase()))) {
          throw new Error(`Post text doesn't contain words ${containWords.join(', ')}`)
        }
      }

      const reverseContainWords = words.filter(word => word.startsWith('-'))
      if (reverseContainWords.length) {
        if (!reverseContainWords.every(word => text.split(/[,.\s]/).some(textWord => word.replace('-').toLowerCase() !== textWord.toLowerCase()))) {
          throw new Error(`Post text doesn't contains all words: ${reverseContainWords.join(', ')}`)
        }
      }
    }
    if (tags.length && /#\S+/ig.test(text)) {
      const containTags = tags.filter(tag => !tag.startsWith('-'))
      if (containTags.length) {
        if (!containTags.some(tag => text.match(/#\S+/ig).some(textTag => tag.toLowerCase() === textTag.toLowerCase()))) {
          throw new Error(`Post text doesn't contain some of hashtags ${containTags.join(', ')}`)
        }
      }

      const reverseContainTags = tags.filter(tag => tag.startsWith('-'))
      if (reverseContainTags.length) {
        if (!reverseContainTags.every(tag => text.match(/#\S+/ig).some(textTag => tag.replace('-').toLowerCase() !== textTag.toLowerCase()))) {
          throw new Error(`Post text doesn't contains all hastags: ${reverseContainTags.join(', ')}`)
        }
      }
    }
  }
}
