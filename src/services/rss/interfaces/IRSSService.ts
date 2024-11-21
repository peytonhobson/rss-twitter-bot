import type { TweetV2PostTweetResult } from 'twitter-api-v2'
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
   * @param params.customArticleFilter - Optional. Custom function to filter articles
   * @param params.fetchCustomArticles - Optional. Custom function to fetch additional articles
   */
  postArticleTweet(params: {
    getPrompt: (article: Article) => string
    customArticleFilter?: (article: Article) => boolean
    fetchCustomArticles?: () => Promise<Article[]>
    platform?: 'twitter' | 'bluesky'
  }): Promise<
    | {
        article: Article
        tweet: string | undefined
      }
    | undefined
  >

  /**
   * Posts a thread about the oldest unpublished article from the RSS feeds
   * @param params - Configuration for the thread post
   * @param params.getPrompt - Function to generate the thread content from an article
   * @param params.customArticleFilter - Optional. Custom function to filter articles
   * @param params.fetchCustomArticles - Optional. Custom function to fetch additional articles
   */
  postArticleThread(params: {
    getPrompt: (article: Article) => string
    customArticleFilter?: (article: Article) => boolean
    fetchCustomArticles?: () => Promise<Article[]>
  }): Promise<
    | {
        article: Article
        tweets: TweetV2PostTweetResult[] | undefined
      }
    | undefined
  >

  /**
   * Posts a poll about the oldest unpublished article from the RSS feeds
   * @param params - Configuration for the poll post
   * @param params.getPrompt - Function to generate the poll content from an article
   * @param params.customArticleFilter - Optional. Custom function to filter articles
   * @param params.fetchCustomArticles - Optional. Custom function to fetch additional articles
   */
  postArticlePoll(params: {
    getPrompt: (article: Article) => string
    customArticleFilter?: (article: Article) => boolean
    fetchCustomArticles?: () => Promise<Article[]>
  }): Promise<
    | {
        article: Article
        poll: unknown
      }
    | undefined
  >

  /**
   * Finds the latest posted articles
   * @param limit - The number of articles to find
   * @returns The latest posted articles
   */
  findLatestPostedArticles(limit: number): Promise<PostedArticle[]>
}
