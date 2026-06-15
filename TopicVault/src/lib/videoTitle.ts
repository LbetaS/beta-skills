export type SplitVideoTitle = {
  title: string
  topics: string[]
}

export function splitVideoTitle(value: string): SplitVideoTitle {
  const topics = value.match(/#[^\s#]+/g) ?? []
  const title = value
    .replace(/#[^\s#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    title: title || value.trim(),
    topics,
  }
}
