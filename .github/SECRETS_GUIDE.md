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

## GitHub secrets are not enough (GCP owner, one-time)

Adding `GCP_SA_KEY` and `GCP_PROJECT_ID` in GitHub only authenticates CI. If **Cloud Scheduler** still fails, the causes are almost always **in Google Cloud**, not in GitHub:

1. **Cloud Resource Manager API disabled** — Logs show `SERVICE_DISABLED` for `cloudresourcemanager.googleapis.com`. A project **Owner** must enable it once: [Cloud Resource Manager API](https://console.developers.google.com/apis/api/cloudresourcemanager.googleapis.com/overview) (pick the correct project). Without this, IAM and many other calls fail even with a valid key.

2. **`iam.serviceAccounts.actAs` on the deploy identity** — Scheduler jobs use `--oidc-service-account-email` equal to the same `client_email` as in `GCP_SA_KEY`. Google requires that identity to be allowed **Service Account User** **on that service account resource** (a self-binding: member = that SA, role = `roles/iam.serviceAccountUser`). The deploy workflow tries to add this binding in CI, but the deploy SA often lacks `iam.serviceAccounts.setIamPolicy`, so the step only warns and Scheduler creation still fails.

**Fix (recommended):** On a machine where `gcloud auth login` is a project Owner, run:

```bash
cd /path/to/stockmarketbullionnews
chmod +x scripts/fix-gcp-owner-prereqs.sh
# Replace with your project id and the exact client_email from GCP_SA_KEY JSON:
GCP_PROJECT_ID="YOUR_PROJECT_ID" DEPLOY_SA_EMAIL="YOUR_SA@YOUR_PROJECT_ID.iam.gserviceaccount.com" ./scripts/fix-gcp-owner-prereqs.sh
```

Or point at the same JSON file you use for `GCP_SA_KEY`:

```bash
GCP_PROJECT_ID="YOUR_PROJECT_ID" GCP_SA_KEY_FILE="./your-key.json" ./scripts/fix-gcp-owner-prereqs.sh
```

Do **not** grant broad `roles/iam.serviceAccountAdmin` on the whole project unless you fully intend to; the self **Service Account User** binding above is the minimal fix for Scheduler OIDC with the same SA as the deploy key.

If you used `./scripts/setup-gcp.sh` and GitHub stores the **`github-actions@…`** key it generates, that script already enables APIs and applies this self-binding for that account. If GitHub instead uses another account (for example `rankpulse@…`), you must run the owner script once for **that** email.

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

If logs mention `cloudresourcemanager.googleapis.com` / `SERVICE_DISABLED`, a project **Owner** must enable [Cloud Resource Manager API](https://console.developers.google.com/apis/api/cloudresourcemanager.googleapis.com/overview) for that project once (often required before other IAM calls succeed).

### Cloud Scheduler: `iam.serviceAccounts.actAs` / `PERMISSION_DENIED`

Jobs are created with OIDC using the **same** email as `GCP_SA_KEY`’s `client_email`. Google requires that principal to be allowed to **act as** itself when Scheduler mints tokens.

As **Owner**, run once (replace `SA_EMAIL` with your key’s `client_email`, and `PROJECT` with `GCP_PROJECT_ID`):

```bash
SA_EMAIL="rankpulse@YOUR_PROJECT.iam.gserviceaccount.com"
PROJECT="YOUR_PROJECT"
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"
```

If you use `./scripts/setup-gcp.sh` with the default `github-actions@…` account, that script applies this binding for that account automatically. For any other deploy key, run `./scripts/fix-gcp-owner-prereqs.sh` once as Owner (see **GitHub secrets are not enough** above).
