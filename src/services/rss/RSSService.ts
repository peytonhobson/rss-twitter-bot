/* eslint-disable prettier/prettier */
import { OpenAIService } from '../openai/OpenAIService'
import { TwitterService } from '../twitter/TwitterService'
import { MongoService } from '../database/MongoService'
import { fetchArticles, getLLMPollParameters } from '../../utils'
import { validatePostedArticle, type PostedArticle } from '../../models/article'
import type { IRSSService } from './interfaces/IRSSService'
import type { MongoServiceParams } from '../database/MongoService'
import type { TwitterServiceParams } from '../twitter/TwitterService'
import type { OpenAIServiceParams } from '../openai/OpenAIService'
import type { RSSFeed, Article } from '../../models'

const POSTED_ARTICLE_COLLECTION_NAME = 'posted-articles'

export type RSSServiceParams = {
  rssFeeds: RSSFeed[]
  enableDebug?: boolean
} & MongoServiceParams &
  TwitterServiceParams &
  OpenAIServiceParams

export class RSSService implements IRSSService {
  readonly #rssFeeds: RSSFeed[]
  readonly #twitterService: TwitterService
  readonly #openAIService: OpenAIService
  readonly #mongoService: MongoService
  readonly #enableDebug: boolean

  constructor(readonly params: RSSServiceParams) {

    const {
      rssFeeds,
      enableDebug = false
    } = params

    this.#mongoService = new MongoService(params)
    this.#twitterService = new TwitterService(params)
    this.#openAIService = new OpenAIService(params)

    this.#rssFeeds = rssFeeds
    this.#enableDebug = enableDebug
  }

  async postArticleTweet({
    getPrompt,
    customArticleFilter
  }: {
    getPrompt: (article: Article) => string
    customArticleFilter?: ((article: Article) => boolean) | undefined
  }) {
    await this.#mongoService.connect()

    const articles = await fetchArticles(this.#rssFeeds, customArticleFilter)

    const oldestUnpublishedArticle =
      await this.#getOldestUnpublishedArticle(articles)

    if (!oldestUnpublishedArticle) {
      if (this.#enableDebug) {
        console.log('No matching articles found.')
      }

      return
    }

    const tweetContent = getPrompt(oldestUnpublishedArticle)

    const tweet = await this.#openAIService.generateChatCompletion({
      content: tweetContent
    })

    const postedTweet = await this.#twitterService.postTweet(tweet)

    await this.#markArticleAsPosted({
      ...oldestUnpublishedArticle,
      postType: 'tweet'
    })

    await this.#mongoService.disconnect()

    return {
      article: oldestUnpublishedArticle,
      tweet: postedTweet
    }
  }

  async postArticleThread({
    getPrompt,
    customArticleFilter
  }: {
    getPrompt: (article: Article) => string
    customArticleFilter?: ((article: Article) => boolean) | undefined
  }) {
   await this.#mongoService.connect()

    const articles = await fetchArticles(this.#rssFeeds, customArticleFilter)

    const oldestUnpublishedArticle =
      await this.#getOldestUnpublishedArticle(articles)

    if (!oldestUnpublishedArticle) {
      if (this.#enableDebug) {
        console.log('No matching articles found.')
      }

      return
    }

    const threadContent = getPrompt(oldestUnpublishedArticle)

    const generatedContent = await this.#openAIService.generateChatCompletion({
      content: threadContent
    })

    // TODO: Separate function + custom split function
    /* Split tweets by line that starts with a number to ensure 
       each tweet is a separate tweet */
    let tweets = generatedContent
      .split(/(?=\n\d+\/)/)
      .map(tweet =>
        tweet.trim().replaceAll('[Article Link]', oldestUnpublishedArticle.link)
      )

    // Check if any tweets contain the article link
    const tweetContainLink = tweets.some(tweet => tweet.includes(oldestUnpublishedArticle.link))

    if (!tweetContainLink) {
      tweets = [...tweets, `Read More: ${oldestUnpublishedArticle.link}\n${oldestUnpublishedArticle.twitterHandle ? `@${oldestUnpublishedArticle.twitterHandle}` : ''}`]
    }

    const postedThread = await this.#twitterService.postThread(tweets)

    await this.#markArticleAsPosted({
      ...oldestUnpublishedArticle,
      postType: 'thread'
    })

    await this.#mongoService.disconnect()

    return {
      article: oldestUnpublishedArticle,
      tweets: postedThread
    }
  }

  async postArticlePoll({
    getPrompt,
    customArticleFilter
  }: {
    getPrompt: (article: Article) => string
    customArticleFilter?: ((article: Article) => boolean) | undefined
  }) {
    await this.#mongoService.connect()

    const articles = await fetchArticles(this.#rssFeeds, customArticleFilter)

    const oldestUnpublishedArticle =
      await this.#getOldestUnpublishedArticle(articles)

    if (!oldestUnpublishedArticle) {
      if (this.#enableDebug) {
        console.log('No matching articles found.')
      }

      return
    }

    const llmPollParameters = getLLMPollParameters(
      getPrompt(oldestUnpublishedArticle)
    )

    const pollData =
      await this.#openAIService.getStructuredOutput(llmPollParameters)

    if (!pollData) {
      console.log('No poll data generated')

      return
    }

    const pollDataWithLinks = {
      ...pollData,
      tweet: `${pollData.tweet}\n\nRead More: ${oldestUnpublishedArticle.link}\n${oldestUnpublishedArticle.twitterHandle ? `@${oldestUnpublishedArticle.twitterHandle}` : ''}`
    }

    const postedPoll = await this.#twitterService.postPoll(pollDataWithLinks)

    await this.#markArticleAsPosted({
      ...oldestUnpublishedArticle,
      postType: 'poll'
    })

    await this.#mongoService.disconnect()

    return {
      article: oldestUnpublishedArticle,
      poll: postedPoll
    }
  }

  /**
   * Checks if an article has already been posted.
   * @param link - The URL of the article to check.
   * @returns A boolean indicating whether the article has been posted.
   * @private
   */
  async #isArticlePosted(link: string): Promise<boolean> {
    try {
      const existingArticle = await this.#mongoService.findOne(
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

  /**
   * Retrieves the oldest unpublished article from a list of articles.
   * Prioritizes articles from authors different from the last posted article.
   * @param articles - An array of articles to check.
   * @returns The oldest unpublished article, or undefined if none found.
   * @private
   */
  async #getOldestUnpublishedArticle(articles: Article[]) {
    const filteredArticles = articles.sort(
      (a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime()
    )

    let oldestUnpublishedArticle: Article | undefined = undefined

    const lastPostedArticle = validatePostedArticle(
      await this.#mongoService.findOne<PostedArticle>(POSTED_ARTICLE_COLLECTION_NAME, {
        sort: { _id: -1 }
      })
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
          articlesByLastPostedAuthor: Article[]
          articlesByOtherAuthors: Article[]
        }
      )

    /* If the last posted article is from a different author, 
     prioritize posting articles from other authors */
    for (const article of articlesByOtherAuthors) {
      if (!(await this.#isArticlePosted(article.link))) {
        oldestUnpublishedArticle = article
        break
      }
    }

    /* If there are valid articles from other authors, 
     return the oldest unpublished article */
    if (oldestUnpublishedArticle) {
      return oldestUnpublishedArticle
    }

    /* Check if there are any unpublished articles from the last posted author */
    for (const article of articlesByLastPostedAuthor) {
      if (!(await this.#isArticlePosted(article.link))) {
        oldestUnpublishedArticle = article
        break
      }
    }

    return oldestUnpublishedArticle
  }

  /**
   * Marks an article as posted by saving it to the database.
   * @param article - The article to mark as posted, including the post type.
   * @private
   */
  async #markArticleAsPosted(
    article: PostedArticle
  ): Promise<void> {
    try {
      const result = await this.#mongoService.insertOne<PostedArticle>(
        POSTED_ARTICLE_COLLECTION_NAME,
        article
      )

      if (result && this.#enableDebug) {
        console.log('Article saved to database', article)
      }
    } catch (error) {
      console.error('Error inserting article:', error)
    }
  }

  async findLatestPostedArticles(limit: number): Promise<PostedArticle[]> {
    await this.#mongoService.connect()

    const articles = await this.#mongoService.find<Article>(POSTED_ARTICLE_COLLECTION_NAME, 
      undefined, 
    {
      limit,
      sort: { _id: -1 }
    })

    return articles?.map(validatePostedArticle).filter(article => article !== undefined) ?? []
  }
}
