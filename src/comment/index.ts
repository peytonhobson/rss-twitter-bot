import { run, runSafeAsync } from '@crossingminds/utils'
import { EResourceType, FetcherService } from 'rettiwt-api'
import { config } from 'dotenv'
import { connectDB } from '../connectDB'
import { openaiClient } from '../openaiClient'
import { twitterClient } from '../twitterClient'
import { rssFeeds } from '../rssFeeds'
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

  const accountsToPoll = rssFeeds
    .map(rssFeed => rssFeed.twitterId)
    .filter(Boolean)

  for (const account of accountsToPoll) {
    const { value, hasError, error } = await runSafeAsync(async () => {
      return await rettiwtFetcher.request(EResourceType.USER_TIMELINE, {
        id: account,
        filter: {
          startDate: twentyFourHoursAgo
        }
      })
    })

    if (error) {
      console.log(error)
      continue
    }

    console.log(
      value?.data?.user?.result?.timeline?.timeline?.instructions[1]?.entries
    )
    {
    entryId: 'tweet-1821999895458541959',
    sortIndex: '1829302406341459948',
    content: {
      entryType: 'TimelineTimelineItem',
      __typename: 'TimelineTimelineItem',
      itemContent: [Object],
      clientEventInfo: [Object]
    }
  },
  // Filter by entryType = 'TimelineTimelineItem' and grab itemContent
    process.exit(0)

    if (tweets.data && tweets.data.length > 0) {
      for (const tweet of tweets.data) {
        const tweetCreatedAt = new Date(tweet.created_at)

        // Only consider tweets from the last 24 hours
        if (tweetCreatedAt >= twentyFourHoursAgo) {
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
          } else {
            console.log(
              `Already commented recently on tweet ${tweet.id} from ${account}.`
            )
          }
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

async function generateComment(tweetText) {
  const content = `
  You are an expert in psychedelics and wellness. Generate a thoughtful and engaging comment in response to the following tweet:
  
  Tweet: "${tweetText}"
  
  Make sure the comment is relevant, insightful, and adds value to the conversation. Keep it under 100 characters.
  `

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: content }],
    max_tokens: 50 // Adjust token limit based on desired comment length
  })

  return response.choices[0]?.message?.content?.trim() || ''
}
