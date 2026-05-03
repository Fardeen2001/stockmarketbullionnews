/**
 * Webmaster tokens management API
 * GET    /api/admin/webmaster                    - list all connected providers (optional ?provider=)
 * POST   /api/admin/webmaster/connect/:provider  - start OAuth (dedicated route, not this file)
 * POST   /api/admin/webmaster?action=refresh|disconnect&provider=
 */

import { NextResponse } from 'next/server';
import { getWebmasterTokensCollection } from '@/lib/db';
import { ensureWebmasterCollection, createWebmasterIndexes } from '@/lib/models/WebmasterToken';
import { getDatabase } from '@/lib/db';
import { getValidAccessToken } from '@/lib/webmaster/oauth';

const VALID_PROVIDERS = ['google', 'bing', 'yandex'];

// GET /api/admin/webmaster - list all provider statuses
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.has('action')) {
      return NextResponse.json(
        {
          error:
            'GET does not support OAuth actions. Use POST /api/admin/webmaster/connect/{google|bing|yandex} to connect.',
        },
        { status: 405 }
      );
    }
    const provider = searchParams.get('provider');

    const db = await getDatabase();
    await ensureWebmasterCollection(db);
    const collection = await getWebmasterTokensCollection();

    if (provider) {
      if (!VALID_PROVIDERS.includes(provider)) {
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
      }
      const token = await collection.findOne({ provider });
      return NextResponse.json(formatTokenResponse(token, provider));
    }

    // Return all providers
    const tokens = await collection.find({}).toArray();
    const response = {};
    for (const p of VALID_PROVIDERS) {
      const t = tokens.find(t => t.provider === p);
      response[p] = formatTokenResponse(t, p);
    }
    return NextResponse.json(response);
  } catch (err) {
    console.error('[Webmaster API] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/webmaster - connect, refresh, disconnect
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const provider = searchParams.get('provider');

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'connect':
        return NextResponse.json(
          {
            error:
              'Use POST /api/admin/webmaster/connect/{google|bing|yandex} to start OAuth (not action=connect here).',
          },
          { status: 400 }
        );

      case 'refresh': {
        if (!provider || !VALID_PROVIDERS.includes(provider)) {
          return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }
        const db = await getDatabase();
        await ensureWebmasterCollection(db);
        const collection = await getWebmasterTokensCollection();
        const token = await collection.findOne({ provider });

        if (!token) {
          return NextResponse.json({ error: 'No token found for provider' }, { status: 404 });
        }

        const refreshed = await getValidAccessToken(provider, token);

        await collection.updateOne(
          { provider },
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

        return NextResponse.json({
          success: true,
          expiresAt: refreshed.expiresAt,
        });
      }

      case 'disconnect': {
        if (!provider || !VALID_PROVIDERS.includes(provider)) {
          return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }
        const db = await getDatabase();
        await ensureWebmasterCollection(db);
        const collection = await getWebmasterTokensCollection();
        await collection.updateOne(
          { provider },
          {
            $set: {
              status: 'disconnected',
              disconnectedAt: new Date(),
            },
            $unset: {
              accessToken: '',
              refreshToken: '',
              expiresAt: '',
            },
          }
        );
        return NextResponse.json({ success: true, provider });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[Webmaster API] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function formatTokenResponse(token, provider) {
  if (!token) {
    return { connected: false, provider };
  }

  const now = new Date();
  const isExpired = token.expiresAt && token.expiresAt < now;
  const isExpiringSoon = token.expiresAt &&
    (token.expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000;

  return {
    connected: token.status === 'active' && !!token.accessToken,
    provider,
    status: isExpired ? 'expired' : isExpiringSoon ? 'expiring_soon' : token.status,
    connectedAt: token.connectedAt,
    lastRefreshAt: token.lastRefreshAt,
    expiresAt: token.expiresAt,
    siteUrl: token.siteUrl,
    metadata: token.metadata,
  };
}