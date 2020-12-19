export function deepmerge<T = Record<string, unknown>>(
  target: T,
  ...sources: T[]
): T {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const isObject = (obj: object) => obj && typeof obj === 'object'
  sources.forEach((source) =>
    Object.keys(source).forEach((key) => {
      const targetValue = target[key]
      const sourceValue = source[key]

      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        target[key] = targetValue.concat(sourceValue)
      } else if (
        isObject(targetValue) &&
        isObject(sourceValue as Record<string, unknown>)
      ) {
        target[key] = deepmerge(
          Object.assign({}, targetValue),
          sourceValue as Record<string, unknown>
        )
      } else {
        target[key] = sourceValue
      }
    })
  )

  return target
}
