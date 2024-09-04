import { twitterClient } from '../twitterClient'
import { openaiClient } from '../openaiClient'
import { getRegularPrompt, getThreadPrompt } from './prompts'
import type { Db } from 'mongodb'
import type { FeedItem } from './fetchArticles'

export async function tweetArticle(article: FeedItem, db: Db) {
  const lastTwoTweets = await db
    .collection('postedArticles')
    .find({})
    .sort({ _id: -1 })
    .limit(2)
    .toArray()

  /* If either of last two tweets were threads, we don't want to create a thread */
  const shouldCreateThread =
    isArticleSmallEnoughForThread(article) &&
    lastTwoTweets.every(tweet => !tweet.thread)

  if (shouldCreateThread) {
    await createTwitterThread(article)
  } else {
    await createRegularTweet(article)
  }

  return {
    thread: shouldCreateThread
  }
}

async function createRegularTweet(article: FeedItem) {
  const tweet = await getRegularPrompt(article)

  try {
    await twitterClient.v2.tweet(tweet)
    console.log(`Tweeted: ${tweet}`)
  } catch (error) {
    console.error('Error posting tweet:', error)
    process.exit(1)
  }
}
async function createTwitterThread(article: FeedItem) {
  const content = await getThreadPrompt(article)

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }]
  })

  const generatedContent = response.choices[0]?.message?.content?.trim() || ''

  const tweets = generatedContent
    .split(/(?=\n\d+\/\d+)/)
    .map(tweet => tweet.trim())

  try {
    await twitterClient.v2.tweetThread(tweets)
  } catch (error) {
    console.error('Error posting thread:', error)
    process.exit(1)
  }
}

function isArticleSmallEnoughForThread(article: FeedItem): boolean {
  // Assuming 2,000 characters is a reasonable length for GPT-4 to generate a thread
  return article.content.length <= 2000
}
