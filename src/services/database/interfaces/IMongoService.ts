import type {
  OptionalUnlessRequiredId,
  WithId,
  Document as MongoDocument
} from 'mongodb'

/**
 * Interface for a database service.
 */
export interface IMongoService {
  /**
   * Establishes a connection to the database.
   */
  connect(): Promise<void>

  /**
   * Closes the database connection.
   */
  disconnect(): Promise<void>

  /**
   * Inserts a single document into a collection.
   * @param collectionName The name of the collection to insert into.
   * @param document The document to insert.
   * @returns The ID of the inserted document.
   */
  insertOne<T extends MongoDocument>(
    collectionName: string,
    document: OptionalUnlessRequiredId<T>
  ): Promise<string | undefined>

  /**
   * Finds a single document in a collection.
   * @param collectionName The name of the collection to search.
   * @param query The query to filter documents.
   * @returns The found document, or null if not found.
   */
  findOne<T extends MongoDocument>(
    collectionName: string,
    query: object
  ): Promise<WithId<T> | undefined>

  /**
   * Finds multiple documents in a collection.
   * @param collectionName The name of the collection to search.
   * @param query The query to filter documents.
   * @returns An array of found documents.
   */
  find<T extends MongoDocument>(
    collectionName: string,
    query: object
  ): Promise<WithId<T>[] | undefined>
}
