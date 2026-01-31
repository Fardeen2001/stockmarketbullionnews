# Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] MongoDB Atlas cluster created and accessible
- [ ] API keys obtained and tested
- [ ] Domain name configured (if using custom domain)
- [ ] Google AdSense account created (optional)
- [ ] Sitemap and robots.txt updated with production domain

## Vercel Deployment

### Step 1: Prepare Repository

1. Push code to GitHub/GitLab/Bitbucket
2. Ensure all sensitive data is in environment variables (not in code)

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 3: Environment Variables

Add all environment variables in Vercel dashboard:
- `MONGODB_URI`
- `ALPHA_VANTAGE_API_KEY`
- `METALPRICE_API_KEY` (or `GOLD_API_KEY`)
- `UNSPLASH_ACCESS_KEY`
- `HUGGINGFACE_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (your Vercel domain or custom domain)
- `CRON_SECRET` (generate a random string)
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (if using AdSense)

### Step 4: Cron Jobs (Automatic)

Cron jobs are **fully automatic** - no manual setup needed!

- Vercel automatically sets up cron jobs from `vercel.json`
- All cron jobs run on schedule without any intervention
- Verify in: Vercel Dashboard → Project → Settings → Cron Jobs

**Cron Schedule:**
- Update Stocks: Every hour at minute 0
- Update Metals: Every hour at minute 5
- Scrape News: Every hour at minute 10
- Detect Trends: Every hour at minute 20
- Generate Articles: Every hour at minute 30
- Update Sharia: Every Sunday at midnight

### Step 5: Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_SITE_URL` environment variable

## MongoDB Atlas Setup

### Step 1: Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster
3. Choose region closest to your users

### Step 2: Network Access

1. Go to Network Access
2. Add IP Address:
   - For Vercel: Add `0.0.0.0/0` (allow all) or specific Vercel IPs
   - For development: Add your local IP

### Step 3: Database User

1. Go to Database Access
2. Create database user with read/write permissions
3. Save username and password

### Step 4: Connection String

1. Go to Clusters → Connect
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your database user password
5. Add to `MONGODB_URI` environment variable

## Post-Deployment

### Step 1: Verify Deployment

1. Visit your deployed site
2. Check all pages load correctly
3. Test API endpoints

### Step 2: Initial Data Population

Cron jobs will automatically populate data on their first scheduled run. No manual intervention needed!

If you want to trigger initial data immediately (optional):

```bash
# Using curl
curl https://stockmarketbullion.com/api/cron/update-stocks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Or use Vercel CLI
vercel env pull .env.local
```

**Note:** Cron jobs run automatically, so you can simply wait for the scheduled times.

### Step 3: Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property (your domain)
3. Verify ownership
4. Submit sitemap: `https://stockmarketbullion.com/sitemap.xml`

### Step 4: Monitor

1. Set up Vercel Analytics (optional)
2. Monitor MongoDB Atlas metrics
3. Check API rate limits
4. Review error logs in Vercel dashboard

## Scaling Considerations

### Free Tier Limits

- **Vercel**: 100GB bandwidth/month, 100 hours function execution
- **MongoDB Atlas**: 512MB storage, shared CPU/RAM
- **API Limits**: Check each API provider's free tier limits

### When to Upgrade

- Traffic exceeds 5,000 daily visitors
- Database storage exceeds 400MB
- API rate limits hit frequently
- Function execution time increases

### Upgrade Path

1. **Vercel Pro**: $20/month - More bandwidth, better performance
2. **MongoDB M10**: $57/month - Dedicated resources, 10GB storage
3. **API Upgrades**: Consider paid tiers for stock/metal APIs
4. **CDN**: Vercel includes CDN, but consider Cloudflare for additional caching

## Monitoring & Maintenance

### Daily Checks

- Verify cron jobs are running (check Vercel logs)
- Monitor API rate limits
- Check for error logs

### Weekly Tasks

- Review MongoDB storage usage
- Check API usage and costs
- Review site analytics
- Update dependencies if needed

### Monthly Tasks

- Review and optimize database queries
- Check for security updates
- Review and update API keys if needed
- Analyze traffic patterns and optimize

## Troubleshooting Production Issues

### Cron Jobs Not Running

1. Check Vercel Cron Jobs dashboard (Settings → Cron Jobs)
2. Verify `vercel.json` is correct and committed to repository
3. Check function logs for errors in Vercel dashboard
4. Ensure `CRON_SECRET` is set correctly in environment variables
5. Wait a few minutes - cron jobs run on schedule (not immediately)
6. Verify the cron job paths match your API routes

### Database Connection Errors

1. Check MongoDB Atlas network access (IP whitelist)
2. Verify connection string format
3. Check database user permissions
4. Review MongoDB Atlas logs

### API Rate Limits

1. Implement caching (Next.js ISR)
2. Reduce cron job frequency
3. Use multiple API keys (if allowed)
4. Upgrade to paid API tiers

### Performance Issues

1. Enable Vercel Analytics
2. Check function execution times
3. Optimize database queries
4. Implement Redis caching (future enhancement)

## Security Best Practices

1. **Never commit API keys** to repository
2. **Use environment variables** for all secrets
3. **Enable MongoDB IP whitelisting** (restrict to Vercel IPs if possible)
4. **Use strong CRON_SECRET** (random 32+ character string)
5. **Enable Vercel Security Headers** (automatic with Next.js)
6. **Regular dependency updates** (check for vulnerabilities)

## Backup Strategy

### Database Backups

MongoDB Atlas free tier includes:
- Daily automated backups
- Point-in-time recovery (last 2 days)

For production, consider:
- Weekly manual exports
- Automated backup to S3/Google Cloud Storage

### Code Backups

- Git repository (primary backup)
- Regular commits to main branch
- Tag releases for important versions

## Cost Estimation (Free Tier)

- **Vercel**: Free (up to 100GB bandwidth)
- **MongoDB Atlas**: Free (M0 cluster)
- **APIs**: Free tiers available
- **Total**: $0/month (for MVP)

## Cost Estimation (Production - 10K visitors/day)

- **Vercel Pro**: $20/month
- **MongoDB M10**: $57/month
- **API Costs**: $10-50/month (depending on usage)
- **Total**: ~$87-127/month

---

For detailed architecture, see [PROJECT_PLAN.md](./PROJECT_PLAN.md)
