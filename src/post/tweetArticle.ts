import { twitterClient } from '../twitterClient'
import { getRegularTweet, getThreadTweet } from './prompts'
import type { FeedItem } from './fetchArticles'

export async function tweetArticle(article: FeedItem) {
  const shouldCreateThread = isArticleSmallEnoughForThread(article)

  const tweet = await getRegularTweet(article)

  try {
    await twitterClient.v2.tweet(tweet)
    console.log(`Tweeted: ${tweet}`)
  } catch (error) {
    console.error('Error posting tweet:', error)
    process.exit(1)
  }
}

// TODO: If this happens too often, we should check previous tweets to see if it was also a thread
function isArticleSmallEnoughForThread(article: FeedItem): boolean {
  // Assuming 2,000 characters is a reasonable length for GPT-4 to generate a thread
  return article.content.length <= 2000
}
