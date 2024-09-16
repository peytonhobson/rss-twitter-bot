import { TwitterApi } from 'twitter-api-v2'
import { Rettiwt } from 'rettiwt-api'
import { runSafeAsync } from '@crossingminds/utils'
import type { TwitterApiTokens } from 'twitter-api-v2'
import type { ITwitterService } from './interfaces/ITwitterService'

export interface TwitterServiceParams {
  twitterTokens: TwitterApiTokens
  rettiwtApiKey?: string | undefined
  enableDebug?: boolean
}

export class TwitterService implements ITwitterService {
  readonly #twitterClient: TwitterApi
  readonly #rettiwtClient: Rettiwt | undefined
  readonly #enableDebug: boolean = false

  constructor(readonly params: TwitterServiceParams) {
    this.#twitterClient = new TwitterApi(params.twitterTokens)
    if (params.rettiwtApiKey) {
      this.#rettiwtClient = new Rettiwt({
        apiKey: params.rettiwtApiKey
      })
    }

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

  async postPoll({
    question,
    content,
    options
  }: {
    question: string
    content: string
    options: string[]
  }) {
    try {
      const postedTweet = await this.#twitterClient.v2.tweet({
        text: `${question}\n\n${content}`,
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

  async postReply(tweetId: string, reply: string) {
    try {
      // TODO: Use Rettiwt instead of Twitter API v2 if available
      const postedTweet = await this.#twitterClient.v2.reply(tweetId, reply)

      return postedTweet
    } catch (error) {
      console.error('Error posting reply:', error)

      return undefined
    }
  }

  async getUserId(username: string) {
    const {
      value: userId,
      hasError,
      error
    } = await runSafeAsync(async () => {
      if (this.#rettiwtClient) {
        return (await this.#rettiwtClient.user.details(username))?.id
      }

      if (this.#enableDebug) {
        console.log('Getting user id with Twitter API v2')
      }

      /* Use Twitter API v2 instead of Rettiwt if rettiwt api key is not provided.
         This will throw an error if the twitter api plan is not Pro or higher. */
      return (await this.#twitterClient.v2.userByUsername(username)).data.id
    })

    if (hasError) {
      console.error('Error getting user id:', error)
    }

    return userId
  }

  async getUserTimeline(
    userId: string,
    params: { count?: number; exclude?: ('retweets' | 'replies')[] }
  ) {
    const {
      value: timeline,
      hasError,
      error
    } = await runSafeAsync(async () => {
      if (this.#rettiwtClient) {
        const { list } = await this.#rettiwtClient.user.timeline(
          userId,
          params.count
        )

        if (params.exclude?.includes('retweets')) {
          return list.filter(tweet => !tweet.retweetedTweet)
        }

        return list
      }

      if (this.#enableDebug) {
        console.log('Getting user timeline with Twitter API v2')
      }

      return (
        await this.#twitterClient.v2.userTimeline(userId, {
          ...(params.count ? { max_results: params.count } : {}),
          ...(params.exclude ? { exclude: params.exclude } : {})
        })
      ).tweets
    })

    if (hasError) {
      console.error('Error getting user timeline:', error)
    }

    return timeline
  }
}
