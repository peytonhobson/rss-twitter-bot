import RSSParser from 'rss-parser'
import { validateArticle } from '../models/article'
import type { RSSFeed, Article } from '../models'

const rssParser = new RSSParser()

/**
 * Fetches articles from multiple RSS feeds and applies filtering.
 * @param rssFeeds - An array of RSS feed configurations.
 * @param earliestPublishDate - The earliest date to consider for articles.
 * @param customArticleFilter - An optional custom filter function for articles.
 * @returns A promise that resolves to an array of filtered articles.
 */
export async function fetchArticles(rssFeeds: RSSFeed[]) {
  return (
    await Promise.all(
      rssFeeds.map(async rssFeed => {
        return await fetchFeed(rssFeed)
      })
    )
  ).flat()
}

/**
 * Fetches and processes articles from a single RSS feed.
 * @param rssFeed - The RSS feed configuration.
 * @param earliestPublishDate - The earliest date to consider for articles.
 * @returns A promise that resolves to an array of processed articles.
 */
async function fetchFeed(rssFeed: RSSFeed) {
  try {
    const feed = await rssParser.parseURL(rssFeed.feedUrl)

    const feedItemsWithTwitterHandle = feed.items.map(item => ({
      ...item,
      twitterHandle: rssFeed.twitterHandle
    }))

    const validatedArticles = validateArticles(feedItemsWithTwitterHandle)

    return validatedArticles
  } catch (error) {
    console.error('Error parsing feed:', error, rssFeed)
    return []
  }
}

/**
 * Validates an array of RSS feed items.
 * @param items - An array of RSS feed items to validate.
 * @returns An array of validated articles.
 */
function validateArticles(items: unknown[]) {
  const validatedItems: Article[] = []

  for (const item of items) {
    try {
      const validatedItem = validateArticle(item)

      if (validatedItem) {
        validatedItems.push(validatedItem)
      }
    } catch (error) {
      console.error('Error validating article:', error, item)
    }
  }

  return validatedItems
}
