/**
 * Refresh all webmaster tokens before they expire
 * POST /api/cron/refresh-tokens
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from 'next/server';
import { getWebmasterTokensCollection } from '@/lib/db';
import { getValidAccessToken } from '@/lib/webmaster/oauth';
import { verifyGCPRequest } from '@/lib/cron/gcpAuth';

export async function POST(request) {
  try {
    const authResult = await verifyGCPRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collection = await getWebmasterTokensCollection();
    const tokens = await collection.find({ status: 'active' }).toArray();

    const results = { refreshed: [], failed: [] };

    for (const token of tokens) {
      try {
        const refreshed = await getValidAccessToken(token.provider, token);

        await collection.updateOne(
          { provider: token.provider },
          {
            $set: {
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              expiresAt: refreshed.expiresAt,
              lastRefreshAt: new Date(),
              status: 'active',
            },
          }
        );

        results.refreshed.push(token.provider);
      } catch (err) {
        console.error(`[Refresh Tokens] Failed for ${token.provider}:`, err.message);
        results.failed.push({ provider: token.provider, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      refreshed: results.refreshed,
      failed: results.failed,
    });
  } catch (err) {
    console.error('[Refresh Tokens] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}