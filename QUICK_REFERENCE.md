# Quick Reference Guide

## Workflow at a Glance

```
12:00 AM → update-stocks (fetch stock prices)
03:00 AM → update-metals (fetch metal prices)
06:00 AM → scrape-news-v2 (collect from RSS + websites, EXCLUDE Reddit)
09:00 AM → detect-trends (cluster by vectors, generate embeddings)
12:00 PM → generate-articles-v2 (create SEO articles with metadata)
         → update-sitemap (auto-updates for indexing)
         
Sunday 12:00 AM → update-sharia (Sharia-compliant stocks)
```

---

## Key Data Sources

✅ **INCLUDED**:
- Economic Times RSS + Website
- Moneycontrol RSS
- LiveMint RSS
- HalalStock.in (Sharia stocks)

❌ **EXCLUDED**:
- Reddit (explicitly excluded per requirements)

---

## The 6-Step Process

### 1️⃣ Detect Trends (09:00 AM)
- Input: Last 24 hours of scraped content
- Process: Vector clustering (threshold: 0.75)
- Output: TrendingTopics with 3 categories (stocks/metals/sharia)
- Embeddings: All data stored with vectors for future search

### 2️⃣ Scrape News (06:00 AM)
- Input: RSS feeds + websites
- Process: Extract title, content, summary, metadata
- Output: ScrapedContent with symbols & metals extracted
- Exclusion: Reddit is not scraped

### 3️⃣ Generate Embeddings (Automatic)
- Input: Title + content
- Process: Hugging Face sentence transformers (768-dim)
- Output: Vector stored in MongoDB with metadata
- Fallback: Zero vector if generation fails

### 4️⃣ Retrieve Context (Part of Article Generation)
- Input: Trending topic
- Process: Vector search similar scraped content (RAG)
- Output: Facts, trends, stock prices, metal prices
- Similarity: 0.65+ for scraped, 0.6+ for trends, 0.75+ for articles

### 5️⃣ Generate Articles (12:00 PM)
- Input: TrendingTopic + retrieved context
- Process: LLM (Mistral-7B) generates 600-800 word article
- Output: Article + metadata (FAQs, tags, SEO, JSON-LD)
- Quality: Humanized content, natural links, images included

### 6️⃣ Update Sitemap (Automatic)
- Input: Published articles
- Process: Generate Google News Sitemap (48h rolling window)
- Output: XML sitemap for search engines
- Update: Real-time on article publication

---

## Database Collections

| Collection | Purpose | Key Fields |
|------------|---------|-----------|
| Stocks | Stock data | symbol, price, change%, embedding |
| Metals | Metal prices | metalType, price, change%, embedding |
| ScrapedContent | Raw data | title, content, symbols, metals, embedding |
| TrendingTopics | Detected trends | topic, category, score, embedding |
| News | Generated articles | title, slug, content, SEO metadata, embedding |
| ShariahCompliantStocks | Islamic finance | symbol, compliance status |

---

## Vector Search Details

**Model**: Hugging Face sentence-transformers  
**Dimensions**: 768  
**Storage**: MongoDB Atlas Vector Search  
**Indexes**: `news_vector_index`, `scraped_vector_index`, `trending_vector_index`

```javascript
// Search example
const results = await vectorDB.searchSimilar(
  'scraped',           // Collection
  queryEmbedding,      // Vector [768 floats]
  15,                  // Max results
  0.65                 // Similarity threshold
);
```

---

## Article Generation Process

```javascript
1. Generate topic embedding
   ↓
2. Vector search for similar content (RAG)
   - Scraped content (15 results, 0.65 threshold)
   - Trends (5 results, 0.6 threshold)  
   - Existing articles (5 results, 0.75 threshold)
   - Real-time stock/metal prices
   ↓
3. LLM generates article (Mistral-7B)
   Parameters:
   - max_tokens: 1200
   - temperature: 0.75
   - top_p: 0.9
   - repetition_penalty: 1.2
   ↓
4. Humanize content (StealthWriter or basic)
   ↓
5. Generate metadata
   - FAQs (3-5 Q&A)
   - Tags, entities, topics, TL;DR
   - SEO: Meta title/description, keywords
   - JSON-LD schema for search engines
   ↓
6. Process links
   - Internal: Related articles (vector similarity)
   - External: Source citations
   ↓
7. Generate image (Unsplash)
   ↓
8. Generate embedding for article
   ↓
9. Publish (isPublished: true)
   ↓
10. Sitemap auto-updates
```

---

## SEO Metadata

**Auto-Generated Per Article**:
- Meta Title: 50-60 characters (keyword-optimized)
- Meta Description: 150-160 characters
- Keywords: Top 10 extracted from content
- JSON-LD: Article schema for SERP rich snippets
- Canonical URL: Self-referential
- Publication date: ISO 8601 format

**Sitemap Integration**:
```xml
<url>
  <loc>https://site.com/news/article-slug</loc>
  <news:news>
    <news:publication>
      <news:name>StockMarket Bullion</news:name>
      <news:language>en</news:language>
    </news:publication>
    <news:publication_date>2024-01-15T12:00:00+00:00</news:publication_date>
    <news:title>Article Title</news:title>
  </news:news>
</url>
```

---

## API Routes Summary

### Cron Routes (Automated)
- `GET /api/cron/update-stocks` - Daily 12:00 AM
- `GET /api/cron/update-metals` - Daily 03:00 AM
- `GET /api/cron/scrape-news-v2` - Daily 06:00 AM
- `GET /api/cron/detect-trends` - Daily 09:00 AM
- `GET /api/cron/generate-articles-v2` - Daily 12:00 PM
- `GET /api/cron/update-sharia` - Sunday 12:00 AM

### Public API
- `GET /api/stocks` - All stocks
- `GET /api/stocks/[symbol]` - Single stock
- `GET /api/metals` - All metals
- `GET /api/metals/[type]` - Single metal
- `GET /api/news` - Articles list
- `GET /api/news/[slug]` - Single article
- `GET /api/news/search` - Search articles
- `GET /api/sharia/stocks` - Sharia-compliant stocks

### Sitemaps
- `GET /news-sitemap.xml` - Google News Sitemap
- `GET /sitemap-index.xml` - Sitemap index

---

## Environment Variables Required

```bash
# Core
MONGODB_URI=mongodb+srv://...
HUGGINGFACE_API_KEY=hf_...
NEXT_PUBLIC_SITE_URL=https://stockmarketbullion.com
CRON_SECRET=your-secure-key

# Optional
UNSPLASH_ACCESS_KEY=...
HUMANIZER_API_KEY=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
```

---

## Error Recovery

| Failure | Fallback | Action |
|---------|----------|--------|
| Embedding fails | Zero vector | Article still published |
| Vector search fails | Cosine similarity | Context still retrieved |
| LLM fails | Template article | Manual review needed |
| Image fails | Generic image | Placeholder used |
| Humanizer fails | Basic humanization | Continue process |

---

## Performance Metrics

| Operation | Speed | Volume |
|-----------|-------|--------|
| Scraping RSS | ~100ms/feed | 30-40 articles |
| Website scraping | 1-10s/site | 30-40 articles |
| Embedding generation | ~100ms each | Batch enabled |
| Vector search | ~50ms | 15-20 results |
| LLM generation | 5-30s | 1 article |
| Total pipeline | ~1-2 min | 1-5 articles |
| Daily output | - | 70-100 articles |

---

## Monitoring Checklist

- [ ] All cron jobs completed
- [ ] Article count > 0 for the day
- [ ] No embedding failures
- [ ] Sitemap updated
- [ ] Vector search working
- [ ] No database errors
- [ ] Cache valid

---

## Common Issues & Fixes

**No trends detected**
→ Ensure scrape-news-v2 ran first. Check ScrapedContent count.

**Articles not generating**
→ Check if TrendingTopics exists. Verify LLM API key. Check logs.

**Sitemap not updating**
→ Wait 30 minutes for cache. Check article count in News collection.

**Slow article generation**
→ Check vector search speed. Verify LLM response time. Check MongoDB indexes.

**Images not loading**
→ Check Unsplash API key. Verify quota. Check image URLs.

---

## Running Workflows

### Manual Execution (Development)

```bash
# Run all cron jobs in sequence
npm run cron

# Run with no wait between jobs
npm run cron:no-wait

# Development mode (watch + cron)
npm run dev:with-cron
```

### Production (Vercel)

- Automatic via Vercel Cron Jobs
- No manual intervention needed
- Monitor in Vercel dashboard

---

## File Structure

```
/vercel/share/v0-project/
├── WORKFLOW_GUIDE.md          ← Complete workflow overview
├── DATA_SOURCES.md            ← Data sources & scraping
├── API_INFRASTRUCTURE.md      ← API routes & implementation
├── QUICK_REFERENCE.md         ← This file
├── app/
│   ├── api/cron/              ← Cron job handlers
│   │   ├── detect-trends/
│   │   ├── scrape-news-v2/
│   │   ├── generate-articles-v2/
│   │   └── ...
│   └── news-sitemap.xml/      ← Sitemap generation
├── lib/
│   ├── ai/                    ← LLM & embeddings
│   │   ├── agents/
│   │   ├── embeddings.js
│   │   └── contentGenerator.js
│   ├── vector/                ← Vector database
│   ├── scrapers/              ← Web scraping
│   └── db.js                  ← MongoDB connection
└── scripts/
    └── cron-runner.js         ← Local cron runner
```

---

## Next Steps for Optimization

1. **Monitor Performance**: Track article generation speed
2. **Tune Similarity Thresholds**: Adjust 0.65/0.6/0.75 based on results
3. **Add More Sources**: Expand RSS feeds & websites
4. **Enhance Metadata**: Add more FAQs, better entities
5. **Optimize Images**: Compress & cache Unsplash images
6. **Scale Embeddings**: Implement batch processing for speed
7. **Track Analytics**: Monitor which articles get views
8. **A/B Test SEO**: Test different title/description formats

---

**Quick Reference**  
**Updated**: 2024  
**Status**: Production Ready  
**Use for**: Development, debugging, understanding workflow
