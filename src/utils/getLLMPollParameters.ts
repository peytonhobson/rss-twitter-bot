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
          description: `For a twitter poll, generate a tweet starting with a question
          that is engaging and relevant to the topic along with information about the provided article. Then, generate two to four possible
          poll options that are under 25 characters each.`,
          parameters: {
            type: 'object',
            properties: {
              parameters: {
                type: 'object',
                properties: {
                  tweet: {
                    type: 'string',
                    description: `The poll tweet that is engaging and relevant to the topic. This should start with a question that is engaging and relevant to the topic. It should also include information about the provided article.`
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
                      'Two to four possible poll options that are under 25 characters each'
                  }
                },
                required: ['tweet', 'options']
              }
            }
          }
        }
      }
    ],
    sanitize: (data: unknown) => {
      return r.required(
        r.object(data, ({ tweet, options }) => {
          return {
            tweet: r.required(r.string(tweet)),
            options: r.required(r.array(options, option => r.string(option)))
          }
        })
      )
    }
  } as const satisfies Parameters<
    typeof OpenAIService.prototype.getStructuredOutput
  >[0]
}
