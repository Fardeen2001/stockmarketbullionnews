import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Cloud Run
 * Used for container health checks and load balancer
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'stockmarket-bullion-news',
    version: process.env.npm_package_version || '1.0.0',
  });
}
