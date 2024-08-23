import { twitterClient } from './twitterClient'
import type { FeedItem } from './fetchArticles'

function formatTweet(article: FeedItem): string {
  const title = article.title || 'Interesting Read'
  const source = new URL(article.link).hostname.replace('www.', '') // Extracts the domain as the source
  const link = article.link // Optionally, you can shorten the URL using a URL shortener service

  return `${title}\n\nSource: ${source}\n\n${link}`
}

export async function tweetArticle(article: FeedItem) {
  const tweet = formatTweet(article)

  try {
    await twitterClient.v2.tweet(tweet)
    console.log(`Tweeted: ${tweet}`)
  } catch (error) {
    console.error('Error posting tweet:', error)
    process.exit(1)
  }
}
