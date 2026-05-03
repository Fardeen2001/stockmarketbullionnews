/**
 * OAuth 2.0 flows for webmaster tools integrations
 * Handles: Google Search Console (Indexing API), Bing Webmaster, Yandex Webmaster
 */

/** Canonical public site origin — OAuth redirect URIs must match this host in each provider console. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stockmarketbullion.com';

/**
 * Get the OAuth callback URL for a provider
 */
export function getCallbackUrl(provider) {
  return `${SITE_URL}/api/admin/webmaster/callback?provider=${provider}`;
}

// ─── Google Search Console ─────────────────────────────────────────────────

/**
 * Get Google OAuth authorization URL for Search Console Indexing API
 */
export function getGoogleAuthUrl(state) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_OAUTH_CLIENT_ID not configured');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getCallbackUrl('google'),
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/indexing',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Exchange Google auth code for tokens (returns accessToken, refreshToken, expiresAt)
 */
export async function exchangeGoogleCode(code) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getCallbackUrl('google'),
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh Google access token using refresh token
 */
export async function refreshGoogleToken(refreshToken) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token refresh failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken, // unchanged
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

// ─── Bing Webmaster ────────────────────────────────────────────────────────

/**
 * Get Bing Webmaster OAuth authorization URL
 */
export function getBingAuthUrl(state) {
  const clientId = process.env.BING_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error('BING_OAUTH_CLIENT_ID not configured');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getCallbackUrl('bing'),
    response_type: 'code',
    scope: 'api.websites',
    state,
  });

  return `https://oauth.live.com/authorize?${params}`;
}

/**
 * Exchange Bing auth code for tokens (Bing uses Microsoft identity)
 */
export async function exchangeBingCode(code) {
  const clientId = process.env.BING_OAUTH_CLIENT_ID;
  const clientSecret = process.env.BING_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Bing OAuth credentials not configured');
  }

  // Bing Webmaster uses Microsoft identity platform
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getCallbackUrl('bing'),
      grant_type: 'authorization_code',
      code,
      scope: 'api.websites',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bing token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh Bing access token
 */
export async function refreshBingToken(refreshToken) {
  const clientId = process.env.BING_OAUTH_CLIENT_ID;
  const clientSecret = process.env.BING_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Bing OAuth credentials not configured');
  }

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'api.websites',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bing token refresh failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

// ─── Yandex Webmaster ─────────────────────────────────────────────────────

/**
 * Get Yandex OAuth authorization URL
 */
export function getYandexAuthUrl(state) {
  const clientId = process.env.YANDEX_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error('YANDEX_OAUTH_CLIENT_ID not configured');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getCallbackUrl('yandex'),
    response_type: 'code',
    scope: 'webmaster',
    state,
  });

  return `https://oauth.yandex.com/authorize?${params}`;
}

/**
 * Exchange Yandex auth code for tokens
 */
export async function exchangeYandexCode(code) {
  const clientId = process.env.YANDEX_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YANDEX_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Yandex OAuth credentials not configured');
  }

  const response = await fetch('https://oauth.yandex.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: getCallbackUrl('yandex'),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Yandex token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh Yandex access token
 */
export async function refreshYandexToken(refreshToken) {
  const clientId = process.env.YANDEX_OAUTH_CLIENT_ID;
  const clientSecret = process.env.YANDEX_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Yandex OAuth credentials not configured');
  }

  const response = await fetch('https://oauth.yandex.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Yandex token refresh failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

// ─── Generic helpers ────────────────────────────────────────────────────────

const VALID_WEBMASTER = new Set(['google', 'bing', 'yandex']);

/**
 * Authorization URL for a webmaster OAuth provider (Google / Bing / Yandex).
 */
export function getWebmasterAuthUrl(provider, state) {
  if (!VALID_WEBMASTER.has(provider)) {
    throw new Error(`Unknown webmaster provider: ${provider}`);
  }
  switch (provider) {
    case 'google':
      return getGoogleAuthUrl(state);
    case 'bing':
      return getBingAuthUrl(state);
    case 'yandex':
      return getYandexAuthUrl(state);
    default:
      throw new Error(`Unknown webmaster provider: ${provider}`);
  }
}

/**
 * Get valid access token (refreshes if needed) for a provider
 */
export async function getValidAccessToken(provider, tokens) {
  if (!tokens?.accessToken) {
    throw new Error(`No ${provider} tokens stored`);
  }

  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 min buffer before expiry

  if (tokens.expiresAt && tokens.expiresAt.getTime() - bufferMs < now.getTime()) {
    // Token expired or about to expire — refresh it
    let refreshed;
    switch (provider) {
      case 'google':
        refreshed = await refreshGoogleToken(tokens.refreshToken);
        break;
      case 'bing':
        refreshed = await refreshBingToken(tokens.refreshToken);
        break;
      case 'yandex':
        refreshed = await refreshYandexToken(tokens.refreshToken);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    return refreshed;
  }

  return tokens;
}
