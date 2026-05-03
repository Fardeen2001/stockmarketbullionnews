#!/usr/bin/env bash
# One-time fix for Cloud Scheduler + IAM failures in CI (run as Project Owner).
#
# Fixes:
#   1) SERVICE_DISABLED on cloudresourcemanager.googleapis.com (and related APIs)
#   2) PERMISSION_DENIED iam.serviceAccounts.actAs when creating Scheduler HTTP jobs
#      with --oidc-service-account-email = the same SA as the GitHub deploy key
#
# Usage (pick ONE way to pass the deploy SA email — same as GCP_SA_KEY client_email):
#   GCP_PROJECT_ID=your-project-id DEPLOY_SA_EMAIL=rankpulse@your-project-id.iam.gserviceaccount.com ./scripts/fix-gcp-owner-prereqs.sh
#
# Or derive email from the same JSON you pasted into GitHub as GCP_SA_KEY:
#   GCP_PROJECT_ID=your-project-id GCP_SA_KEY_FILE=./path/to-key.json ./scripts/fix-gcp-owner-prereqs.sh
#
# Requires: gcloud authenticated as a principal with Owner (or equivalent) on the project.

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-}"
SA_EMAIL="${DEPLOY_SA_KEY_EMAIL:-${DEPLOY_SA_EMAIL:-}}"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: Set GCP_PROJECT_ID to your Google Cloud project ID (same as GitHub secret GCP_PROJECT_ID)."
  exit 1
fi

if [ -z "$SA_EMAIL" ] && [ -n "${GCP_SA_KEY_FILE:-}" ]; then
  if [ ! -f "$GCP_SA_KEY_FILE" ]; then
    echo "Error: GCP_SA_KEY_FILE=$GCP_SA_KEY_FILE not found."
    exit 1
  fi
  SA_EMAIL="$(jq -r .client_email "$GCP_SA_KEY_FILE")"
  KEY_PROJECT="$(jq -r .project_id "$GCP_SA_KEY_FILE")"
  if [ "$KEY_PROJECT" != "$PROJECT_ID" ]; then
    echo "Error: GCP_PROJECT_ID ($PROJECT_ID) does not match project_id in JSON ($KEY_PROJECT)."
    exit 1
  fi
fi

if [ -z "$SA_EMAIL" ] || [ "$SA_EMAIL" = "null" ]; then
  echo "Error: Set DEPLOY_SA_EMAIL (or DEPLOY_SA_KEY_EMAIL) to the service account in GitHub secret GCP_SA_KEY,"
  echo "       or set GCP_SA_KEY_FILE to that JSON file."
  exit 1
fi

echo "Project:  $PROJECT_ID"
echo "Deploy SA (Scheduler OIDC / GitHub key): $SA_EMAIL"
echo ""

gcloud config set project "$PROJECT_ID"

echo "Enabling APIs (Owner)..."
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

echo ""
echo "Granting Scheduler OIDC prerequisite: this SA may act as itself (Service Account User on resource)..."
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

echo ""
echo "Done. Re-run the GitHub Actions deploy workflow."
echo "If Scheduler still fails, ensure this SA has roles/cloudscheduler.admin (or equivalent) on the project"
