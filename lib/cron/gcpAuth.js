/**
 * GCP Cloud Scheduler + manual cron auth.
 * - Bearer CRON_SECRET (manual / scripts)
 * - Scheduler identification headers
 * - OIDC: Bearer Google-signed JWT (Cloud Scheduler --oidc-service-account-email)
 */
import { OAuth2Client } from 'google-auth-library';

function verifyHeaders(request) {
  const cloudSchedulerHeader = request.headers.get('x-cloudscheduler');
  if (cloudSchedulerHeader === 'true') {
    return { authorized: true, source: 'cloud-scheduler-header' };
  }
  const googleHeader = request.headers.get('x-google-cloud-scheduler');
  if (googleHeader) {
    return { authorized: true, source: 'cloud-scheduler-header' };
  }
  const serviceHeader = request.headers.get('x-appengine-cron');
  if (serviceHeader === 'true') {
    return { authorized: true, source: 'app-engine' };
  }
  return null;
}

/**
 * @returns {Promise<{ authorized: boolean, source: string }>}
 */
export async function verifyGCPRequest(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return { authorized: true, source: 'development' };
  }

  if (authHeader === `Bearer ${cronSecret}`) {
    return { authorized: true, source: 'manual' };
  }

  const fromHeaders = verifyHeaders(request);
  if (fromHeaders) return fromHeaders;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token && token !== cronSecret && token.includes('.')) {
      const audience =
        process.env.CLOUD_RUN_AUDIENCE ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        '';
      if (audience) {
        try {
          const client = new OAuth2Client();
          const ticket = await client.verifyIdToken({ idToken: token, audience });
          const email = ticket.getPayload()?.email || '';
          if (email.endsWith('.gserviceaccount.com')) {
            const allowed = process.env.CLOUD_SCHEDULER_OIDC_SA;
            if (!allowed || email === allowed) {
              return { authorized: true, source: 'cloud-scheduler-oidc' };
            }
          }
        } catch {
          // fall through
        }
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    const allHeaders = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log('Cron request headers:', JSON.stringify(allHeaders, null, 2));
  }

  return { authorized: false, source: 'unauthorized' };
}

export async function verifySchedulerRequest(request, _serviceAccountEmail) {
  return verifyGCPRequest(request);
}

export function getSchedulerJobConfig(jobName, schedule = '0 */6 * * *') {
  return {
    name: jobName,
    schedule,
    timeZone: 'Asia/Kolkata',
    description: `Automated news pipeline - ${jobName}`,
  };
}
