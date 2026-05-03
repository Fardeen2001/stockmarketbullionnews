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

# Enable required APIs (run while authenticated as a project Owner)
echo "Enabling GCP APIs..."
gcloud services enable \
    cloudresourcemanager.googleapis.com \
    serviceusage.googleapis.com \
    run.googleapis.com \
    cloudscheduler.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com \
    artifactregistry.googleapis.com \
    iam.googleapis.com \
    --quiet

echo "APIs enabled successfully"

# Create service account for GitHub Actions
echo "Creating GitHub Actions service account..."
GHA_SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$GHA_SA_EMAIL" 2>/dev/null; then
    gcloud iam service-accounts create github-actions \
        --display-name="GitHub Actions Service Account" \
        --description="Service account for GitHub Actions CI/CD"
fi

# Grant roles
echo "Granting roles to GitHub Actions service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$GHA_SA_EMAIL" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$GHA_SA_EMAIL" \
    --role="roles/cloudscheduler.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$GHA_SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$GHA_SA_EMAIL" \
    --role="roles/container.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$GHA_SA_EMAIL" \
    --role="roles/artifactregistry.writer"

# Cloud Scheduler OIDC uses this same SA; creating jobs requires actAs on that identity.
gcloud iam service-accounts add-iam-policy-binding "$GHA_SA_EMAIL" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:${GHA_SA_EMAIL}" \
    --role="roles/iam.serviceAccountUser" \
    --quiet

echo "GitHub Actions SA created: $GHA_SA_EMAIL"

# Create JSON key for GitHub Actions
echo "Creating service account key..."
KEY_FILE="gcp-sa-key.json"
gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$GHA_SA_EMAIL"

echo "Key created: $KEY_FILE"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. ADD TO GITHUB SECRETS:"
echo "   - Name: GCP_SA_KEY"
echo "   - Value: (paste entire content of $KEY_FILE)"
echo ""
echo "2. ADD TO GITHUB SECRETS:"
echo "   - Name: GCP_PROJECT_ID"
echo "   - Value: $PROJECT_ID"
echo ""
echo "3. ADD TO GITHUB SECRETS:"
echo "   - Name: GCP_SA_EMAIL"
echo "   - Value: $GHA_SA_EMAIL"
echo ""
echo "4. CREATE SECRETS IN GCP SECRET MANAGER:"
echo ""
echo '   echo -n "your-mongodb-uri" | gcloud secrets create mongodb-uri --data-file=-'
echo '   echo -n "your-hf-key" | gcloud secrets create huggingface-api-key --data-file=-'
echo '   echo -n "your-cron-secret" | gcloud secrets create cron-secret --data-file=-'
echo '   echo -n "your-unsplash-key" | gcloud secrets create unsplash-access-key --data-file=-'
echo ""
echo "5. PUSH TO GITHUB to trigger deployment"
echo ""
echo "=========================================="

# Cleanup
rm -f "$KEY_FILE" 2>/dev/null || true