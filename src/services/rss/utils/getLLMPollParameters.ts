import { r } from '@crossingminds/utils'
import type { OpenAIService } from '../../openai/OpenAIService'
import type { FeedItem } from './fetchArticles'

export function getLLMPollParameters(article: FeedItem) {
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

  return {
    content,
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
          }
        }
      }
    ],
    sanitize: (data: unknown) =>
      r.required(
        r.object(data, ({ question, content: tweetContent, options }) => {
          return {
            question: r.required(r.string(question)),
            content: r.required(r.string(tweetContent)),
            options: r.required(r.array(options, r.string))
          }
        })
      )
  } as const satisfies Parameters<
    typeof OpenAIService.prototype.getStructuredOutput
  >[0]
}
