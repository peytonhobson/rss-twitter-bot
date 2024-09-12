/**
 * Represents an RSS feed configuration.
 * @property {string} feedUrl - The URL of the RSS feed.
 * @property {string | undefined} twitterHandle - The Twitter handle associated with the feed.
 */
export type RSSFeed = {
  feedUrl: string
  twitterHandle?: string | undefined
}
