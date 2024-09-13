import type RSSParser from 'rss-parser'

export type Article = Awaited<
  ReturnType<typeof RSSParser.prototype.parseURL>
>[number] & {
  twitterHandle: string | undefined
}
