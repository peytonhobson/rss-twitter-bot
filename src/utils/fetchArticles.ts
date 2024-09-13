import { r } from '@crossingminds/utils'
import RSSParser from 'rss-parser'
import type { RSSFeed, Article } from '../models'

const rssParser = new RSSParser()

/**
 * Fetches articles from multiple RSS feeds and applies filtering.
 * @param rssFeeds - An array of RSS feed configurations.
 * @param earliestPublishDate - The earliest date to consider for articles.
 * @param customArticleFilter - An optional custom filter function for articles.
 * @returns A promise that resolves to an array of filtered articles.
 */
export async function fetchArticles(
  rssFeeds: RSSFeed[],
  customArticleFilter: ((article: Article) => boolean) | undefined
) {
  return (
    await Promise.all(
      rssFeeds.map(async rssFeed => {
        return await fetchFeed(rssFeed)
      })
    )
  )
    .flat()
    .filter(customArticleFilter ?? (() => true))
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

    const validatedArticles = validateArticles(feed.items)

    return validatedArticles.map(item => ({
      ...item,
      twitterHandle: rssFeed.twitterHandle // Add Twitter handle to each feed item
    }))
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
function validateArticles(items: RSSParser.Item[]) {
  const validatedItems: NonNullable<ReturnType<typeof validateArticle>>[] = []

  for (const item of items) {
    try {
      const validatedItem = validateArticle(item)

      if (validatedItem) {
        validatedItems.push(validatedItem)
      }
    } catch (error) {
      console.error('Error validating feed item:', error, item)
    }
  }

  return validatedItems
}

/**
 * Validates a single RSS feed item.
 * @param item - The RSS feed item to validate.
 * @returns A validated article object or undefined if validation fails.
 */
function validateArticle(item: RSSParser.Item) {
  return r.object(
    item,
    ({ pubDate, link, content, contentSnippet, ...rest }) => ({
      pubDate: r.required(r.string(pubDate)),
      link: r.required(r.string(link)),
      content: r.required(r.string(content)),
      contentSnippet: r.required(r.string(contentSnippet)),
      title: r.required(r.string(item.title)),
      ...rest
    })
  )
}
