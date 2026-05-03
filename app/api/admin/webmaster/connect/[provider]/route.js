import { NextResponse } from 'next/server';
import { getWebmasterAuthUrl } from '@/lib/webmaster/oauth';
import { createWebmasterOAuthState } from '@/lib/webmaster/oauth-state';

const VALID_PROVIDERS = new Set(['google', 'bing', 'yandex']);

/**
 * POST /api/admin/webmaster/connect/:provider
 * Start OAuth — returns { authUrl }. Uses signed `state` (no GET/connect footgun).
 */
export async function POST(request, context) {
  try {
    const { provider } = await context.params;
    if (!VALID_PROVIDERS.has(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const state = createWebmasterOAuthState(provider);
    const authUrl = getWebmasterAuthUrl(provider, state);
    return NextResponse.json({ authUrl, provider });
  } catch (err) {
    console.error('[Webmaster connect]', err);
    const status = err.message?.includes('not configured') ? 503 : 500;
    return NextResponse.json({ error: err.message || 'Connect failed' }, { status });
  }
}
