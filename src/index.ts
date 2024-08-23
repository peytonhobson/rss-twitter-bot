import { config } from 'dotenv'
import { r, run, runSafe } from '@crossingminds/utils'
import { fetchArticles } from './fetchArticles'
import { rssFeeds } from './rssFeeds'
import { connectDB } from './connectDB'
import { getOldestUnpostedArticle } from './getOldestUnpostedArticle'
import { tweetArticle } from './tweetArticle'

config()

const { value: credentials, hasError } = runSafe(() => ({
  appKey: r.required(r.string(process.env.TWITTER_API_KEY)),
  appSecret: r.required(r.string(process.env.TWITTER_API_SECRET)),
  accessToken: r.required(r.string(process.env.TWITTER_ACCESS_TOKEN)),
  accessSecret: r.required(r.string(process.env.TWITTER_ACCESS_SECRET))
}))

if (hasError) {
  console.error('Error loading credentials:', credentials)
  process.exit(1)
}

run(async () => {
  const db = await connectDB()

  const articles = (
    await Promise.all(
      rssFeeds.map(async feedUrl => {
        return await fetchArticles(feedUrl)
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
