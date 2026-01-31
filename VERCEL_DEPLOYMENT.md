# Quick Vercel Deployment Guide

## Prerequisites
- GitHub/GitLab/Bitbucket account with your code pushed
- MongoDB Atlas account (free tier works)
- API keys ready (see SETUP_INSTRUCTIONS.md)

## Step-by-Step Deployment

### 1. Push Your Code to GitHub
```bash
# If not already done, initialize git and push
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/stockmarketbullionnews.git
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New Project"** or **"Import Project"**
3. Connect your GitHub account (if not already connected)
4. Select your repository: `stockmarketbullionnews`
5. Vercel will auto-detect Next.js - **don't change any settings**
6. Click **"Deploy"** (we'll add environment variables after)

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? stockmarketbullionnews
# - Directory? ./
```

### 3. Add Environment Variables

After deployment, go to your project dashboard:

1. Click on your project
2. Go to **Settings** → **Environment Variables**
3. Add each variable (click "Add" for each):

**Required Variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stockmarketbullion?retryWrites=true&w=majority
ALPHA_VANTAGE_API_KEY=your_key_here
METALPRICE_API_KEY=your_key_here
UNSPLASH_ACCESS_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
CRON_SECRET=generate_random_string_here_min_32_chars
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

**Optional Variables:**
```
GOLD_API_KEY=your_key_here
PEXELS_API_KEY=your_key_here
HUMANIZER_API_KEY=your_key_here
HUMANIZER_PROVIDER=stealthwriter
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER_AGENT=StockMarketBullion/1.0
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
ADMIN_SECRET_KEY=generate_random_32_char_string
```

**Important:**
- For each variable, select **"Production"**, **"Preview"**, and **"Development"** environments
- Click **"Save"** after adding each variable
- After adding all variables, **redeploy** your project (Settings → Deployments → Redeploy)

### 4. Verify Cron Jobs

1. Go to **Settings** → **Cron Jobs** in Vercel dashboard
2. You should see 6 cron jobs automatically configured from `vercel.json`:
   - `/api/cron/update-stocks` - Every hour at :00
   - `/api/cron/update-metals` - Every hour at :05
   - `/api/cron/scrape-news-v2` - Every hour at :10
   - `/api/cron/detect-trends` - Every hour at :20
   - `/api/cron/generate-articles-v2` - Every hour at :30
   - `/api/cron/update-sharia` - Every Sunday at midnight

**Note:** Cron jobs will start running automatically after deployment. No manual setup needed!

### 5. Test Your Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Check health endpoint: `https://your-project.vercel.app/api/health`
3. Test a few pages:
   - Homepage: `/`
   - News: `/news`
   - Stocks: `/stocks`
   - Metals: `/metals`

### 6. Set Up MongoDB Atlas (If Not Done)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free M0 cluster
3. **Network Access**: Add IP `0.0.0.0/0` (allows all IPs - Vercel uses dynamic IPs)
4. **Database Access**: Create a user with read/write permissions
5. **Connection**: Get connection string and use it in `MONGODB_URI`

### 7. Custom Domain (Optional)

1. In Vercel dashboard: **Settings** → **Domains**
2. Add your domain (e.g., `stockmarketbullion.com`)
3. Follow DNS instructions (add CNAME or A records)
4. Update `NEXT_PUBLIC_SITE_URL` environment variable to your custom domain
5. Redeploy

## Post-Deployment Checklist

- [ ] All environment variables added
- [ ] MongoDB Atlas IP whitelist configured (0.0.0.0/0)
- [ ] Health endpoint returns 200
- [ ] Cron jobs visible in Vercel dashboard
- [ ] Test pages load correctly
- [ ] Check Vercel logs for any errors
- [ ] Update `NEXT_PUBLIC_SITE_URL` if using custom domain

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel auto-detects, but you can set in `package.json`)

### Cron Jobs Not Running
- Wait 5-10 minutes (cron jobs run on schedule, not immediately)
- Check Vercel dashboard → Settings → Cron Jobs
- Verify `CRON_SECRET` is set correctly
- Check function logs in Vercel dashboard

### Database Connection Errors
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas Network Access (IP whitelist)
- Ensure database user has correct permissions

### API Errors
- Verify all API keys are correct
- Check API rate limits
- Review Vercel function logs

## Next Steps

1. **Wait for Initial Data**: Cron jobs will populate data automatically within the first hour
2. **Monitor**: Check Vercel dashboard for logs and metrics
3. **Google Search Console**: Submit your sitemap once deployed
4. **Analytics**: Consider adding Vercel Analytics or Google Analytics

## Need Help?

- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Check `DEPLOYMENT.md` for detailed information
