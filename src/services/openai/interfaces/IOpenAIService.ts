import type { ChatCompletionTool } from 'openai/resources'

export interface IOpenAIService {
  /**
   * Generates a chat completion based on the given parameters.
   * @param content The input content or prompt to generate text from.
   * @param maxTokens The maximum number of tokens to generate. Optional.
   * @param model The OpenAI model to use. Optional.
   * @returns A Promise that resolves to the generated text.
   */
  generateChatCompletion({
    content,
    maxTokens,
    model
  }: {
    content: string
    maxTokens?: number
    model?: string
  }): Promise<string>

  /**
   * Gets structured output from the OpenAI API based on the provided parameters.
   * @param content The input content or prompt.
   * @param functionName The name of the function to call.
   * @param functionDescription A description of what the function does.
   * @param parameters The parameters schema for the function.
   * @param model The OpenAI model to use.
   * @param temperature The temperature setting for output randomness.
   * @param sanitize A function to sanitize the output.
   * @returns The structured output of type T.
   * @throws If the response does not contain a function call or arguments.
   */
  getStructuredOutput<T>(params: {
    content: string
    tools: ChatCompletionTool[]
    model?: string
    temperature?: number
    sanitize: (data: unknown) => T
  }): Promise<T>

  // /**
  //  * Generates hashtags for a given text.
  //  * @param text The text to generate hashtags for.
  //  * @param maxHashtags The maximum number of hashtags to generate.
  //  * @returns An array of generated hashtags.
  //  */
  // generateHashtags(text: string, maxHashtags?: number): Promise<string[]>
}
