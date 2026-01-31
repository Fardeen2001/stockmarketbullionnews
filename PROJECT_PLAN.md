# Stock Market & Bullion News Website - Detailed Implementation Plan

## Project Overview
A comprehensive news website focused on stock markets, precious metals (gold, silver, etc.), and Sharia-compliant stocks. The platform automatically aggregates, analyzes, and generates news content using AI, with full SEO optimization and ad monetization.

## Architecture Overview

### Tech Stack
- **Frontend/Backend**: Next.js 16+ (App Router) with React 19
- **Database**: MongoDB Atlas (Free Tier)
- **Vector Database**: ChromaDB (embedded) or MongoDB Atlas Vector Search
- **Scraping**: Playwright for dynamic content
- **AI/ML**: Hugging Face Transformers (free models) for content generation and embeddings
- **APIs**: 
  - Stocks: Alpha Vantage, Finnhub, Yahoo Finance (yfinance)
  - Metals: MetalpriceAPI, Gold-API.com
  - Images: Unsplash API, Pexels API
- **Charts**: Chart.js or Recharts
- **Hosting**: Vercel (free tier)
- **Cron Jobs**: Vercel Cron Functions

---

## Database Schema Design

### MongoDB Collections

#### 1. Stocks Collection
```javascript
{
  _id: ObjectId,
  symbol: String (unique, indexed), // e.g., "TCS", "RELIANCE"
  name: String, // Full company name
  exchange: String, // "NSE", "BSE", "NYSE", etc.
  sector: String,
  industry: String,
  description: String,
  imageUrl: String, // From Unsplash or generated
  currentPrice: Number,
  previousClose: Number,
  change: Number,
  changePercent: Number,
  marketCap: Number,
  peRatio: Number,
  volume: Number,
  high52Week: Number,
  low52Week: Number,
  priceHistory: [{
    date: Date,
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number
  }],
  fundamentals: {
    revenue: Number,
    profit: Number,
    debt: Number,
    equity: Number
  },
  lastUpdated: Date,
  isShariaCompliant: Boolean,
  shariaComplianceData: {
    source: String, // "halalstock.in"
    lastChecked: Date,
    complianceStatus: String, // "compliant", "non-compliant", "pending"
    debtRatio: Number,
    interestRatio: Number,
    haramBusinessRatio: Number
  }
}
```

#### 2. Metals Collection
```javascript
{
  _id: ObjectId,
  metalType: String, // "gold", "silver", "platinum", "palladium"
  unit: String, // "per_gram", "per_ounce", "per_kg"
  currentPrice: Number,
  currency: String, // "INR", "USD"
  change: Number,
  changePercent: Number,
  priceHistory: [{
    date: Date,
    price: Number,
    currency: String
  }],
  description: String,
  imageUrl: String,
  lastUpdated: Date
}
```

#### 3. News Articles Collection
```javascript
{
  _id: ObjectId,
  title: String (indexed),
  slug: String (unique, indexed),
  content: String, // AI-generated full article
  summary: String, // Short excerpt
  category: String, // "stocks", "metals", "sharia"
  relatedSymbol: String, // Stock symbol or metal type
  relatedStockId: ObjectId, // Reference to Stocks collection
  relatedMetalId: ObjectId, // Reference to Metals collection
  imageUrl: String,
  imageAlt: String,
  sources: [{
    url: String,
    domain: String,
    title: String,
    scrapedAt: Date
  }],
  trendingScore: Number, // Calculated based on mentions, engagement
  publishedAt: Date (indexed),
  createdAt: Date,
  updatedAt: Date,
  seoMetadata: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    ogImage: String
  },
  embedding: [Number], // Vector embedding for semantic search
  viewCount: Number,
  isPublished: Boolean
}
```

#### 4. Scraped Content Collection (Raw Data)
```javascript
{
  _id: ObjectId,
  source: String, // "reddit", "economic_times", "moneycontrol", etc.
  sourceUrl: String (unique),
  title: String,
  content: String,
  author: String,
  publishedAt: Date,
  scrapedAt: Date,
  category: String, // "stocks", "metals"
  relatedSymbols: [String], // Extracted stock symbols
  relatedMetals: [String], // Extracted metal types
  engagement: {
    upvotes: Number,
    comments: Number,
    shares: Number
  },
  isProcessed: Boolean,
  processedAt: Date
}
```

#### 5. Trending Topics Collection
```javascript
{
  _id: ObjectId,
  topic: String, // e.g., "TCS earnings", "Gold price surge"
  category: String,
  relatedSymbols: [String],
  relatedMetals: [String],
  mentionCount: Number,
  sources: [String], // List of source domains
  detectedAt: Date,
  peakTime: Date,
  articlesGenerated: [ObjectId], // References to News Articles
  embedding: [Number]
}
```

---

## Data Pipeline Architecture

### Phase 1: Data Collection (Hourly Cron Job)

#### Step 1.1: Stock Data Fetching
```
1. Fetch stock list (NSE/BSE top 500 stocks + global major stocks)
2. For each stock:
   - Call Alpha Vantage API (with rate limiting)
   - Fallback to yfinance if Alpha Vantage fails
   - Store price data, fundamentals
   - Update priceHistory array
3. Update MongoDB Stocks collection
4. Cache results to minimize API calls
```

#### Step 1.2: Metals Data Fetching
```
1. For each metal (gold, silver, platinum, palladium):
   - Call MetalpriceAPI or Gold-API
   - Fetch current price in INR and USD
   - Store in priceHistory
2. Update MongoDB Metals collection
```

#### Step 1.3: Sharia Compliance Check
```
1. Scrape halalstock.in using Playwright
2. Extract compliant stock list
3. Match with our Stocks collection
4. Update isShariaCompliant flag and shariaComplianceData
5. Run weekly (not hourly to avoid over-scraping)
```

### Phase 2: News Aggregation (Hourly Cron Job)

#### Step 2.1: Multi-Source Scraping
```
Sources to scrape:
- Reddit: r/IndianStockMarket, r/investing, r/Gold, r/Silver
- News Sites: Economic Times, Moneycontrol, Business Standard, Reuters India
- RSS Feeds: Financial news RSS feeds
- Stock Market Websites: NSE India, BSE India

For each source:
1. Use Playwright to load page
2. Extract headlines, content, timestamps
3. Identify related stocks/metals (NLP extraction)
4. Store in Scraped Content collection
```

#### Step 2.2: Trend Detection
```
1. Generate embeddings for all new scraped content
2. Use vector similarity to cluster related content
3. Identify trending topics:
   - High frequency mentions
   - Recent spike in engagement
   - Multiple source coverage
4. Store in Trending Topics collection
```

#### Step 2.3: Content Deduplication
```
1. Compare new scraped content with existing
2. Use embedding similarity (cosine similarity > 0.85)
3. Merge duplicate stories
4. Track source diversity
```

### Phase 3: AI Content Generation (Hourly Cron Job)

#### Step 3.1: Article Generation
```
For each trending topic:
1. Gather all related scraped content
2. Extract key facts, quotes, data points
3. Prompt LLM (Hugging Face model):
   - Input: Aggregated facts, stock/metal data
   - Output: SEO-optimized news article
   - Style: Objective, factual, financial journalism
4. Generate title, summary, full content
5. Create slug from title
```

#### Step 3.2: Image Generation
```
1. Query Unsplash API with relevant keywords
   - For stocks: company name, "stock market", "trading"
   - For metals: "gold", "silver", "bullion"
2. Select best matching image
3. Store imageUrl and imageAlt
4. Fallback to Pexels if Unsplash fails
```

#### Step 3.3: SEO Optimization
```
1. Generate meta title (max 60 chars)
2. Generate meta description (max 160 chars)
3. Extract keywords from content
4. Create structured data (JSON-LD) for Article schema
5. Generate Open Graph tags
```

#### Step 3.4: Vector Embedding
```
1. Generate embedding for article content
   - Use Sentence-Transformers (all-MiniLM-L6-v2)
2. Store in News Articles collection
3. Also store in ChromaDB/Vector DB for semantic search
```

#### Step 3.5: Publishing
```
1. Mark article as published
2. Set publishedAt timestamp
3. Link to related stock/metal
4. Trigger Next.js ISR revalidation
```

---

## Frontend Architecture

### Page Structure

#### 1. Homepage (`/`)
- Hero section with site description
- Quick links to 3 main sections
- Latest trending news preview
- Ad placement (top banner)

#### 2. Stocks Section (`/stocks`)
- **Main Page**: Grid of stock info cards
  - Filter by sector, exchange
  - Search functionality
  - Sort by price change, volume, market cap
- **Stock Detail Page** (`/stocks/[symbol]`)
  - Company overview
  - Interactive price chart (Chart.js)
  - Key metrics table
  - Recent news articles
  - Related stocks
  - Ad placement (sidebar)

#### 3. Metals Section (`/metals`)
- **Main Page**: Cards for each metal (gold, silver, etc.)
  - Current prices
  - 24h change
  - Quick chart preview
- **Metal Detail Page** (`/metals/[metalType]`)
  - Price history chart
  - Price in multiple currencies
  - Recent news
  - Market analysis
  - Ad placement

#### 4. Sharia Stocks Section (`/sharia`)
- **Main Page**: Only Sharia-compliant stocks
  - Same layout as stocks section
  - Compliance badge on each card
  - Filter by compliance score
- **Sharia Stock Detail Page** (`/sharia/[symbol]`)
  - All stock details
  - Sharia compliance breakdown
  - Compliance metrics visualization
  - Related Sharia news

#### 5. News Section (`/news`)
- **Main Page**: All news articles
  - Filter by category (stocks/metals/sharia)
  - Filter by date
  - Search functionality
- **News Detail Page** (`/news/[slug]`)
  - Full article content
  - Related articles (vector similarity)
  - Social share buttons
  - Comments section (optional)
  - Ad placements (multiple)

### Component Architecture

#### Reusable Components
1. **StockCard**: Displays stock info, price, change, mini chart
2. **MetalCard**: Displays metal info, price, change
3. **NewsCard**: Displays article preview, image, title, summary
4. **PriceChart**: Interactive chart component (Chart.js wrapper)
5. **AdUnit**: Google AdSense ad component
6. **SEOHead**: Dynamic SEO meta tags component
7. **Navigation**: Main nav with 3 sections
8. **Footer**: Links, disclaimers, sitemap

---

## API Routes Structure

### `/api/stocks`
- `GET /api/stocks` - List all stocks (with pagination, filters)
- `GET /api/stocks/[symbol]` - Get single stock details
- `GET /api/stocks/[symbol]/history` - Get price history

### `/api/metals`
- `GET /api/metals` - List all metals
- `GET /api/metals/[type]` - Get single metal details
- `GET /api/metals/[type]/history` - Get price history

### `/api/news`
- `GET /api/news` - List all news articles
- `GET /api/news/[slug]` - Get single article
- `GET /api/news/trending` - Get trending articles
- `GET /api/news/related/[slug]` - Get related articles (vector search)

### `/api/sharia`
- `GET /api/sharia/stocks` - List Sharia-compliant stocks
- `GET /api/sharia/stocks/[symbol]` - Get Sharia stock details

### `/api/cron` (Protected)
- `GET /api/cron/update-stocks` - Update stock data
- `GET /api/cron/update-metals` - Update metals data
- `GET /api/cron/scrape-news` - Run news scraping
- `GET /api/cron/generate-articles` - Generate AI articles
- `GET /api/cron/update-sharia` - Update Sharia compliance (weekly)

---

## Cron Job Schedule

### Vercel Cron Configuration (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/update-stocks",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/update-metals",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/scrape-news",
      "schedule": "0 * * * *"
    },
    {
      "path": "api/cron/generate-articles",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/update-sharia",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

---

## SEO Strategy

### On-Page SEO
1. **Meta Tags**: Dynamic title, description per page
2. **Structured Data**: JSON-LD for Article, Organization, BreadcrumbList
3. **Semantic HTML**: Proper use of `<article>`, `<section>`, `<header>`
4. **Image Optimization**: Next.js Image component with alt text
5. **Internal Linking**: Related articles, stock links
6. **URL Structure**: Clean, descriptive URLs (`/stocks/tcs`, `/news/gold-price-surge-india`)

### Technical SEO
1. **Sitemap**: Auto-generated XML sitemap (`/sitemap.xml`)
2. **Robots.txt**: Allow all crawlers, disallow `/api/*`
3. **Page Speed**: Optimize images, lazy load, code splitting
4. **Mobile Responsive**: Tailwind CSS responsive design
5. **HTTPS**: Vercel provides SSL automatically

### Content SEO
1. **Keywords**: Natural integration of "stock price India", "gold rate today", etc.
2. **Fresh Content**: Hourly updates ensure fresh content
3. **Long-form Articles**: AI generates 500-1000 word articles
4. **Local SEO**: Focus on Indian markets (NSE, BSE, INR prices)

---

## Ad Monetization Strategy

### Google AdSense Integration
1. **Ad Placements**:
   - Top banner (728x90) on all pages
   - Sidebar (300x250) on detail pages
   - In-article ads (responsive) between paragraphs
   - Bottom banner (728x90) on article pages

2. **Ad Component**:
   - React component with lazy loading
   - GDPR consent handling
   - Responsive ad units

3. **Revenue Optimization**:
   - High-traffic pages (homepage, trending news)
   - Multiple ad units on article pages
   - Native ad styling to match site design

---

## Security & Performance

### Security
1. **API Keys**: Store in environment variables
2. **Cron Protection**: Use Vercel Cron secret or API key auth
3. **Rate Limiting**: Implement rate limits on public APIs
4. **Input Validation**: Sanitize all user inputs
5. **CORS**: Configure properly for API routes

### Performance
1. **Caching**: 
   - Redis for API responses (optional, future)
   - Next.js ISR for static pages (revalidate: 3600)
   - CDN caching via Vercel
2. **Image Optimization**: Next.js Image with WebP
3. **Code Splitting**: Automatic with Next.js
4. **Database Indexing**: Index on frequently queried fields

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [x] Project setup and dependencies
- [ ] MongoDB connection and schemas
- [ ] Basic Next.js pages structure
- [ ] API routes for stocks/metals/news
- [ ] Environment configuration

### Phase 2: Data Integration (Week 2)
- [ ] Stock API integration (Alpha Vantage/yfinance)
- [ ] Metals API integration
- [ ] Database seeding with initial data
- [ ] Basic frontend components (cards, lists)

### Phase 3: Scraping Infrastructure (Week 3)
- [ ] Playwright setup
- [ ] Reddit API integration
- [ ] News site scrapers
- [ ] RSS feed parser
- [ ] Data storage pipeline

### Phase 4: AI Content Generation (Week 4)
- [ ] Hugging Face model integration
- [ ] Article generation prompts
- [ ] Image API integration (Unsplash/Pexels)
- [ ] SEO metadata generation
- [ ] Vector embedding generation

### Phase 5: Frontend Development (Week 5)
- [ ] Complete all page layouts
- [ ] Interactive charts
- [ ] Search and filtering
- [ ] Responsive design
- [ ] Navigation and routing

### Phase 6: Sharia Compliance (Week 6)
- [ ] HalalStock.in scraper
- [ ] Compliance data matching
- [ ] Sharia section frontend
- [ ] Compliance metrics display

### Phase 7: SEO & Ads (Week 7)
- [ ] SEO meta tags implementation
- [ ] Structured data (JSON-LD)
- [ ] Sitemap generation
- [ ] Google AdSense integration
- [ ] Performance optimization

### Phase 8: Cron Jobs & Automation (Week 8)
- [ ] Vercel Cron setup
- [ ] All cron job implementations
- [ ] Error handling and logging
- [ ] Monitoring and alerts

### Phase 9: Testing & Launch (Week 9)
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] SEO audit
- [ ] Content quality review
- [ ] Production deployment
- [ ] Google Search Console setup

---

## Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Stock APIs
ALPHA_VANTAGE_API_KEY=...
FINNHUB_API_KEY=...

# Metals APIs
METALPRICE_API_KEY=...
GOLD_API_KEY=...

# Image APIs
UNSPLASH_ACCESS_KEY=...
PEXELS_API_KEY=...

# AI/ML
HUGGINGFACE_API_KEY=...

# Reddit API
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...

# AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-...

# Cron Secret
CRON_SECRET=...

# App
NEXT_PUBLIC_SITE_URL=https://...
```

---

## Success Metrics

1. **Content**: 10-20 new articles per day
2. **Coverage**: 500+ stocks, 4+ metals
3. **Performance**: Lighthouse score >90
4. **SEO**: Index 1000+ pages in Google
5. **Traffic**: 5000+ daily visitors (MVP target)
6. **Revenue**: AdSense revenue from traffic

---

## Future Enhancements

1. **User Accounts**: Save favorite stocks, personalized news
2. **Alerts**: Price alerts, news notifications
3. **Portfolio Tracker**: Track user portfolios
4. **Advanced Analytics**: More detailed charts, technical indicators
5. **Mobile App**: React Native app
6. **Newsletter**: Daily/weekly email digest
7. **Social Features**: Comments, sharing, discussions
8. **Premium Tier**: Ad-free, advanced features

---

## Notes

- All APIs should use free tiers initially
- Implement proper error handling and fallbacks
- Cache aggressively to minimize API calls
- Monitor API rate limits
- Use TypeScript for better type safety (optional)
- Implement proper logging for debugging
- Set up error tracking (Sentry free tier)
