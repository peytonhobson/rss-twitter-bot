import { twitterClient } from '../twitterClient'
import { openaiClient } from '../openaiClient'
import { getRegularPrompt, getThreadPrompt } from './prompts'
import { createPoll } from './createPoll'
import type { Db } from 'mongodb'
import type { FeedItem } from './fetchArticles'

export async function tweetArticle(article: FeedItem, db: Db) {
  const lastTwoTweets = await db
    .collection('postedArticles')
    .find({})
    .sort({ _id: -1 })
    .limit(2)
    .toArray()

  const shouldCreatePoll =
    Math.random() > 0.9 && lastTwoTweets.every(tweet => !tweet.poll)

  /* If either of last two tweets were threads, we don't want to create a thread */
  const shouldCreateThread =
    isArticleSmallEnoughForThread(article) &&
    lastTwoTweets.every(tweet => !tweet.thread)

  if (shouldCreatePoll) {
    await createTwitterPoll(article)
  } else if (shouldCreateThread) {
    await createTwitterThread(article)
  } else {
    await createRegularTweet(article)
  }

  return {
    // poll: shouldCreatePoll,
    thread: shouldCreateThread
  }
}

async function createRegularTweet(article: FeedItem) {
  const content = await getRegularPrompt(article)

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }]
  })

  const tweet = response.choices[0]?.message?.content?.trim() || ''

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

async function generatePollQuestionAndOptions(article: FeedItem) {
  const content = `
  You are an expert in psychedelics and wellness. Based on the following article snippet, create a Twitter poll question, a comment about the article, and four possible options that encourage engagement and thoughtful discussion. The poll should be relevant to the main topic of the article. The output should be in the following JSON format:

  {
    "question": "string",
    "options": ["string", "string", "string", "string"]
  }

  Ensure the poll question is under 100 characters and each option is under 25 characters.

  Article Title: "${article.title}"
  Article Link: "${article.link}"
  Article Twitter Handle: "${article.twitterHandle}"
  Article Snippet: "${article.contentSnippet.slice(0, 300)}"
  `

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content }],
    temperature: 0.8,
    functions: [
      {
        name: 'generate_poll',
        description: 'Generate a poll question, content, and four options',
        parameters: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description:
                'The poll question that is engaging and relevant to the topic.',
              maxLength: 100
            },
            content: {
              type: 'string',
              description: `A comment about the article that is engaging and relevant to the topic, as well as the article title, link, and twitter handle.
                

                ###Format###

                {comment}

                Read More: {link}
                @{twitterHandle}
                `,
              maxLength: 100
            },
            options: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 25
              },
              minItems: 2,
              maxItems: 4,
              description:
                'Four possible poll options that are under 25 characters each'
            }
          },
          required: ['question', 'options']
        }
      }
    ],
    function_call: { name: 'generate_poll' }
  })

  const pollData = response.choices[0]?.message.function_call?.arguments

  if (pollData) {
    // TODO: validate these types
    const { question, options } = JSON.parse(pollData)

    return { question, options }
  } else {
    throw new Error('Failed to generate poll question and options.')
    process.exit(1)
  }
}

async function createTwitterPoll(article: FeedItem) {
  try {
    const { question, options } = await generatePollQuestionAndOptions(article)

    // Ensure options are unique and within Twitter's requirements (2-4 options)
    const uniqueOptions = Array.from(new Set(options))
      .slice(0, 4)
      .map(option => option.toString())

    await createPoll({
      question,
      options: uniqueOptions
    })

    console.log(`Poll created: ${question}`)
  } catch (error) {
    console.error('Failed to create poll tweet:', error)
    process.exit(1)
  }
}
