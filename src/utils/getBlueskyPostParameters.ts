import { r } from '@crossingminds/utils'
import type { OpenAIService } from '../services/openai/OpenAIService'

export function getBlueskyPostParameters(content: string) {
  return {
    content,
    tools: [
      {
        type: 'function',
        function: {
          name: 'generate_post',
          description: `Generate a bluesky post`,
          parameters: {
            type: 'object',
            properties: {
              parameters: {
                type: 'string',
                description: `The post.`,
                maxLength: 300
              }
            }
          }
        }
      }
    ],
    sanitize: (data: unknown) => {
      return r.required(r.string(data))
    }
  } as const satisfies Parameters<
    typeof OpenAIService.prototype.getStructuredOutput
  >[0]
}
