# API Infrastructure & Integration Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                   INTEGRATED SYSTEM ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────────┘

EXTERNAL SERVICES
├── Hugging Face (LLM & Embeddings)
├── MongoDB Atlas (Vector Search Database)
├── Unsplash (Image Generation)
├── Economic Times, Moneycontrol, LiveMint (RSS/Websites)
├── HalalStock.in (Sharia Compliance)
└── Optional: Humanizer API (Content Enhancement)
    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      VERCEL DEPLOYMENT                              │
├── Next.js Server (App Router)
├── Serverless Functions (Route Handlers)
├── Cron Jobs (Scheduled Tasks)
└── Edge Network (Global Distribution)
    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   API ENDPOINTS & ROUTES                            │
├── Cron Routes (Automated Workflows)
├── Public API Routes (Data Retrieval)
├── Admin Routes (Management)
└── Sitemap Routes (SEO)
    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                               │
├── MongoDB Collections
├── Vector Search Indexes
└── Real-time Updates
```

---

## Cron Job Routes

### 1. `/api/cron/update-stocks`
**Schedule**: 12:00 AM UTC Daily  
**Purpose**: Fetch and update current stock prices

**Process**:
```javascript
// Request
GET /api/cron/update-stocks
Header: Authorization: Bearer {CRON_SECRET}

// Response
{
  "success": true,
  "updated": 50,
  "failed": 0,
  "stocks": ["INFY", "TCS", "RELIANCE", ...],
  "timestamp": "2024-01-15T00:00:00Z"
}
```

**Implementation**:
- Fetches from Yahoo Finance API or NSE source
- Updates Stock collection with:
  - currentPrice
  - changePercent
  - marketCap
  - volume
  - lastUpdated

**Error Handling**:
- Failed updates logged but don't stop job
- Previous prices retained if update fails
- Returns partial success status

---

### 2. `/api/cron/update-metals`
**Schedule**: 03:00 AM UTC Daily  
**Purpose**: Update precious metals prices

**Data Coverage**:
- Gold
- Silver
- Platinum
- Palladium
- Rhodium
- Ruthenium

**Process**:
```javascript
// Request
GET /api/cron/update-metals
Header: Authorization: Bearer {CRON_SECRET}

// Response
{
  "success": true,
  "updated": 6,
  "metals": ["gold", "silver", "platinum", ...],
  "timestamp": "2024-01-15T03:00:00Z"
}
```

**Storage**:
- Metal collection with price history
- Track price changes over time
- Calculate daily/weekly/monthly trends

---

### 3. `/api/cron/scrape-news-v2`
**Schedule**: 06:00 AM UTC Daily  
**Purpose**: Scrape financial news from multiple sources

**Sources**:
- RSS feeds (Economic Times, Moneycontrol, LiveMint)
- Direct website scraping
- HalalStock.in (Sharia-compliant stocks)
- ❌ EXCLUDED: Reddit

**Process**:
```javascript
// Request
GET /api/cron/scrape-news-v2
Header: Authorization: Bearer {CRON_SECRET}

// Response
{
  "success": true,
  "total": 87,
  "processed": 85,
  "failed": 2,
  "bySource": {
    "rss": 40,
    "website": 35,
    "halalstock": 12
  },
  "symbols": ["INFY", "TCS", ...],
  "metals": ["gold", "silver"],
  "timestamp": "2024-01-15T06:00:00Z"
}
```

**Data Stored**:
```javascript
{
  title: string,
  content: string,
  summary: string,
  source: string,           // Domain
  sourceUrl: string,        // Full URL
  sourceType: string,       // 'rss' | 'website' | 'halalstock'
  relatedSymbols: [],       // Extracted stock symbols
  relatedMetals: [],        // Extracted metal names
  scrapedAt: Date,
  isProcessed: false,
  embedding: null,          // Added by trend detection
}
```

**Symbol Extraction**:
- Regex patterns for NSE/BSE codes
- 2-5 uppercase letters (INFY, TCS, RELIANCE)
- Normalized format (removes .NS/.BO suffix)

**Metal Extraction**:
- Comprehensive list matching
- Case-insensitive
- Deduplicated

---

### 4. `/api/cron/detect-trends`
**Schedule**: 09:00 AM UTC Daily  
**Purpose**: Detect trending topics using vector clustering

**Process**:
```javascript
// Request
GET /api/cron/detect-trends
Header: Authorization: Bearer {CRON_SECRET}

// Response
{
  "success": true,
  "trends": [
    {
      "topic": "Gold prices surge amid market uncertainty",
      "category": "metals",
      "trendingScore": 0.87,
      "mentionCount": 23,
      "sources": ["economictimes", "moneycontrol", "livemint"],
      "relatedSymbols": [],
      "relatedMetals": ["gold"],
      "embedding": [...768 floats...]
    },
    ...
  ],
  "clusters": 12,
  "timestamp": "2024-01-15T09:00:00Z"
}
```

**Algorithm**:
```
1. Retrieve recent unprocessed ScrapedContent (24h window)
   
2. For each item:
   - Generate embedding from title + content
   - Store embedding in MongoDB vector database
   
3. Cluster similar content:
   - Vector similarity threshold: 0.75
   - Use vector search to find related items
   - Merge into clusters (min size: 2 items)
   
4. Identify trends:
   - Calculate trend score (0-1):
     * Item count: 30%
     * Source diversity: 20%
     * Engagement: 30%
     * Recency: 20%
   - Filter: score > 0.5
   
5. Categorize:
   - Metals category (if relatedMetals present)
   - Stocks category (if relatedSymbols present)
   - Sharia category (if sharia-compliant stocks)
   
6. Store trends with embeddings
```

**Vector Database**:
- Documents stored with embedding: vector[768]
- vectorSearchText: topic name
- vectorUpdatedAt: timestamp
- Indexed for fast similarity search

**Output**:
- TrendingTopics collection updated
- Trends ready for article generation
- Embeddings available for context retrieval

---

### 5. `/api/cron/generate-articles-v2`
**Schedule**: 12:00 PM UTC Daily  
**Purpose**: Generate SEO-optimized articles from trending topics

**Trigger Logic**:
```
Input sources:
├─ TrendingTopics without articles
├─ UnprocessedScrapedContent (alternative)
└─ Topics flagged for generation
```

**Process**:
```javascript
// Request
GET /api/cron/generate-articles-v2
Header: Authorization: Bearer {CRON_SECRET}

// Response
{
  "success": true,
  "generated": 3,
  "skipped": 2,
  "errors": 0,
  "totalTopics": 5,
  "articles": [
    {
      "title": "Gold Prices Surge Amid Global Market Uncertainty",
      "slug": "gold-prices-surge-2024-01-15",
      "category": "metals"
    },
    ...
  ],
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Article Generation Pipeline**:

1. **Context Retrieval (RAG)**:
   ```
   Generate query embedding from topic
         ↓
   Vector search similar scraped content (15 results, threshold: 0.65)
   Vector search trending topics (5 results, threshold: 0.6)
   Vector search existing articles (5 results, threshold: 0.75)
         ↓
   Fetch real-time stock/metal prices
         ↓
   Compile context data with facts and trends
   ```

2. **LLM Generation**:
   ```
   Model: Mistral-7B-Instruct-v0.2 (via Hugging Face)
   Input: RAG prompt with context + SEO requirements
   Output: 600-800 word article (plain text)
   Parameters:
   - max_new_tokens: 1200
   - temperature: 0.75
   - top_p: 0.9
   - repetition_penalty: 1.2
   ```

3. **Content Humanization**:
   ```
   If humanizer available:
     - Use StealthWriter/Humanizer API
     - Process in chunks for quality
   Else:
     - Basic humanization (word variations)
   ```

4. **Metadata Generation**:
   ```
   - FAQs: 3-5 Q&A pairs
   - Tags: Category + topic tags
   - Entities: NER from content
   - Topics: Main topics covered
   - TL;DR: 2-3 sentence summary
   ```

5. **SEO Metadata**:
   ```
   - Meta Title: 50-60 characters (keyword-focused)
   - Meta Description: 150-160 characters
   - Keywords: Top 10 extracted
   - JSON-LD: Article schema for search engines
   ```

6. **Image & Links**:
   ```
   Image:
   - Query Unsplash API with topic + category
   - Generate alt text
   - Store image URL
   
   Internal Links:
   - Find related articles (vector similarity)
   - Inject naturally in content
   - Limit: 3-5 per article
   
   External Links:
   - Source citations from context
   - Authority websites
   - Limit: 3-5 per article
   ```

7. **Embedding Generation**:
   ```
   Generate vector embedding for:
   - Title + full content
   - Store in vector database
   - Enable future similarity search
   ```

**Storage**:
```javascript
{
  title: "Article Title",
  slug: "article-slug",
  content: "Full article text...",
  summary: "Brief summary...",
  category: "stocks|metals|sharia",
  
  // Metadata
  faqs: [ { question: "", answer: "" } ],
  tags: [],
  entities: [],
  topics: [],
  tldr: [],
  
  // SEO
  seoMetadata: {
    metaTitle: "...",
    metaDescription: "...",
    keywords: [],
    jsonLd: { ... }
  },
  
  // Media
  imageUrl: "...",
  imageAlt: "...",
  
  // Links
  internalLinks: [ { text: "", url: "", slug: "" } ],
  externalLinks: [ { text: "", url: "" } ],
  
  // Tracking
  embedding: [...768 floats...],
  trendingScore: 0.85,
  publishedAt: Date,
  isPublished: true
}
```

**Error Handling**:
- Embedding failure → Use zero vector (fallback)
- LLM failure → Use template-based generation
- Image API failure → Use generic image
- Humanizer failure → Skip humanization

---

### 6. `/api/cron/update-sharia`
**Schedule**: 12:00 AM UTC (Sundays only)  
**Purpose**: Update Sharia-compliant stock data

**Data Source**: HalalStock.in

**Process**:
```javascript
// Request
GET /api/cron/update-sharia
Header: Authorization: Bearer {CRON_SECRET}

// Response
{
  "success": true,
  "updated": 150,
  "compliantStocks": ["INFY", "TCS", ...],
  "timestamp": "2024-01-15T00:00:00Z"
}
```

**Compliance Checks**:
- Interest-bearing debt limits
- Cash ratio requirements
- Business activity restrictions
- Dividend purity standards

---

## Public API Routes

### Stock Data Endpoints

#### GET `/api/stocks`
**Purpose**: Retrieve all stocks

**Response**:
```javascript
{
  "stocks": [
    {
      "id": "...",
      "symbol": "INFY",
      "name": "Infosys",
      "currentPrice": 1850.50,
      "changePercent": 2.5,
      "marketCap": 765000000000,
      "pe_ratio": 28.5,
      "lastUpdated": "2024-01-15T00:00:00Z"
    }
  ],
  "count": 50
}
```

#### GET `/api/stocks/[symbol]`
**Purpose**: Get specific stock details

#### GET `/api/stocks/[symbol]/history`
**Purpose**: Get historical price data

---

### Metals Endpoints

#### GET `/api/metals`
**Purpose**: Retrieve all metals

#### GET `/api/metals/[type]`
**Purpose**: Get specific metal (gold, silver, platinum, etc.)

#### GET `/api/metals/[type]/history`
**Purpose**: Get historical metal prices

---

### News Endpoints

#### GET `/api/news`
**Purpose**: Retrieve published news articles

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category (stocks|metals|sharia)
- `search`: Search articles

**Response**:
```javascript
{
  "articles": [
    {
      "id": "...",
      "title": "Article Title",
      "slug": "article-slug",
      "content": "...",
      "summary": "...",
      "category": "stocks",
      "publishedAt": "2024-01-15T12:00:00Z",
      "imageUrl": "...",
      "trendingScore": 0.85
    }
  ],
  "total": 125,
  "page": 1,
  "pages": 13
}
```

#### GET `/api/news/[slug]`
**Purpose**: Get specific article

#### GET `/api/news/search`
**Purpose**: Full-text search articles

#### GET `/api/news/related/[slug]`
**Purpose**: Get related articles (vector similarity)

---

### Sharia Stocks Endpoint

#### GET `/api/sharia/stocks`
**Purpose**: List Sharia-compliant stocks

#### GET `/api/sharia/stocks/[symbol]`
**Purpose**: Get Sharia compliance details

---

### Sitemap Routes

#### GET `/news-sitemap.xml`
**Purpose**: Google News Sitemap

**Output**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>https://stockmarketbullion.com/news/article-slug</loc>
    <news:news>
      <news:publication>
        <news:name>StockMarket Bullion</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>2024-01-15T12:00:00+00:00</news:publication_date>
      <news:title>Article Title</news:title>
    </news:news>
  </url>
</urlset>
```

**Features**:
- Only includes articles from last 2 days
- W3C date format compliance
- Auto-updates on article publication
- Caching: 30 min + 15 min stale-while-revalidate

#### GET `/sitemap-index.xml`
**Purpose**: Main sitemap index

---

## Admin Routes

### Authentication

#### POST `/api/admin/login`
**Purpose**: Admin login

```javascript
// Request
{
  "email": "admin@example.com",
  "password": "secure_password"
}

// Response
{
  "success": true,
  "token": "jwt_token...",
  "user": { "id": "...", "email": "..." }
}
```

#### POST `/api/admin/logout`
**Purpose**: Logout admin

#### POST `/api/admin/verify`
**Purpose**: Verify authentication token

---

### News Management

#### POST `/api/admin/news/[id]`
**Purpose**: Update article

```javascript
{
  "title": "Updated Title",
  "content": "Updated content...",
  "isPublished": true,
  "tags": ["tag1", "tag2"]
}
```

#### DELETE `/api/admin/news/[id]`
**Purpose**: Delete article

---

## Admin Panels

### `/admin`
- Dashboard with stats
- Recent activity feed
- Generated articles count
- Engagement metrics

### `/admin/news`
- Browse all articles
- Edit/delete articles
- Bulk operations
- Search functionality

### `/admin/stocks`
- Stock price tracking
- Add/update stocks
- Price history charts

### `/admin/metals`
- Metal price tracking
- Real-time updates

### `/admin/trends`
- View detected trends
- Trend analytics
- Trend scoring details

### `/admin/scraped`
- View raw scraped content
- Mark as processed
- Review sources

### `/admin/settings`
- Configure data sources
- Update API keys
- Cron job scheduling

---

## Error Handling & Status Codes

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Not permitted |
| 404 | Not Found | Resource not found |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Unexpected error |

### Error Response Format

```javascript
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "error detail"
  }
}
```

---

## Rate Limiting

### API Endpoints

- **Cron Routes**: No limit (verified by secret)
- **Public API**: 100 requests/minute per IP
- **Search**: 50 requests/minute per IP
- **Admin API**: 200 requests/minute per user

### External Services

| Service | Limit | Handling |
|---------|-------|----------|
| Hugging Face | 1 req/sec | Queue, backoff |
| Unsplash | 50/hour | Cache, fallback |
| MongoDB | Depends on plan | Connection pooling |

---

## Caching Strategy

### Route Caching

```javascript
// Sitemaps
Cache-Control: public, s-maxage=1800, stale-while-revalidate=900

// Public article list
Cache-Control: public, s-maxage=300, stale-while-revalidate=60

// Individual articles
Cache-Control: public, s-maxage=3600, stale-while-revalidate=1800

// Stock/metal data
Cache-Control: public, s-maxage=600, stale-while-revalidate=300

// Cron routes
Cache-Control: no-cache, no-store, must-revalidate
```

### Database Caching

- Connection pooling: Up to 10 connections
- Query result caching: 5 minute TTL
- Embedding cache: In-memory

---

## Security Measures

### Authentication

- **Cron Routes**: Bearer token (CRON_SECRET)
- **Admin Routes**: JWT tokens with expiration
- **Public Routes**: Rate limiting + IP tracking

### Data Protection

- MongoDB encryption at rest
- HTTPS for all connections
- Input validation & sanitization
- SQL injection prevention (parameterized queries)

### CORS Configuration

```javascript
{
  origin: process.env.NEXT_PUBLIC_SITE_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}
```

---

## Monitoring & Logging

### Structured Logging

```javascript
// Format
{
  "timestamp": "2024-01-15T12:00:00Z",
  "level": "info|warn|error",
  "service": "cron-job-name",
  "message": "Description",
  "data": { ...details... }
}
```

### Metrics Tracked

- Articles generated per day
- Embeddings created
- Vector search queries
- API response times
- Error rates
- Database query times

### Alerting

- Cron job failures
- API errors (>5%)
- Database connection loss
- Vector search failures

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas setup with vector indexes
- [ ] Hugging Face API key verified
- [ ] Unsplash API key configured
- [ ] Cron jobs registered in Vercel
- [ ] Admin authentication tested
- [ ] Sitemap generation verified
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Monitoring enabled
- [ ] Backups scheduled
- [ ] SSL certificate valid

---

**Last Updated**: 2024
**Version**: 2.0
**Status**: Production Ready
