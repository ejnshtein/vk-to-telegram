module.exports = function ({ tags, words }) {
    return text => {
        if (words.length) {
            words.forEach(word => {
                const containKeyWord = word.startsWith('-') ?
                    !text.split(/[,.\s]/).some(textWord => word.replace('-', '').toLowerCase() === textWord.toLowerCase()) :
                    text.split(/[,.\s]/).some(textWord => word.toLowerCase() === textWord.toLowerCase())

                if (containKeyWord) {
                    throw `Post text ${word.startsWith('-') ? 'not' : '' } contain keyword ${word.replace('-', '')}`
                }
            })
            if (/#\S+/ig.test(text)) {
                tags.forEach(tag => {
                    const containKeyTag = tag.startsWith('-') ? 
                        !text.match(/#\S+/ig).some(textTag => tag.replace('-', '').toLowerCase() !== textTag.toLowerCase()) :
                        text.match(/#\S+/ig).some(textTag => tag.toLowerCase() === textTag.toLowerCase())
                    if (containKeyTag) {
                        throw `Post text${tag.startsWith('-') ? ' not' : ' ' } contain keyhashtag ${tag.replace('-', '')}`
                    }
                })
            }
        }
        //     text.split(/[,.\s]/).forEach(word => {
        //         const keyword = words.find(testWord => testWord.startsWith('-') ? testWord.replace('-', '').toLowerCase() !== word.toLowerCase() : testWord.toLowerCase() === word.toLowerCase())
        //         if (keyword) {
        //             throw `Found a key word "${keyword}" from the filterByWord. Rejecting.`
        //         }
        //     })
        // }
        // if (tags.length && /#\S+/ig.test(text)) {
        //     text.match(/#\S+/ig).forEach(hashtag => {
        //         const keytag = tags.find(testtag => testtag.startsWith('-') ? testtag.replace('-', '').toLowerCase() !== hashtag.toLowerCase() : testtag.toLowerCase() === hashtag.toLowerCase())
        //         if (keytag) {
        //             throw `Found a key hashtag "${keytag}" from the filterByHasttag. Rejecting.`
        //         }
        //     })
        // }
        return 
    }
}