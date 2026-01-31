# MongoDB Vector Search Setup Guide

This guide explains how to set up MongoDB Atlas Vector Search for semantic search functionality in StockMarket Bullion.

## Overview

MongoDB Atlas Vector Search provides native vector search capabilities, eliminating the need for external vector databases like ChromaDB. Embeddings are stored directly in MongoDB documents and searched using MongoDB's aggregation pipeline.

## Prerequisites

1. **MongoDB Atlas Cluster** (M10 or higher recommended)
   - Free tier (M0) does not support vector search indexes
   - M10+ clusters support vector search
   - If using M0, the system will fall back to cosine similarity search

2. **Embedding Model**
   - Currently using: `sentence-transformers/all-MiniLM-L6-v2`
   - Vector dimension: 384
   - Similarity metric: cosine

## Setting Up Vector Search Indexes

### Method 1: MongoDB Atlas UI (Recommended)

1. **Navigate to Atlas Search**
   - Go to MongoDB Atlas → Your Cluster → "Atlas Search" tab
   - Click "Create Search Index"

2. **Create Index for News Collection**
   - Select collection: `news`
   - Choose "JSON Editor"
   - Index name: `news_vector_index`
   - Paste the following JSON:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    }
  ]
}
```

3. **Create Index for Scraped Content**
   - Collection: `scrapedContent`
   - Index name: `scraped_vector_index`
   - Same JSON definition as above

4. **Create Index for Trending Topics**
   - Collection: `trendingTopics`
   - Index name: `trending_vector_index`
   - Same JSON definition as above

5. **Wait for Index Creation**
   - Indexes take a few minutes to build
   - Status will show "Active" when ready

### Method 2: Using mongosh

Connect to your MongoDB Atlas cluster and run:

```javascript
use stockmarketbullion

// News collection
db.news.createSearchIndex({
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 384,
        "similarity": "cosine"
      }
    ]
  },
  "name": "news_vector_index"
})

// Scraped content collection
db.scrapedContent.createSearchIndex({
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 384,
        "similarity": "cosine"
      }
    ]
  },
  "name": "scraped_vector_index"
})

// Trending topics collection
db.trendingTopics.createSearchIndex({
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 384,
        "similarity": "cosine"
      }
    ]
  },
  "name": "trending_vector_index"
})
```

### Method 3: Using Setup Script

Run the provided script to get index definitions:

```bash
node scripts/setup-mongodb-vector-indexes.js
```

This will output the exact JSON definitions and instructions.

## How It Works

### Storing Embeddings

Embeddings are stored directly in MongoDB documents:

```javascript
{
  _id: ObjectId("..."),
  title: "Article Title",
  content: "Article content...",
  embedding: [0.123, 0.456, ...], // 384-dimensional vector
  vectorSearchText: "Article title and content for search",
  vectorUpdatedAt: ISODate("...")
}
```

### Searching

The system uses MongoDB's `$vectorSearch` aggregation stage:

```javascript
{
  $vectorSearch: {
    index: 'news_vector_index',
    path: 'embedding',
    queryVector: [0.123, 0.456, ...],
    numCandidates: 100,
    limit: 10
  }
}
```

### Fallback Mode

If vector search indexes are not available (e.g., M0 cluster), the system automatically falls back to cosine similarity search using JavaScript. This is slower but works on any MongoDB cluster.

## Verification

To verify indexes are working:

1. **Check Index Status**
   - Go to Atlas Search → Your Indexes
   - Status should be "Active"

2. **Test Vector Search**
   - The system will automatically use vector search if indexes exist
   - Check application logs for any fallback warnings

3. **Monitor Performance**
   - Vector search is much faster than fallback
   - Typical query time: < 100ms for 10K documents

## Troubleshooting

### "Index not found" errors

- **Cause**: Vector search index not created
- **Solution**: Create indexes using one of the methods above
- **Note**: System will use fallback search automatically

### Slow search performance

- **Cause**: Using fallback cosine similarity (M0 cluster)
- **Solution**: Upgrade to M10+ cluster for vector search indexes

### Embeddings not stored

- **Check**: Documents should have `embedding` field
- **Verify**: `vectorUpdatedAt` field indicates when embedding was added
- **Note**: Embeddings are generated automatically by AI agents

### Index build taking too long

- **Normal**: Large collections can take 10-30 minutes
- **Check**: Index status in Atlas Search UI
- **Wait**: Indexes build in background, don't block operations

## Benefits of MongoDB Vector Search

1. **Unified Database**: No separate vector database needed
2. **Native Integration**: Works seamlessly with existing MongoDB queries
3. **Scalable**: Handles millions of vectors efficiently
4. **Cost Effective**: No additional infrastructure costs
5. **Simple**: One database for all data and vectors

## Migration from ChromaDB

If you were using ChromaDB:

1. **No code changes needed**: The VectorDB interface remains the same
2. **Embeddings already in MongoDB**: Documents already have embedding fields
3. **Just create indexes**: Follow setup steps above
4. **Automatic fallback**: Works even without indexes

## Performance Comparison

| Method | Query Time (10K docs) | Setup Complexity |
|--------|----------------------|------------------|
| MongoDB Vector Search | < 100ms | Medium (index setup) |
| Fallback Cosine Search | 200-500ms | None (automatic) |
| ChromaDB (old) | 50-100ms | High (separate service) |

## Next Steps

1. Create vector search indexes (if using M10+ cluster)
2. Verify indexes are active
3. Test semantic search functionality
4. Monitor performance and adjust `numCandidates` if needed

For more information, see [MongoDB Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/).
