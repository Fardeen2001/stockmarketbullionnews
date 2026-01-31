# AI Agents System

This directory contains the modern AI agent system for StockMarket Bullion.

## Architecture

The system uses an agentic approach where specialized AI agents handle different tasks:

1. **ScrapingAgent** - Intelligent news scraping with vector-based deduplication
2. **TrendDetectionAgent** - Detects trending topics using vector clustering
3. **ContentGenerationAgent** - Generates articles using RAG (Retrieval Augmented Generation)

## Vector Database

Uses MongoDB Atlas Vector Search for efficient vector storage and similarity search:
- Stores embeddings directly in MongoDB documents
- Uses MongoDB's native vector search indexes
- Enables semantic search and deduplication
- Supports RSS feed embeddings
- No separate vector database needed

## Workflow

1. **Scraping** (Hourly)
   - ScrapingAgent scrapes from multiple sources
   - Generates embeddings for each item
   - Uses vector search to deduplicate
   - Stores in MongoDB with embeddings

2. **Trend Detection** (Every hour, 15 min past)
   - TrendDetectionAgent clusters recent content
   - Identifies trending topics using vector similarity
   - Calculates trending scores
   - Stores trends with embeddings

3. **Content Generation** (Every hour, 30 min past)
   - ContentGenerationAgent retrieves context using vector search
   - Uses RAG to generate high-quality articles
   - Stores articles with embeddings for future search

## Benefits

- **Better Deduplication**: Vector similarity catches near-duplicates
- **Semantic Search**: Find related content by meaning, not just keywords
- **RAG**: Articles are generated with relevant context from multiple sources
- **Scalable**: Vector database handles millions of embeddings efficiently
- **Intelligent**: Agents can make decisions and learn from context

## Usage

### Scraping Agent
```javascript
const agent = new ScrapingAgent();
await agent.initialize(apiKey);
const result = await agent.execute({
  sources: [...],
  maxItems: 100,
});
```

### Trend Detection Agent
```javascript
const agent = new TrendDetectionAgent();
await agent.initialize(apiKey);
const result = await agent.execute({
  hours: 24,
});
```

### Content Generation Agent
```javascript
const agent = new ContentGenerationAgent();
await agent.initialize(apiKey);
const result = await agent.execute({
  topic: 'TCS earnings',
  relatedSymbols: ['TCS'],
});
```

## Vector Search API

Search for similar news articles:
```
GET /api/news/search?q=gold price surge&limit=10
```

Returns articles ranked by semantic similarity.
