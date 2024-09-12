import { MongoClient } from 'mongodb'
import type {
  Db,
  Filter,
  Document as MongoDocument,
  OptionalUnlessRequiredId
} from 'mongodb'
import type { IDatabaseService } from './interfaces/IDatabaseService'

const DEFAULT_DB_NAME = 'twitter-bot'

export interface MongoServiceParams {
  mongoUri: string
  customDbName?: string | undefined
}

/**
 * Service for interacting with a MongoDB database.
 */
export class MongoService implements IDatabaseService {
  readonly #client: MongoClient
  readonly #dbName: string
  #db: Db | undefined = undefined

  constructor(readonly params: MongoServiceParams) {
    this.#client = new MongoClient(params.mongoUri)
    this.#dbName = params.customDbName ?? DEFAULT_DB_NAME
  }

  // TODO: Maybe in constructor?
  async connect(): Promise<void> {
    try {
      await this.#client.connect()
      this.#db = this.#client.db(this.#dbName)
      console.log('Connected successfully to MongoDB')
    } catch (error) {
      console.error('Error connecting to MongoDB:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    await this.#client.close()
    // TODO: Implement debug flag
    console.log('Disconnected from MongoDB')
  }

  #getCollection<T extends MongoDocument>(collectionName: string) {
    if (!this.#db) {
      throw new Error('Database not connected. Call connect() first.')
    }

    return this.#db.collection<T>(collectionName)
  }

  async insertOne<T extends MongoDocument>(
    collectionName: string,
    doc: OptionalUnlessRequiredId<T>
  ) {
    const collection = this.#getCollection<T>(collectionName)
    const result = await collection.insertOne(doc)
    return result.insertedId.toString()
  }

  // TODO: Type validation
  async findOne<T extends MongoDocument>(
    collectionName: string,
    query: Filter<T>
  ) {
    const collection = this.#getCollection<T>(collectionName)

    return await collection.findOne(query)
  }

  async find<T extends MongoDocument>(
    collectionName: string,
    query: Filter<T>
  ) {
    const collection = this.#getCollection<T>(collectionName)
    return await collection.find(query).toArray()
  }
}
