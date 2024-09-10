import OpenAI from 'openai'

import { config } from 'dotenv'
import { r, runSafe } from '@crossingminds/utils'

config()

const { value: credentials, hasError } = runSafe(() => ({
  apiKey: r.required(r.string(process.env.OPEN_AI_KEY))
}))

if (hasError) {
  console.error('Error loading credentials:', credentials)
}

export const openaiClient = credentials ? new OpenAI(credentials) : undefined
