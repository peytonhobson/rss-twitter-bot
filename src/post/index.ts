import { config } from 'dotenv'
import { run } from '@crossingminds/utils'
import { rssFeeds } from '../rssFeeds'
import { connectDB } from '../connectDB'
import { fetchArticles } from './fetchArticles'
import { getOldestUnpostedArticle } from './getOldestUnpostedArticle'
import { tweetArticle } from './tweetArticle'

config()

const DB_NAME = 'postedArticles'

run(async () => {
  const db = await connectDB(DB_NAME)

  const articles = (
    await Promise.all(
      rssFeeds.map(async rssFeed => {
        return await fetchArticles(rssFeed)
      })
    )
  ).flat()

  const oldestUnpostedArticle = await getOldestUnpostedArticle(db, articles)

  if (!oldestUnpostedArticle) {
    console.log('No new articles to post')
    process.exit(0)
  }

  await tweetArticle(oldestUnpostedArticle)

  try {
    await db.collection('postedArticles').insertOne(oldestUnpostedArticle)
  } catch (error) {
    console.error('Error inserting article:', error)
  }

  console.log('Article posted and saved to database')

  process.exit(0)
})
