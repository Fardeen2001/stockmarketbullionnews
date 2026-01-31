# AI Agents & Vector Database Guide

## Overview

StockMarket Bullion now uses a modern AI agent system with vector databases for intelligent content processing, deduplication, and generation.

## Architecture

### Components

1. **Vector Database (MongoDB Atlas Vector Search)**
   - Stores embeddings directly in MongoDB documents
   - Enables semantic search using MongoDB's native vector search
   - Handles deduplication
   - Supports millions of vectors
   - No separate vector database needed

2. **AI Agents**
   - **ScrapingAgent**: Intelligent scraping with vector-based deduplication
   - **TrendDetectionAgent**: Detects trends using vector clustering
   - **ContentGenerationAgent**: Generates articles using RAG

3. **Embeddings**
   - Uses Hugging Face `sentence-transformers/all-MiniLM-L6-v2`
   - 384-dimensional vectors
   - Fast and accurate semantic search

## Workflow

### 1. Scraping (Hourly - :00)
```
ScrapingAgent → Scrape Sources → Generate Embeddings → 
Vector Search (Deduplication) → Store in MongoDB + ChromaDB
```

### 2. Trend Detection (Hourly - :15)
```
TrendDetectionAgent → Cluster Content → Calculate Scores → 
Store Trending Topics with Embeddings
```

### 3. Article Generation (Hourly - :30)
```
ContentGenerationAgent → Retrieve Context (RAG) → 
Generate Article → Store with Embeddings
```

## API Endpoints

### New Endpoints

1. **`/api/cron/scrape-news-v2`** - Enhanced scraping with vector deduplication
2. **`/api/cron/detect-trends`** - AI-powered trend detection
3. **`/api/cron/generate-articles-v2`** - RAG-based article generation
4. **`/api/news/search`** - Semantic search for news articles

### Semantic Search

Search for articles by meaning, not just keywords:

```bash
GET /api/news/search?q=gold price surge&limit=10
```

Returns articles ranked by semantic similarity to your query.

## Configuration

### Environment Variables

```env
# Required
HUGGINGFACE_API_KEY=your_key

# Optional - ChromaDB
CHROMA_DB_PATH=./chroma_db  # Local path
CHROMA_REMOTE_URL=http://localhost:8000  # Remote ChromaDB
```

### For Vercel/Serverless

MongoDB Atlas Vector Search works perfectly in serverless:
1. Uses MongoDB Atlas (already configured)
2. No additional infrastructure needed
3. Automatic fallback to cosine similarity if indexes not available

## Benefits

### 1. Better Deduplication
- Vector similarity catches near-duplicates (85%+ similarity)
- Handles paraphrased content
- Reduces redundant articles

### 2. Semantic Search
- Find related content by meaning
- Better than keyword matching
- Understands context

### 3. RAG (Retrieval Augmented Generation)
- Articles generated with relevant context
- Multiple source perspectives
- More accurate and comprehensive

### 4. Trend Detection
- Clusters related content automatically
- Identifies trending topics
- Calculates trending scores

## Migration from Old System

The old endpoints still work:
- `/api/cron/scrape-news` (legacy)
- `/api/cron/generate-articles` (legacy)

New endpoints are recommended:
- `/api/cron/scrape-news-v2` (with vector deduplication)
- `/api/cron/generate-articles-v2` (with RAG)

## Performance

- **Embedding Generation**: ~100ms per text
- **Vector Search**: ~50ms for 10K vectors
- **Article Generation**: ~5-10s with RAG
- **Deduplication**: ~200ms per item

## Troubleshooting

### Vector Search not working
- Check if MongoDB Atlas Vector Search indexes are created
- See [MongoDB Vector Search Setup Guide](./docs/MONGODB_VECTOR_SEARCH_SETUP.md)
- System automatically falls back to cosine similarity if indexes unavailable

### Low similarity scores
- Check embedding model compatibility
- Ensure text is properly formatted
- Adjust similarity threshold (default: 0.7)

### Memory issues
- MongoDB Atlas handles vector storage automatically
- Limit batch sizes when processing large amounts of data
- Clear old embeddings periodically if needed

## Future Enhancements

1. **Multi-modal embeddings** (text + images)
2. **Fine-tuned models** for financial domain
3. **Real-time trend detection**
4. **Personalized recommendations**
5. **Multi-language support**

---

For technical details, see `lib/ai/agents/README.md`
