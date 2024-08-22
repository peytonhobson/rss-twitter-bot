import { twitterClient } from './twitterClient'
import type { FeedItem } from './fetchArticles'

export async function tweetArticle(article: FeedItem) {
  const tweet = `${article.title} - ${article.link}`
  try {
    await twitterClient.v2.tweet(tweet)
    console.log(`Tweeted: ${tweet}`)
  } catch (error) {
    console.error('Error posting tweet:', error)
  }
}
