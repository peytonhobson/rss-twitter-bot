import { daysToMilliseconds } from '@crossingminds/utils'
import RSSParser from 'rss-parser'
import type { RSSFeed } from './postArticleTweet'

const DEFAULT_EARLIEST_PUBLISH_DATE = daysToMilliseconds(1)

export type FeedItem = Awaited<ReturnType<typeof fetchArticles>>[number]

const rssParser = new RSSParser()

export async function fetchArticles(
  rssFeed: RSSFeed,
  earliestPublishDate: Date | undefined
) {
  try {
    const feed = await rssParser.parseURL(rssFeed.feedLink)

    return feed.items
      .filter(item => {
        const pubDate = new Date(item.pubDate).getTime()

        /* Filter out articles that are older than the earliest publish date.
           If no earliest publish date is provided, default to 1 day */
        return (
          pubDate >
          Date.now() -
            (earliestPublishDate.getTime() ?? DEFAULT_EARLIEST_PUBLISH_DATE)
        )
      })
      .map(item => ({
        ...item,
        twitterHandle: rssFeed.twitterHandle // Add Twitter handle to each feed item
      }))
  } catch (error) {
    console.error('Error parsing feed:', error, rssFeed)
    return []
  }
}
