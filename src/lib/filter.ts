export const filter = ({
  tags,
  words,
}: {
  tags: string[];
  words: string[];
}) => (text: string): void => {
  if (words.length) {
    const containWords = tags.filter((word) => !word.startsWith("-"));
    if (containWords.length) {
      if (
        !containWords.some((word) =>
          text
            .split(/[,.\s]/)
            .some((textWord) => word.toLowerCase() === textWord.toLowerCase())
        )
      ) {
        throw new Error(
          `Post text doesn't contain words ${containWords.join(", ")}`
        );
      }
    }

    const reverseContainWords = words.filter((word) => word.startsWith("-"));
    if (reverseContainWords.length) {
      if (
        !reverseContainWords.every((word) =>
          text
            .split(/[,.\s]/)
            .some(
              (textWord) =>
                word.replace("-", "").toLowerCase() !== textWord.toLowerCase()
            )
        )
      ) {
        throw new Error(
          `Post text doesn't contains all words: ${reverseContainWords.join(
            ", "
          )}`
        );
      }
    }
  }
  if (tags.length && /#\S+/gi.test(text)) {
    const containTags = tags.filter((tag) => !tag.startsWith("-"));
    if (containTags.length) {
      if (
        !containTags.some((tag) =>
          text
            .match(/#\S+/gi)
            .some((textTag) => tag.toLowerCase() === textTag.toLowerCase())
        )
      ) {
        throw new Error(
          `Post text doesn't contain some of hashtags ${containTags.join(", ")}`
        );
      }
    }

    const reverseContainTags = tags.filter((tag) => tag.startsWith("-"));
    if (reverseContainTags.length) {
      if (
        !reverseContainTags.every((tag) =>
          text
            .match(/#\S+/gi)
            .some(
              (textTag) =>
                tag.replace("-", "").toLowerCase() !== textTag.toLowerCase()
            )
        )
      ) {
        throw new Error(
          `Post text doesn't contains all hastags: ${reverseContainTags.join(
            ", "
          )}`
        );
      }
    }
  }
};
