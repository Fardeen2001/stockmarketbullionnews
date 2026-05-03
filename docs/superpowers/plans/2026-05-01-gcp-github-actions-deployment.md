# GitHub Actions + Google Cloud Deployment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Complete CI/CD pipeline that deploys to Google Cloud Run and sets up Cloud Scheduler jobs on every push to main branch.

**Architecture:** GitHub Actions builds Docker image, pushes to Google Container Registry, deploys to Cloud Run, and configures Cloud Scheduler jobs automatically.

**Tech Stack:** GitHub Actions, Google Cloud Run, Cloud Build, Cloud Scheduler, Container Registry

---

## Files to Create/Modify

| File                                    | Action | Purpose                        |
| --------------------------------------- | ------ | ------------------------------ |
| `.github/workflows/deploy.yml`          | Create | Main CI/CD pipeline            |
| `Dockerfile`                            | Modify | Multi-stage production build   |
| `.dockerignore`                         | Create | Exclude unnecessary files      |
| `cloudbuild.yaml`                       | Modify | Cloud Build configuration      |
| `scripts/setup-gcp.sh`                  | Create | Initial GCP setup script       |
| `.github/workflows/scheduler-setup.yml` | Create | Cloud Scheduler setup workflow |
| `.env.example`                          | Create | Example environment file       |

---

## Implementation Tasks

### Task 1: Create GitHub Actions Deploy Workflow

**Files:**

- Create: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Google Cloud Run

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: asia-southeast1
  SERVICE_NAME: news-site
  IMAGE: gcr.io/${{ secrets.GCP_PROJECT_ID }}/${{ env.SERVICE_NAME }}

jobs:
  # ============================================
  # JOB 1: Build and Deploy
  # ============================================
  build-and-deploy:
    name: Build & Deploy to Cloud Run
    runs-on: ubuntu-latest

    steps:
      # Checkout code
      - name: Checkout
        uses: actions/checkout@v4

      # Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      # Install dependencies
      - name: Install dependencies
        run: npm ci

      # Authenticate with Google Cloud
      - name: Authenticate with Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      # Setup Google Cloud SDK
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      # Configure Docker auth
      - name: Configure Docker auth
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      # Build and push Docker image
      - name: Build and push Docker image
        run: |
          docker build \
            --tag ${{ env.IMAGE }}:${{ github.sha }} \
            --tag ${{ env.IMAGE }}:latest \
            .

          docker push ${{ env.IMAGE }}:${{ github.sha }}
          docker push ${{ env.IMAGE }}:latest

      # Deploy to Cloud Run
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE_NAME }} \
            --image ${{ env.IMAGE }}:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --port 8080 \
            --memory 2Gi \
            --cpu 2 \
            --timeout 600 \
            --concurrency 80 \
            --min-instances 1 \
            --max-instances 10 \
            --set-env-vars "NODE_ENV=production" \
            --set-env-vars "NEXT_PUBLIC_SITE_URL=${{ secrets.NEXT_PUBLIC_SITE_URL }}" \
            --set-secrets "MONGODB_URI=mongodb-uri:latest,HUGGINGFACE_API_KEY=huggingface-api-key:latest,CRON_SECRET=cron-secret:latest,UNSPLASH_ACCESS_KEY=unsplash-access-key:latest,GSC_API_KEY=gsc-api-key:latest,BING_WEBMASTER_API_KEY=bing-webmaster-api-key:latest"

      # Get service URL
      - name: Get Cloud Run service URL
        id: service-url
        run: |
          URL=$(gcloud run services describe ${{ env.SERVICE_NAME }} --region ${{ env.REGION }} --format 'value(status.url)')
          echo "SERVICE_URL=$URL" >> $GITHUB_ENV
          echo "Deployed to: $URL"

      # Report deployment status
      - name: Deployment Status
        run: |
          echo "========================================"
          echo "Deployment Complete!"
          echo "Service URL: ${{ env.SERVICE_URL }}"
          echo "Image: ${{ env.IMAGE }}:${{ github.sha }}"
          echo "========================================"

  # ============================================
  # JOB 2: Setup Cloud Scheduler (runs after deploy)
  # ============================================
  setup-scheduler:
    name: Setup Cloud Scheduler Jobs
    needs: build-and-deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate with Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Setup Cloud Scheduler
        run: |
          chmod +x scripts/setup-cloud-scheduler.sh
          export SERVICE_URL="${{ env.SERVICE_URL }}"
          export SERVICE_ACCOUNT_EMAIL="${{ secrets.GCP_SA_EMAIL }}"
          ./scripts/setup-cloud-scheduler.sh

      - name: List Scheduler Jobs
        run: |
          echo "========================================"
          echo "Cloud Scheduler Jobs:"
          gcloud scheduler jobs list --location=asia-southeast1 --format="table(name,schedule,state)"
          echo "========================================"

  # ============================================
  # JOB 3: Notify (optional)
  # ============================================
  notify:
    name: Deployment Notification
    needs: [build-and-deploy, setup-scheduler]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: Deployment Summary
        run: |
          echo "========================================"
          echo "Deployment Complete!"
          echo "Branch: ${{ github.ref }}"
          echo "Commit: ${{ github.sha }}"
          echo "Deployed by: ${{ github.actor }}"
          echo "========================================"
```

---

### Task 2: Create Cloud Scheduler Setup Workflow

**Files:**

- Create: `.github/workflows/scheduler-setup.yml`

```yaml
name: Setup Cloud Scheduler Jobs

on:
  workflow_dispatch: # Manual trigger
    inputs:
      service_url:
        description: "Cloud Run service URL"
        required: true
        type: string

env:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: asia-southeast1

jobs:
  setup-scheduler:
    name: Configure Cloud Scheduler
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate with Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Create Service Account
        run: |
          SA_EMAIL="news-pipeline@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

          # Create SA if not exists
          if ! gcloud iam service-accounts describe "$SA_EMAIL" 2>/dev/null; then
            gcloud iam service-accounts create news-pipeline \
              --display-name="News Pipeline Service Account"
          fi

          # Grant roles
          gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
            --member="serviceAccount:$SA_EMAIL" \
            --role="roles/run.admin"

          gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
            --member="serviceAccount:$SA_EMAIL" \
            --role="roles/cloudscheduler.admin"

          gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
            --member="serviceAccount:$SA_EMAIL" \
            --role="roles/secretmanager.secretAccessor"

          echo "SA_EMAIL=$SA_EMAIL" >> $GITHUB_ENV

      - name: Setup Scheduler Jobs
        run: |
          chmod +x scripts/setup-cloud-scheduler.sh
          export SERVICE_URL="${{ github.event.inputs.service_url || vars.CLOUD_RUN_URL }}"
          export SERVICE_ACCOUNT_EMAIL="${{ env.SA_EMAIL }}"
          ./scripts/setup-cloud-scheduler.sh

      - name: Verify Jobs
        run: |
          echo "========================================"
          echo "Cloud Scheduler Jobs:"
          gcloud scheduler jobs list --location=${{ env.REGION }} --format="table(name,schedule,state)"
          echo "========================================"
```

---

### Task 3: Update Dockerfile for GitHub Actions

**Files:**

- Modify: `Dockerfile`

```dockerfile
# Dockerfile for Google Cloud Run
# Optimized for GitHub Actions CI/CD

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

# Environment
ENV NODE_ENV=production
ENV PORT=8080

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/health || exit 1

# Start server
CMD ["node", "server.js"]
```

---

### Task 4: Create GCP Setup Script

**Files:**

- Create: `scripts/setup-gcp.sh`

```bash
#!/bin/bash

# Initial GCP Setup Script
# Run this once to setup GCP project before first deployment

set -e

PROJECT_ID="${GCP_PROJECT_ID:-}"
SERVICE_NAME="${SERVICE_NAME:-news-site}"
REGION="asia-southeast1"

echo "=========================================="
echo "GCP Initial Setup"
echo "=========================================="

if [ -z "$PROJECT_ID" ]; then
    echo "Error: GCP_PROJECT_ID not set"
    echo "Usage: GCP_PROJECT_ID=project-id ./setup-gcp.sh"
    exit 1
fi

# Set project
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo "Enabling GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudscheduler.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com \
    iam.googleapis.com \
    --quiet

echo "APIs enabled successfully"

# Create service account
echo "Creating service account..."
SA_EMAIL="news-pipeline@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SA_EMAIL" 2>/dev/null; then
    gcloud iam service-accounts create news-pipeline \
        --display-name="News Pipeline Service Account" \
        --description="Service account for Cloud Run and Cloud Scheduler"
fi

# Grant roles to service account
echo "Granting roles..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudscheduler.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/container.admin"

echo "Service account created: $SA_EMAIL"

# Create JSON key for GitHub Actions
echo "Creating service account key..."
KEY_FILE="gcp-sa-key.json"
gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SA_EMAIL"

echo "Key created: $KEY_FILE"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Add '$KEY_FILE' content to GitHub Secrets as GCP_SA_KEY"
echo "2. Add your project ID as GCP_PROJECT_ID secret"
echo "3. Create secrets in Secret Manager:"
echo "   - mongodb-uri"
echo "   - huggingface-api-key"
echo "   - cron-secret"
echo "   - unsplash-access-key"
echo "4. Push to GitHub to trigger deployment"
echo ""
echo "To create secrets in Secret Manager:"
echo "  echo -n 'your-value' | gcloud secrets create SECRET_NAME --data-file=-"
echo "=========================================="
```

---

### Task 5: Create Environment Example File

**Files:**

- Create: `.env.example`

```env
# ===========================================
# GCP Deployment - Environment Variables
# ===========================================

# Site URL (for SEO and sitemap)
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# MongoDB Connection
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/stocknews

# HuggingFace API Key (required for AI content generation)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx

# Authentication Secret (for cron job security)
CRON_SECRET=your-secure-random-string-min-32-chars

# Image APIs
UNSPLASH_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Webmaster Tools APIs (for URL indexing)
GOOGLE_SEARCH_CONSOLE_API_KEY=your-gsc-api-key
BING_WEBMASTER_API_KEY=your-bing-api-key
YANDEX_WEBMASTER_TOKEN=your-yandex-oauth-token

# Optional: Stock/Metal API Keys
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
METALPRICE_API_KEY=your-metalprice-key
GOLD_API_KEY=your-gold-api-key

# Optional: Vector DB / Embeddings
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2

# GCP Specific (set in Cloud Run env, not here)
# GCP_PROJECT_ID=your-project-id
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service/account/key.json
```

---

### Task 6: Create GitHub Secrets Guide

**Files:**

- Create: `.github/SECRETS_GUIDE.md`

````markdown
# GitHub Secrets Setup Guide

Follow these steps to configure GitHub Actions for GCP deployment.

## Step 1: Create Service Account Key

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions Service Account"

# Grant roles
gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudscheduler.admin"

gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/container.admin"

# Create JSON key
gcloud iam service-accounts keys create key.json \
    --iam-account="github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com"
```
````

## Step 2: Add Secrets to GitHub

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret Name            | Description               | How to Get                                       |
| ---------------------- | ------------------------- | ------------------------------------------------ |
| `GCP_SA_KEY`           | Service account JSON key  | Paste content of `key.json` file                 |
| `GCP_PROJECT_ID`       | GCP Project ID            | From Google Cloud Console                        |
| `GCP_SA_EMAIL`         | Service account email     | `github-actions@project.iam.gserviceaccount.com` |
| `NEXT_PUBLIC_SITE_URL` | Your site URL             | `https://stockmarketbullion.com`                 |
| `MONGODB_URI`          | MongoDB connection string | From MongoDB Atlas                               |
| `HUGGINGFACE_API_KEY`  | HuggingFace API key       | From huggingface.co                              |
| `CRON_SECRET`          | Secret for cron auth      | Generate random 32+ char string                  |
| `UNSPLASH_ACCESS_KEY`  | Unsplash API key          | From unsplash.com/developers                     |

## Step 3: Create Secrets in GCP Secret Manager

```bash
# Create secrets
echo -n "your-mongodb-uri" | gcloud secrets create mongodb-uri --data-file=-
echo -n "your-hf-key" | gcloud secrets create huggingface-api-key --data-file=-
echo -n "your-cron-secret" | gcloud secrets create cron-secret --data-file=-
echo -n "your-unsplash-key" | gcloud secrets create unsplash-access-key --data-file=-
echo -n "your-gsc-key" | gcloud secrets create gsc-api-key --data-file=-
echo -n "your-bing-key" | gcloud secrets create bing-webmaster-api-key --data-file=-

# Add versions (latest tag)
gcloud secrets versions add mongodb-uri --data-file=- <<< "your-mongodb-uri"
gcloud secrets versions add huggingface-api-key --data-file=- <<< "your-hf-key"
gcloud secrets versions add cron-secret --data-file=- <<< "your-cron-secret"
gcloud secrets versions add unsplash-access-key --data-file=- <<< "your-unsplash-key"
```

## Step 4: Add Repository Variables

Go to **Settings** → **Secrets and variables** → **Variables** → \*\*New repository variable`:

| Variable Name       | Value             |
| ------------------- | ----------------- |
| `GCP_REGION`        | `asia-southeast1` |
| `CLOUD_RUN_SERVICE` | `news-site`       |

## Step 5: Test Deployment

Push any change to `main` branch to trigger deployment.

Check progress in **Actions** tab.

```

---

### Task 7: Create .gitignore Updates

**Files:**
- Modify: `.gitignore`

Add these GCP-related entries:

```

# GCP

_.json
!package.json
service-account_.json
gcp-sa-key.json
key.json

# GitHub Actions

.github/workflows/\*.yml
!.github/workflows/deploy.yml

```

---

## Deployment Flow

```

Push to main
↓
GitHub Actions Trigger
↓
┌─ Build Docker Image
│ └─ Push to Container Registry
│ └─ gcr.io/project/news-site:sha
↓
┌─ Deploy to Cloud Run
│ └─ Latest image → news-site
↓
┌─ Setup Cloud Scheduler Jobs
│ └─ Create/update all scheduled jobs
↓
Success!

```

---

## Approval Required

**Plan complete and saved to `docs/superpowers/plans/2026-05-01-gcp-github-actions-deployment.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks

**2. Inline Execution** - Execute tasks in this session

Which approach?
```
