# Automated Financial News Workflow

This document describes the comprehensive automated workflow for the StockMarket Bullion news platform, from trend detection through article publication and SEO optimization.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AUTOMATED NEWS WORKFLOW PIPELINE                          │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  1. SCRAPE   │────▶│  2. EMBED &  │────▶│  3. TREND    │────▶│  4. GENERATE │
  │  NEWS DATA   │     │  STORE       │     │  DETECTION   │     │  ARTICLES    │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
        │                      │                    │                     │
        ▼                      ▼                    ▼                     ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ WORKFLOW_    │     │ MongoDB      │     │ Stocks       │     │ Meta Llama   │
  │ SOURCES      │     │ Vector DB    │     │ Metals       │     │ SEO + JSON-LD│
  │ (NO Reddit)  │     │ Embeddings   │     │ Sharia       │     │ Stored schema│
  │ RSS + sites  │     └──────────────┘     │ (mutually    │     └──────────────┘
  └──────────────┘                          │  exclusive)  │              │
                                            └──────────────┘              ▼
                                                                  ┌──────────────┐
                                                                  │  5. PUBLISH  │
                                                                  │  & SITEMAP   │
                                                                  └──────────────┘
```

---

## Step 1: Trend Detection

**Purpose:** Detect trending topics for the current day across three distinct categories.

**Categories (analyzed separately, mutually exclusive):**
| Category | Description | Filter |
|----------|-------------|--------|
| **Metals** | Gold, silver, platinum, etc. | Content with `relatedMetals` |
| **Stocks** | General equities, NSE/BSE stocks | Content with `relatedSymbols` and no `relatedMetals` |
| **Sharia** | Sharia-compliant stocks | Content whose symbols are in verified halal list (halalstock.in) |

**Implementation:**
- `TrendDetectionAgent` clusters scraped content by semantic similarity
- Each category is queried and clustered independently
- Trends stored in `trendingTopics` collection with `category` field
- Uses vector embeddings for semantic clustering

**Cron:** `/api/cron/detect-trends` — runs daily at 9:00 UTC

---

## Step 2: Web Scraping Pipeline

**Purpose:** Gather relevant financial data from internet sources.

**Included Sources:**
- **RSS Feeds:** Economic Times, MoneyControl, LiveMint
- **News Websites:** Stock market sites, financial portals
- **Excluded:** Reddit (explicitly excluded from dataset)

**Configuration:** Single source-of-truth: `lib/workflow/sources.js` — `WORKFLOW_SOURCES` and `getWorkflowScrapeSources()`. Reddit excluded by design.

**Processing:**
- Deduplication via vector similarity (85% threshold)
- Enrichment with `relatedSymbols`, `relatedMetals`
- Extraction of stock symbols and metal types from content

**Cron:** `/api/cron/scrape-news-v2` — runs daily at 6:00 UTC

---

## Step 3: Embeddings & Vector Storage

**Purpose:** Generate embeddings and store in MongoDB Vector DB.

**Flow:**
1. Each scraped item gets an embedding via `EmbeddingGenerator` (all-mpnet-base-v2)
2. Stored in `scrapedContent` collection with `embedding` field
3. Indexed in MongoDB Atlas Vector Search for similarity queries
4. Metadata: source URL, title, category, relatedSymbols, relatedMetals

**Collections with embeddings:**
- `scrapedContent` — raw scraped items
- `trendingTopics` — detected trends
- `news` — published articles

**Backfill:** `/api/cron/backfill-embeddings` — fills missing embeddings on demand

---

## Step 4: Article Generation

**Purpose:** Generate high-quality, SEO-friendly news articles using LLM (Meta Llama).

**Process:**
1. Retrieve topics from trends or unprocessed scraped content
2. RAG: Vector search for relevant scraped content, trends, existing articles
3. LLM generation with Mistral/Llama-style model
4. Humanization (optional)
5. Generate metadata:
   - **Meta title** (≤60 chars)
   - **Meta description** (≤160 chars)
   - **JSON-LD schema** (NewsArticle, FAQPage)
   - Keywords, tags, entities, TL;DR, FAQs

**Output:** Published article in `news` collection with `isPublished: true`

**Cron:** `/api/cron/generate-articles-v2` — runs daily at 12:00 UTC

---

## Step 5: Publication & Sitemap

**Purpose:** Publish articles and update sitemap for SEO.

**Publication:** Articles are stored with `isPublished: true` — automatically visible on site.

**News Sitemap:**
- Route: `/news-sitemap.xml`
- Dynamic: Fetches last 2 days of published articles
- Google News compliant (publication_date, title, language)
- Cache: 5 min (`s-maxage=300`), stale-while-revalidate 2 min — ensures new articles appear quickly for indexing

**Sitemap Update:** Full workflow calls `revalidatePath()` in-process after article generation. Standalone: `/api/cron/update-sitemap`.

---

## Master Workflow Orchestrator

**Endpoint:** `/api/cron/full-workflow`

**Implementation:** In-process (no HTTP chaining). `lib/workflow/runFullWorkflow.js` invokes agents directly.

**Runs in sequence:**
1. Scrape news (WORKFLOW_SOURCES, no Reddit)
2. Detect trends (stocks, metals, sharia — mutually exclusive)
3. Generate articles (`lib/workflow/runArticleGeneration.js`)
4. Revalidate sitemap and news pages

---

## Cron Schedule Summary

| Cron | Schedule | Purpose |
|------|----------|---------|
| update-stocks | Daily 00:00 UTC | Refresh stock prices |
| update-metals | Daily 03:00 UTC | Refresh metal prices |
| scrape-news-v2 | Daily 06:00 UTC | Scrape news (no Reddit) |
| detect-trends | Daily 09:00 UTC | Detect trends (stocks, metals, sharia) |
| generate-articles-v2 | Daily 12:00 UTC | Generate & publish articles |
| update-sharia | Weekly Sunday 00:00 UTC | Update Sharia compliance |
| full-workflow | On-demand | Run complete pipeline |
| update-sitemap | After articles | Invalidate sitemap cache |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `HUGGINGFACE_API_KEY` | AI embeddings & text generation |
| `MONGODB_URI` | Database connection |
| `CRON_SECRET` | Cron endpoint authentication |
| `NEXT_PUBLIC_SITE_URL` | Base URL for sitemaps |
| `UNSPLASH_ACCESS_KEY` | Article images |
| `HUMANIZER_API_KEY` | Content humanization (optional) |

---

## Data Flow

```
Scraped Content (no Reddit)
    │
    ├──► Embedding ──► scrapedContent + vector index
    │
    └──► Trend Detection (per category: stocks | metals | sharia)
              │
              └──► trendingTopics + vector index
                        │
                        └──► Article Generation (RAG from scraped + trends)
                                  │
                                  └──► news (published) + vector index
                                            │
                                            └──► news-sitemap.xml (dynamic)
```

---

## SEO Output

Each published article includes:
- Meta title, meta description, keywords (stored in `seoMetadata`)
- JSON-LD schema (NewsArticle, FAQPage) — generated at publish, stored, consumed by news page
- Open Graph & Twitter Card tags
- BreadcrumbList schema (generated on page)
- Canonical URL, structured internal/external links
