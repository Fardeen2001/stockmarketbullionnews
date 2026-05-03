/**
 * OAuth callback handler for webmaster integrations
 * Handles return from Google, Bing, Yandex OAuth flows
 */

import { NextResponse } from 'next/server';
import {
  exchangeGoogleCode,
  exchangeBingCode,
  exchangeYandexCode,
} from '@/lib/webmaster/oauth';
import { verifyWebmasterOAuthState } from '@/lib/webmaster/oauth-state';
import { getDatabase, getWebmasterTokensCollection } from '@/lib/db';
import { ensureWebmasterCollection } from '@/lib/models/WebmasterToken';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      return NextResponse.redirect(
        new URL(`/admin/settings?webmaster_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !provider) {
      return NextResponse.redirect(
        new URL('/admin/settings?webmaster_error=missing_params', request.url)
      );
    }

    const stateOk = verifyWebmasterOAuthState(state);
    if (!stateOk || stateOk.provider !== provider) {
      return NextResponse.redirect(
        new URL('/admin/settings?webmaster_error=invalid_or_expired_oauth_state', request.url)
      );
    }

    let tokens;
    let metadata = {};

    // Exchange code for tokens based on provider
    switch (provider) {
      case 'google':
        tokens = await exchangeGoogleCode(code);
        break;
      case 'bing':
        tokens = await exchangeBingCode(code);
        break;
      case 'yandex':
        tokens = await exchangeYandexCode(code);
        metadata = {
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://stockmarketbullion.com',
        };
        break;
      default:
        return NextResponse.redirect(
          new URL('/admin/settings?webmaster_error=unknown_provider', request.url)
        );
    }

    // Store tokens in database
    const db = await getDatabase();
    await ensureWebmasterCollection(db);
    const collection = await getWebmasterTokensCollection();

    await collection.updateOne(
      { provider },
      {
        $set: {
          ...tokens,
          metadata,
          status: 'active',
          connectedAt: new Date(),
          lastRefreshAt: new Date(),
        },
        $setOnInsert: {
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://stockmarketbullion.com',
        },
      },
      { upsert: true }
    );

    return NextResponse.redirect(
      new URL('/admin/settings?webmaster_success=' + provider, request.url)
    );
  } catch (err) {
    console.error('[Webmaster Callback] Error:', err);
    return NextResponse.redirect(
      new URL(`/admin/settings?webmaster_error=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}