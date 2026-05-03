/**
 * Webmaster Tools URL Indexing Service
 * Submits URLs to: Google Search Console, Bing Webmaster, Yandex, Baidu
 * Now reads tokens from database (webmasterTokens collection) instead of env vars.
 */

import { getNewsCollection, getWebmasterTokensCollection } from '@/lib/db';
import { getValidAccessToken } from './oauth';
import { runIndexNewArticles } from './indexNewArticles.js';

export class WebmasterIndexer {
  constructor(config = {}) {
    this.siteUrl = config.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://stockmarketbullion.com';
    this.fallbackGscApiKey = config.gscApiKey || process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
    this.fallbackGscSiteUrl = config.gscSiteUrl || process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
    this.fallbackBingApiKey = config.bingApiKey || process.env.BING_WEBMASTER_API_KEY;
    this.fallbackYandexToken = config.yandexToken || process.env.YANDEX_WEBMASTER_TOKEN;
  }

  /**
   * Load tokens from DB. Returns { google, bing, yandex } token objects.
   */
  async loadTokensFromDb() {
    const collection = await getWebmasterTokensCollection();
    const tokens = await collection.find({ status: 'active' }).toArray();
    const result = {};
    for (const t of tokens) {
      result[t.provider] = t;
    }
    return result;
  }

  /**
   * Get valid access token for a provider, refreshing if needed.
   * Updates DB if token was refreshed.
   */
  async getToken(provider, dbTokens) {
    const stored = dbTokens[provider];
    if (!stored) return null;

    try {
      const refreshed = await getValidAccessToken(provider, stored);

      // If token was refreshed, persist it back to DB
      if (refreshed.accessToken !== stored.accessToken) {
        const collection = await getWebmasterTokensCollection();
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
      }

      return refreshed.accessToken;
    } catch (err) {
      console.error(`[WebmasterIndexer] Token refresh failed for ${provider}:`, err.message);
      // Mark as expired in DB
      const collection = await getWebmasterTokensCollection();
      await collection.updateOne(
        { provider },
        { $set: { status: 'expired', lastUsedAt: new Date() } }
      );
      return null;
    }
  }

  async initialize() {
    console.log('[WebmasterIndexer] Initializing...');
    console.log('[WebmasterIndexer] Site URL:', this.siteUrl);
    this.dbTokens = await this.loadTokensFromDb();
    console.log('[WebmasterIndexer] Google configured:', !!this.dbTokens.google?.accessToken || !!this.fallbackGscApiKey);
    console.log('[WebmasterIndexer] Bing configured:', !!this.dbTokens.bing?.accessToken || !!this.fallbackBingApiKey);
    console.log('[WebmasterIndexer] Yandex configured:', !!this.dbTokens.yandex?.accessToken || !!this.fallbackYandexToken);
  }

  /**
   * Submit URL to Google Search Console Indexing API v3
   */
  async submitToGSC(url, accessToken) {
    const endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    let token = accessToken;

    if (!token && credentials) {
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth({
        credentials: JSON.parse(credentials),
        scopes: ['https://www.googleapis.com/auth/indexing'],
      });
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      token = tokenResponse.token;
    }

    if (!token) {
      throw new Error('No GSC credentials configured');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type: 'URL_UPDATED' }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GSC API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Submit URL to Bing Webmaster API
   */
  async submitToBing(url, apiKey) {
    if (!apiKey) {
      console.log('[WebmasterIndexer] Bing API key not configured, skipping');
      return null;
    }

    const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl?apikey=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteUrl: this.siteUrl, url }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Bing API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Submit URL to Yandex Webmaster API
   */
  async submitToYandex(url, accessToken) {
    if (!accessToken) {
      console.log('[WebmasterIndexer] Yandex token not configured, skipping');
      return null;
    }

    const endpoint = 'https://api.webmaster.yandex.net/v4/user/';

    const hostsResponse = await fetch(endpoint + 'hosts', {
      headers: { 'Authorization': `OAuth ${accessToken}` },
    });

    if (!hostsResponse.ok) {
      throw new Error(`Yandex auth error: ${hostsResponse.status}`);
    }

    const hostsData = await hostsResponse.json();
    const hostId = hostsData?.hosts?.[0]?.host_id;

    if (!hostId) {
      throw new Error('No Yandex host found for this site');
    }

    const submitEndpoint = `${endpoint}hosts/${hostId}/urls/`;
    const response = await fetch(submitEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `OAuth ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ href: url }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Yandex API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Batch submit multiple URLs
   */
  async batchSubmit(urls) {
    if (!this.dbTokens) {
      this.dbTokens = await this.loadTokensFromDb();
    }

    const googleToken = await this.getToken('google', this.dbTokens);
    const bingToken = await this.getToken('bing', this.dbTokens);
    const yandexToken = await this.getToken('yandex', this.dbTokens);

    const results = {
      success: [],
      failed: [],
    };

    for (const url of urls) {
      try {
        if (googleToken || this.fallbackGscApiKey) {
          await this.submitToGSC(url, googleToken || this.fallbackGscApiKey);
        }
        if (bingToken || this.fallbackBingApiKey) {
          await this.submitToBing(url, bingToken || this.fallbackBingApiKey);
        }
        if (yandexToken || this.fallbackYandexToken) {
          await this.submitToYandex(url, yandexToken || this.fallbackYandexToken);
        }
        results.success.push(url);
      } catch (err) {
        results.failed.push({ url, error: err.message });
      }

      await new Promise(r => setTimeout(r, 300));
    }

    return results;
  }

  async close() {
    console.log('[WebmasterIndexer] Closed');
  }
}

// Implemented outside the class body so a stray `}` in this file cannot
// leave `async indexNewArticles()` at module scope (invalid syntax / Turbopack error).
WebmasterIndexer.prototype.indexNewArticles = async function indexNewArticles(options = {}) {
  return runIndexNewArticles(this, options);
};

export default WebmasterIndexer;