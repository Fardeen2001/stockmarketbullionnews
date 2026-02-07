# Comprehensive Automated Workflow for Financial News Platform

## Overview

This document outlines the complete automated workflow for the StockMarket Bullion news platform, which orchestrates multiple interconnected systems to detect trends, scrape data, generate embeddings, create SEO-optimized articles, and maintain search engine indexing.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATED WORKFLOW PIPELINE                  │
└─────────────────────────────────────────────────────────────────┘

    ↓

┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: DETECT TRENDS (09:00 AM UTC)                             │
│ (/api/cron/detect-trends)                                        │
│─────────────────────────────────────────────────────────────────│
│ • Analyzes scraped content from last 24 hours                    │
│ • Clusters similar content using vector embeddings              │
│ • Calculates trending scores based on:                          │
│   - Item count (mention frequency)                              │
│   - Source diversity                                            │
│   - Engagement metrics                                          │
│   - Recency factor                                              │
│ • Identifies 3 categories:                                       │
│   - Stock market trends                                         │
│   - Precious metals trends                                      │
│   - Sharia-compliant stocks trends                              │
│ • Stores embeddings in MongoDB Vector Database                  │
│ • Outputs: TrendingTopics collection with embeddings            │
└──────────────────────────────────────────────────────────────────┘

    ↓

┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: SCRAPE NEWS (06:00 AM UTC)                               │
│ (/api/cron/scrape-news-v2)                                      │
│─────────────────────────────────────────────────────────────────│
│ • Web scraping pipeline with multiple sources:                  │
│                                                                 │
│   A) EXCLUDED SOURCES:                                          │
│   • ❌ Reddit (explicitly excluded per requirements)            │
│                                                                 │
│   B) INCLUDED SOURCES:                                          │
│   • RSS Feeds (Economic Times, Moneycontrol, LiveMint)         │
│   • Website scraping (Economic Times, etc.)                    │
│   • HalalStock.in for Sharia-compliant stocks                  │
│                                                                 │
│ • Extraction methods:                                           │
│   - Playwright (browser automation for JS-heavy sites)         │
│   - Cheerio (HTML parsing for static content)                  │
│   - RSS Parser (for RSS feeds)                                 │
│                                                                 │
│ • Data extraction per source:                                  │
│   - Title, URL, summary                                        │
│   - Publication date                                           │
│   - Source metadata                                            │
│   - Symbol/metal extraction (regex-based)                      │
│                                                                 │
│ • Stores in: ScrapedContent collection                         │
│ • Outputs: Raw content ready for processing                    │
└──────────────────────────────────────────────────────────────────┘

    ↓

┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: GENERATE EMBEDDINGS                                      │
│ (Automatic in detect-trends & generate-articles workflows)      │
│─────────────────────────────────────────────────────────────────│
│ • Embedding Generation (via Hugging Face):                      │
│   - Model: Sentence transformers (768-dimension vectors)       │
│   - Input: Concatenated title + content/summary                │
│   - Output: Vector embeddings for semantic search               │
│                                                                 │
│ • Storage Strategy (All Research Data Embedded):                │
│   - Scraped content → ScrapedContent collection                │
│   - Trending topics → TrendingTopics collection                │
│   - Generated articles → News collection                       │
│                                                                 │
│ • Vector Database Integration:                                 │
│   - MongoDB Atlas Vector Search (primary)                      │
│   - Cosine similarity fallback                                 │
│   - Documents updated with:                                    │
│     * embedding: vector array                                  │
│     * vectorSearchText: searchable text                        │
│     * vectorUpdatedAt: timestamp                               │
│                                                                 │
│ • Indexing:                                                    │
│   - news_vector_index (on News collection)                     │
│   - scraped_vector_index (on ScrapedContent)                   │
│   - trending_vector_index (on TrendingTopics)                  │
└──────────────────────────────────────────────────────────────────┘

    ↓

┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: UPDATE PRICE DATA (Parallel Processes)                   │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│ A) Update Stocks (12:00 AM UTC)                                │
│    (/api/cron/update-stocks)                                   │
│    • Fetches current stock prices (NSE/BSE)                    │
│    • Updates Stock collection with latest data                 │
│    • Calculation fields: change%, market cap, PE ratio        │
│                                                                 │
│ B) Update Metals (03:00 AM UTC)                                │
│    (/api/cron/update-metals)                                   │
│    • Fetches precious metals prices                            │
│    • Updates Metal collection                                  │
│    • Covers: Gold, Silver, Platinum, Palladium, etc.          │
│                                                                 │
│ C) Update Sharia-Compliant Stocks (12:00 AM Sunday)           │
│    (/api/cron/update-sharia)                                   │
│    • Verifies stock compliance with Islamic finance rules      │
│    • Syncs with HalalStock.in data                             │
│    • Updates ShariahCompliantStocks collection                 │
│                                                                 │
│ Output: Stock/Metal/Sharia collections with current prices    │
└──────────────────────────────────────────────────────────────────┘

    ↓

┌──────────────────────────────────────────────────────────────────┐
│ STEP 5: GENERATE ARTICLES (12:00 PM UTC)                         │
│ (/api/cron/generate-articles-v2)                                │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│ TRIGGER LOGIC:                                                 │
│ • Input Source: Trending Topics OR Unprocessed Scraped Content │
│ • Processing topics that have NO articles yet                  │
│                                                                 │
│ ARTICLE GENERATION PROCESS (RAG Pattern):                      │
│                                                                 │
│ 1. Retrieve Context (Vector Search):                           │
│    • Query embedding: Generate from topic                      │
│    • Search embeddings database for:                           │
│      - Similar scraped content (15 results, 0.65 threshold)    │
│      - Related trending topics (5 results, 0.6 threshold)      │
│      - Existing articles (5 results, 0.75 threshold)           │
│    • Fetch real-time stock/metal data                          │
│    • Compile: facts, trends, stock prices, metal prices       │
│                                                                 │
│ 2. Generate Article with LLM (Meta Llama via Hugging Face):   │
│    • Model: Mistral-7B-Instruct-v0.2 (or compatible)          │
│    • Prompt: Comprehensive SEO-focused template with:         │
│      - Topic and context data                                  │
│      - Markdown headers (NO for output format)                │
│      - Internal linking strategy                               │
│      - External linking strategy                               │
│      - SEO optimization requirements                           │
│    • Output: 600-800 word article                              │
│    • Parameters:                                               │
│      - max_new_tokens: 1200                                    │
│      - temperature: 0.75 (balanced creativity)                │
│      - top_p: 0.9                                             │
│      - repetition_penalty: 1.2                                │
│                                                                 │
│ 3. Content Humanization:                                       │
│    • If humanizer available: Use StealthWriter/Humanizer API   │
│    • Fallback: Basic humanization (word variations)            │
│    • Goal: Make AI-generated content sound natural             │
│                                                                 │
│ 4. Metadata Generation:                                        │
│    • FAQs: 3-5 Q&A pairs derived from article                  │
│    • Tags: Category-based tags                                 │
│    • Entities: Named entity recognition (stocks, metals)       │
│    • Topics: Main topics covered                               │
│    • TL;DR: 2-3 sentence summary                              │
│                                                                 │
│ 5. SEO Metadata Generation:                                    │
│    • Meta Title: 50-60 characters                              │
│    • Meta Description: 150-160 characters                      │
│    • Keywords: Top 10 extracted keywords                       │
│    • JSON-LD Schema: Article schema for search engines        │
│                                                                 │
│ 6. Image Generation:                                           │
│    • Uses Unsplash API (or AI image generation)               │
│    • Query: Topic + category-based                            │
│    • Image alt text: Auto-generated                           │
│                                                                 │
│ 7. Link Processing:                                            │
│    • Internal links: Related articles in the platform          │
│    • External links: Source citations                          │
│    • Methods:                                                  │
│      a) AI-generated markers in content                        │
│      b) Automatic keyword-based linking                        │
│      c) Source-based external linking                          │
│                                                                 │
│ 8. Embedding Generation:                                       │
│    • Generate vector embedding for entire article              │
│    • Store in vector database for similarity search            │
│                                                                 │
│ STORAGE:                                                       │
│ • Stores in News collection with all metadata                  │
│ • Marks source trends/scraped content as processed             │
│ • Published immediately (isPublished: true)                    │
│                                                                 │
│ OUTPUT:                                                        │
│ • Complete articles with metadata                              │
│ • Ready for indexing and SEO                                   │
│ • Average: 1-5 articles per run                                │
└──────────────────────────────────────────────────────────────────┘

    ↓

┌──────────────────────────────────────────────────────────────────┐
│ STEP 6: UPDATE SITEMAP FOR SEO (Automatic)                      │
│ (/news-sitemap.xml/route.js & /sitemap-index.xml/route.js)    │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│ SITEMAP GENERATION:                                            │
│                                                                 │
│ A) News Sitemap (news-sitemap.xml):                            │
│    • Google News Sitemap specification compliant               │
│    • Dynamic content from News collection                      │
│    • Filter: Articles published in last 2 days                 │
│    • Limit: 1000 articles (Google limit)                       │
│    • Fields:                                                   │
│      - URL: /news/{slug}                                       │
│      - Publication date (W3C format)                           │
│      - Title                                                   │
│      - Publication name: "StockMarket Bullion"                │
│      - Language: "en"                                          │
│    • Cache: 30 min (s-maxage=1800)                            │
│    • Stale-while-revalidate: 15 min                            │
│                                                                 │
│ B) Index Sitemap (sitemap-index.xml):                          │
│    • References multiple sitemaps                              │
│    • Includes:                                                 │
│      - News sitemap                                            │
│      - Regular sitemap (stocks, metals pages)                  │
│      - Dynamic sitemap entries                                 │
│                                                                 │
│ SEARCH ENGINE INDEXING:                                        │
│ • Google Search Console integration:                           │
│   - Submit news sitemap for News indexing                      │
│   - Crawl stats monitoring                                     │
│   - Coverage reports                                           │
│                                                                 │
│ • Bing Webmaster Tools:                                        │
│   - Submit sitemaps                                            │
│   - Index coverage reports                                     │
│                                                                 │
│ • robots.txt:                                                  │
│   - Sitemap-index location                                     │
│   - Crawler directives                                         │
│                                                                 │
│ REVALIDATION STRATEGY:                                         │
│ • Cache articles for dynamic revalidation                      │
│ • Stale-while-revalidate: Serve cached while regenerating     │
│ • Ensures sitemap always includes latest articles              │
└──────────────────────────────────────────────────────────────────┘

---

## Cron Job Schedule

| Job | Time (UTC) | Frequency | Purpose |
|-----|-----------|-----------|---------|
| update-stocks | 12:00 AM | Daily | Refresh stock prices |
| update-metals | 03:00 AM | Daily | Refresh metal prices |
| scrape-news-v2 | 06:00 AM | Daily | Scrape latest news |
| detect-trends | 09:00 AM | Daily | Analyze & cluster content |
| generate-articles-v2 | 12:00 PM | Daily | Create SEO articles |
| update-sharia | 12:00 AM | Sundays | Update Sharia compliance |

---

## Data Flow & Storage

### Collections & Data Storage

```
MongoDB Collections:
├── Stocks
│   ├── symbol, currentPrice, changePercent
│   ├── marketCap, peRatio, volume
│   └── lastUpdated
│
├── Metals
│   ├── metalType, currentPrice, changePercent
│   ├── lastUpdated
│   └── priceHistory
│
├── ScrapedContent
│   ├── title, content, summary
│   ├── source, sourceUrl, sourceType
│   ├── relatedSymbols[], relatedMetals[]
│   ├── embedding (768-dim vector)
│   ├── vectorSearchText
│   ├── scrapedAt, isProcessed
│   └── engagement metrics
│
├── TrendingTopics
│   ├── topic, category
│   ├── relatedSymbols[], relatedMetals[]
│   ├── mentionCount, sources[]
│   ├── engagement, trendingScore
│   ├── embedding (768-dim vector)
│   ├── vectorSearchText
│   ├── articlesGenerated[]
│   └── detectedAt, peakTime
│
└── News
    ├── title, slug, content, summary
    ├── category, relatedSymbol, relatedMetalId
    ├── imageUrl, imageAlt
    ├── sources[], tldr[], faqs[]
    ├── tags[], entities[], topics[]
    ├── trendingScore
    ├── seoMetadata
    │   ├── metaTitle, metaDescription
    │   ├── keywords[], jsonLd
    │   └── canonicalUrl
    ├── internalLinks[], externalLinks[]
    ├── embedding (768-dim vector)
    ├── vectorSearchText
    ├── publishedAt, createdAt, updatedAt
    └── isPublished, viewCount
```

### Vector Search Configuration

**MongoDB Atlas Vector Search Indexes:**

1. **news_vector_index**
   - Path: `embedding`
   - Dimensions: 768
   - Similarity: cosine

2. **scraped_vector_index**
   - Path: `embedding`
   - Dimensions: 768
   - Similarity: cosine

3. **trending_vector_index**
   - Path: `embedding`
   - Dimensions: 768
   - Similarity: cosine

---

## Key Features & Capabilities

### 1. Trend Detection
- **Clustering Algorithm**: Vector similarity with configurable threshold (0.75)
- **Categories**: Stocks, Metals, Sharia-Compliant Stocks (automatically detected)
- **Scoring**: Multi-factor calculation (item count, source diversity, engagement, recency)
- **Output**: Topics ready for article generation

### 2. Web Scraping Pipeline
- **Excluded**: Reddit (as per requirements)
- **Included Sources**:
  - Economic Times RSS + Website
  - Moneycontrol RSS
  - LiveMint RSS
  - HalalStock.in (Sharia stocks)
- **Methods**: Playwright (JS), Cheerio (HTML), RSS Parser
- **Data**: Title, URL, summary, publication date, metadata

### 3. Embedding & Vector Database
- **Model**: Hugging Face sentence-transformers (768-dim)
- **Storage**: MongoDB Vector Search (primary), cosine similarity fallback
- **Coverage**: All research data (scraped content, trends, articles)
- **Updates**: Automatic with vector timestamps

### 4. Article Generation (RAG Pattern)
- **LLM**: Mistral-7B-Instruct via Hugging Face
- **Context Retrieval**: Vector search (embeddings)
- **Content**: 600-800 words, SEO-optimized
- **Metadata**: FAQs, tags, entities, TL;DR, JSON-LD
- **Links**: Internal (related articles) + external (sources)
- **Image**: Auto-sourced from Unsplash
- **Humanization**: StealthWriter/Humanizer API integration

### 5. SEO Optimization
- **Meta Tags**: Auto-generated title (50-60 chars), description (150-160 chars)
- **Keywords**: Top 10 extracted
- **JSON-LD**: Article schema for SERP rich snippets
- **Sitemap**: Google News Sitemap (2-day rolling window)
- **Caching**: Smart cache invalidation on publication

### 6. Publishing & Indexing
- **Publication**: Automatic (isPublished: true)
- **Indexing**: Real-time sitemap updates
- **SEO**: Sitemap-based crawl optimization
- **Freshness**: Recent content prioritized (2-day window)

---

## Configuration & Environment Variables

### Required Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database

# Hugging Face (for LLM & Embeddings)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxx

# Image Generation
UNSPLASH_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# Content Humanization (Optional)
HUMANIZER_API_KEY=xxx
HUMANIZER_PROVIDER=stealthwriter  # or other provider

# Website Configuration
NEXT_PUBLIC_SITE_URL=https://stockmarketbullion.com

# Reddit (Optional - used if specified, can be excluded)
REDDIT_CLIENT_ID=xxxx
REDDIT_CLIENT_SECRET=xxxx
REDDIT_USER_AGENT=StockMarketBullionNews/1.0

# Cron Authentication
CRON_SECRET=your-secure-secret-key
```

---

## Workflow Execution Timeline

### Daily Flow (IST - Indian Standard Time)

```
05:30 AM (00:00 UTC) - Stock Update
        └─ Fetch latest stock prices, update database

06:30 AM (01:00 UTC) - Metal Update
        └─ Fetch latest metal prices, update database

11:30 AM (06:00 UTC) - News Scraping
        └─ Scrape from RSS feeds, websites, HalalStock
        └─ Stores raw content with metadata
        └─ Extraction: Symbols, metals, summaries

02:30 PM (09:00 UTC) - Trend Detection
        └─ Cluster scraped content by similarity
        └─ Calculate trending scores
        └─ Identify 3 categories
        └─ Generate embeddings for all research data
        └─ Store trends with vectors

05:30 PM (12:00 UTC) - Article Generation
        └─ Retrieve context via vector search
        └─ Generate articles using LLM
        └─ Create metadata (FAQs, tags, SEO)
        └─ Generate images, links
        └─ Publish articles
        └─ Update sitemaps

### Weekly (Sunday)
05:30 AM (00:00 UTC) - Sharia Stock Update
        └─ Verify stock compliance
        └─ Update Islamic finance data
```

---

## Error Handling & Resilience

### Graceful Degradation
- **Embedding Failure**: Fallback to zero vector (allows processing to continue)
- **Vector Search Failure**: Fall back to cosine similarity algorithm
- **Playwright Failure**: Fallback to Cheerio (HTML parsing)
- **LLM Generation Failure**: Template-based article generation
- **Image API Failure**: Use placeholder or generic image
- **Humanizer Failure**: Use basic humanization

### Retry Logic
- **Transient Errors**: Automatic retry with exponential backoff
- **Network Timeouts**: 10-second timeout with retry
- **Rate Limiting**: Adaptive rate limiting for external APIs

### Monitoring & Logging
- Structured logging with timestamps
- Error tracking (source, message, stack)
- Success metrics (articles generated, embeddings created)
- Debug information in logs

---

## Performance Optimization

### Caching Strategy
- **Sitemap**: 30-minute cache + 15-minute stale-while-revalidate
- **Vector Search**: In-memory embedding cache
- **Database**: Connection pooling, indexes on frequently queried fields
- **Images**: Cached from Unsplash

### Batch Processing
- **Embeddings**: Batch generation (up to 10 per request)
- **Article Generation**: Process up to 5 topics per cron run
- **MongoDB**: Bulk write operations

### Rate Limiting
- **Hugging Face**: 1 request/second per endpoint
- **Unsplash**: 50 requests/hour
- **Reddit API**: Authenticated rate limit (60 requests/min)

---

## Future Enhancements

1. **Real-time Trending**: WebSocket updates for live trend detection
2. **Advanced NLP**: Named entity recognition for better linking
3. **Multi-language Support**: Translate articles to Hindi/other languages
4. **Fact-Checking Integration**: Validate data with external sources
5. **User Personalization**: Content recommendations based on preferences
6. **A/B Testing**: SEO optimization testing for titles/descriptions
7. **Advanced Analytics**: Track which articles drive the most engagement
8. **Social Media Integration**: Auto-post to Twitter, LinkedIn
9. **Premium Content**: Subscriber-only articles
10. **API Monetization**: Expose endpoints for third-party consumption

---

## Troubleshooting Guide

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No trends detected | No scraped content | Ensure scrape-news-v2 runs before detect-trends |
| Articles not generating | Vector search failing | Check MongoDB vector index creation |
| Low article quality | Poor context retrieval | Increase vector search threshold |
| Sitemap not updating | Cache not invalidating | Clear cache or wait 30 minutes |
| Embedding errors | Hugging Face API down | Use fallback zero vectors (automatic) |
| Images not loading | Unsplash quota exceeded | Check API limits or configure fallback |
| Slow scraping | Playwright browsers not installed | Use Cheerio fallback (automatic) |

---

## References

- [MongoDB Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- [Google News Sitemap Spec](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap)
- [Hugging Face Models](https://huggingface.co/models)
- [Retrieval Augmented Generation (RAG)](https://en.wikipedia.org/wiki/Retrieval-augmented_generation)
- [SEO Best Practices](https://developers.google.com/search/docs)

---

**Last Updated**: 2024
**Version**: 2.0
**Status**: Production Ready
