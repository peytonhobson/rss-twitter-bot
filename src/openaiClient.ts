import OpenAI from 'openai'

import { config } from 'dotenv'

config() // Load environment variables from .env

export const openaiClient = new OpenAI({
  apiKey: process.env['OPEN_AI_KEY']
})
