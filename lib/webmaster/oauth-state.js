import crypto from 'crypto';

const TTL_SEC = 15 * 60;
const DEV_FALLBACK = '__dev_webmaster_oauth_state__';

function resolveSecret() {
  return process.env.WEBMASTER_OAUTH_STATE_SECRET || process.env.CRON_SECRET || null;
}

function signingSecretForCreate() {
  const s = resolveSecret();
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error(
      'Set CRON_SECRET or WEBMASTER_OAUTH_STATE_SECRET so webmaster OAuth state can be signed'
    );
  }
  return s || DEV_FALLBACK;
}

function signingSecretForVerify() {
  const s = resolveSecret();
  if (!s && process.env.NODE_ENV === 'production') {
    return null;
  }
  return s || DEV_FALLBACK;
}

/**
 * Signed OAuth `state` (HMAC). Survives cross-origin flows (e.g. admin on localhost, callback on production).
 */
export function createWebmasterOAuthState(provider) {
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const payload = JSON.stringify({ provider, exp });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', signingSecretForCreate()).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

/**
 * @returns {{ provider: string } | null}
 */
export function verifyWebmasterOAuthState(token) {
  if (!token || typeof token !== 'string') return null;
  const secret = signingSecretForVerify();
  if (!secret) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected;
  try {
    expected = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  } catch {
    return null;
  }
  if (sig.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const { provider, exp } = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!provider || typeof provider !== 'string' || typeof exp !== 'number') return null;
    if (Math.floor(Date.now() / 1000) > exp) return null;
    return { provider };
  } catch {
    return null;
  }
}
