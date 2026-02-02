# Vercel Cron Jobs Fix

## Problem
Cron jobs in Vercel were not running automatically - they only ran when the "Run Now" button was clicked manually.

## Root Cause
The cron authentication was only checking for `x-vercel-cron: 'true'`, but Vercel may send the header in different formats:
- `x-vercel-cron: true`
- `x-vercel-cron: 1`
- `X-Vercel-Cron: true` (case variations)

## Solution Implemented

### 1. Created Shared Cron Authentication Utility
**File:** `lib/utils/cronAuth.js`

This utility handles all authentication scenarios:
- ✅ Vercel automatic cron triggers (handles multiple header formats)
- ✅ Manual triggers with Bearer token
- ✅ Development mode (when CRON_SECRET is not set)
- ✅ Better logging for debugging

### 2. Updated All Cron Endpoints
All cron endpoints now use the shared utility:
- `app/api/cron/update-stocks/route.js`
- `app/api/cron/update-metals/route.js`
- `app/api/cron/scrape-news-v2/route.js`
- `app/api/cron/detect-trends/route.js`
- `app/api/cron/generate-articles-v2/route.js`
- `app/api/cron/update-sharia/route.js`

### 3. Added Logging
All cron endpoints now log:
- When they're triggered
- Authentication source (vercel-cron, manual, development)
- Timestamp
- Header information (in development mode)

### 4. Created Test Endpoint
**File:** `app/api/cron/test/route.js`

Use this endpoint to verify cron job configuration:
```
GET /api/cron/test
```

This will show:
- All incoming headers
- Authentication status
- Environment information
- Instructions for debugging

## Verification Steps

### 1. Test the Cron Endpoint
Visit or call:
```
https://your-domain.vercel.app/api/cron/test
```

You should see:
- `authorized: true` if called from Vercel cron
- `source: "vercel-cron"` when triggered automatically
- All headers that Vercel sends

### 2. Check Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. Verify all cron jobs are listed
4. Check the **Logs** tab to see execution history

### 3. Verify Environment Variables
Ensure `CRON_SECRET` is set in Vercel:
1. Go to **Settings** → **Environment Variables**
2. Verify `CRON_SECRET` exists for **Production** environment
3. If not set, add it (cron jobs will still work but less secure)

### 4. Check Deployment
Cron jobs only work on **Production** deployments, not preview deployments:
- Ensure you've deployed to production
- Cron jobs won't run on preview branches

## Important Notes

### Vercel Plan Limitations
- **Hobby (Free) Plan**: Cron jobs may have limitations or delays
- **Pro Plan ($20/month)**: Full cron job support with more frequent execution

### Cron Schedule Format
Current schedules in `vercel.json`:
- `"0 0 * * *"` - Daily at midnight (update-stocks)
- `"0 3 * * *"` - Daily at 3 AM (update-metals)
- `"0 6 * * *"` - Daily at 6 AM (scrape-news-v2)
- `"0 9 * * *"` - Daily at 9 AM (detect-trends)
- `"0 12 * * *"` - Daily at noon (generate-articles-v2)
- `"0 0 * * 0"` - Weekly on Sunday at midnight (update-sharia)

### Troubleshooting

If cron jobs still don't run automatically:

1. **Check Vercel Logs**
   - Go to Vercel Dashboard → Your Project → Logs
   - Filter by "Cron" to see cron job executions
   - Look for errors or authentication failures

2. **Verify vercel.json**
   - Ensure `vercel.json` is in the root directory
   - Paths should start with `/api/cron/...`
   - Cron expressions use standard cron format

3. **Test Manually**
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
        https://your-domain.vercel.app/api/cron/test
   ```

4. **Check Function Timeout**
   - Current timeout: 300 seconds (5 minutes)
   - If jobs take longer, increase `maxDuration` in `vercel.json`

5. **Redeploy**
   - After changing `vercel.json`, you must redeploy
   - Cron jobs are configured during deployment

## Next Steps

1. **Deploy to Production**
   ```bash
   git add .
   git commit -m "Fix Vercel cron job authentication"
   git push
   ```

2. **Monitor First Execution**
   - Wait for the next scheduled time
   - Check Vercel logs to verify execution
   - Verify data is being updated

3. **Set Up Alerts** (Optional)
   - Configure Vercel notifications for failed cron jobs
   - Set up monitoring for cron job execution

## Files Changed

- ✅ `lib/utils/cronAuth.js` (new)
- ✅ `app/api/cron/update-stocks/route.js`
- ✅ `app/api/cron/update-metals/route.js`
- ✅ `app/api/cron/scrape-news-v2/route.js`
- ✅ `app/api/cron/detect-trends/route.js`
- ✅ `app/api/cron/generate-articles-v2/route.js`
- ✅ `app/api/cron/update-sharia/route.js`
- ✅ `app/api/cron/test/route.js` (new)

All changes maintain backward compatibility and improve reliability.
