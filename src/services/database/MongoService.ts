import { MongoClient } from 'mongodb'
import type {
  Db,
  Filter,
  Document as MongoDocument,
  OptionalUnlessRequiredId
} from 'mongodb'
import type { IMongoService } from './interfaces/IMongoService'

const DEFAULT_DB_NAME = 'twitter-bot'

export interface MongoServiceParams {
  mongoUri?: string | undefined
  customDbName?: string | undefined
}

/**
 * Service for interacting with a MongoDB database.
 */
export class MongoService implements IMongoService {
  readonly #client: MongoClient | undefined
  readonly #dbName: string
  #db: Db | undefined = undefined

  constructor(readonly params: MongoServiceParams) {
    this.#client = params.mongoUri
      ? new MongoClient(params.mongoUri)
      : undefined
    this.#dbName = params.customDbName ?? DEFAULT_DB_NAME
  }

  async connect() {
    try {
      if (!this.#client) {
        console.log('MongoDB client not connected. Skipping connection.')

        return
      }

      await this.#client.connect()

      this.#db = this.#client.db(this.#dbName)
    } catch (error) {
      console.error('Error connecting to MongoDB:', error)
      throw error
    }
  }

  async disconnect() {
    if (!this.#client) {
      console.log('MongoDB client not connected. Skipping disconnection.')

      return
    }

    await this.#client.close()
    // TODO: Implement debug flag
    console.log('Disconnected from MongoDB')
  }

  #getCollection<T extends MongoDocument>(collectionName: string) {
    if (!this.#client) {
      console.log('MongoDB client not connected. Skipping collection.')

      return
    }

    if (!this.#db) {
      console.log('Database not connected. Call connect() first.')

      return
    }

    return this.#db.collection<T>(collectionName)
  }

  async insertOne<T extends MongoDocument>(
    collectionName: string,
    doc: OptionalUnlessRequiredId<T>
  ) {
    const collection = this.#getCollection<T>(collectionName)

    if (!collection) {
      return undefined
    }

    const result = await collection.insertOne(doc)
    return result.insertedId.toString()
  }

  // TODO: Add sanitization function
  async findOne<T extends MongoDocument>(
    collectionName: string,
    query: Filter<T>
  ) {
    const collection = this.#getCollection<T>(collectionName)

    if (!collection) {
      return undefined
    }

    return (await collection.findOne<T>(query)) ?? undefined
  }

  async find<T extends MongoDocument>(
    collectionName: string,
    query: Filter<T>
  ) {
    const collection = this.#getCollection<T>(collectionName)

    if (!collection) {
      return undefined
    }

    return await collection.find(query).toArray()
  }
}
