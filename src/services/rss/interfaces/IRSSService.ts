import type { FeedItem } from '../utils'

/**
 * Interface for the RSSService
 */
export interface IRSSService {
  /**
   * Posts a tweet about the oldest unpublished article from the RSS feeds.
   * @param earliestPublishDate - The earliest date to consider for articles.
   * @param customArticleFilter - Optional custom filter function for articles.
   */
  postArticleTweet(params: {
    textPrompt: string
    earliestPublishDate?: Date
    customArticleFilter?: (feedItem: FeedItem) => boolean
  }): Promise<void>

  /**
   * Posts a thread about the oldest unpublished article from the RSS feeds.
   * @param earliestPublishDate - The earliest date to consider for articles.
   * @param customArticleFilter - Optional custom filter function for articles.
   */
  postArticleThread(params: {
    textPrompt: string
    earliestPublishDate?: Date
    customArticleFilter?: (feedItem: FeedItem) => boolean
  }): Promise<void>

  /**
   * Posts a poll about the oldest unpublished article from the RSS feeds.
   * @param earliestPublishDate - The earliest date to consider for articles.
   * @param customArticleFilter - Optional custom filter function for articles.
   */
  postArticlePoll(params: {
    textPrompt: string
    earliestPublishDate?: Date
    customArticleFilter?: (feedItem: FeedItem) => boolean
  }): Promise<void>
}
