import { config } from 'dotenv'
import { r, run, runSafe } from '@crossingminds/utils'
import { fetchArticles } from './fetchArticles'
import { rssFeeds } from './rssFeeds'

config() // Load environment variables from .env

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

//  TODO: Replace with feed URLs
run(async () => {
  const articles = await Promise.all(
    rssFeeds.map(async feedUrl => {
      return await fetchArticles(feedUrl)
    })
  )

  console.log(articles)
})
