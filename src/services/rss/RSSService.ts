import { OpenAIService } from '../openai/OpenAIService'
import { TwitterService } from '../twitter/TwitterService'
import { MongoService } from '../database/MongoService'
import { fetchArticles, getLLMPollParameters } from './utils'
import { getThreadContent } from './utils/getThreadContent'
import { getTweetContent } from './utils/getTweetContent'
import type { IRSSService } from './interfaces/IRSSService'
import type { MongoServiceParams } from '../database/MongoService'
import type { TwitterServiceParams } from '../twitter/TwitterService'
import type { OpenAIServiceParams } from '../openai/OpenAIService'
import type { RSSFeed, FeedItem } from './utils'

const POSTED_ARTICLE_COLLECTION_NAME = 'posted-articles'

export type RSSServiceParams = {
  rssFeeds: RSSFeed[]
} & Partial<MongoServiceParams> &
  TwitterServiceParams &
  OpenAIServiceParams

export class RSSService implements IRSSService {
  private rssFeeds: RSSFeed[]
  private dbService: MongoService | undefined
  private twitterService: TwitterService
  private openAIService: OpenAIService

  constructor(readonly params: RSSServiceParams) {
    const {
      mongoUri,
      customDbName,
      openaiApiKey,
      twitterTokens,
      rettiwtApiKey,
      rssFeeds
    } = params

    this.rssFeeds = rssFeeds

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

  async postArticleTweet({
    textPrompt,
    earliestPublishDate,
    customArticleFilter
  }: {
    textPrompt: string
    earliestPublishDate?: Date | undefined
    customArticleFilter?: ((feedItem: FeedItem) => boolean) | undefined
  }) {
    const articles = await fetchArticles(
      this.rssFeeds,
      earliestPublishDate,
      customArticleFilter
    )

    const oldestUnpostedArticle = await this.getOldestUnpostedArticle(articles)

    if (!oldestUnpostedArticle) {
      // TODO: Logging?
      return
    }

    const tweetContent = getTweetContent(oldestUnpostedArticle, textPrompt)

    const tweet = await this.openAIService.generateChatCompletion({
      content: tweetContent
    })

    // TODO: Make this available to rettwit or twitter service
    await this.twitterService.postTweet(tweet)

    await this.markArticleAsPosted({
      ...oldestUnpostedArticle,
      postType: 'tweet'
    })
  }

  async postArticleThread({
    textPrompt,
    earliestPublishDate,
    customArticleFilter
  }: {
    textPrompt: string
    earliestPublishDate?: Date | undefined
    customArticleFilter?: ((feedItem: FeedItem) => boolean) | undefined
  }) {
    const articles = await fetchArticles(
      this.rssFeeds,
      earliestPublishDate,
      customArticleFilter
    )

    const oldestUnpostedArticle = await this.getOldestUnpostedArticle(articles)

    if (!oldestUnpostedArticle) {
      return
    }

    const threadContent = getThreadContent(oldestUnpostedArticle, textPrompt)

    const generatedContent = await this.openAIService.generateChatCompletion({
      content: threadContent
    })

    // TODO: Separate function
    /* Split tweets by line that starts with a number to ensure 
       each tweet is a separate tweet */
    const tweets = generatedContent
      .split(/(?=\n\d+\/)/)
      .map(tweet => tweet.trim())

    // TODO: Make this available to rettwit or twitter service
    await this.twitterService.postThread(tweets)

    await this.markArticleAsPosted({
      ...oldestUnpostedArticle,
      postType: 'thread'
    })
  }

  async postArticlePoll({
    textPrompt,
    earliestPublishDate,
    customArticleFilter
  }: {
    textPrompt: string
    earliestPublishDate?: Date | undefined
    customArticleFilter?: ((feedItem: FeedItem) => boolean) | undefined
  }) {
    const articles = await fetchArticles(
      this.rssFeeds,
      earliestPublishDate,
      customArticleFilter
    )

    const oldestUnpostedArticle = await this.getOldestUnpostedArticle(articles)

    if (!oldestUnpostedArticle) {
      return
    }

    const llmPollParameters = getLLMPollParameters(
      oldestUnpostedArticle,
      textPrompt
    )

    const pollData =
      await this.openAIService.getStructuredOutput(llmPollParameters)

    // TODO: Make this available to rettwit or twitter service
    await this.twitterService.postPoll(pollData)

    await this.markArticleAsPosted({
      ...oldestUnpostedArticle,
      postType: 'poll'
    })
  }

  private async isArticlePosted(link: string): Promise<boolean> {
    if (this.dbService === undefined) {
      console.warn('Database service not initialized')

      return false
    }

    try {
      const existingArticle = await this.dbService?.findOne<FeedItem>(
        POSTED_ARTICLE_COLLECTION_NAME,
        { link }
      )

      return Boolean(existingArticle)
    } catch (error) {
      console.error('Error checking if article is posted:', error)

      /* Assume article is posted to avoid posting duplicates */
      return true
    }
  }

  private async getOldestUnpostedArticle(articles: FeedItem[]) {
    const filteredArticles = articles.sort(
      (a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime()
    )

    let oldestUnpostedArticle: FeedItem | undefined = undefined

    const lastPostedArticle = await this.dbService?.findOne<FeedItem>(
      POSTED_ARTICLE_COLLECTION_NAME,
      {
        sort: { _id: -1 }
      }
    )

    const lastPostedArticleAuthor = lastPostedArticle
      ? new URL(lastPostedArticle.link).hostname
      : undefined

    /* Split articles by last posted author and other authors */
    const { articlesByLastPostedAuthor, articlesByOtherAuthors } =
      filteredArticles.reduce(
        (acc, article) => {
          const articleAuthor = new URL(article.link).hostname

          if (lastPostedArticle && articleAuthor === lastPostedArticleAuthor) {
            return {
              ...acc,
              articlesByLastPostedAuthor: [
                ...acc.articlesByLastPostedAuthor,
                article
              ]
            }
          }

          return {
            ...acc,
            articlesByOtherAuthors: [...acc.articlesByOtherAuthors, article]
          }
        },
        { articlesByLastPostedAuthor: [], articlesByOtherAuthors: [] } as {
          articlesByLastPostedAuthor: FeedItem[]
          articlesByOtherAuthors: FeedItem[]
        }
      )

    /* If the last posted article is from a different author, 
     prioritize posting articles from other authors */
    if (lastPostedArticle && this.dbService !== undefined) {
      for (const article of articlesByOtherAuthors) {
        if (!(await this.isArticlePosted(article.link))) {
          oldestUnpostedArticle = article
          break
        }
      }
    }

    /* If there are valid articles from other authors, 
     return the oldest unposted article */
    if (oldestUnpostedArticle) {
      return oldestUnpostedArticle
    }

    /* Check if there are any unposted articles from the last posted author */
    for (const article of articlesByLastPostedAuthor) {
      if (!(await this.isArticlePosted(article.link))) {
        oldestUnpostedArticle = article
        break
      }
    }

    return oldestUnpostedArticle
  }

  private async markArticleAsPosted(
    article: FeedItem & { postType: string }
  ): Promise<void> {
    if (this.dbService === undefined) {
      console.log(
        'Database service not initialized. Not saving article to database.'
      )

      return
    }

    try {
      await this.dbService.insertOne(POSTED_ARTICLE_COLLECTION_NAME, article)

      // TODO: Debug flag
      console.log('Article saved to database', article)
    } catch (error) {
      console.error('Error inserting article:', error)
    }
  }
}
