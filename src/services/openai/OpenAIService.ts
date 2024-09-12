import OpenAI from 'openai'
import type { FunctionParameters } from 'openai/resources'
import type { IOpenAIService } from './interfaces/IOpenAIService'

export class OpenAIService implements IOpenAIService {
  private openaiClient: OpenAI

  constructor(apiKey: string) {
    this.openaiClient = new OpenAI({ apiKey })
  }

  // TODO: Add additional parameters for the OpenAI API
  async generateChatCompletion({
    content,
    maxTokens = 100,
    model = 'gpt-4o'
  }: {
    content: string
    maxTokens?: number
    model?: string
  }): Promise<string> {
    const response = await this.openaiClient.chat.completions.create({
      model,
      messages: [{ role: 'user', content }],
      max_tokens: maxTokens
    })

    return response.choices[0].message.content?.trim() ?? ''
  }

  async getStructuredOutput(params: {
    content: string
    functionName: string
    functionDescription: string
    parameters: FunctionParameters
    model?: string
    temperature?: number
  }): Promise<string>
  async getStructuredOutput<T>(params: {
    content: string
    functionName: string
    functionDescription: string
    parameters: FunctionParameters
    model?: string
    temperature?: number
    sanitize: (data: unknown) => T
  }): Promise<T> {
    const {
      content,
      functionName,
      functionDescription,
      parameters,
      model = 'gpt-4o',
      temperature,
      sanitize
    } = params

    const response = await this.openaiClient.chat.completions.create({
      model,
      messages: [{ role: 'user', content }],
      temperature,
      tool_choice: 'required',
      tools: [
        {
          type: 'function',
          function: {
            name: functionName,
            description: functionDescription,
            parameters
          }
        }
      ]
    })

    const functionCallArguments =
      response.choices[0].message.tool_calls?.[0].function.arguments

    if (!functionCallArguments) {
      throw new Error('No arguments in the response')
    }

    return typeof sanitize === 'function'
      ? sanitize(JSON.parse(functionCallArguments))
      : JSON.parse(functionCallArguments)
  }
}
