# GCP Migration Plan for StockMarket Bullion News

> **Goal:** Migrate from Vercel to Google Cloud Platform with Cloud Run + Cloud Scheduler for automated news pipeline

**Architecture:**

- Next.js app deployed to Cloud Run
- Cloud Scheduler triggers pipeline every 6 hours
- Full pipeline: Research → Collect → Write → Publish → Index

---

## Files to Create/Modify

| File                       | Action | Purpose                     |
| -------------------------- | ------ | --------------------------- |
| `Dockerfile`               | Create | Container for Cloud Run     |
| `docker-compose.yml`       | Create | Local dev with all services |
| `cloudbuild.yaml`          | Create | GCP Cloud Build CI/CD       |
| `scripts/gcp-deploy.sh`    | Create | Deployment script           |
| `scripts/run-pipeline.js`  | Create | Main orchestrator (Node.js) |
| `lib/webmaster/indexer.js` | Create | GSC/Bing/other indexing     |
| `lib/cron/gcpAuth.js`      | Create | Replace cronAuth.js         |
| `app/api/cron/**/*.js`     | Modify | Remove Vercel-specific auth |
| `vercel.json`              | Delete | Vercel config               |
| `lib/utils/cronAuth.js`    | Delete | Vercel cron auth            |
| `VERCEL_CRON_FIX.md`       | Delete | Vercel docs                 |

---

## Implementation Tasks

### Task 1: Create Dockerfile

- [ ] **Step 1: Create Dockerfile for Cloud Run**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install Python for Playwright (if needed)
RUN apk add --no-cache python3 python3-pip

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build Next.js
RUN npm run build

# Expose port
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

# Start Next.js
CMD ["npm", "start"]
```

- [ ] **Step 2: Create .dockerignore**

```text
node_modules
.next
.git
*.md
.env*.local
.vercel
```

---

### Task 2: Create Cloud Scheduler Integration

- [ ] **Step 1: Create GCP auth module**

```javascript
// lib/cron/gcpAuth.js
// Handles Cloud Scheduler and manual triggers

export function verifyGCPRequest(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // No secret = dev mode
  if (!cronSecret) {
    return { authorized: true, source: "development" };
  }

  // Manual trigger with Bearer token
  if (authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true, source: "manual" };
  }

  // Cloud Scheduler sends custom header
  const schedulerHeader = request.headers.get("x-cloudscheduler");
  if (schedulerHeader === "true") {
    return { authorized: true, source: "cloud-scheduler" };
  }

  // Cloud Scheduler also sends this header
  const googleHeader = request.headers.get("x-google-something");
  if (googleHeader) {
    return { authorized: true, source: "cloud-scheduler" };
  }

  return { authorized: false, source: "unauthorized" };
}
```

- [ ] **Step 2: Create Cloud Scheduler setup script**

```bash
# scripts/setup-cloud-scheduler.sh

# Create job for every 6 hours
gcloud scheduler jobs create http news-pipeline-6h \
  --location=asia-southeast1 \
  --schedule="0 */6 * * *" \
  --uri="https://[REGION]-[PROJECT].run.app/api/cron/pipeline" \
  --headers="Authorization=Bearer $(gcloud auth print-identity-token)" \
  --description="Run news pipeline every 6 hours"

# Or using HTTP target with OIDC
gcloud scheduler jobs create http news-pipeline-6h \
  --location=asia-southeast1 \
  --schedule="0 */6 * * *" \
  --uri="https://[REGION]-[PROJECT].run.app/api/cron/pipeline" \
  --oidc-service-account-email="[SA]@[PROJECT].iam.gserviceaccount.com" \
  --description="Run news pipeline every 6 hours"
```

---

### Task 3: Create Main Pipeline Orchestrator

- [ ] **Step 1: Create Node.js pipeline script**

```javascript
// scripts/run-pipeline.js
/**
 * Main News Pipeline Orchestrator
 * Runs: Research → Scrape → Detect Trends → Generate Articles → Index URLs
 */

import { ScraperAgent } from "../lib/ai/agents/scrapingAgent.js";
import { TrendDetectionAgent } from "../lib/ai/agents/trendDetectionAgent.js";
import { runArticleGeneration } from "../lib/workflow/runArticleGeneration.js";
import { WebmasterIndexer } from "../lib/webmaster/indexer.js";

const hfApiKey = process.env.HUGGINGFACE_API_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

async function runPipeline() {
  const startTime = Date.now();
  const results = {
    scrape: null,
    trends: null,
    articles: null,
    indexing: null,
    errors: [],
  };

  console.log("[Pipeline] Starting news generation pipeline...");

  // Step 1: Research & Scrape
  console.log("[Pipeline] Step 1: Scraping news sources...");
  try {
    const scrapeAgent = new ScraperAgent();
    await scrapeAgent.initialize(hfApiKey);
    const scrapeResult = await scrapeAgent.execute({
      sources: getWorkflowScrapeSources(),
      maxItems: 50,
    });
    results.scrape = { success: true, count: scrapeResult.total };
    console.log(`[Pipeline] Scraped ${scrapeResult.total} items`);
    await scrapeAgent.close();
  } catch (err) {
    results.errors.push({ step: "scrape", error: err.message });
    console.error("[Pipeline] Scrape failed:", err.message);
  }

  // Step 2: Detect Trends
  console.log("[Pipeline] Step 2: Detecting trends...");
  try {
    const trendAgent = new TrendDetectionAgent({ clusteringThreshold: 0.75 });
    await trendAgent.initialize(hfApiKey);
    const trendResult = await trendAgent.execute({
      hours: 24,
      categories: ["stocks", "metals", "sharia"],
    });
    results.trends = { success: true, count: trendResult.trends?.length ?? 0 };
    console.log(`[Pipeline] Detected ${results.trends.count} trends`);
  } catch (err) {
    results.errors.push({ step: "trends", error: err.message });
    console.error("[Pipeline] Trends failed:", err.message);
  }

  // Step 3: Generate Articles
  console.log("[Pipeline] Step 3: Generating articles...");
  try {
    const articleResult = await runArticleGeneration({ hfApiKey });
    results.articles = {
      success: true,
      generated: articleResult.generated,
      skipped: articleResult.skipped,
      errors: articleResult.errors,
    };
    console.log(`[Pipeline] Generated ${articleResult.generated} articles`);
  } catch (err) {
    results.errors.push({ step: "articles", error: err.message });
    console.error("[Pipeline] Article generation failed:", err.message);
  }

  // Step 4: Index URLs to Webmasters
  console.log("[Pipeline] Step 4: Indexing URLs...");
  try {
    const indexer = new WebmasterIndexer({ siteUrl });
    await indexer.initialize();
    const indexResult = await indexer.indexNewArticles();
    results.indexing = indexResult;
    console.log(`[Pipeline] Indexed ${indexResult.count} URLs`);
    await indexer.close();
  } catch (err) {
    results.errors.push({ step: "indexing", error: err.message });
    console.error("[Pipeline] Indexing failed:", err.message);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const success = results.errors.length === 0;

  console.log("\n[Pipeline] Pipeline complete!");
  console.log(`Duration: ${duration}s`);
  console.log(`Success: ${success}`);
  console.log(JSON.stringify(results, null, 2));

  return { success, results, duration };
}

runPipeline().catch(console.error);
```

---

### Task 4: Create Webmaster URL Indexing Service

- [ ] **Step 1: Create indexer module**

```javascript
// lib/webmaster/indexer.js
/**
 * Webmaster Tools URL Indexing Service
 * Submits URLs to: Google Search Console, Bing Webmaster, Yandex, Baidu, DuckDuckGo
 */

export class WebmasterIndexer {
  constructor(config = {}) {
    this.siteUrl = config.siteUrl || process.env.NEXT_PUBLIC_SITE_URL;
    this.gscApiKey =
      config.gscApiKey || process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
    this.gscSiteUrl =
      config.gscSiteUrl || process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  }

  async initialize() {
    // Initialize any required clients
    this.gscClient = this.gscApiKey ? createGSCClient(this.gscApiKey) : null;
  }

  /**
   * Index all new (unindexed) articles
   */
  async indexNewArticles() {
    const newsCollection = await getNewsCollection();
    const recentArticles = await newsCollection
      .find({
        isPublished: true,
        indexedAt: { $exists: false },
      })
      .sort({ publishedAt: -1 })
      .limit(50)
      .toArray();

    const results = {
      count: recentArticles.length,
      gsc: [],
      bing: [],
      errors: [],
    };

    for (const article of recentArticles) {
      const articleUrl = `${this.siteUrl}/news/${article.slug}`;

      // Submit to Google Search Console
      if (this.gscClient && this.gscSiteUrl) {
        try {
          await this.submitToGSC(articleUrl);
          results.gsc.push(articleUrl);
        } catch (err) {
          results.errors.push({ url: articleUrl, error: err.message });
        }
      }

      // Submit to Bing
      try {
        await this.submitToBing(articleUrl);
        results.bing.push(articleUrl);
      } catch (err) {
        results.errors.push({ url: articleUrl, error: err.message });
      }

      // Mark as indexed
      await newsCollection.updateOne(
        { _id: article._id },
        {
          $set: {
            indexedAt: new Date(),
            indexedUrls: results.gsc.length + results.bing.length,
          },
        },
      );
    }

    return results;
  }

  /**
   * Submit URL to Google Search Console Indexing API
   */
  async submitToGSC(url) {
    const endpoint = `https://indexing.googleapis.com/v3/urlNotifications:publish`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        type: "URL_UPDATED", // or 'URL_DELETED' for removal
      }),
    });

    if (!response.ok) {
      throw new Error(`GSC API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Submit URL to Bing Webmaster API
   */
  async submitToBing(url) {
    const bingApiKey = process.env.BING_WEBMASTER_API_KEY;
    if (!bingApiKey) {
      console.log("Bing API key not configured, skipping Bing submission");
      return null;
    }

    const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl?apikey=${bingApiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteUrl: this.siteUrl,
        url: url,
      }),
    });

    if (!response.ok) {
      throw new Error(`Bing API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get OAuth access token for GSC API
   */
  async getAccessToken() {
    // Use service account or OAuth2
    // For service account:
    const { GoogleAuth } = require("google-auth-library");
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  }

  async close() {
    // Cleanup
  }
}
```

---

### Task 5: Update Cron Routes

- [ ] **Step 1: Update all cron route files to use GCP auth**

Replace `verifyCronSecret` with:

```javascript
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';

// Replace:
function verifyCronSecret(request) { ... }

// With:
export async function GET(request) {
  const authResult = verifyGCPRequest(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

Files to update:

- `app/api/cron/generate-articles/route.js`
- `app/api/cron/scrape-news/route.js`
- `app/api/cron/scrape-news-v2/route.js`
- `app/api/cron/generate-articles-v2/route.js`
- `app/api/cron/detect-trends/route.js`
- `app/api/cron/update-stocks/route.js`
- `app/api/cron/update-metals/route.js`
- `app/api/cron/update-sitemap/route.js`
- `app/api/cron/full-workflow/route.js`
- `app/api/cron/diagnose/route.js`
- `app/api/cron/test/route.js`
- `app/api/cron/backfill-embeddings/route.js`
- `app/api/cron/update-sharia/route.js`

---

### Task 6: Create Cloud Build CI/CD

- [ ] **Step 1: Create cloudbuild.yaml**

```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "build"
      - "-t"
      - "gcr.io/$PROJECT_ID/news-site:$SHORT_SHA"
      - "-t"
      - "gcr.io/$PROJECT_ID/news-site:latest"
      - "."

  # Push to Container Registry
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "push"
      - "gcr.io/$PROJECT_ID/news-site:$SHORT_SHA"
      - "push"
      - "gcr.io/$PROJECT_ID/news-site:latest"

  # Deploy to Cloud Run
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: gcloud
    args:
      - "run"
      - "deploy"
      - "news-site"
      - "--image"
      - "gcr.io/$PROJECT_ID/news-site:$SHORT_SHA"
      - "--region"
      - "asia-southeast1"
      - "--platform"
      - "managed"
      - "--allow-unauthenticated"
      - "--set-env-vars"
      - "NODE_ENV=production,MONGODB_URI=$_MONGODB_URI,HUGGINGFACE_API_KEY=$_HUGGINGFACE_API_KEY"
      - "--set-secrets"
      - "CRON_SECRET=cron-secret:latest,UNSPLASH_ACCESS_KEY=unsplash-key:latest"

images:
  - "gcr.io/$PROJECT_ID/news-site:$SHORT_SHA"
  - "gcr.io/$PROJECT_ID/news-site:latest"
```

- [ ] **Step 2: Create deployment script**

```bash
#!/bin/bash
# scripts/gcp-deploy.sh

set -e

PROJECT_ID="your-project-id"
REGION="asia-southeast1"
SERVICE_NAME="news-site"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Build and push
echo "Building Docker image..."
docker build -t ${IMAGE}:latest .

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE}:latest \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 600 \
  --concurrency 80

echo "Deployment complete!"
echo "Service URL: $(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')"
```

---

### Task 7: Create Docker Compose for Local Dev

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:8080"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/stocknews
      - HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
      - CRON_SECRET=${CRON_SECRET}
      - NEXT_PUBLIC_SITE_URL=http://localhost:3000
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  # Optional: Mongo Express for debugging
  mongo-express:
    image: mongo-express
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_URI=mongodb://mongo:27017
    depends_on:
      - mongo

volumes:
  mongo_data:
```

---

## Deployment Guide

### 1. Prerequisites

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
gcloud init

# Enable required APIs
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com cloudbuild.googleapis.com
```

### 2. Create Service Account

```bash
gcloud iam service-accounts create news-pipeline \
  --display-name="News Pipeline Service Account"

# Grant roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:news-pipeline@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:news-pipeline@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudscheduler.admin"
```

### 3. Create Secrets

```bash
# Create secrets in Secret Manager
echo -n "your-secret-value" | gcloud secrets create cron-secret --data-file=-
echo -n "your-key" | gcloud secrets create huggingface-api-key --data-file=-
echo -n "your-key" | gcloud secrets create unsplash-access-key --data-file=-
```

### 4. Deploy

```bash
./scripts/gcp-deploy.sh
```

### 5. Setup Cloud Scheduler

```bash
./scripts/setup-cloud-scheduler.sh
```

---

## Cron Schedule

| Job                 | Schedule      | Purpose                     |
| ------------------- | ------------- | --------------------------- |
| news-pipeline-6h    | `0 */6 * * *` | Main pipeline every 6 hours |
| news-pipeline-daily | `0 8 * * *`   | Full daily run at 8 AM      |

---

## Approval Required

**Plan complete.** Please approve to proceed with implementation.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session

Which approach?
