import { daysToMilliseconds, run } from '@crossingminds/utils'
import { OpenAIService } from '../openai/OpenAIService'
import { TwitterService } from '../twitter/TwitterService'
import { MongoService } from '../database/MongoService'
import {
  fetchArticles,
  getBlueskyPostParameters,
  getLLMPollParameters
} from '../../utils'
import { validatePostedArticle, type PostedArticle } from '../../models/article'
import { BlueskyService } from '../bluesky/BlueskyService'
import type { BlueskyServiceParams } from '../bluesky/BlueskyService'
import type { IRSSService } from './interfaces/IRSSService'
import type { MongoServiceParams } from '../database/MongoService'
import type { TwitterServiceParams } from '../twitter/TwitterService'
import type { OpenAIServiceParams } from '../openai/OpenAIService'
import type { RSSFeed, Article } from '../../models'

const POSTED_ARTICLE_COLLECTION_NAME = 'posted-articles'

const Platforms = ['twitter', 'bluesky'] as const

export type Platform = (typeof Platforms)[number]

export type RSSServiceParams = {
  rssFeeds: RSSFeed[]
  enableDebug?: boolean
} & MongoServiceParams &
  TwitterServiceParams &
  OpenAIServiceParams &
  Partial<BlueskyServiceParams>

export class RSSService implements IRSSService {
  readonly #rssFeeds: RSSFeed[]
  readonly #blueskyService: BlueskyService | undefined
  readonly #twitterService: TwitterService
  readonly #openAIService: OpenAIService
  readonly #mongoService: MongoService
  readonly #enableDebug: boolean

  constructor(readonly params: RSSServiceParams) {
    const { rssFeeds, enableDebug = false } = params

    this.#mongoService = new MongoService(params)
    this.#twitterService = new TwitterService(params)
    this.#openAIService = new OpenAIService(params)

    if (params.blueskyIdentifier && params.blueskyPassword) {
      this.#blueskyService = new BlueskyService({
        blueskyIdentifier: params.blueskyIdentifier,
        blueskyPassword: params.blueskyPassword,
        enableDebug
      })
    }

    this.#rssFeeds = rssFeeds
    this.#enableDebug = enableDebug
  }

  async postArticleTweet({
    customArticleFilter,
    fetchCustomArticles,
    getPrompt,
    platforms = ['twitter']
  }: {
    customArticleFilter?: ((article: Article) => boolean) | undefined
    fetchCustomArticles?: () => Promise<Article[]>
    getPrompt: (article: Article, platform: Platform) => string
    platforms: [Platform, ...Platform[]]
  }) {
    await this.#mongoService.connect()

    const oldestUnpublishedArticle = await this.#getOldestUnpublishedArticle({
      customArticleFilter,
      fetchCustomArticles
    })

    if (oldestUnpublishedArticle === undefined) return undefined

    const posts = await Promise.all(
      platforms.map(async platform => {
        const content = getPrompt(oldestUnpublishedArticle, platform)

        switch (platform) {
          case 'twitter':
            return await run(async () => {
              const tweet = await this.#openAIService.generateChatCompletion({
                content
              })

              return {
                post: await this.#twitterService.postTweet(tweet),
                type: 'tweet' as const
              }
            })

          case 'bluesky':
            if (!this.#blueskyService) {
              console.error('Provide bluesky credentials to create a post.')

              return undefined
            }

            return await run(async () => {
              const postParameters = getBlueskyPostParameters(content)

              const postData =
                await this.#openAIService.getStructuredOutput(postParameters)

              if (!postData) {
                return undefined
              }

              return {
                post: await this.#blueskyService?.createPost(postData),
                type: 'blueskyPost' as const
              }
            })
        }
      })
    )

    await this.#markArticleAsPosted({
      ...oldestUnpublishedArticle,
      postType: 'tweet',
      createdAt: new Date()
    })

    await this.#mongoService.disconnect()

    return {
      article: oldestUnpublishedArticle,
      tweet: posts.find(post => post?.type === 'tweet')?.post,
      blueskyPost: posts.find(post => post?.type === 'blueskyPost')?.post
    }
  }

  async postArticleThread({
    getPrompt,
    customArticleFilter,
    fetchCustomArticles
  }: {
    getPrompt: (article: Article) => string
    customArticleFilter?: ((article: Article) => boolean) | undefined
    fetchCustomArticles?: () => Promise<Article[]>
  }) {
    await this.#mongoService.connect()

    const oldestUnpublishedArticle = await this.#getOldestUnpublishedArticle({
      customArticleFilter,
      fetchCustomArticles
    })

    if (oldestUnpublishedArticle === undefined) return undefined

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
    const tweetContainLink = tweets.some(tweet =>
      tweet.includes(oldestUnpublishedArticle.link)
    )

    if (!tweetContainLink) {
      tweets = [
        ...tweets,
        `Read More: ${oldestUnpublishedArticle.link}\n${oldestUnpublishedArticle.twitterHandle ? `@${oldestUnpublishedArticle.twitterHandle}` : ''}`
      ]
    }

    const postedThread = await this.#twitterService.postThread(tweets)

    await this.#markArticleAsPosted({
      ...oldestUnpublishedArticle,
      postType: 'thread',
      createdAt: new Date()
    })

    await this.#mongoService.disconnect()

    return {
      article: oldestUnpublishedArticle,
      tweets: postedThread
    }
  }

  async postArticlePoll({
    getPrompt,
    customArticleFilter,
    fetchCustomArticles,
    client = 'twitter'
  }: {
    getPrompt: (article: Article) => string
    customArticleFilter?: ((article: Article) => boolean) | undefined
    fetchCustomArticles?: () => Promise<Article[]>
    client?: 'twitter' | 'rettiwt'
  }) {
    await this.#mongoService.connect()

    const oldestUnpublishedArticle = await this.#getOldestUnpublishedArticle({
      customArticleFilter,
      fetchCustomArticles
    })

    if (oldestUnpublishedArticle === undefined) return undefined

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
      tweet: `${pollData.tweet}\n\nRead More: ${oldestUnpublishedArticle.link}\n${oldestUnpublishedArticle.twitterHandle ? `@${oldestUnpublishedArticle.twitterHandle}` : ''}`,
      client
    }

    const postedPoll = await this.#twitterService.postPoll(pollDataWithLinks)

    await this.#markArticleAsPosted({
      ...oldestUnpublishedArticle,
      postType: 'poll',
      createdAt: new Date()
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

  async filterArticles(
    articles: Article[],
    customArticleFilter: ((article: Article) => boolean) | undefined
  ) {
    const filterResults = await Promise.all(
      articles.map(async article => {
        const isPosted = await this.#isArticlePosted(article.link)
        const passesCustomFilter = customArticleFilter?.(article) ?? true

        return !isPosted && passesCustomFilter
      })
    )

    const filteredArticles = articles
      .filter((_, index) => filterResults[index])
      .sort(
        (a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime()
      )

    return filteredArticles
  }

  /**
   * Retrieves the oldest unpublished article from a list of articles.
   * Prioritizes articles from authors different from the last posted article.
   * @param articles - An array of articles to check.
   * @returns The oldest unpublished article, or undefined if none found.
   * @private
   */
  async #getOldestUnpublishedArticle({
    customArticleFilter,
    fetchCustomArticles
  }: {
    customArticleFilter: ((article: Article) => boolean) | undefined
    fetchCustomArticles: (() => Promise<Article[]>) | undefined
  }) {
    const articles = [
      ...(await fetchArticles(this.#rssFeeds)),
      ...((await fetchCustomArticles?.()) ?? [])
    ]

    const filteredArticles = await this.filterArticles(
      articles,
      customArticleFilter
    )

    const lastPostedArticles =
      (
        await this.#mongoService.find<PostedArticle>(
          POSTED_ARTICLE_COLLECTION_NAME,
          {
            createdAt: {
              $gte: new Date(Date.now() - daysToMilliseconds(1))
            }
          },
          {
            sort: { _id: -1 }
          }
        )
      )
        ?.map(validatePostedArticle)
        .filter(article => article !== undefined) ?? []

    const authorsPostedInLast24Hours = new Set(
      lastPostedArticles?.map(article => new URL(article.link).hostname)
    )

    let oldestUnpublishedArticle: Article | undefined = undefined

    for (const article of filteredArticles) {
      const articleAuthor = new URL(article.link).hostname

      if (authorsPostedInLast24Hours.has(articleAuthor)) {
        continue
      }

      oldestUnpublishedArticle = article
      break
    }

    /* If there are valid articles from other authors, 
     return the oldest unpublished article */
    if (oldestUnpublishedArticle) {
      return oldestUnpublishedArticle
    }

    return filteredArticles[0]
  }

  /**
   * Marks an article as posted by saving it to the database.
   * @param article - The article to mark as posted, including the post type.
   * @private
   */
  async #markArticleAsPosted(article: PostedArticle): Promise<void> {
    /* Validate article and remove any extra fields */
    const postedArticle = validatePostedArticle(article)

    if (!postedArticle) {
      console.error('Invalid article', article)
      return
    }

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

    const articles = await this.#mongoService.find<Article>(
      POSTED_ARTICLE_COLLECTION_NAME,
      undefined,
      {
        limit,
        sort: { _id: -1 }
      }
    )

    return (
      articles
        ?.map(validatePostedArticle)
        .filter(article => article !== undefined) ?? []
    )
  }
}
