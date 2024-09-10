import { createPoll } from './createPoll'
import { createThread } from './createThread'
import { createTweet } from './createTweet'
import type { Db } from 'mongodb'
import type { FeedItem } from './fetchArticles'

export async function tweetArticle(article: FeedItem, db: Db) {
  const lastTwoTweets = await db
    .collection('postedArticles')
    .find({})
    .sort({ _id: -1 })
    .limit(2)
    .toArray()

  /* Create a 10% chance of creating a poll, but don't create 
     a poll if either of the last two tweets were polls */
  const shouldCreatePoll =
    Math.random() > 0.9 && lastTwoTweets.every(tweet => !tweet.poll)

  if (shouldCreatePoll) {
    await createPoll(article)

    return {
      poll: true
    }
  }

  /* If either of last two tweets were threads, we don't want to create a thread */
  const shouldCreateThread =
    isArticleSmallEnoughForThread(article) &&
    lastTwoTweets.every(tweet => !tweet.thread) // If either of last two tweets were threads, we don't want to create a thread

  if (shouldCreateThread) {
    await createThread(article)

    return {
      thread: true
    }
  }

  await createTweet(article)

  return undefined
}

function isArticleSmallEnoughForThread(article: FeedItem): boolean {
  // Assuming 2,000 characters is a reasonable length for GPT-4 to generate a thread
  return article.content.length <= 2000
}
