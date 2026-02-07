// Vector Database Service using MongoDB Atlas Vector Search
import { getDatabase } from '@/lib/db';

// Collection mapping for vector search
const COLLECTION_MAP = {
  news: 'news',
  scraped: 'scrapedContent',
  rss: 'scrapedContent', // RSS feeds stored in scrapedContent
  trending: 'trendingTopics',
};

// Vector search index names (must match indexes created in MongoDB Atlas)
const VECTOR_INDEX_MAP = {
  news: 'news_vector_index',
  scraped: 'scraped_vector_index',
  rss: 'scraped_vector_index',
  trending: 'trending_vector_index',
};

export class VectorDB {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.db = await getDatabase();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('VectorDB initialization error:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Add a single embedding to MongoDB
   * Embeddings are stored directly in the document
   * @param {string} collectionName - Collection name key
   * @param {string|ObjectId} id - Document ID (string or ObjectId)
   * @param {Array} embedding - Embedding vector array
   * @param {Object} metadata - Additional metadata
   * @param {string} text - Text for vector search
   */
  async addEmbedding(collectionName, id, embedding, metadata, text) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.db) {
        return false;
      }

      const collection = this.db.collection(COLLECTION_MAP[collectionName] || collectionName);
      const { ObjectId } = await import('mongodb');

      // Convert string ID to ObjectId if needed
      const documentId = typeof id === 'string' && ObjectId.isValid(id) 
        ? new ObjectId(id) 
        : id;

      // Update document with embedding if it exists, or create new one
      await collection.updateOne(
        { _id: documentId },
        {
          $set: {
            embedding: embedding,
            ...metadata,
            vectorSearchText: text, // Store text for vector search
            vectorUpdatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      return true;
    } catch (error) {
      console.error(`Error adding embedding to ${collectionName}:`, error.message);
      return false;
    }
  }

  /**
   * Add multiple embeddings to MongoDB
   */
  async addEmbeddings(collectionName, items) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.db) {
        return false;
      }

      const collection = this.db.collection(COLLECTION_MAP[collectionName] || collectionName);
      const { ObjectId } = await import('mongodb');

      // Prepare bulk operations
      const operations = items.map((item) => {
        // Convert string ID to ObjectId if needed
        const documentId = typeof item.id === 'string' && ObjectId.isValid(item.id)
          ? new ObjectId(item.id)
          : item.id;

        return {
          updateOne: {
            filter: { _id: documentId },
            update: {
              $set: {
                embedding: item.embedding,
                ...item.metadata,
                vectorSearchText: item.text,
                vectorUpdatedAt: new Date(),
              },
            },
            upsert: true,
          },
        };
      });

      if (operations.length > 0) {
        await collection.bulkWrite(operations);
      }

      return true;
    } catch (error) {
      console.error(`Error adding embeddings to ${collectionName}:`, error.message);
      return false;
    }
  }

  /**
   * Search for similar documents using MongoDB Vector Search
   * Uses $vectorSearch aggregation stage (MongoDB Atlas Vector Search)
   */
  async searchSimilar(collectionName, queryEmbedding, limit = 10, threshold = 0.7) {
    try {
      if (!this.initialized) {
        const initialized = await this.initialize();
        if (!initialized) return [];
      }

      if (!this.db) {
        return [];
      }

      const collection = this.db.collection(COLLECTION_MAP[collectionName] || collectionName);
      const indexName = VECTOR_INDEX_MAP[collectionName] || `${collectionName}_vector_index`;

      // MongoDB Atlas Vector Search aggregation pipeline
      const pipeline = [
        {
          $vectorSearch: {
            index: indexName,
            path: 'embedding', // Field containing the vector
            queryVector: queryEmbedding,
            numCandidates: limit * 10, // Number of candidates to consider (higher = more accurate, slower)
            limit: limit,
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            topic: 1,
            slug: 1,
            category: 1,
            content: 1,
            summary: 1,
            vectorSearchText: 1,
            publishedAt: 1,
            sourceUrl: 1,
            source: 1,
            scrapedAt: 1,
            embedding: 1,
            score: { $meta: 'vectorSearchScore' }, // Similarity score from MongoDB
          },
        },
        {
          $match: {
            score: { $gte: threshold }, // Filter by similarity threshold
          },
        },
      ];

      const results = await collection.aggregate(pipeline).toArray();

      // Format results to match expected structure (include source fields for scraped content)
      return results.map((doc) => ({
        id: doc._id.toString(),
        similarity: doc.score || 0,
        metadata: {
          title: doc.title || doc.topic,
          slug: doc.slug,
          category: doc.category,
          publishedAt: doc.publishedAt,
          sourceUrl: doc.sourceUrl,
          source: doc.source,
          scrapedAt: doc.scrapedAt,
        },
        text: doc.content || doc.summary || doc.vectorSearchText || doc.topic || '',
      }));
    } catch (error) {
      // If vector search index doesn't exist, fall back to cosine similarity search
      if (error.message?.includes('index') || error.message?.includes('vectorSearch')) {
        console.warn(`Vector search index not found for ${collectionName}, using fallback search`);
        return await this.fallbackSimilaritySearch(collectionName, queryEmbedding, limit, threshold);
      }
      console.error(`Error searching ${collectionName}:`, error.message);
      return [];
    }
  }

  /**
   * Fallback similarity search using cosine similarity
   * Used when vector search index is not available
   */
  async fallbackSimilaritySearch(collectionName, queryEmbedding, limit = 10, threshold = 0.7) {
    try {
      if (!this.db) {
        return [];
      }

      const collection = this.db.collection(COLLECTION_MAP[collectionName] || collectionName);

      // Get all documents with embeddings
      const documents = await collection
        .find({ embedding: { $exists: true, $ne: null } })
        .limit(1000) // Limit to prevent memory issues
        .toArray();

      if (documents.length === 0) {
        return [];
      }

      // Calculate cosine similarity for each document
      const similarities = documents
        .map((doc) => {
          if (!doc.embedding || !Array.isArray(doc.embedding)) {
            return null;
          }

          const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
          return {
            id: doc._id.toString(),
            similarity,
            metadata: {
              title: doc.title,
              slug: doc.slug,
              category: doc.category,
              publishedAt: doc.publishedAt,
              sourceUrl: doc.sourceUrl,
              source: doc.source,
              scrapedAt: doc.scrapedAt,
            },
            text: doc.content || doc.summary || doc.vectorSearchText || '',
          };
        })
        .filter((item) => item !== null && item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return similarities;
    } catch (error) {
      console.error(`Error in fallback similarity search:`, error.message);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Delete an embedding (remove embedding field from document)
   */
  async deleteEmbedding(collectionName, id) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.db) {
        return false;
      }

      const collection = this.db.collection(COLLECTION_MAP[collectionName] || collectionName);
      const { ObjectId } = await import('mongodb');

      // Convert string ID to ObjectId if needed
      const documentId = typeof id === 'string' && ObjectId.isValid(id)
        ? new ObjectId(id)
        : id;

      await collection.updateOne(
        { _id: documentId },
        {
          $unset: {
            embedding: '',
            vectorSearchText: '',
            vectorUpdatedAt: '',
          },
        }
      );

      return true;
    } catch (error) {
      console.error(`Error deleting embedding from ${collectionName}:`, error.message);
      return false;
    }
  }

  /**
   * Update an embedding
   */
  async updateEmbedding(collectionName, id, embedding, metadata, text) {
    try {
      return await this.addEmbedding(collectionName, id, embedding, metadata, text);
    } catch (error) {
      console.error(`Error updating embedding in ${collectionName}:`, error.message);
      return false;
    }
  }
}

// Singleton instance
let vectorDBInstance = null;

export function getVectorDB() {
  if (!vectorDBInstance) {
    vectorDBInstance = new VectorDB();
  }
  return vectorDBInstance;
}
