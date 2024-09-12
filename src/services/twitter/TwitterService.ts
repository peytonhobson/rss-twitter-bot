import { TwitterApi } from 'twitter-api-v2'
import { r } from '@crossingminds/utils'
import { CustomTweetService } from './CustomTweetService'
import { getPollCardDataConfig, getPollTweetConfig } from './pollConfig'
import type { TwitterApiTokens } from 'twitter-api-v2'
import type { ITwitterService } from './interfaces/ITwitterService'

export interface TwitterServiceParams {
  twitterTokens: TwitterApiTokens
  rettiwtApiKey?: string | undefined
}

export class TwitterService implements ITwitterService {
  readonly #twitterClient: TwitterApi
  readonly #customTweetService: CustomTweetService | undefined

  constructor(readonly params: TwitterServiceParams) {
    this.#twitterClient = new TwitterApi(params.twitterTokens)

    if (params.rettiwtApiKey) {
      this.#customTweetService = new CustomTweetService({
        apiKey: params.rettiwtApiKey
      })
    }
  }

  async postTweet(tweet: string) {
    try {
      await this.#twitterClient.v2.tweet(tweet)

      // TODO: debug flag
      console.log(`Tweeted: ${tweet}`)
    } catch (error) {
      console.error('Error posting tweet:', error)
    }
  }

  async postThread(tweets: string[]): Promise<void> {
    try {
      await this.#twitterClient.v2.tweetThread(tweets)
    } catch (error) {
      console.error('Error posting thread:', error)
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
  }): Promise<void> {
    if (this.#customTweetService === undefined) {
      console.error('Polls cannot be created with a rettiwt API key.')

      return
    }

    /* A card uri is needed to generate a poll */
    const cardData = await this.#customTweetService.request(
      getPollCardDataConfig(options)
    )

    const cardUri = r.object(cardData, ({ card_uri }) => r.string(card_uri))

    if (cardUri === undefined) {
      console.error('Error parsing cardUri')

      return
    }

    /* The free twitter api does not support polls, so we need to use the custom tweet service */
    await this.#customTweetService.request(
      getPollTweetConfig({ text: `${question}\n\n${content}`, cardUri })
    )
  }
}
