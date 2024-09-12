import {
  fetchArticles,
  isArticleSmallEnoughForThread,
  getLLMPollParameters
} from './utils'
import { getThreadContent } from './utils/getThreadContent'
import { getTweetContent } from './utils/getTweetContent'
import type { OpenAIService } from '../openai/OpenAIService'
import type { TwitterService } from '../twitter/TwitterService'
import type { MongoService } from '../database/MongoService'
import type { RSSFeed, FeedItem } from './utils'

const POSTED_ARTICLE_COLLECTION_NAME = 'posted-articles'

interface RSSServiceParams {
  rssFeeds: RSSFeed[]
  dbService: MongoService | undefined
  twitterService: TwitterService
  openAIService: OpenAIService
}

export class RSSService {
  private rssFeeds: RSSFeed[] = []
  private dbService: MongoService | undefined
  private twitterService: TwitterService
  private openAIService: OpenAIService

  constructor(readonly params: RSSServiceParams) {
    this.rssFeeds = params.rssFeeds
    this.dbService = params.dbService
    this.twitterService = params.twitterService
    this.openAIService = params.openAIService
  }

  async tweetNextArticle({
    earliestPublishDate,
    customArticleFilter
  }: {
    earliestPublishDate?: Date | undefined
    customArticleFilter: (feedItem: FeedItem) => boolean
  }): Promise<void> {
    const articles = (
      await Promise.all(
        this.rssFeeds.map(async rssFeed => {
          return await fetchArticles(rssFeed, earliestPublishDate)
        })
      )
    )
      .flat()
      .filter(customArticleFilter)

    const oldestUnpostedArticle = await this.getOldestUnpostedArticle(articles)

    if (!oldestUnpostedArticle) {
      return
    }

    const { postType } = await this.tweetArticle(oldestUnpostedArticle)

    await this.markArticleAsPosted({ ...oldestUnpostedArticle, postType })
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

  private async tweetArticle(article: FeedItem) {
    const lastTwoTweets = await this.dbService?.find(
      POSTED_ARTICLE_COLLECTION_NAME,
      { sort: { _id: -1 }, limit: 2 }
    )

    /* Create a 10% chance of creating a poll, but don't create 
     a poll if either of the last two tweets were polls */
    const shouldCreatePoll =
      Math.random() > 0.9 &&
      (lastTwoTweets?.every(tweet => tweet.postType !== 'poll') ?? true)

    if (shouldCreatePoll) {
      const llmPollParameters = getLLMPollParameters(article)

      const pollData =
        await this.openAIService.getStructuredOutput(llmPollParameters)

      await this.twitterService.postPoll(pollData)

      return {
        postType: 'poll'
      } as const
    }

    /* If either of last two tweets were threads, we don't want to create a thread */
    const shouldCreateThread =
      isArticleSmallEnoughForThread(article) &&
      (lastTwoTweets?.every(tweet => tweet.postType !== 'thread') ?? true)

    if (shouldCreateThread) {
      const threadContent = await getThreadContent(article)

      const generatedContent = await this.openAIService.generateChatCompletion({
        content: threadContent
      })

      // TODO: Separate function
      /* Split tweets by line that starts with a number to ensure 
       each tweet is a separate tweet */
      const tweets = generatedContent
        .split(/(?=\n\d+\/)/)
        .map(tweet => tweet.trim())

      // TODO: Get Tweets
      await this.twitterService.postThread(tweets)

      return {
        postType: 'thread'
      } as const
    }

    const tweetContent = await getTweetContent(article)

    const tweet = await this.openAIService.generateChatCompletion({
      content: tweetContent
    })

    await this.twitterService.postTweet(tweet)

    return {
      postType: 'tweet'
    } as const
  }
}
