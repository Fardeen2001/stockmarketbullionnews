'use client';

import { useState, useEffect } from 'react';

const PROVIDERS = [
  {
    id: 'google',
    name: 'Google Search Console',
    description: 'Index new articles using Google Indexing API',
    icon: '🔍',
    docsUrl: 'https://console.cloud.google.com/apis/library/indexing.googleapis.com',
  },
  {
    id: 'bing',
    name: 'Bing Webmaster',
    description: 'Submit URLs to Bing for faster indexing',
    icon: '🌐',
    docsUrl: 'https://www.bing.com/webmasters',
  },
  {
    id: 'yandex',
    name: 'Yandex Webmaster',
    description: 'Submit URLs to Yandex search engine',
    icon: '🇷🇺',
    docsUrl: 'https://webmaster.yandex.com',
  },
];

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleString();
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return 'No expiry';
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffMs = exp - now;
  if (diffMs < 0) return 'Expired';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Less than 1 hour';
  if (diffHours < 24) return `${diffHours} hours`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days`;
}

export default function WebmasterSettings() {
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexResult, setIndexResult] = useState(null);

  useEffect(() => {
    fetchStatuses();

    // Check for callback messages
    const params = new URLSearchParams(window.location.search);
    const success = params.get('webmaster_success');
    const error = params.get('webmaster_error');
    if (success) {
      setMessage({ type: 'success', text: `${success} connected successfully!` });
      window.history.replaceState({}, '', '/admin/settings');
    }
    if (error) {
      setMessage({ type: 'error', text: `Error: ${error}` });
      window.history.replaceState({}, '', '/admin/settings');
    }
  }, []);

  async function fetchStatuses() {
    try {
      const res = await fetch('/api/admin/webmaster');
      const data = await res.json();
      setStatuses(data);
    } catch (err) {
      console.error('Failed to fetch webmaster status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(provider) {
    setActionLoading(provider);
    try {
      const res = await fetch(`/api/admin/webmaster/connect/${encodeURIComponent(provider)}`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          type: 'error',
          text: data.error || `Connect failed (${res.status}). Check OAuth env vars and CRON_SECRET for production.`,
        });
        return;
      }
      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      setMessage({
        type: 'error',
        text: data.error || 'OAuth URL not returned. Check server logs and OAuth credentials.',
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDisconnect(provider) {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    setActionLoading(provider);
    try {
      await fetch(`/api/admin/webmaster?action=disconnect&provider=${provider}`, { method: 'POST' });
      setMessage({ type: 'success', text: `${provider} disconnected.` });
      fetchStatuses();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRefresh(provider) {
    setActionLoading(provider);
    try {
      await fetch(`/api/admin/webmaster?action=refresh&provider=${provider}`, { method: 'POST' });
      setMessage({ type: 'success', text: `${provider} token refreshed!` });
      fetchStatuses();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleIndex() {
    setIndexLoading(true);
    setIndexResult(null);
    try {
      const res = await fetch('/api/cron/index-urls', {
        method: 'POST',
        headers: { Authorization: `Bearer ${window.prompt('Enter CRON_SECRET:')}` },
      });
      const data = await res.json();
      setIndexResult(data);
    } catch (err) {
      setIndexResult({ error: err.message });
    } finally {
      setIndexLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-primary">Loading webmaster status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {PROVIDERS.map((provider) => {
        const s = statuses[provider.id];
        return (
          <div key={provider.id} className="border border-accent-300 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <span className="text-3xl mr-4">{provider.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-accent">{provider.name}</h3>
                  <p className="text-sm text-accent/70 mt-1">{provider.description}</p>
                </div>
              </div>

              <div className="flex items-center">
                {s?.connected ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full mr-3">
                    Connected
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full mr-3">
                    Not Connected
                  </span>
                )}
              </div>
            </div>

            {s?.connected && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-accent/60">Connected:</span>
                  <span className="ml-2 font-medium">{formatDate(s.connectedAt)}</span>
                </div>
                <div>
                  <span className="text-accent/60">Last Refresh:</span>
                  <span className="ml-2 font-medium">{formatDate(s.lastRefreshAt)}</span>
                </div>
                <div>
                  <span className="text-accent/60">Expires:</span>
                  <span className={`ml-2 font-medium ${s.status === 'expired' ? 'text-red-600' : s.status === 'expiring_soon' ? 'text-yellow-600' : ''}`}>
                    {formatExpiry(s.expiresAt)}
                  </span>
                </div>
                <div>
                  <span className="text-accent/60">Status:</span>
                  <span className={`ml-2 font-medium ${
                    s.status === 'active' ? 'text-green-600' :
                    s.status === 'expired' ? 'text-red-600' :
                    s.status === 'expiring_soon' ? 'text-yellow-600' : ''
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {!s?.connected ? (
                <button
                  onClick={() => handleConnect(provider.id)}
                  disabled={actionLoading === provider.id}
                  className="px-4 py-2 bg-secondary text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium"
                >
                  {actionLoading === provider.id ? 'Redirecting...' : 'Connect'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleRefresh(provider.id)}
                    disabled={actionLoading === provider.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium"
                  >
                    {actionLoading === provider.id ? 'Refreshing...' : 'Refresh Token'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(provider.id)}
                    disabled={actionLoading === provider.id}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </>
              )}
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-accent border border-accent-300 rounded-lg hover:bg-accent-100 text-sm font-medium"
              >
                Docs
              </a>
            </div>
          </div>
        );
      })}

      {/* Manual Indexing */}
      <div className="border border-accent-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-accent mb-2">Manual Indexing</h3>
        <p className="text-sm text-accent/70 mb-4">
          Submit all unindexed published articles to Google, Bing, and Yandex.
          This is automatically triggered by the 6-hour cron job.
        </p>
        <button
          onClick={handleIndex}
          disabled={indexLoading}
          className="px-6 py-2 bg-secondary text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
        >
          {indexLoading ? 'Indexing...' : 'Index All Articles'}
        </button>
        {indexResult && (
          <div className={`mt-4 p-4 rounded-lg ${indexResult.error ? 'bg-red-100' : 'bg-green-100'}`}>
            {indexResult.error ? (
              <p className="text-red-800">Error: {indexResult.error}</p>
            ) : (
              <div>
                <p className="font-medium text-green-800 mb-2">Indexing Complete!</p>
                <div className="text-sm space-y-1">
                  <p>Total indexed: {indexResult.indexed}</p>
                  <p>Google: {indexResult.gsc}, Bing: {indexResult.bing}, Yandex: {indexResult.yandex}</p>
                  {indexResult.errors?.length > 0 && (
                    <p className="text-red-700">Errors: {indexResult.errors.length}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* OAuth Setup Instructions */}
      <div className="border border-accent-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-accent mb-4">OAuth Setup</h3>
        <p className="text-sm text-accent/70 mb-4">
          To enable OAuth-based token management, add these environment variables to your <code className="bg-primary px-1 rounded">.env.local</code>:
        </p>
        <div className="bg-primary rounded-lg p-4 font-mono text-sm space-y-1">
          <p># Google OAuth (console.cloud.google.com)</p>
          <p>GOOGLE_OAUTH_CLIENT_ID=your-client-id</p>
          <p>GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret</p>
          <br />
          <p># Bing OAuth (apps.dev.microsoft.com)</p>
          <p>BING_OAUTH_CLIENT_ID=your-client-id</p>
          <p>BING_OAUTH_CLIENT_SECRET=your-client-secret</p>
          <br />
          <p># Yandex OAuth (oauth.yandex.com)</p>
          <p>YANDEX_OAUTH_CLIENT_ID=your-client-id</p>
          <p>YANDEX_OAUTH_CLIENT_SECRET=your-client-secret</p>
          <br />
          <p># Public site URL (OAuth callback host; must match provider redirect URIs)</p>
          <p>NEXT_PUBLIC_SITE_URL=https://stockmarketbullion.com</p>
          <br />
          <p># Production: sign OAuth state (use CRON_SECRET or a dedicated secret)</p>
          <p># WEBMASTER_OAUTH_STATE_SECRET=optional-if-no-CRON_SECRET</p>
        </div>
        <p className="text-xs text-accent/60 mt-4">
          The callback URL for all providers is: <code className="bg-primary px-1 rounded">your-site-url/api/admin/webmaster/callback?provider=</code>{'google|bing|yandex'}
        </p>
      </div>
    </div>
  );
}