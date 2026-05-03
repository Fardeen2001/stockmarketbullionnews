#!/bin/bash

# GCP Deployment Script for StockMarket Bullion News
# Usage: ./scripts/gcp-deploy.sh [environment]

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="asia-southeast1"
SERVICE_NAME="news-site"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Parse arguments
ENV="${1:-production}"

echo "=========================================="
echo "GCP Deployment - ${ENV}"
echo "=========================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "Setting project to: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

# Enable required APIs
echo "Enabling required GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudscheduler.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com \
    --quiet

# Build and push Docker image
echo "Building Docker image..."
docker build -t "${IMAGE}:latest" .

echo "Pushing to Container Registry..."
docker push "${IMAGE}:latest"

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
    --image "${IMAGE}:latest" \
    --region "${REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --timeout 600 \
    --concurrency 80 \
    --min-instances 1 \
    --max-instances 10

# Get service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format 'value(status.url)')
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "Service URL: ${SERVICE_URL}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Setup Cloud Scheduler: ./scripts/setup-cloud-scheduler.sh"
echo "2. Configure secrets in Secret Manager"
echo ""