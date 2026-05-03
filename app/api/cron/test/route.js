import { NextResponse } from 'next/server';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';
import { bindSchedulerHttpMethods } from '@/lib/cron/scheduleHttp';

/**
 * Test endpoint to verify Cloud Scheduler job configuration
 * This endpoint helps debug cron job issues by showing:
 * - All incoming headers
 * - Authentication status
 * - Environment variables (masked)
 */
async function handleCron(request) {
  const authResult = await verifyGCPRequest(request);
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
    googleCloud: !!process.env.GOOGLE_CLOUD_PROJECT,
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
      cloudScheduler: 'Cloud Scheduler sends x-cloudscheduler header or uses OIDC',
      manualTrigger: 'Use Authorization: Bearer YOUR_CRON_SECRET header',
      development: 'If CRON_SECRET is not set, all requests are allowed (development mode)',
    },
  });
}

export const { GET, POST } = bindSchedulerHttpMethods(handleCron, { jobName: 'test' });
