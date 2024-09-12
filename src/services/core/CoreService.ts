import { MongoService } from '../database/MongoService'
import { TwitterService } from '../twitter/TwitterService'
import { OpenAIService } from '../openai/OpenAIService'
import { type FeedItem, type RSSFeed } from '../rss/utils'
import { RSSService } from '../rss/RSSService'
import type { ICoreService } from './interfaces/ICoreService'
import type { MongoServiceParams } from '../database/MongoService'
import type { OpenAIServiceParams } from '../openai/OpenAIService'
import type { TwitterServiceParams } from '../twitter/TwitterService'

export type CoreServiceParams = Partial<MongoServiceParams> &
  TwitterServiceParams &
  OpenAIServiceParams

export class CoreService implements ICoreService {
  private dbService: MongoService | undefined
  private twitterService: TwitterService
  private openAIService: OpenAIService

  constructor(readonly params: CoreServiceParams) {
    const { mongoUri, customDbName, openaiApiKey, twitterTokens, rettiwtApiKey } =
      params

    if (mongoUri) {
      this.dbService = new MongoService({
        mongoUri,
        customDbName
      })
    }
    this.twitterService = new TwitterService({
      twitterTokens,
      rettiwtApiKey
    })
    this.openAIService = new OpenAIService({
      openaiApiKey
    })
  }

  async postNextArticle({
    rssFeeds,
    earliestPublishDate,
    customArticleFilter
  }: {
    rssFeeds: RSSFeed[]
    earliestPublishDate?: Date | undefined
    customArticleFilter?: ((feedItem: FeedItem) => boolean) | undefined
  }): Promise<void> {
    const rssService = new RSSService({
      rssFeeds,
      dbService: this.dbService,
      twitterService: this.twitterService,
      openAIService: this.openAIService
    })

    await rssService.tweetNextArticle({
      earliestPublishDate,
      customArticleFilter
    })

    // TODO: More explicit logging with tweet
    console.log('Article posted')
  }

  async makeRandomComments(): Promise<void> {
    console.log('Function not yet implemented')
    // Implement logic to make random comments on Twitter timelines
    // This method will use the twitterService to fetch timelines and post comments
    // It may also use the openAIService to generate comment content
  }
}
