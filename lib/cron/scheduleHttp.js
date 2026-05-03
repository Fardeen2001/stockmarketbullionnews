/**
 * Google Cloud Scheduler HTTP targets use POST by default. Next.js App Router
 * requires one export per HTTP method, so a GET-only route returns 405 for
 * Scheduler unless POST is also implemented.
 *
 * @param {(request: Request) => Promise<Response>} handler
 * @returns {{ GET: typeof handler, POST: typeof handler }}
 */
export function bindSchedulerHttpMethods(handler) {
  return { GET: handler, POST: handler };
}
