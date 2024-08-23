import { MongoClient } from 'mongodb'
import { config } from 'dotenv'
import { r, runSafe } from '@crossingminds/utils'

config() // Load environment variables from .env

const { hasError, value: mongoURI } = runSafe(() =>
  r.required(r.string(process.env.MONGO_URI))
)

if (hasError) {
  console.error('Error loading MongoDB URI:', mongoURI)
  process.exit(1)
}

const client = new MongoClient(mongoURI)

export async function connectDB() {
  try {
    await client.connect()

    return client.db('postedArticles')
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(1)
  }
}
