# StockMarket Bullion News - GCP Deployment Guide

Complete guide to deploy your application to Google Cloud Run with automatic Cloud Scheduler setup.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **GitHub Repository** for this project
3. **Git** installed locally

---

## Step 1: Create GCP Project

```bash
# Go to https://console.cloud.google.com
# Create new project or select existing one
# Note your Project ID (e.g., "stockmarket-bullion-news")
```

---

## Step 2: Run Local GCP Setup Script

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Run the setup script
chmod +x scripts/setup-gcp.sh
./scripts/setup-gcp.sh
```

This script will:

- Enable all required GCP APIs
- Create service account for GitHub Actions
- Generate JSON key file (`gcp-sa-key.json`)
- Display next steps

---

## Step 3: Add Secrets to GitHub

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

### Add these Repository Secrets:

| Secret Name            | Value                                               | How to Get                                       |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------ |
| `GCP_SA_KEY`           | (JSON content)                                      | Open `gcp-sa-key.json` file, copy entire content |
| `GCP_PROJECT_ID`       | your-project-id                                     | From GCP Console                                 |
| `GCP_SA_EMAIL`         | github-actions@your-project.iam.gserviceaccount.com | Auto-generated                                   |
| `NEXT_PUBLIC_SITE_URL` | https://your-domain.com                             | Your site URL                                    |
| `MONGODB_URI`          | mongodb+srv://...                                   | From MongoDB Atlas                               |
| `HUGGINGFACE_API_KEY`  | hf_xxxx...                                          | From huggingface.co                              |
| `UNSPLASH_ACCESS_KEY`  | your-key                                            | From unsplash.com/developers                     |
| `CRON_SECRET`          | random-string                                       | Generate: `openssl rand -base64 32`              |

---

## Step 4: Create Secrets in GCP Secret Manager

```bash
# Authenticate with gcloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Create each secret (replace values with your actual secrets)
echo -n 'mongodb+srv://user:pass@cluster.mongodb.net/stocknews' | gcloud secrets create mongodb-uri --data-file=-
echo -n 'hf_xxxxxxxxxxxxxx' | gcloud secrets create huggingface-api-key --data-file=-
echo -n 'your-random-secret' | gcloud secrets create cron-secret --data-file=-
echo -n 'your-unsplash-key' | gcloud secrets create unsplash-access-key --data-file=-
echo -n 'your-gsc-key' | gcloud secrets create gsc-api-key --data-file=-
echo -n 'your-bing-key' | gcloud secrets create bing-webmaster-api-key --data-file=-
```

---

## Step 5: Clean Up Local Key File

```bash
rm -f gcp-sa-key.json
```

---

## Step 6: Push to GitHub

```bash
git add .
git commit -m "feat: GCP deployment with GitHub Actions"
git push origin main
```

---

## What Happens Automatically

1. **GitHub Actions triggers** on push to main
2. **Docker image builds** and pushes to Container Registry
3. **Cloud Run deploys** the image
4. **Cloud Scheduler jobs** are created (9 jobs)

### Cloud Scheduler Jobs Created:

| Job                    | Schedule            | Description          |
| ---------------------- | ------------------- | -------------------- |
| news-pipeline-6h       | Every 6 hours       | Main pipeline        |
| news-full-weekly       | Sunday 5 AM IST     | Weekly comprehensive |
| news-update-sharia     | Sunday midnight IST | Sharia compliance    |
| news-update-stocks     | Midnight IST        | Stock prices         |
| news-update-metals     | 3 AM IST            | Metal prices         |
| news-scrape            | 6 AM IST            | News scraping        |
| news-detect-trends     | 9 AM IST            | Trend detection      |
| news-generate-articles | Noon IST            | Article generation   |
| news-update-sitemap    | 1 PM IST            | Sitemap update       |

---

## Verify Deployment

### Check Cloud Run:

```bash
gcloud run services describe news-site --region asia-southeast1
```

### Check Scheduler Jobs:

```bash
gcloud scheduler jobs list --location=asia-southeast1
```

### View Logs:

```bash
gcloud run logs read news-site --region asia-southeast1 --limit 50
```

---

## Test the Health Endpoint

```bash
curl https://your-service-url/api/health
```

Should return:

```json
{
  "status": "healthy",
  "timestamp": "...",
  "service": "stockmarket-bullion-news"
}
```

---

## Troubleshooting

### "Permission denied" error

- Verify `GCP_SA_KEY` is correct JSON
- Check service account has required roles

### "Secret not found" error

- Ensure secrets exist in GCP Secret Manager
- Check secret names match exactly (case-sensitive)

### "Deployment failed" error

- Check Cloud Run logs: `gcloud run logs read news-site --region asia-southeast1`
- Verify all environment variables are set
- Check Docker build locally: `docker build .`

### Test manually first:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-service-url/api/cron/test
```

---

## Security Checklist

- [ ] Delete `gcp-sa-key.json` after adding to GitHub
- [ ] Use strong `CRON_SECRET` (32+ random characters)
- [ ] Enable MongoDB Atlas IP whitelist
- [ ] Use latest versions of GitHub Actions
- [ ] Enable VPC for production (optional)

---

## Cost Estimate

| Resource           | Monthly Estimate            |
| ------------------ | --------------------------- |
| Cloud Run          | ~$0-10 (depends on traffic) |
| Cloud Scheduler    | Free (up to 20 jobs)        |
| Container Registry | ~$1-5 storage               |
| Secret Manager     | ~$0.03                      |

**Total: ~$5-20/month** for moderate traffic

---

## Next Steps After Deployment

1. **Configure custom domain** in Cloud Run
2. **Setup monitoring** with Cloud Monitoring
3. **Enable Cloud Armor** for DDoS protection
4. **Configure SSL** (automatic with Cloud Run)
5. **Setup alerts** for errors and latency
