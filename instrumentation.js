/**
 * Next.js Instrumentation Hook
 *
 * This file must stay Edge-safe: Turbopack analyzes it for the Edge runtime.
 * Node-only logic (process.stderr, emitWarning overrides) lives in
 * instrumentation.node.js and is loaded only on the Node server runtime.
 */

export async function register() {
  if (typeof process === 'undefined') return;
  if (process.env.NEXT_RUNTIME === 'edge') return;

  await import('./instrumentation.node.js');

  if (process.env.NODE_ENV === 'development') {
    console.log('[Instrumentation] Deprecation warning suppression enabled');
  }
}
