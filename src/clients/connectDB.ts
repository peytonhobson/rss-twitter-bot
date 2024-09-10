import { MongoClient } from 'mongodb'
import { config } from 'dotenv'
import { r, runSafe } from '@crossingminds/utils'

config()

// TODO: Implement own version of runSafe
const { hasError, value: mongoURI } = runSafe(() =>
  r.required(r.string(process.env.MONGO_URI))
)

// TODO: Better error message
if (hasError) {
  console.error('Error loading MongoDB URI:', mongoURI)
}

const client = mongoURI ? new MongoClient(mongoURI) : undefined

export async function connectDB(dbName: string) {
  try {
    await client.connect()

    return client.db(dbName)
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
  }
}
