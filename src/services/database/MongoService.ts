import { MongoClient } from 'mongodb'
import type { Db, Collection, Filter, OptionalUnlessRequiredId } from 'mongodb'
import type { IDatabaseService } from './interfaces/IDatabaseService'

const DEFAULT_DB_NAME = 'twitter-bot'

interface MongoServiceParams {
  uri: string
  customDbName?: string
}

/**
 * Service for interacting with a MongoDB database.
 */
export class MongoService implements IDatabaseService {
  private client: MongoClient
  private dbName: string
  private db: Db | undefined = undefined

  constructor(private readonly params: MongoServiceParams) {
    this.client = new MongoClient(params.uri)
    this.dbName = params.customDbName ?? DEFAULT_DB_NAME
  }

  // TODO: Maybe in constructor?
  /**
   * Connects to the MongoDB database.
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect()
      this.db = this.client.db(this.dbName)
      console.log('Connected successfully to MongoDB')
    } catch (error) {
      console.error('Error connecting to MongoDB:', error)
      throw error
    }
  }

  /**
   * Disconnects from the MongoDB database.
   */
  async disconnect(): Promise<void> {
    await this.client.close()
    // TODO: Implement debug flag
    console.log('Disconnected from MongoDB')
  }

  /**
   * Gets a collection from the database.
   * @param collectionName The name of the collection to get.
   * @returns The collection.
   */
  private getCollection<T extends Document>(
    collectionName: string
  ): Collection<T> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db.collection<T>(collectionName)
  }

  /**
   * Inserts a single document into a collection.
   * @param collectionName The name of the collection to insert into.
   * @param doc The document to insert.
   * @returns The ID of the inserted document.
   */
  async insertOne<T extends Document>(
    collectionName: string,
    doc: OptionalUnlessRequiredId<T>
  ): Promise<string> {
    const collection = this.getCollection<T>(collectionName)
    const result = await collection.insertOne(doc)
    return result.insertedId.toString()
  }

  /**
   * Finds a single document in a collection.
   * @param collectionName The name of the collection to search.
   * @param query The query to filter documents.
   * @returns The found document, or null if not found.
   */
  async findOne<T extends Document>(collectionName: string, query: Filter<T>) {
    const collection = this.getCollection<T>(collectionName)

    return await collection.findOne(query)
  }

  /**
   * Finds multiple documents in a collection.
   * @param collectionName The name of the collection to search.
   * @param query The query to filter documents.
   * @returns An array of found documents.
   */
  async find<T extends Document>(collectionName: string, query: object) {
    const collection = this.getCollection<T>(collectionName)
    return await collection.find(query).toArray()
  }

  // async savePostedArticle(article: {
  //   url: string
  //   postedAt: Date
  // }): Promise<void> {
  //   await this.insertOne('postedArticles', article)
  // }

  // async getLastPostedArticleDate(): Promise<Date | null> {
  //   const lastArticle = await this.findOne<{ postedAt: Date }>(
  //     'postedArticles',
  //     { sort: { postedAt: -1 } }
  //   )
  //   return lastArticle ? lastArticle.postedAt : null
  // }
}
