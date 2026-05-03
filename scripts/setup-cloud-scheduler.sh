#!/bin/bash

# Complete Cloud Scheduler Setup for StockMarket Bullion News
# Creates all scheduled jobs for the news pipeline.
#
# OIDC identity: set SERVICE_ACCOUNT_EMAIL to the SA that should mint tokens (GitHub Actions:
# same as GCP_SA_KEY client_email). If SERVICE_ACCOUNT_EMAIL is unset, the script falls back to
# creating/using legacy news-pipeline@... (owner gcloud only).

set -e

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/gcloud-list-formats.sh
source "${_SCRIPT_DIR}/lib/gcloud-list-formats.sh"

PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${REGION:-asia-southeast1}"
SERVICE_URL="${SERVICE_URL:-https://your-service-url.run.app}"
SA_EMAIL="${SERVICE_ACCOUNT_EMAIL}"

if [ -z "$SA_EMAIL" ] && [ "${GITHUB_ACTIONS:-}" = "true" ]; then
    echo "Error: SERVICE_ACCOUNT_EMAIL is empty. In GitHub Actions this must be the deploy key client_email (see deploy workflow resolve step). GitHub often strips this value from cross-job outputs when it matches a secret."
    exit 1
fi

echo "=========================================="
echo "Complete Cloud Scheduler Setup"
echo "=========================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
gcloud config set project "${PROJECT_ID}"

# Best-effort: CRM + Scheduler APIs must be on for IAM and job lifecycle. Owner may need to run
# scripts/fix-gcp-owner-prereqs.sh if the deploy key lacks serviceusage.services.enable.
echo "Ensuring Cloud Resource Manager and Cloud Scheduler APIs (best-effort)..."
for _api in cloudresourcemanager.googleapis.com cloudscheduler.googleapis.com; do
    if ! gcloud services enable "${_api}" --project="${PROJECT_ID}" --quiet; then
        echo "::warning::Could not enable ${_api}. If logs show SERVICE_DISABLED, a project Owner must enable it once (see scripts/fix-gcp-owner-prereqs.sh)."
    fi
done
echo ""

# Create service account if not exists
if [ -z "$SA_EMAIL" ]; then
    SA_EMAIL="news-pipeline@${PROJECT_ID}.iam.gserviceaccount.com"
    echo "Creating service account: ${SA_EMAIL}"

    # Check if SA exists
    if ! gcloud iam service-accounts describe "${SA_EMAIL}" &> /dev/null 2>/dev/null; then
        gcloud iam service-accounts create news-pipeline \
            --display-name="News Pipeline Service Account" \
            --description="Service account for Cloud Scheduler and Cloud Run"
    fi

    # Grant roles to service account
    echo "Granting roles to service account..."
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/run.admin" 2>/dev/null || true

    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/cloudscheduler.admin" 2>/dev/null || true

    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/secretmanager.secretAccessor" 2>/dev/null || true
fi

echo ""
echo "Service Account: ${SA_EMAIL}"
echo "Service URL: ${SERVICE_URL}"
echo ""

# Create or update a scheduler HTTP job (idempotent: no delete — delete was failing silently
# when APIs/IAM were misconfigured, then create hit ALREADY_EXISTS).
create_or_update_job() {
    local JOB_NAME=$1
    local SCHEDULE=$2
    local URI=$3
    local DESCRIPTION=$4
    local TIMEZONE=$5
    # Scheduler HTTP jobs default to POST; these Next.js routes only implement GET.

    local -a tz_args=()
    if [ -n "${TIMEZONE}" ]; then
        tz_args=(--time-zone="${TIMEZONE}")
    fi

    local verb=create
    if gcloud scheduler jobs describe "${JOB_NAME}" --location="${REGION}" &>/dev/null; then
        verb=update
        echo "Updating job: ${JOB_NAME} (${SCHEDULE})"
        gcloud scheduler jobs update http "${JOB_NAME}" \
            --location="${REGION}" \
            --schedule="${SCHEDULE}" \
            "${tz_args[@]}" \
            --http-method=GET \
            --uri="${URI}" \
            --oidc-service-account-email="${SA_EMAIL}" \
            --oidc-token-audience="${SERVICE_URL}" \
            --description="${DESCRIPTION}" \
            --quiet
        echo "  ✓ ${JOB_NAME} updated"
    else
        echo "Creating job: ${JOB_NAME} (${SCHEDULE})"
        gcloud scheduler jobs create http "${JOB_NAME}" \
            --location="${REGION}" \
            --schedule="${SCHEDULE}" \
            "${tz_args[@]}" \
            --http-method=GET \
            --uri="${URI}" \
            --oidc-service-account-email="${SA_EMAIL}" \
            --oidc-token-audience="${SERVICE_URL}" \
            --description="${DESCRIPTION}" \
            --quiet
        echo "  ✓ ${JOB_NAME} created"
    fi
}

echo ""
echo "Creating scheduled jobs..."
echo ""

# ============================================
# DAILY JOBS (Every 6 hours via main pipeline)
# ============================================

# Main Pipeline - Every 6 hours
create_or_update_job \
    "news-pipeline-6h" \
    "0 */6 * * *" \
    "${SERVICE_URL}/api/cron/full-workflow" \
    "Main pipeline: Scrape → Trends → Generate → Index (Every 6 hours)"

echo ""

# ============================================
# WEEKLY JOBS
# ============================================

# Full Workflow - Sunday 5 AM IST (Comprehensive weekly run)
create_or_update_job \
    "news-full-weekly" \
    "0 5 * * 0" \
    "${SERVICE_URL}/api/cron/full-workflow" \
    "Weekly comprehensive pipeline run (Sunday 5 AM IST)" \
    "Asia/Kolkata"

# Update Sharia Compliance - Sunday Midnight IST
create_or_update_job \
    "news-update-sharia" \
    "0 0 * * 0" \
    "${SERVICE_URL}/api/cron/update-sharia" \
    "Weekly Sharia compliance data update (Sunday midnight IST)" \
    "Asia/Kolkata"

echo ""

# ============================================
# STOCKS & METALS DATA JOBS
# ============================================

# Update Stock Prices - Daily at Midnight IST
create_or_update_job \
    "news-update-stocks" \
    "0 0 * * *" \
    "${SERVICE_URL}/api/cron/update-stocks" \
    "Daily stock price updates (Midnight IST)" \
    "Asia/Kolkata"

# Update Metal Prices - Daily at 3 AM IST
create_or_update_job \
    "news-update-metals" \
    "0 3 * * *" \
    "${SERVICE_URL}/api/cron/update-metals" \
    "Daily precious metals price updates (3 AM IST)" \
    "Asia/Kolkata"

echo ""

# ============================================
# CONTENT PIPELINE JOBS
# ============================================

# Scrape News - Daily at 6 AM IST
create_or_update_job \
    "news-scrape" \
    "0 6 * * *" \
    "${SERVICE_URL}/api/cron/scrape-news-v2" \
    "Daily news scraping from sources (6 AM IST)" \
    "Asia/Kolkata"

# Detect Trends - Daily at 9 AM IST
create_or_update_job \
    "news-detect-trends" \
    "0 9 * * *" \
    "${SERVICE_URL}/api/cron/detect-trends" \
    "Daily trend detection analysis (9 AM IST)" \
    "Asia/Kolkata"

# Generate Articles - Daily at Noon IST
create_or_update_job \
    "news-generate-articles" \
    "0 12 * * *" \
    "${SERVICE_URL}/api/cron/generate-articles-v2" \
    "Daily article generation from trends (Noon IST)" \
    "Asia/Kolkata"

# Update Sitemap - Daily at 1 PM IST
create_or_update_job \
    "news-update-sitemap" \
    "0 13 * * *" \
    "${SERVICE_URL}/api/cron/update-sitemap" \
    "Daily sitemap update for SEO (1 PM IST)" \
    "Asia/Kolkata"

echo ""
echo "=========================================="
echo "Cloud Scheduler Setup Complete!"
echo "=========================================="
echo ""
echo "Jobs created:"
echo ""
gcloud scheduler jobs list --location="${REGION}" --format="${GCLOUD_SCHEDULER_JOBS_LIST_FORMAT}"
echo ""
echo "=========================================="
echo "CRON SCHEDULE SUMMARY"
echo "=========================================="
echo ""
echo "DAILY SCHEDULE (IST):"
echo "  00:00 - Update Stocks"
echo "  03:00 - Update Metals"
echo "  06:00 - Scrape News"
echo "  06:00 - Full Workflow (every 6 hours)"
echo "  09:00 - Detect Trends"
echo "  12:00 - Generate Articles"
echo "  13:00 - Update Sitemap"
echo ""
echo "WEEKLY (IST):"
echo "  Sunday 00:00 - Update Sharia"
echo "  Sunday 05:00 - Full Weekly Pipeline"
echo ""
echo "MANUAL TRIGGERS:"
echo "  ${SERVICE_URL}/api/cron/full-workflow"
echo ""