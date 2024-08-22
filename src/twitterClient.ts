import { r, runSafe } from '@crossingminds/utils'
import { TwitterApi } from 'twitter-api-v2'
import { config } from 'dotenv'

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

// Twitter API credentials
export const twitterClient = new TwitterApi(credentials)
