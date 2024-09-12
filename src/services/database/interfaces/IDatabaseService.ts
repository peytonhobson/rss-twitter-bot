import type { OptionalUnlessRequiredId, WithId } from 'mongodb'

/**
 * Interface for a database service.
 */
export interface IDatabaseService {
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
  insertOne<T extends Document>(
    collectionName: string,
    document: OptionalUnlessRequiredId<T>
  ): Promise<string>

  /**
   * Finds a single document in a collection.
   * @param collectionName The name of the collection to search.
   * @param query The query to filter documents.
   * @returns The found document, or null if not found.
   */
  findOne<T extends Document>(
    collectionName: string,
    query: object
  ): Promise<WithId<T> | null>

  /**
   * Finds multiple documents in a collection.
   * @param collectionName The name of the collection to search.
   * @param query The query to filter documents.
   * @returns An array of found documents.
   */
  find<T extends Document>(
    collectionName: string,
    query: object
  ): Promise<WithId<T>[]>
}
