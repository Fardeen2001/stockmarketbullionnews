/**
 * Writes a YAML file for `gcloud run deploy --env-vars-file`.
 * Reads values from the environment (set by CI from GitHub secrets).
 * Skips unset keys. Maps MONGODB_URL -> MONGODB_URI when URI is empty.
 */
const fs = require('fs');

const KEYS = [
  'MONGODB_URI',
  'MONGODB_DB_NAME',
  /** When set, cron OIDC must match this SA email (set by CI from GCP_SA_KEY client_email). */
  'CLOUD_SCHEDULER_OIDC_SA',
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

function trimEnv(value) {
  if (value === undefined || value === null) return value;
  return String(value).trim();
}

let mongoUri = trimEnv(process.env.MONGODB_URI);
const mongoUrl = trimEnv(process.env.MONGODB_URL);
if (!mongoUri && mongoUrl) {
  mongoUri = mongoUrl;
}
if (mongoUri) process.env.MONGODB_URI = mongoUri;

const lines = ['NODE_ENV: production'];
for (const k of KEYS) {
  const v = trimEnv(process.env[k]);
  if (v !== undefined && v.length > 0) {
    lines.push(`${k}: ${JSON.stringify(v)}`);
  }
}

fs.writeFileSync(outPath, `${lines.join('\n')}\n`);
