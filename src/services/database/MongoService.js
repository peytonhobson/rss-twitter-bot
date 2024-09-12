import { MongoClient } from 'mongodb';
const DEFAULT_DB_NAME = 'twitter-bot';
/**
 * Service for interacting with a MongoDB database.
 */
export class MongoService {
    params;
    client;
    dbName;
    db = undefined;
    constructor(params) {
        this.params = params;
        this.client = new MongoClient(params.mongoURI);
        this.dbName = params.customDbName ?? DEFAULT_DB_NAME;
    }
    // TODO: Maybe in constructor?
    /**
     * Connects to the MongoDB database.
     */
    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            console.log('Connected successfully to MongoDB');
        }
        catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }
    /**
     * Disconnects from the MongoDB database.
     */
    async disconnect() {
        await this.client.close();
        // TODO: Implement debug flag
        console.log('Disconnected from MongoDB');
    }
    /**
     * Gets a collection from the database.
     * @param collectionName The name of the collection to get.
     * @returns The collection.
     */
    getCollection(collectionName) {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db.collection(collectionName);
    }
    /**
     * Inserts a single document into a collection.
     * @param collectionName The name of the collection to insert into.
     * @param doc The document to insert.
     * @returns The ID of the inserted document.
     */
    async insertOne(collectionName, doc) {
        const collection = this.getCollection(collectionName);
        const result = await collection.insertOne(doc);
        return result.insertedId.toString();
    }
    // TODO: Type validation
    /**
     * Finds a single document in a collection.
     * @param collectionName The name of the collection to search.
     * @param query The query to filter documents.
     * @returns The found document, or null if not found.
     */
    async findOne(collectionName, query) {
        const collection = this.getCollection(collectionName);
        return await collection.findOne(query);
    }
    /**
     * Finds multiple documents in a collection.
     * @param collectionName The name of the collection to search.
     * @param query The query to filter documents.
     * @returns An array of found documents.
     */
    async find(collectionName, query) {
        const collection = this.getCollection(collectionName);
        return await collection.find(query).toArray();
    }
}
