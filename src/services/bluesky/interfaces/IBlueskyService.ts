import type { TweetV2PostTweetResult } from 'twitter-api-v2'

/**
 * Interface for Bluesky service operations
 */
export interface IBlueskyService {
  /**
   * Posts a single post
   * @param text - The content of the post
   */
  createPost(text: string): Promise<string | undefined>

  /**
   * Posts a thread of tweets
   * @param tweets - An array of tweet contents
   */
  createThread(tweets: string[]): Promise<TweetV2PostTweetResult[] | undefined>

  /**
   * Posts a poll tweet
   * @param pollData.question - The poll question
   * @param pollData.content - Additional content for the tweet
   * @param pollData.options - The poll options (2-4 options)
   */
  createPoll(pollData: {
    tweet: string
    options: string[]
  }): Promise<unknown | undefined>
}
