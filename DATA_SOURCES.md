# Data Sources & Scraping Pipeline

## Overview

This document details the data sources used in the StockMarket Bullion news platform, with explicit documentation of included and excluded sources per platform requirements.

---

## Data Sources Configuration

### EXCLUDED Sources

#### Reddit ❌

**Status**: Explicitly excluded from scraping pipeline
**Reason**: As per platform requirements
**Implementation**: The `scrapeReddit()` method exists in `NewsScraper` but is NOT called by the scraping pipeline

**Code Evidence**:
```javascript
// In lib/scrapers/newsScraper.js
// These methods exist but are NOT used:
async scrapeReddit(subreddit, limit = 10) { ... }
async scrapeRedditAPI(subreddit, limit = 10) { ... }

// In app/api/cron/scrape-news-v2/route.js
// Reddit sources are intentionally EXCLUDED:
const sources = [
  // NOTE: Reddit sources explicitly excluded
  // Uncomment lines below to enable (currently disabled per requirements)
  // ...NEWS_SOURCES.reddit.map(subreddit => ({
  //   type: 'reddit',
  //   subreddit,
  // })),
  
  // Only RSS and website sources are active:
  ...NEWS_SOURCES.rss.map(url => ({
    type: 'rss',
    url,
  })),
  ...NEWS_SOURCES.websites.map(site => ({
    type: 'website',
    url: site.url,
    selectors: site.selectors,
  })),
];
```

**Note**: If Reddit inclusion is needed in the future:
1. Uncomment Reddit sources in `/api/cron/scrape-news-v2/route.js`
2. Ensure REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are configured
3. Subreddits to monitor are predefined in `NEWS_SOURCES.reddit`

---

### INCLUDED Sources

#### 1. RSS Feeds ✅

**Status**: Active and primary source
**Scraper Method**: RSS Parser
**Advantage**: Fast, reliable, standardized format
**No JavaScript Rendering Required**: Ideal for serverless environments

**Configured Feeds**:

```javascript
// lib/scrapers/newsScraper.js
export const NEWS_SOURCES = {
  rss: [
    'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    'https://www.moneycontrol.com/rss/business.xml',
    'https://www.livemint.com/rss/markets',
  ],
};
```

**Data Extracted per Feed**:
- Title
- URL/Link
- Summary/Content snippet
- Publication date
- Source domain

**Update Frequency**: Daily (6:00 AM UTC via `/api/cron/scrape-news-v2`)

**Example Feed Details**:

| Feed | Source | Content Type | Update Frequency |
|------|--------|--------------|------------------|
| economictimes.indiatimes.com | Economic Times | Financial news | Real-time |
| moneycontrol.com | Moneycontrol | Stock market, investments | Real-time |
| livemint.com | LiveMint | Markets, business | Real-time |

---

#### 2. Website Scraping ✅

**Status**: Active for direct website content
**Scraper Method**: 
- Primary: Playwright (for JavaScript-heavy sites)
- Fallback: Cheerio (HTML parsing for static sites)

**Configured Websites**:

```javascript
export const NEWS_SOURCES = {
  websites: [
    {
      url: 'https://economictimes.indiatimes.com/markets/stocks',
      selectors: {
        article: 'article, .newsItem, .story',
        title: 'h2, h3, .title, .headline',
        link: 'a',
        summary: '.summary, .excerpt, p',
        date: '.date, time',
      },
    },
    // Add more websites as needed
  ],
};
```

**Data Extraction Process**:

1. **Navigation**: Visit website URL with Playwright
2. **DOM Parsing**: Query selectors for article elements
3. **Data Extraction**: Pull title, link, summary, date
4. **URL Resolution**: Convert relative URLs to absolute
5. **Storage**: Store with source metadata

**Selector Strategy**:
- Multiple selector options for resilience
- Falls back to next selector if first fails
- Example: `article, .newsItem, .story` tries article tags first, then class-based selectors

**Methods**:
- **Playwright**: `scrapeNewsSite()` - Full DOM control, handles dynamic content
- **Cheerio (Fallback)**: `scrapeNewsSiteCheerio()` - Lightweight HTML parsing

---

#### 3. HalalStock.in - Sharia-Compliant Stocks ✅

**Status**: Active for Islamic finance compliance
**Source**: HalalStock.in
**Purpose**: Track Sharia-compliant stocks

**Data Extracted**:
- Stock symbol
- Company name
- Compliance status
- Category/sector

**Scraper Methods**:
```javascript
async scrapeHalalStock() { ... }          // Playwright method
async scrapeHalalStockCheerio() { ... }  // Cheerio fallback
```

**Integration**:
- Runs automatically as part of scraping pipeline
- Feeds into stock symbol extraction
- Marks articles with Sharia compliance data
- Used by `update-sharia` cron job (Sundays)

---

## Symbol & Metal Extraction

### Stock Symbol Extraction

**Process**: Regex-based pattern matching on all scraped content

**Patterns Matched**:
```javascript
// lib/scrapers/newsScraper.js
extractStockSymbols(text) {
  const patterns = [
    /\b([A-Z]{2,5})\b/g,        // 2-5 uppercase letters (e.g., INFY)
    /\b([A-Z]{2,5}\.NS)\b/g,    // NSE format (e.g., INFY.NS)
    /\b([A-Z]{2,5}\.BO)\b/g,    // BSE format (e.g., INFY.BO)
  ];
}
```

**Examples Extracted**:
- INFY (Infosys)
- TCS (Tata Consultancy Services)
- RELIANCE (Reliance Industries)
- WIPRO (Wipro Limited)

**Storage**: 
- Stored in `relatedSymbols[]` array in ScrapedContent
- Used for trend detection clustering
- Linked to article generation context

### Metal Type Extraction

**Process**: Text-based pattern matching with comprehensive metal list

**Supported Metals**:

```javascript
// lib/scrapers/newsScraper.js
extractMetalTypes(text) {
  const metals = [
    // Precious metals
    'gold', 'silver', 'platinum', 'palladium', 'rhodium', 
    'ruthenium', 'iridium', 'osmium',
    
    // Industrial metals
    'copper', 'aluminum', 'aluminium', 'zinc', 'nickel', 
    'lead', 'tin',
    
    // Other metals
    'iron', 'steel', 'titanium', 'tungsten', 'molybdenum', 
    'cobalt', 'lithium', 'uranium',
    
    // Alloys
    'bronze', 'brass', 'stainless steel'
  ];
}
```

**Storage**:
- Stored in `relatedMetals[]` array in ScrapedContent
- Used for metals trend category detection
- Linked to article generation for metals category

---

## Data Processing Pipeline

### 1. Raw Data Collection

```
Sources: RSS + Websites + HalalStock
    ↓
ScrapedContent Collection
    ├─ title, content, summary
    ├─ source, sourceUrl, sourceType
    ├─ scrapedAt: timestamp
    └─ isProcessed: false
```

### 2. Data Enrichment

```
ScrapedContent Records
    ↓
Symbol/Metal Extraction → relatedSymbols[], relatedMetals[]
    ↓
Embedding Generation → embedding: vector[768]
    ↓
Vector Database Storage → searchable by similarity
```

### 3. Trend Detection

```
Enriched ScrapedContent
    ↓
Clustering by Similarity → vector-based clustering
    ↓
Category Detection → stocks/metals/sharia
    ↓
Scoring → trendingScore calculation
    ↓
TrendingTopics Collection
    ├─ topic: string
    ├─ category: 'stocks'|'metals'|'sharia'
    ├─ relatedSymbols[], relatedMetals[]
    ├─ embedding: vector[768]
    └─ articlesGenerated: []
```

### 4. Article Generation

```
TrendingTopics
    ↓
Vector Search Context Retrieval
    ├─ Similar scraped content (facts)
    ├─ Related trends
    ├─ Existing articles (avoid duplication)
    └─ Stock/metal current prices
    ↓
LLM Article Generation
    ↓
Metadata Generation (FAQs, tags, entities, TL;DR, JSON-LD)
    ↓
SEO Optimization (title, description, keywords)
    ↓
Image & Link Processing
    ↓
Embedding Generation → News Collection
    ↓
Automatic Publication
```

---

## Data Quality & Validation

### Input Validation

**Scraped Content**:
- Title length: 10-500 characters
- Content/Summary: Not empty
- Source URL: Valid HTTP(S) URL
- Publication date: Valid ISO date or current time

### Processing Validation

**Embeddings**:
- Vector dimensions: 768
- All elements are numbers
- Fallback: Zero vector if generation fails

**Symbols**:
- Alphabetic characters only
- 2-5 characters (NSE/BSE standard)
- Upper case (normalized)

**Metals**:
- Matched against comprehensive metal list
- Case-insensitive matching
- Deduplicated before storage

---

## Performance Characteristics

### Scraping Speed

| Source Type | Method | Speed | Reliability |
|-------------|--------|-------|-------------|
| RSS Feeds | RSS Parser | ~100ms/feed | Very High |
| Websites (Static) | Cheerio | ~1-2s/site | High |
| Websites (Dynamic) | Playwright | ~5-10s/site | Very High |
| HalalStock | Playwright→Cheerio | ~3-5s | High |

### Volume Metrics

**Daily Scraping**:
- Target: 100+ articles/day
- RSS feeds: 30-40 articles
- Website scraping: 30-40 articles
- HalalStock: 10-20 entries
- Total stored: 70-100 with metadata

### Storage

**ScrapedContent Collection**:
- Document size: ~2-5 KB per record
- Embedding size: ~3 KB (768 floats)
- Daily growth: ~0.5-1 MB

---

## Configuration Instructions

### Adding New RSS Feed

```javascript
// In lib/scrapers/newsScraper.js
export const NEWS_SOURCES = {
  rss: [
    'https://existing-feed.com/rss',
    'https://new-feed.com/rss',  // Add here
  ],
};
```

### Adding New Website

```javascript
export const NEWS_SOURCES = {
  websites: [
    {
      url: 'https://newssite.com/markets',
      selectors: {
        article: 'article, div.news-item',
        title: 'h2, h3.headline',
        link: 'a.article-link',
        summary: 'p.excerpt',
        date: 'time, span.date',
      },
    },
  ],
};
```

### Enabling Reddit (If Needed)

```javascript
// In app/api/cron/scrape-news-v2/route.js
const sources = [
  // Uncomment to enable Reddit:
  ...NEWS_SOURCES.reddit.map(subreddit => ({
    type: 'reddit',
    subreddit,
  })),
  
  // Keep RSS and websites active:
  ...NEWS_SOURCES.rss.map(url => ({
    type: 'rss',
    url,
  })),
];
```

---

## Compliance & Regulations

### Data Attribution
- All sources credited in article metadata
- Source links included for transparency
- Original content properly cited

### Copyright
- Using publicly available news feeds
- No content replication (articles are regenerated)
- Original sources linked and credited

### Rate Limiting
- Respectful scraping with delays
- User-agent identification
- No automated DDoS-like behavior

---

## Troubleshooting

### No Data Being Scraped

1. Check environment variables are set
2. Verify cron job is running (check logs)
3. Ensure RSS feeds are accessible
4. Check MongoDB connection

### Symbols/Metals Not Extracted

1. Verify extraction regex patterns match your data
2. Check symbol format (NSE/BSE codes)
3. Metal names must match list exactly (case-insensitive)
4. Review sample scraped content in MongoDB

### Website Scraping Failing

1. Try Cheerio fallback (automatic, no action needed)
2. Verify CSS selectors are correct for target site
3. Check if site structure has changed
4. Add new selectors if needed

---

**Last Updated**: 2024
**Version**: 2.0
**Status**: Production Ready
