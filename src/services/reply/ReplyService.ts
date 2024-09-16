import { daysToMilliseconds } from '@crossingminds/utils'
import { MongoService } from '../database/MongoService'
import { OpenAIService } from '../openai/OpenAIService'
import { TwitterService } from '../twitter/TwitterService'
import type { MongoServiceParams } from '../database/MongoService'
import type { OpenAIServiceParams } from '../openai/OpenAIService'
import type { TwitterServiceParams } from '../twitter/TwitterService'
import type { IReplyService } from './interfaces/IReplyService'

const REPLIED_TWEETS_COLLECTION_NAME = 'replied-tweets'

export type ReplyServiceParams = {
  accounts: string[]
  enableDebug?: boolean
} & MongoServiceParams &
  TwitterServiceParams &
  OpenAIServiceParams

export class ReplyService implements IReplyService {
  readonly #twitterService: TwitterService
  readonly #openAIService: OpenAIService
  readonly #mongoService: MongoService
  readonly #enableDebug: boolean
  readonly #accountsToReplyTo: string[]

  constructor(readonly params: ReplyServiceParams) {
    const { accounts, enableDebug = false } = params

    this.#mongoService = new MongoService(params)
    this.#twitterService = new TwitterService(params)
    this.#openAIService = new OpenAIService(params)

    this.#accountsToReplyTo = accounts
    this.#enableDebug = enableDebug
  }

  async postRandomReply({ getPrompt }: { getPrompt: () => string }) {
    await this.#mongoService.connect()

    let userId: string | undefined
    let account: string | undefined

    const postedTweetsWithinLast24Hours = await this.#mongoService.find(
      REPLIED_TWEETS_COLLECTION_NAME,
      {
        timestamp: {
          $gte: new Date(Date.now() - daysToMilliseconds(1))
        }
      }
    )

    while (userId === undefined) {
      account =
        this.#accountsToReplyTo[
          Math.floor(Math.random() * this.#accountsToReplyTo.length)
        ]

      const repliedToAccountInLast24Hours = postedTweetsWithinLast24Hours?.some(
        tweet => tweet.account === account
      )

      /* Don't reply to the same account within 24 hours, 
        otherwise, we'll be spamming the same account */
      if (repliedToAccountInLast24Hours) {
        continue
      }

      if (account) {
        userId = await this.#twitterService.getUserId(account)
      }
    }

    if (userId === undefined) {
      console.log(`No user found for any accounts`)

      return
    }

    const targetAccountsRecentTweets =
      await this.#twitterService.getUserTimeline(userId, {
        count: 10
      })

    // TODO: Put a limit on the number of tweets
    const postedTweetsToThisAccount = await this.#mongoService.find(
      REPLIED_TWEETS_COLLECTION_NAME,
      { account }
    )

    const repliedTweetIds = new Set(
      postedTweetsToThisAccount?.map(tweet => tweet.tweetId)
    )
    const eligibleTweets = targetAccountsRecentTweets?.filter(
      tweet => !repliedTweetIds.has(tweet.id)
    )

    // TODO: Instead sort these by created time
    /* Assuming the tweets are in reverse chronological order for now */
    const latestEligibleTweet = eligibleTweets?.[0]

    if (!latestEligibleTweet) {
      console.log(`No eligible tweets found for account: ${account}`)

      return
    }

    // Generate a reply using OpenAI
    const replyContent = await this.#openAIService.generateChatCompletion({
      content: getPrompt()
    })

    // Post the reply
    const replyTweet = await this.#twitterService.postReply(
      latestEligibleTweet.id,
      replyContent
    )

    // Save the replied tweet to the database
    await this.#mongoService.insertOne(REPLIED_TWEETS_COLLECTION_NAME, {
      account,
      tweetId: latestEligibleTweet.id,
      replyId: replyTweet?.data.id,
      timestamp: new Date()
    })

    if (this.#enableDebug) {
      console.log(
        `Posted reply to tweet ${latestEligibleTweet.id} for account ${account}`
      )
    }
  }
}
