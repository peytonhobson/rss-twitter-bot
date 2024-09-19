import type { TweetV2PostTweetResult } from 'twitter-api-v2'

/**
 * Interface for Twitter service operations
 */
export interface ITwitterService {
  /**
   * Posts a single tweet
   * @param tweet - The content of the tweet
   */
  postTweet(tweet: string): Promise<TweetV2PostTweetResult | undefined>

  /**
   * Posts a thread of tweets
   * @param tweets - An array of tweet contents
   */
  postThread(tweets: string[]): Promise<TweetV2PostTweetResult[] | undefined>

  /**
   * Posts a poll tweet
   * @param pollData.question - The poll question
   * @param pollData.content - Additional content for the tweet
   * @param pollData.options - The poll options (2-4 options)
   */
  postPoll(pollData: {
    tweet: string
    options: string[]
  }): Promise<unknown | undefined>
}
