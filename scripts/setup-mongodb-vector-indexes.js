#!/usr/bin/env node

/**
 * MongoDB Vector Search Index Setup Script
 * 
 * This script helps you create vector search indexes in MongoDB Atlas
 * for semantic search functionality.
 * 
 * Usage:
 *   node scripts/setup-mongodb-vector-indexes.js
 * 
 * Note: This script provides the index definitions. You need to create
 * them manually in MongoDB Atlas UI or using MongoDB Compass.
 */

const indexDefinitions = {
  // News articles vector search index
  news: {
    name: 'news_vector_index',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 384, // Hugging Face all-MiniLM-L6-v2 model dimension
          similarity: 'cosine',
        },
      ],
    },
  },

  // Scraped content vector search index
  scraped: {
    name: 'scraped_vector_index',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 384,
          similarity: 'cosine',
        },
      ],
    },
  },

  // Trending topics vector search index
  trending: {
    name: 'trending_vector_index',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 384,
          similarity: 'cosine',
        },
      ],
    },
  },
};

console.log('MongoDB Atlas Vector Search Index Definitions\n');
console.log('='.repeat(60));
console.log('\nTo create these indexes in MongoDB Atlas:\n');
console.log('1. Go to MongoDB Atlas → Your Cluster → Atlas Search');
console.log('2. Click "Create Search Index"');
console.log('3. Select "JSON Editor"');
console.log('4. Use the definitions below for each collection\n');

Object.entries(indexDefinitions).forEach(([collection, config]) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Collection: ${collection}`);
  console.log(`Index Name: ${config.name}`);
  console.log(`\nJSON Definition:`);
  console.log(JSON.stringify(config.definition, null, 2));
  console.log(`\nSteps:`);
  console.log(`1. Select collection: ${collection}`);
  console.log(`2. Index name: ${config.name}`);
  console.log(`3. Paste the JSON definition above`);
  console.log(`4. Click "Next" and "Create Search Index"`);
});

console.log(`\n${'='.repeat(60)}`);
console.log('\nAlternative: Use MongoDB Compass or mongosh\n');
console.log('For mongosh, connect to your cluster and run:');
console.log('\nuse stockmarketbullion\n');

Object.entries(indexDefinitions).forEach(([collection, config]) => {
  console.log(`\n// Create index for ${collection} collection`);
  console.log(`db.${collection}.createSearchIndex(`);
  console.log(JSON.stringify(config.definition, null, 2));
  console.log(`);`);
});

console.log('\n' + '='.repeat(60));
console.log('\nNote: Vector Search requires MongoDB Atlas M10+ cluster');
console.log('Free tier (M0) does not support vector search indexes.');
console.log('You can still use the fallback cosine similarity search.');
