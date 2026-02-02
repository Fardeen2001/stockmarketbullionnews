/**
 * Vercel Cron Job Authentication Utility
 * 
 * Handles authentication for cron jobs from:
 * 1. Vercel's automatic cron triggers (x-vercel-cron header)
 * 2. Manual triggers with CRON_SECRET Bearer token
 * 3. Development mode (when CRON_SECRET is not set)
 */

export function verifyCronRequest(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Development mode: allow if no secret is set
  if (!cronSecret) {
    return { authorized: true, source: 'development' };
  }
  
  // Manual trigger with Bearer token
  if (authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true, source: 'manual' };
  }
  
  // Vercel automatic cron trigger
  // Vercel sends the header in various formats:
  // - x-vercel-cron: true
  // - x-vercel-cron: 1
  // - X-Vercel-Cron: true (case variations)
  const vercelCronHeader = request.headers.get('x-vercel-cron') || 
                           request.headers.get('X-Vercel-Cron');
  
  if (vercelCronHeader === 'true' || vercelCronHeader === '1' || vercelCronHeader === 'True') {
    return { authorized: true, source: 'vercel-cron' };
  }
  
  // Log all headers for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    const allHeaders = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log('Cron request headers:', JSON.stringify(allHeaders, null, 2));
  }
  
  return { authorized: false, source: 'unauthorized' };
}
