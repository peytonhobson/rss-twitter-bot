import { run, runSafeAsync } from '@crossingminds/utils'
import { EResourceType, FetcherService } from 'rettiwt-api'
import { config } from 'dotenv'
import { connectDB } from '../clients/connectDB'
import { openaiClient } from '../clients/openaiClient'
import { twitterClient } from '../clients/twitterClient'
import { validateUserTimeline } from './validateUserTimeline'
import { getPrompt } from './getPrompt'
import type { Collection } from 'mongodb'

config()

const DB_NAME = 'postedComments'

run(async () => {
  const db = await connectDB(DB_NAME)
  const commentsCollection = db.collection('comments')

  await pollTweets(commentsCollection)
})

const rettiwtFetcher = new FetcherService({
  apiKey: process.env.RETTIWT_API_KEY
})

// Poll for tweets in the last 24 hours
async function pollTweets(commentsCollection: Collection) {
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1)

  // TODO: Create separate list of account to comment. They should be accounts that typically receive replies
  const accountsToPoll = rssFeeds
    .map(rssFeed => rssFeed?.twitterId)
    .filter(Boolean)

  for (const account of accountsToPoll) {
    // TODO: If account doesn't have twitterId, get it from API
    const { value, error } = await runSafeAsync(async () => {
      return await rettiwtFetcher.request(EResourceType.USER_TIMELINE, {
        id: account,
        filter: {
          startDate: twentyFourHoursAgo
        }
      })
    })

    if (error) {
      console.log(error)
      // TODO: Remove
      process.exit(0)
      continue
    }

    const validatedTimeline = validateUserTimeline(value)

    const tweets = validatedTimeline
      .flat()
      .filter(entry => entry.content.entryType === 'TimelineTimelineItem')
      .map(({ content }) => ({
        text: content.itemContent.tweetResults.result.legacy.fullText,
        createdAt: content.itemContent.tweetResults.result.legacy.createdAt,
        id: content.itemContent.tweetResults.result.tweetId
      }))
      .filter(({ createdAt }) => new Date(createdAt) >= twentyFourHoursAgo)

    if (tweets.length) {
      for (const tweet of tweets) {
        const commentedRecently = await hasCommentedRecently(
          account,
          tweet.id,
          commentsCollection
        )

        if (!commentedRecently) {
          // Generate a relevant comment using the LLM
          const comment = await generateComment(tweet.text)

          // Post the comment as a reply
          await twitterClient.v2.reply(comment, tweet.id)

          console.log(`Replied to ${account}'s tweet: ${comment}`)

          // Record the comment in the database
          await recordComment(account, tweet.id, commentsCollection)

          // TODO: remove
          process.exit(0)
        } else {
          console.log(
            `Already commented recently on tweet ${tweet.id} from ${account}.`
          )
        }
      }
    }
  }
}

// Check if a comment was made in the last three days
async function hasCommentedRecently(
  account: string,
  tweetId: string,
  commentsCollection: Collection
) {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const comment = await commentsCollection.findOne({
    account,
    tweetId,
    commentedAt: { $gte: threeDaysAgo }
  })

  return !!comment // Returns true if a comment exists, false otherwise
}

// Record a comment in the database
async function recordComment(
  account: string,
  tweetId: string,
  commentsCollection: Collection
) {
  await commentsCollection.insertOne({
    account,
    tweetId,
    commentedAt: new Date()
  })
}

async function generateComment(tweetText: string) {
  const content = getPrompt(tweetText)

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content }],
    temperature: 1.2,
    top_p: 0.9,
    frequency_penalty: 0.5,
    presence_penalty: 0.3
  })

  return response.choices[0]?.message?.content?.trim() || ''
}
