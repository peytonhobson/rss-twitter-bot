import { r } from '@crossingminds/utils'
import type { OpenAIService } from '../services/openai/OpenAIService'

/**
 * Generates the parameters for an LLM poll based on the given content.
 * @param content - The content to base the poll on.
 * @returns An object containing the necessary parameters for generating a poll using OpenAI's structured output.
 */
export function getLLMPollParameters(content: string) {
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
