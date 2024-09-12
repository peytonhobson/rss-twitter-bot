import { MongoClient } from 'mongodb'
import OpenAI from 'openai'
import { TwitterApi } from 'twitter-api-v2'
import { Rettiwt, FetcherService } from 'rettiwt-api'
import { r } from '@crossingminds/utils'
import { customTweetService } from './services/twitter/CustomTweetService'
import {
  getPollCardDataConfig,
  getPollTweetConfig
} from './articles/createPoll'
import type { Db } from 'mongodb'
import type { TwitterApiTokens } from 'twitter-api-v2'

const MONGO_DB_NAME = 'rss-twitter-bot'

export type TwitterInteractionServiceParams = {
  mongoURI?: string
  openAIKey: string
  twitterTokens: TwitterApiTokens
  rettiwtApiKey?: string
}

export class TwitterInteractionService {
  private mongoClient: MongoClient | undefined
  private openaiClient: OpenAI | undefined
  private twitterClient: TwitterApi | undefined
  private rettiwtClient: Rettiwt | undefined
  private rettiwtFetcher: FetcherService | undefined
  private db: Db | undefined

  // TODO: Status?
  constructor({
    mongoURI,
    openAIKey,
    twitterTokens,
    rettiwtApiKey
  }: TwitterInteractionServiceParams) {
    this.initOpenAI(openAIKey)
    this.initTwitter(twitterTokens)
    this.initMongo(mongoURI)
    this.initRettiwt(rettiwtApiKey)
  }

  private initOpenAI(apiKey: string) {
    if (apiKey === undefined) {
      throw new Error('OpenAI API Key is required.')
    }

    if (!this.openaiClient) {
      this.openaiClient = new OpenAI({
        apiKey
      })
    }
  }

  private initTwitter(tokens: TwitterApiTokens | undefined) {
    if (tokens === undefined) {
      throw new Error('Twitter API Tokens are required.')
    }

    if (!this.twitterClient) {
      this.twitterClient = new TwitterApi(tokens)
    }
  }

  private initRettiwt(apiKey: string | undefined) {
    if (apiKey === undefined) {
      console.log(
        'Rettiwt API Key not provided. Skipping Rettiwt initialization.'
      )
    }

    if (!this.rettiwtClient) {
      this.rettiwtClient = new Rettiwt({
        apiKey
      })

      this.rettiwtFetcher = new FetcherService({ apiKey })
    }
  }

  private async initMongo(uri: string | undefined) {
    if (uri === undefined) {
      console.log('Mongo URI not provided. Skipping MongoDB initialization.')

      return
    }

    if (!this.mongoClient) {
      this.mongoClient = new MongoClient(uri)

      this.db = await this.connectMongoDB()
    }
  }

  private async connectMongoDB(): Promise<Db | undefined> {
    // TODO: Log flag for debugging
    if (!this.mongoClient) {
      console.log('Mongo Client not initialized. Skipping MongoDB connection.')

      return undefined
    }

    try {
      await this.mongoClient.connect()

      return this.mongoClient.db(MONGO_DB_NAME)
    } catch (error) {
      console.error('Error connecting to MongoDB:', error)
    }
  }

  public async createTweet(tweet: string) {
    if (this.twitterClient === undefined) {
      console.error('Twitter client not initialized')

      return
    }

    try {
      await this.twitterClient?.v2.tweet(tweet)
      // TODO: debug flag
      console.log(`Tweeted: ${tweet}`)
    } catch (error) {
      console.error('Error posting tweet:', error)
    }
  }

  public async createPoll({
    question,
    content,
    options
  }: {
    question: string
    content: string
    options: string[]
  }) {
    /* Make request for card_uri */
    const cardData = await customTweetService.request(
      getPollCardDataConfig(options)
    )

    const cardUri = r.object(cardData, ({ card_uri }) => r.string(card_uri))

    if (cardUri === undefined) {
      console.error('Error parsing cardUri')

      return
    }

    // TODO: Need key for custom fetcher service
    await customTweetService.request(
      getPollTweetConfig({ text: `${question}\n\n${content}`, cardUri })
    )
  }

  public async createThread(tweets: string[]) {
    if (this.twitterClient === undefined) {
      console.error('Twitter client not initialized')

      return
    }

    try {
      await this.twitterClient.v2.tweetThread(tweets)
    } catch (error) {
      console.error('Error posting thread:', error)
    }
  }
}
