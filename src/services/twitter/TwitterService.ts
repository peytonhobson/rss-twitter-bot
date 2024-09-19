import { TwitterApi } from 'twitter-api-v2'
import type { TwitterApiTokens } from 'twitter-api-v2'
import type { ITwitterService } from './interfaces/ITwitterService'

export interface TwitterServiceParams {
  twitterTokens: TwitterApiTokens
  rettiwtApiKey?: string | undefined
  enableDebug?: boolean
}

export class TwitterService implements ITwitterService {
  readonly #twitterClient: TwitterApi
  readonly #enableDebug: boolean = false

  constructor(readonly params: TwitterServiceParams) {
    this.#twitterClient = new TwitterApi(params.twitterTokens)
    this.#enableDebug = Boolean(params.enableDebug)
  }

  async postTweet(tweet: string) {
    try {
      const postedTweet = await this.#twitterClient.v2.tweet(tweet)

      if (this.#enableDebug) {
        const tweetMessage = postedTweet.data.text

        console.log('Posted tweet:', tweetMessage)
      }

      return postedTweet
    } catch (error) {
      console.error('Error posting tweet:', error)

      return undefined
    }
  }

  async postThread(tweets: string[]) {
    try {
      const postedTweet = await this.#twitterClient.v2.tweetThread(tweets)

      if (this.#enableDebug) {
        const tweetMessage = postedTweet
          .map(tweet => tweet.data.text)
          .join('\n\n')

        console.log('Posted tweet:', tweetMessage)
      }

      return postedTweet
    } catch (error) {
      console.error('Error posting thread:', error)

      return undefined
    }
  }

  async postPoll({ tweet, options }: { tweet: string; options: string[] }) {
    try {
      const postedTweet = await this.#twitterClient.v2.tweet({
        text: tweet,
        poll: {
          duration_minutes: 1440,
          options
        }
      })

      return postedTweet
    } catch (error) {
      console.error('Error posting poll:', error)

      return undefined
    }
  }
}
