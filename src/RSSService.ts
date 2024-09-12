import {
  fetchArticles,
  getOldestUnpostedArticle,
  tweetArticle
} from './articles'
import { POSTED_ARTICLE_COLLECTION_NAME } from './articles/articleCollection'
import { TwitterInteractionService } from './TwitterInteractionService'
import type { TwitterInteractionServiceParams } from './TwitterInteractionService'
import type { RSSFeed, FeedItem } from './articles'

interface RSSServiceParams extends TwitterInteractionServiceParams {
  rssFeeds: RSSFeed[]
}

export class RSSService extends TwitterInteractionService {
  private rssFeeds: RSSFeed[] = []

  constructor(private readonly params: RSSServiceParams) {
    super(params)

    this.rssFeeds = params.rssFeeds
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

    const oldestUnpostedArticle = await getOldestUnpostedArticle(
      this.db,
      articles
    )

    if (!oldestUnpostedArticle) {
      return
    }

    const tweet = await tweetArticle(
      this.twitterInteractionService,
      oldestUnpostedArticle,
      this.rssFeed
    )

    if (tweet) {
      await this.markArticleAsPosted(oldestUnpostedArticle)
    }
  }

  private async markArticleAsPosted(article: FeedItem): Promise<void> {
    if (this.db) {
      try {
        await this.db
          .collection(POSTED_ARTICLE_COLLECTION_NAME)
          .insertOne({ article })

        console.log('Article posted and saved to database')
      } catch (error) {
        console.error('Error inserting article:', error)
      }
    }
  }
}
