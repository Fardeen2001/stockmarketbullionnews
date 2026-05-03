# GCP Deployment Guide for StockMarket Bullion News

## Overview

This guide covers migrating from Vercel to Google Cloud Platform (GCP) with:

- **Cloud Run** - Serverless container deployment
- **Cloud Scheduler** - Automated 6-hour cron jobs
- **Cloud Build** - CI/CD pipeline
- **Secret Manager** - Secure credential storage

---

## Prerequisites

1. **Google Cloud SDK**

```bash
curl https://sdk.cloud.google.com | bash
gcloud init
gcloud auth login
```

2. **Docker**

```bash
docker --version
```

3. **Enable APIs**

```bash
gcloud services enable \
    run.googleapis.com \
    cloudscheduler.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com
```

---

## Step 1: Create GCP Project

```bash
# Create new project
gcloud projects create stockmarket-bullion-news --name="StockMarket Bullion News"

# Set as active
gcloud config set project stockmarket-bullion-news

# Get project number (needed for some commands)
gcloud projects describe stockmarket-bullion-news --format="value(projectNumber)"
```

---

## Step 2: Configure Secret Manager

Store all sensitive credentials in GCP Secret Manager:

```bash
# HuggingFace API Key
echo -n "your-huggingface-api-key" | \
    gcloud secrets create huggingface-api-key --data-file=-

# MongoDB URI
echo -n "mongodb+srv://user:pass@cluster.mongodb.net/stocknews" | \
    gcloud secrets create mongodb-uri --data-file=-

# Cron Secret (for authentication)
openssl rand -base64 32 | \
    gcloud secrets create cron-secret --data-file=-

# Unsplash API Key
echo -n "your-unsplash-key" | \
    gcloud secrets create unsplash-access-key --data-file=-

# OAuth Credentials for Webmaster Tools
echo -n "your-google-client-id" | \
    gcloud secrets create google-oauth-client-id --data-file=-
echo -n "your-google-client-secret" | \
    gcloud secrets create google-oauth-client-secret --data-file=-
echo -n "your-bing-client-id" | \
    gcloud secrets create bing-oauth-client-id --data-file=-
echo -n "your-bing-client-secret" | \
    gcloud secrets create bing-oauth-client-secret --data-file=-
echo -n "your-yandex-client-id" | \
    gcloud secrets create yandex-oauth-client-id --data-file=-
echo -n "your-yandex-client-secret" | \
    gcloud secrets create yandex-oauth-client-secret --data-file=-
```

---

## Step 3: Create Service Account

**GitHub Actions deploy (this repo):** Cloud Scheduler HTTP jobs use **OIDC with the same service account as `GCP_SA_KEY`** (`client_email`). You do **not** need a separate `news-pipeline` account for CI. The workflow grants that identity `roles/run.invoker` on Cloud Run and sets `CLOUD_SCHEDULER_OIDC_SA` on the service so cron auth only accepts that principal.

**Manual / legacy setups** can still create a dedicated scheduler SA:

```bash
# Create service account
gcloud iam service-accounts create news-pipeline \
    --display-name="News Pipeline Service Account" \
    --description="Service account for Cloud Run and Cloud Scheduler"

SA_EMAIL="news-pipeline@$(gcloud config get-value project).iam.gserviceaccount.com"

# Grant roles
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/cloudscheduler.admin"

gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"
```

---

## Step 4: Deploy to Cloud Run

### Option A: Manual Deployment

```bash
# Build and push to Container Registry
docker build -t gcr.io/$PROJECT_ID/news-site:latest .
docker push gcr.io/$PROJECT_ID/news-site:latest

# Deploy to Cloud Run
gcloud run deploy news-site \
    --image gcr.io/$PROJECT_ID/news-site:latest \
    --region asia-southeast1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --timeout 600 \
    --concurrency 80 \
    --set-secrets \
        HUGGINGFACE_API_KEY=huggingface-api-key:latest,\
        MONGODB_URI=mongodb-uri:latest,\
        CRON_SECRET=cron-secret:latest,\
        UNSPLASH_ACCESS_KEY=unsplash-access-key:latest
```

### Option B: Using Deployment Script

```bash
export GCP_PROJECT_ID="your-project-id"
chmod +x scripts/gcp-deploy.sh
./scripts/gcp-deploy.sh production
```

---

## Step 5: Setup Cloud Scheduler

```bash
# Get your Cloud Run service URL
SERVICE_URL=$(gcloud run services describe news-site --region asia-southeast1 --format 'value(status.url)')

# Create service account for scheduler (if not created)
SA_EMAIL="news-pipeline@$(gcloud config get-value project).iam.gserviceaccount.com"

# Create the 6-hour pipeline job
gcloud scheduler jobs create http news-pipeline-6h \
    --location="asia-southeast1" \
    --schedule="0 */6 * * *" \
    --time-zone="Asia/Kolkata" \
    --uri="${SERVICE_URL}/api/cron/full-workflow" \
    --oidc-service-account-email="${SA_EMAIL}" \
    --oidc-audience="${SERVICE_URL}" \
    --description="News pipeline: Scrape → Trends → Generate → Index"

# Create daily full run at 8 AM IST
gcloud scheduler jobs create http news-pipeline-daily \
    --location="asia-southeast1" \
    --schedule="0 8 * * *" \
    --time-zone="Asia/Kolkata" \
    --uri="${SERVICE_URL}/api/cron/full-workflow" \
    --oidc-service-account-email="${SA_EMAIL}" \
    --oidc-audience="${SERVICE_URL}" \
    --description="Daily full news pipeline run"
```

---

## Step 6: Setup Cloud Build CI/CD

```bash
# Connect Cloud Build to GitHub (via Console or CLI)
# Enable Cloud Build API first
gcloud services enable cloudbuild.googleapis.com

# Create trigger via Console:
# 1. Go to Cloud Build > Triggers
# 2. Connect to GitHub repository
# 3. Create trigger with cloudbuild.yaml
```

Or via gcloud:

```bash
gcloud builds triggers create github \
    --repo-name=stockmarketbullionnews \
    --repo-owner=your-github-username \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml
```

---

## Step 7: Configure Webmaster Tools

### Google Search Console

1. Go to https://search.google.com/search-console
2. Add your domain property
3. For Indexing API:
   - Enable "URL Inspection" API in GSC
   - Add `GOOGLE_SEARCH_CONSOLE_API_KEY` to Secret Manager

### Bing Webmaster

1. Go to https://www.bing.com/webmasters
2. Add your site
3. Get API Key from Settings > API Access
4. Add to Secret Manager as `bing-webmaster-api-key`

### Yandex Webmaster

1. Go to https://webmaster.yandex.com
2. Add your site
3. Get OAuth token from https://oauth.yandex.com
4. Add to Secret Manager as `yandex-webmaster-token`

---

## Environment Variables Reference

| Variable                        | Required      | Description                                                         |
| ------------------------------- | ------------- | ------------------------------------------------------------------- |
| `HUGGINGFACE_API_KEY`           | Yes           | HuggingFace API key                                                 |
| `MONGODB_URI`                   | Yes           | MongoDB connection string                                           |
| `CRON_SECRET`                   | Yes           | Authentication secret for cron                                      |
| `NEXT_PUBLIC_SITE_URL`          | Yes           | Your public site URL (sitemaps, SEO, webmaster OAuth callback host) |
| `UNSPLASH_ACCESS_KEY`           | Yes           | Unsplash API key                                                    |
| `GOOGLE_OAUTH_CLIENT_ID`        | For Webmaster | Google OAuth client ID                                              |
| `GOOGLE_OAUTH_CLIENT_SECRET`    | For Webmaster | Google OAuth client secret                                          |
| `BING_OAUTH_CLIENT_ID`          | For Webmaster | Bing OAuth client ID                                                |
| `BING_OAUTH_CLIENT_SECRET`      | For Webmaster | Bing OAuth client secret                                            |
| `YANDEX_OAUTH_CLIENT_ID`        | For Webmaster | Yandex OAuth client ID                                              |
| `YANDEX_OAUTH_CLIENT_SECRET`    | For Webmaster | Yandex OAuth client secret                                          |
| `GOOGLE_SEARCH_CONSOLE_API_KEY` | Fallback      | GSC Indexing API (fallback only)                                    |
| `BING_WEBMASTER_API_KEY`        | Fallback      | Bing Webmaster API (fallback only)                                  |
| `YANDEX_WEBMASTER_TOKEN`        | Fallback      | Yandex Webmaster (fallback only)                                    |

---

## Cron Schedule Reference

| Job                   | Schedule      | Time Zone    | Description   |
| --------------------- | ------------- | ------------ | ------------- |
| `news-pipeline-6h`    | `0 */6 * * *` | Asia/Kolkata | Every 6 hours |
| `news-pipeline-daily` | `0 8 * * *`   | Asia/Kolkata | 8 AM daily    |

---

## Troubleshooting

### Check logs

```bash
gcloud run logs read news-site --region asia-southeast1 --limit 50
```

### Test cron endpoint

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
    https://your-service.run.app/api/cron/full-workflow
```

### Pause/resume scheduler

```bash
gcloud scheduler jobs pause news-pipeline-6h --location=asia-southeast1
gcloud scheduler jobs resume news-pipeline-6h --location=asia-southeast1
```

---

## Local Development

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit with your keys
nano .env.local

# Run with Docker Compose
docker-compose up -d

# Run pipeline manually
docker-compose exec app node scripts/run-pipeline.js
```

---

## Monitoring

### Cloud Run Metrics

```bash
gcloud run services describe news-site --region asia-southeast1
```

### Cloud Scheduler Jobs

```bash
gcloud scheduler jobs list --location=asia-southeast1
gcloud scheduler jobs run news-pipeline-6h --location=asia-southeast1
```

---

## Support

For issues:

1. Check Cloud Run logs
2. Verify secrets are properly configured
3. Test endpoint directly with curl
4. Check MongoDB connectivity
