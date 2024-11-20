import { TwitterApi } from 'twitter-api-v2'
import { r, run } from '@crossingminds/utils'
import {
  getPollCardDataConfig,
  getPollTweetConfig
} from '../../utils/pollConfig'
import { CustomTweetService } from './CustomTweetService'
import type { TwitterApiTokens } from 'twitter-api-v2'
import type { ITwitterService } from './interfaces/ITwitterService'

export interface TwitterServiceParams {
  twitterTokens: TwitterApiTokens
  rettiwtApiKey?: string | undefined
  enableDebug?: boolean
}

export class TwitterService implements ITwitterService {
  readonly #twitterClient: TwitterApi
  readonly #customTweetService: CustomTweetService | undefined
  readonly #enableDebug: boolean = false

  constructor(readonly params: TwitterServiceParams) {
    this.#twitterClient = new TwitterApi(params.twitterTokens)

    if (params.rettiwtApiKey) {
      this.#customTweetService = new CustomTweetService({
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

      return postedTweet.data.text
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
    tweet,
    options,
    client
  }: {
    tweet: string
    options: string[]
    client: 'twitter' | 'rettiwt'
  }) {
    try {
      const postedTweet = run(async () => {
        switch (client) {
          case 'rettiwt':
            return await this.#postRettiwtPoll(tweet, options)
          case 'twitter':
            return await this.#twitterClient.v2.tweet({
              text: tweet,
              poll: {
                duration_minutes: 1440,
                options
              }
            })
        }
      })

      return postedTweet
    } catch (error) {
      console.error('Error posting poll:', error)

      return undefined
    }
  }

  async #postRettiwtPoll(tweet: string, options: string[]) {
    if (this.#customTweetService === undefined) {
      console.error('Polls cannot be created with a rettiwt API key.')

      return
    }

    const cardData = await this.#customTweetService.request(
      getPollCardDataConfig(options)
    )

    const cardUri = r.object(cardData, ({ card_uri }) => r.string(card_uri))

    if (cardUri === undefined) {
      console.error('Error parsing cardUri')

      return
    }

    /* The free twitter api does not support polls, so we need to use the custom tweet service */
    return await this.#customTweetService.request(
      getPollTweetConfig({ text: tweet, cardUri })
    )
  }
}
