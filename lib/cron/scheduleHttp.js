import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

/**
 * Google Cloud Scheduler HTTP targets use POST by default. Next.js App Router
 * requires one export per HTTP method, so a GET-only route returns 405 for
 * Scheduler unless POST is also implemented.
 *
 * Uncaught errors are converted to JSON 503 with `job` and `error` so Cloud
 * Scheduler and Log Explorer show a clear failure instead of an opaque 500.
 *
 * @param {(request: Request) => Promise<Response>} handler
 * @param {{ jobName?: string }} [options] Pass jobName (e.g. route segment) for logs and JSON.
 * @returns {{ GET: (request: Request) => Promise<Response>, POST: (request: Request) => Promise<Response> }}
 */
export function bindSchedulerHttpMethods(handler, options = {}) {
  const jobName = options.jobName || 'cron';

  async function wrapped(request) {
    try {
      return await handler(request);
    } catch (error) {
      const message = error?.message || String(error) || 'Internal error';
      logger.error(`Cron job uncaught exception: ${jobName}`, {
        error: message,
        stack: error?.stack,
      });
      return NextResponse.json(
        {
          success: false,
          fatal: true,
          error: message,
          job: jobName,
        },
        { status: 503 }
      );
    }
  }

  return { GET: wrapped, POST: wrapped };
}
