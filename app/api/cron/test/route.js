import { NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/utils/cronAuth';

/**
 * Test endpoint to verify Vercel cron job configuration
 * This endpoint helps debug cron job issues by showing:
 * - All incoming headers
 * - Authentication status
 * - Environment variables (masked)
 */
export async function GET(request) {
  const authResult = verifyCronRequest(request);
  const timestamp = new Date().toISOString();
  
  // Collect all headers
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  // Check environment
  const envInfo = {
    hasCronSecret: !!process.env.CRON_SECRET,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
  };
  
  return NextResponse.json({
    success: true,
    timestamp,
    authorized: authResult.authorized,
    source: authResult.source,
    headers,
    environment: envInfo,
    message: authResult.authorized 
      ? 'Cron job authentication successful!' 
      : 'Cron job authentication failed. Check headers and CRON_SECRET.',
    instructions: {
      vercelCron: 'Vercel should send x-vercel-cron header with value "true" or "1"',
      manualTrigger: 'Use Authorization: Bearer YOUR_CRON_SECRET header',
      development: 'If CRON_SECRET is not set, all requests are allowed (development mode)',
    },
  });
}
