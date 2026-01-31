# Quick Setup Instructions

## 1. Install Dependencies

```bash
npm install
```

## 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

## 3. Set Up Environment Variables

Create `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stockmarketbullion?retryWrites=true&w=majority

# Stock APIs (get at least one)
ALPHA_VANTAGE_API_KEY=your_key_here
# OR
FINNHUB_API_KEY=your_key_here

# Metals APIs (get at least one)
METALPRICE_API_KEY=your_key_here
# OR
GOLD_API_KEY=your_key_here

# Image APIs
UNSPLASH_ACCESS_KEY=your_key_here
PEXELS_API_KEY=your_key_here  # Optional fallback

# AI/ML
HUGGINGFACE_API_KEY=your_key_here

# Humanizer API (Optional - for humanizing AI-generated content)
# Get from: https://stealthwriter.ai/ or https://undetectable.ai/
HUMANIZER_API_KEY=your_humanizer_api_key_here
HUMANIZER_PROVIDER=stealthwriter  # Options: stealthwriter, undetectable, quillbot

# Reddit API (Optional - scraping works without it)
# Get these from: https://www.reddit.com/prefs/apps
# About URL: https://stockmarketbullion.com
# Redirect URI: https://stockmarketbullion.com/api/auth/reddit/callback
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER_AGENT=StockMarketBullion/1.0 (by /u/your_username)

# AdSense (Optional)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX

# Cron Secret (generate a random string)
CRON_SECRET=your_random_secret_string_here

# Site URL
NEXT_PUBLIC_SITE_URL=https://stockmarketbullion.com
```

## 4. Get API Keys

### MongoDB Atlas (Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create M0 (free) cluster
4. Create database user
5. Whitelist IP (0.0.0.0/0 for development)
6. Get connection string

### Alpha Vantage (Free)
1. Go to https://www.alphavantage.co/support/#api-key
2. Request free API key
3. Note: 5 calls/minute, 500 calls/day limit

### MetalpriceAPI (Free)
1. Go to https://metalpriceapi.com/
2. Sign up for free account
3. Get API key from dashboard

### Unsplash (Free)
1. Go to https://unsplash.com/developers
2. Create app
3. Get access key

### Hugging Face (Free)
1. Go to https://huggingface.co/
2. Sign up for account
3. Go to Settings → Access Tokens
4. Create new token

### Humanizer API (Optional - Recommended for AdSense Approval)
1. Choose a provider:
   - **StealthWriter**: https://stealthwriter.ai/
   - **Undetectable AI**: https://undetectable.ai/
   - **QuillBot**: https://quillbot.com/
2. Sign up for an account
3. Get your API key from the dashboard
4. Add to `.env.local`:
   - `HUMANIZER_API_KEY=your_api_key_here`
   - `HUMANIZER_PROVIDER=stealthwriter` (or undetectable/quillbot)

**Note:** Humanizer API is used to make AI-generated content more human-like, which helps with Google AdSense approval.

## 5. Run Development Server

```bash
npm run dev
```

## 6. Start Development Server with Automatic Cron Jobs

### Option 1: Automatic Cron Jobs (Recommended)

Start the development server with automatic cron jobs that run on schedule:

```bash
npm run dev:with-cron
```

This will:
- Start the Next.js development server
- Automatically run all cron jobs on their scheduled times
- No manual intervention needed!

### Option 2: Development Server Only

If you only want the dev server without cron jobs:

```bash
npm run dev
```

### Option 3: Run Cron Jobs Separately

If you want to run cron jobs in a separate terminal:

```bash
# In one terminal - start dev server
npm run dev

# In another terminal - start cron jobs
npm run cron
```

### Cron Job Schedules

The following cron jobs run automatically (configured for Vercel Hobby plan - daily):

- **Update Stocks**: Daily at midnight (00:00)
- **Update Metals**: Daily at 3:00 AM
- **Scrape News**: Daily at 6:00 AM
- **Detect Trends**: Daily at 9:00 AM
- **Generate Articles**: Daily at noon (12:00)
- **Update Sharia**: Every Sunday at midnight

**Note:** Vercel's free Hobby plan only allows daily cron jobs. To run more frequently (hourly), upgrade to Vercel Pro ($20/month).

### Manual Trigger (Optional)

If you need to manually trigger a cron job for testing:

```bash
# Set your cron secret
export CRON_SECRET="your_secret_here"

# Update stocks
curl "http://localhost:3000/api/cron/update-stocks" \
  -H "Authorization: Bearer $CRON_SECRET"

# Update metals
curl "http://localhost:3000/api/cron/update-metals" \
  -H "Authorization: Bearer $CRON_SECRET"

# Scrape news
curl "http://localhost:3000/api/cron/scrape-news-v2" \
  -H "Authorization: Bearer $CRON_SECRET"

# Generate articles
curl "http://localhost:3000/api/cron/generate-articles-v2" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 7. Verify Setup

1. Visit http://localhost:3000
2. Check that homepage loads
3. Navigate to /stocks, /metals, /sharia, /news
4. Verify data is displaying

## Common Issues

### "MongoDB connection error"
- Check MONGODB_URI format
- Verify IP is whitelisted in MongoDB Atlas
- Check database user has read/write permissions

### "API rate limit exceeded"
- Alpha Vantage: Wait 12 seconds between calls (5/min limit)
- Use caching to reduce API calls
- Consider upgrading to paid tier

### "Playwright browser not found"
```bash
npx playwright install chromium
```

### "No data showing"
- Run cron jobs manually to populate data
- Check MongoDB collections have data
- Verify API keys are correct

### "Cron jobs not running"
- **Development**: Use `npm run dev:with-cron` to start with automatic cron jobs
- **Production (Vercel)**: Cron jobs run automatically via vercel.json
- Check vercel.json configuration
- Verify CRON_SECRET is set in environment variables

## Next Steps

1. Review [PROJECT_PLAN.md](./PROJECT_PLAN.md) for architecture details
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
3. Customize stock lists in `lib/api/stockAPI.js`
4. Adjust scraping sources in `lib/scrapers/newsScraper.js`
5. Configure AdSense ad slots in components

## Automatic Cron Jobs

Cron jobs are now fully automated! No manual intervention needed.

### How It Works

1. **Local Development**: 
   - Run `npm run dev:with-cron` to start server with automatic cron jobs
   - Cron jobs run on schedule using node-cron
   - All jobs execute automatically without manual triggers

2. **Production (Vercel)**:
   - Cron jobs are configured in `vercel.json`
   - Vercel automatically executes them on schedule
   - No additional setup needed after deployment

### Available Scripts

- `npm run dev:with-cron` - Start dev server with automatic cron jobs
- `npm run cron` - Run cron jobs only (requires server to be running)
- `npm run cron:no-wait` - Run cron jobs without waiting for server
- `npm run start:with-cron` - Start production server with cron jobs

### Monitoring Cron Jobs

When cron jobs run, you'll see output like:
```
[2024-01-15T10:00:00.000Z] ✓ Update Stocks - Success
    Updated 50 stocks, 0 errors
[2024-01-15T10:05:00.000Z] ✓ Update Metals - Success
    Updated 4 metals, 0 errors
```

All cron jobs run automatically - just start the server and they'll handle everything!
