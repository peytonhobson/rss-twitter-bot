import { daysToMilliseconds } from '@crossingminds/utils'
import RSSParser from 'rss-parser'
import type { RSSFeed } from './rssFeeds'

const ONE_DAY_AGO = daysToMilliseconds(1)

export type FeedItem = Awaited<ReturnType<typeof fetchArticles>>[number]

const rssParser = new RSSParser()

export async function fetchArticles(rssFeed: RSSFeed) {
  try {
    const feed = await rssParser.parseURL(rssFeed.feedLink)

    /* Filter out articles that are older than a day */
    return feed.items
      .filter(item => {
        const pubDate = new Date(item.pubDate).getTime()

        return pubDate > Date.now() - ONE_DAY_AGO
      })
      .map(item => ({
        ...item,
        twitterHandle: rssFeed.twitterHandle
      }))
  } catch (error) {
    console.error('Error parsing feed:', error)
    process.exit(1)
  }
}
