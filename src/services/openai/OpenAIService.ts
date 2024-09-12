import OpenAI from 'openai'
import type { ChatCompletionTool } from 'openai/resources'
import type { IOpenAIService } from './interfaces/IOpenAIService'

export interface OpenAIServiceParams {
  openaiApiKey: string
}

export class OpenAIService implements IOpenAIService {
  private openaiClient: OpenAI

  constructor(readonly params: OpenAIServiceParams) {
    this.openaiClient = new OpenAI({ apiKey: params.openaiApiKey })
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

    return response.choices[0]?.message.content?.trim() ?? ''
  }

  async getStructuredOutput<T>(params: {
    content: string
    tools: ChatCompletionTool[]
    model?: string
    temperature?: number
    sanitize: (data: unknown) => T
  }): Promise<T> {
    const { content, tools, model = 'gpt-4o', temperature, sanitize } = params

    const response = await this.openaiClient.chat.completions.create({
      model,
      messages: [{ role: 'user', content }],
      ...(temperature ? { temperature } : {}),
      tool_choice: 'required',
      tools
    })

    const functionCallArguments =
      response.choices[0]?.message.tool_calls?.[0]?.function.arguments

    if (!functionCallArguments) {
      throw new Error('No arguments in the response')
    }

    return typeof sanitize === 'function'
      ? sanitize(JSON.parse(functionCallArguments))
      : JSON.parse(functionCallArguments)
  }
}
