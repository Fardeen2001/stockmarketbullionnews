/**
 * Writes a YAML file for `gcloud run deploy --env-vars-file`.
 * Reads values from the environment (set by CI from GitHub secrets).
 * Skips unset keys. Maps MONGODB_URL -> MONGODB_URI when URI is empty.
 */
const fs = require('fs');

const KEYS = [
  'MONGODB_URI',
  'MONGODB_DB_NAME',
  'HUGGINGFACE_API_KEY',
  'HUGGINGFACE_EMBEDDING_MODEL',
  'HUGGINGFACE_TEXT_GENERATION_MODEL',
  'CRON_SECRET',
  'UNSPLASH_ACCESS_KEY',
  'ALPHA_VANTAGE_API_KEY',
  'METALPRICE_API_KEY',
  'GOLD_API_KEY',
  'HUMANIZER_API_KEY',
  'HUMANIZER_PROVIDER',
  'ADMIN_SECRET_KEY',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'BING_OAUTH_CLIENT_ID',
  'BING_OAUTH_CLIENT_SECRET',
  'YANDEX_OAUTH_CLIENT_ID',
  'YANDEX_OAUTH_CLIENT_SECRET',
  'REDDIT_CLIENT_ID',
  'REDDIT_CLIENT_SECRET',
  'REDDIT_USER_AGENT',
  'GOOGLE_SEARCH_CONSOLE_API_KEY',
  'GOOGLE_SEARCH_CONSOLE_SITE_URL',
  'BING_WEBMASTER_API_KEY',
  'YANDEX_WEBMASTER_TOKEN',
  'GOOGLE_SERVICE_ACCOUNT_KEY',
  'WEBMASTER_OAUTH_STATE_SECRET',
  'LOG_LEVEL',
  'INDEX_URL_BATCH_LIMIT',
  'ENABLE_PLAYWRIGHT',
];

const outPath = process.argv[2] || '/tmp/cloud-run-env.yaml';

if (!process.env.MONGODB_URI && process.env.MONGODB_URL) {
  process.env.MONGODB_URI = process.env.MONGODB_URL;
}

const lines = ['NODE_ENV: production'];
for (const k of KEYS) {
  const v = process.env[k];
  if (v !== undefined && String(v).length > 0) {
    lines.push(`${k}: ${JSON.stringify(String(v))}`);
  }
}

fs.writeFileSync(outPath, `${lines.join('\n')}\n`);
