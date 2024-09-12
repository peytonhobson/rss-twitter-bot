import OpenAI from 'openai';
export class OpenAIService {
    params;
    openaiClient;
    constructor(params) {
        this.params = params;
        this.openaiClient = new OpenAI({ apiKey: params.openaiKey });
    }
    // TODO: Add additional parameters for the OpenAI API
    async generateChatCompletion({ content, maxTokens = 100, model = 'gpt-4o' }) {
        const response = await this.openaiClient.chat.completions.create({
            model,
            messages: [{ role: 'user', content }],
            max_tokens: maxTokens
        });
        return response.choices[0]?.message.content?.trim() ?? '';
    }
    async getStructuredOutput(params) {
        const { content, tools, model = 'gpt-4o', temperature, sanitize } = params;
        const response = await this.openaiClient.chat.completions.create({
            model,
            messages: [{ role: 'user', content }],
            ...(temperature ? { temperature } : {}),
            tool_choice: 'required',
            tools
        });
        const functionCallArguments = response.choices[0]?.message.tool_calls?.[0]?.function.arguments;
        if (!functionCallArguments) {
            throw new Error('No arguments in the response');
        }
        return typeof sanitize === 'function'
            ? sanitize(JSON.parse(functionCallArguments))
            : JSON.parse(functionCallArguments);
    }
}
