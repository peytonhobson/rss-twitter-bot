import type { Article } from '../../../models'
import type { PostedArticle } from '../../../models/article'

/**
 * Interface for the RSS service, handling article-based social media posts
 */
export interface IRSSService {
  /**
   * Posts a tweet about the oldest unpublished article from the RSS feeds
   * @param params - Configuration for the tweet post
   * @param params.getPrompt - Function to generate the tweet content from an article
   * @param params.earliestPublishDate - Optional. The earliest publication date to consider for articles
   * @param params.customArticleFilter - Optional. Custom function to filter articles
   */
  postArticleTweet(params: {
    getPrompt: (article: Article) => string
    earliestPublishDate?: Date
    customArticleFilter?: (article: Article) => boolean
  }): Promise<void>

  /**
   * Posts a thread about the oldest unpublished article from the RSS feeds
   * @param params - Configuration for the thread post
   * @param params.getPrompt - Function to generate the thread content from an article
   * @param params.earliestPublishDate - Optional. The earliest publication date to consider for articles
   * @param params.customArticleFilter - Optional. Custom function to filter articles
   */
  postArticleThread(params: {
    getPrompt: (article: Article) => string
    earliestPublishDate?: Date
    customArticleFilter?: (article: Article) => boolean
  }): Promise<void>

  /**
   * Posts a poll about the oldest unpublished article from the RSS feeds
   * @param params - Configuration for the poll post
   * @param params.getPrompt - Function to generate the poll content from an article
   * @param params.earliestPublishDate - Optional. The earliest publication date to consider for articles
   * @param params.customArticleFilter - Optional. Custom function to filter articles
   */
  postArticlePoll(params: {
    getPrompt: (article: Article) => string
    earliestPublishDate?: Date
    customArticleFilter?: (article: Article) => boolean
  }): Promise<void>

  /**
   * Finds the latest posted articles
   * @param limit - The number of articles to find
   * @returns The latest posted articles
   */
  findLatestPostedArticles(limit: number): Promise<PostedArticle[]>
}
