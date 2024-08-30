import { config } from 'dotenv'
import { run } from '@crossingminds/utils'
import { fetchArticles } from './fetchArticles'
import { rssFeeds } from './rssFeeds'
import { connectDB } from './connectDB'
import { getOldestUnpostedArticle } from './getOldestUnpostedArticle'
import { tweetArticle } from './tweetArticle'
import { filterPsychedelicArticles } from './filterPsychedelicArticles'

config()

run(async () => {
  const db = await connectDB()

  const articles = (
    await Promise.all(
      rssFeeds.map(async rssFeed => {
        return await fetchArticles(rssFeed)
      })
    )
  )
    .flat()
    .filter(filterPsychedelicArticles)

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
