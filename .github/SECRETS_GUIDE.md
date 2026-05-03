# GitHub Secrets Setup Guide

Follow these steps to configure GitHub Actions for GCP deployment.

## Step 1: Run GCP Setup Script

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Run setup script
chmod +x scripts/setup-gcp.sh
./scripts/setup-gcp.sh
```

This will:

- Enable required GCP APIs
- Create GitHub Actions service account
- Generate JSON key file

## Step 2: Add Secrets to GitHub

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required Secrets:

| Secret Name            | Description              | How to Get                                       |
| ---------------------- | ------------------------ | ------------------------------------------------ |
| `GCP_SA_KEY`           | Service account JSON key | Paste the **entire** JSON. Name must be exactly **`GCP_SA_KEY`**. |
| `GCP_PROJECT_ID`     | GCP project ID           | Must match the JSON field **`project_id`** (same string as in `GCP_SA_KEY`). |
| `NEXT_PUBLIC_SITE_URL` | Your site URL            | `https://your-domain.com`                        |

### Optional Secrets (for full functionality):

| Secret Name           | Description   | How to Get                          |
| --------------------- | ------------- | ----------------------------------- |
| `REGION`              | GCP region    | e.g. `asia-southeast1`. If unset, workflows default to `asia-southeast1`. |
| `MONGODB_URI`         | MongoDB Atlas | Copy from Atlas dashboard           |
| `HUGGINGFACE_API_KEY` | HuggingFace   | From huggingface.co/settings/tokens |
| `UNSPLASH_ACCESS_KEY` | Unsplash      | From unsplash.com/developers        |
| `CRON_SECRET`         | Random string | Generate: `openssl rand -base64 32` |

## Step 3: Create Secrets in GCP Secret Manager

```bash
# Authenticate with gcloud
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Create secrets
echo -n 'your-value' | gcloud secrets create SECRET_NAME --data-file=-

# Example:
echo -n 'mongodb+srv://...' | gcloud secrets create mongodb-uri --data-file=-
echo -n 'hf_xxxx' | gcloud secrets create huggingface-api-key --data-file=-
echo -n 'your-secret' | gcloud secrets create cron-secret --data-file=-
echo -n 'your-key' | gcloud secrets create unsplash-access-key --data-file=-
```

## Step 4: Add Repository Variables

Go to **Settings** → **Secrets and variables** → **Variables** → **New repository variable**:

| Variable Name       | Value             |
| ------------------- | ----------------- |
| `GCP_REGION`        | `asia-southeast1` |
| `CLOUD_RUN_SERVICE` | `news-site`       |

## Step 5: Push to GitHub

```bash
git add .
git commit -m "feat: Add GitHub Actions CI/CD for GCP deployment"
git push origin main
```

## Verify Deployment

1. Go to **Actions** tab in GitHub repository
2. Watch the workflow run
3. Check Cloud Run console: https://console.cloud.google.com/run
4. Check Cloud Scheduler: `gcloud scheduler jobs list --location=asia-southeast1`

## Troubleshooting

### Error: Permission denied

- Verify GCP_SA_KEY is correct JSON
- Check service account has required roles

### Error: Secret not found

- Ensure secrets exist in GCP Secret Manager
- Check secret names match exactly

### Error: Deployment failed

- Check Cloud Run logs: `gcloud run logs read news-site --region asia-southeast1`
- Verify all environment variables are set

### Cloud Scheduler / `gcloud`: Cloud Resource Manager API disabled

If logs mention `cloudresourcemanager.googleapis.com` / `SERVICE_DISABLED`, a project **Owner** must enable [Cloud Resource Manager API](https://console.developers.google.com/apis/api/cloudresourcemanager.googleapis.com/overview) for that project once.
