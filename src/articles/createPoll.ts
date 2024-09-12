import { r } from '@crossingminds/utils'
import { customFetcherService } from '../services/twitter/CustomTweetService'
import type { AxiosRequestConfig } from 'axios'
import type { FeedItem } from './fetchArticles'

/** Create a twitter poll based on an article */
export async function createPoll(article: FeedItem) {
  try {
    const { question, content, options } =
      await generatePollQuestionAndOptions(article)

    /* Ensure options are unique and within Twitter's requirements (2-4 options) */
    const uniqueOptions = Array.from(new Set(options))
      .slice(0, 4)
      .map(option => option.toString())

    const cardUri = await generateCardUI({
      options: uniqueOptions
    })

    if (cardUri === undefined) {
      console.error('Error generating cardUri for poll.')

      return
    }

    // TODO: Better log
    console.log(`Poll created: ${question}`)
  } catch (error) {
    console.error('Failed to create poll tweet:', error)
  }
}

/** Using OpenAI's structured response format, generate a poll
 *  question, content, and options based on an article */
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
        tool_choice: 'required',
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_poll',
              description: 'Generate a poll question, content, and four options',
              parameters: {
                type: 'object',
                properties: {
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
    const parsedPollData = r.required(
      r.object(
        JSON.parse(pollData),
        ({ question, content: tweetContent, options }) => {
          return {
            question: r.required(r.string(question)),
            content: r.required(r.string(tweetContent)),
            options: r.required(r.array(options, r.string))
          }
        }
      )
    )

    return parsedPollData
  } else {
    // TODO: Throw error?
    throw new Error('Failed to generate poll question and options.')
  }
}
