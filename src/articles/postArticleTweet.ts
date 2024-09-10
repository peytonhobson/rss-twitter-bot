import { config } from 'dotenv'
import { connectDB } from '../clients/connectDB'
import { fetchArticles } from './fetchArticles'
import { getOldestUnpostedArticle } from './getOldestUnpostedArticle'
import { tweetArticle } from './tweetArticle'
import type { FeedItem } from './fetchArticles'

config()

const DB_NAME = 'postedArticles'

export type RSSFeed = {
  feedLink: string
  twitterHandle: string | undefined
  twitterId?: string | undefined
}

interface TweetArticleParams {
  rssFeedItems: RSSFeed[]
  filterCallback: (feedItem: FeedItem) => boolean
  earliestPublishDate?: Date | undefined
}

export async function postArticleTweet({
  rssFeedItems,
  filterCallback,
  earliestPublishDate
}: TweetArticleParams) {
  const db = await connectDB(DB_NAME)

  const articles = (
    await Promise.all(
      rssFeedItems.map(async rssFeed => {
        return await fetchArticles(rssFeed, earliestPublishDate)
      })
    )
  )
    .flat()
    .filter(filterCallback)

  const oldestUnpostedArticle = await getOldestUnpostedArticle(db, articles)

  if (!oldestUnpostedArticle) {
    console.log('No new articles to post')

    return undefined
  }

  const additionaTweetData = await tweetArticle(oldestUnpostedArticle, db)

  try {
    await db
      .collection('postedArticles')
      .insertOne({ ...oldestUnpostedArticle, ...additionaTweetData })

    console.log('Article posted and saved to database')
  } catch (error) {
    console.error('Error inserting article:', error)
  }
}
