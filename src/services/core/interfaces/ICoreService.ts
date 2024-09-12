import type { RSSFeed, FeedItem } from '../../rss/utils'

export interface ICoreService {
  postNextArticle({
    rssFeeds,
    earliestPublishDate,
    customArticleFilter
  }: {
    rssFeeds: RSSFeed[]
    earliestPublishDate?: Date | undefined
    customArticleFilter: (feedItem: FeedItem) => boolean
  }): Promise<void>
  makeRandomComments(): Promise<void>
}
