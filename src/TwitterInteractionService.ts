import { MongoClient } from 'mongodb'
import OpenAI from 'openai'
import { TwitterApi } from 'twitter-api-v2'
import { Rettiwt, FetcherService } from 'rettiwt-api'
import {
  getOldestUnpostedArticle,
  tweetArticle,
  fetchArticles
} from './articles'
import { POSTED_ARTICLE_COLLECTION_NAME } from './articles/articleCollection'
import type { Db } from 'mongodb'
import type { FeedItem, RSSFeed } from './articles'
import type { TwitterApiTokens } from 'twitter-api-v2'

const MONGO_DB_NAME = 'rss-twitter-bot'

type TwitterInteractionServiceConfig = {
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

  constructor({
    mongoURI,
    openAIKey,
    twitterTokens,
    rettiwtApiKey
  }: TwitterInteractionServiceConfig) {
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

  private initMongo(uri: string | undefined) {
    if (uri === undefined) {
      console.log('Mongo URI not provided. Skipping MongoDB initialization.')

      return
    }

    if (!this.mongoClient) {
      this.mongoClient = new MongoClient(uri)
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

  public async fetchAndTweetArticle({
    rssFeeds,
    customArticleFilter,
    earliestPublishDate
  }: {
    rssFeeds: RSSFeed[]
    customArticleFilter: (feedItem: FeedItem) => boolean
    earliestPublishDate?: Date | undefined
  }) {
    const db = await this.connectMongoDB()

    const articles = (
      await Promise.all(
        rssFeeds.map(async rssFeed => {
          return await fetchArticles(rssFeed, earliestPublishDate)
        })
      )
    )
      .flat()
      .filter(customArticleFilter)

    const oldestUnpostedArticle = await getOldestUnpostedArticle(db, articles)

    if (!oldestUnpostedArticle) {
      console.log('No new articles to post.')

      return undefined
    }

    const additionaTweetData = await tweetArticle(oldestUnpostedArticle, db)

    if (db) {
      try {
        await db
          .collection(POSTED_ARTICLE_COLLECTION_NAME)
          .insertOne({ ...oldestUnpostedArticle, ...additionaTweetData })

        console.log('Article posted and saved to database')
      } catch (error) {
        console.error('Error inserting article:', error)
      }
    }
  }
}
