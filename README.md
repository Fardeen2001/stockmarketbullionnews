# StockMarket Bullion

**StockMarket Bullion** (stockmarketbullion.com) - A comprehensive news website focused on stock markets, precious metals (gold, silver, etc.), and Sharia-compliant stocks. The platform automatically aggregates, analyzes, and generates news content using AI, with full SEO optimization and ad monetization.

## Features

- **Stocks Section**: Real-time stock prices, analysis, and news for NSE, BSE, and global markets
- **Metals Section**: Gold, silver, platinum, and palladium prices with news and analysis
- **Sharia Stocks**: Sharia-compliant stock filtering and detailed compliance information
- **AI-Generated Content**: Automated news article generation from aggregated sources
- **Automated Scraping**: Hourly news aggregation from Reddit, RSS feeds, and financial news sites
- **SEO Optimized**: Full SEO with meta tags, structured data, and sitemap
- **Ad Monetization**: Google AdSense integration ready
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS

## Tech Stack

- **Frontend/Backend**: Next.js 16+ (App Router) with React 19
- **Database**: MongoDB Atlas
- **Scraping**: Playwright
- **AI/ML**: Hugging Face Transformers
- **Charts**: Chart.js with react-chartjs-2
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (recommended)

## Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier)
- API keys for:
  - Alpha Vantage (free tier) or Finnhub
  - MetalpriceAPI or Gold-API.com
  - Unsplash API (free)
  - Hugging Face API (free)
  - Google AdSense (optional)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd stockmarketbullionnews
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your API keys:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   ALPHA_VANTAGE_API_KEY=your_key
   METALPRICE_API_KEY=your_key
   UNSPLASH_ACCESS_KEY=your_key
   HUGGINGFACE_API_KEY=your_key
   NEXT_PUBLIC_SITE_URL=https://stockmarketbullion.com
   CRON_SECRET=your_random_secret
   ```

4. **Set up MongoDB**
   
   - Create a free MongoDB Atlas cluster
   - Get your connection string
   - The database will be created automatically on first run

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Initial Setup

### 1. Database Indexes

The application will create indexes automatically, but you can also run this manually if needed. The indexes are defined in:
- `lib/models/Stock.js`
- `lib/models/Metal.js`
- `lib/models/News.js`

### 2. First Data Population

To populate initial data, you can manually trigger the cron jobs:

```bash
# Update stocks (requires API keys)
curl http://localhost:3000/api/cron/update-stocks?authorization=Bearer YOUR_CRON_SECRET

# Update metals
curl http://localhost:3000/api/cron/update-metals?authorization=Bearer YOUR_CRON_SECRET

# Scrape news
curl http://localhost:3000/api/cron/scrape-news?authorization=Bearer YOUR_CRON_SECRET

# Generate articles
curl http://localhost:3000/api/cron/generate-articles?authorization=Bearer YOUR_CRON_SECRET

# Update Sharia compliance (weekly)
curl http://localhost:3000/api/cron/update-sharia?authorization=Bearer YOUR_CRON_SECRET
```

### 3. Vercel Cron Jobs

For production, set up cron jobs in `vercel.json`. The cron jobs are configured to run (daily - Hobby plan compatible):
- Stock updates: Daily at midnight
- Metal updates: Daily at 3:00 AM
- News scraping: Daily at 6:00 AM
- Trend detection: Daily at 9:00 AM
- Article generation: Daily at noon
- Sharia compliance: Weekly (Sunday)

**Note:** Vercel's free Hobby plan only allows daily cron jobs. Upgrade to Pro for hourly execution.

## Project Structure

```
stockmarketbullionnews/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── stocks/        # Stock endpoints
│   │   ├── metals/        # Metal endpoints
│   │   ├── news/          # News endpoints
│   │   ├── sharia/        # Sharia stocks endpoints
│   │   └── cron/          # Cron job endpoints
│   ├── stocks/            # Stocks pages
│   ├── metals/            # Metals pages
│   ├── sharia/            # Sharia stocks pages
│   ├── news/              # News pages
│   └── layout.js          # Root layout
├── components/             # React components
│   ├── Navigation.js
│   ├── Footer.js
│   ├── StockCard.js
│   ├── MetalCard.js
│   ├── NewsCard.js
│   ├── PriceChart.js
│   └── AdSense.js
├── lib/                   # Utility libraries
│   ├── api/               # API wrappers
│   ├── ai/                # AI content generation
│   ├── models/            # Database models
│   ├── scrapers/          # Web scrapers
│   └── utils/             # Utility functions
├── public/                # Static files
└── vercel.json            # Vercel configuration
```

## API Endpoints

### Public Endpoints

- `GET /api/stocks` - List all stocks
- `GET /api/stocks/[symbol]` - Get stock details
- `GET /api/metals` - List all metals
- `GET /api/metals/[type]` - Get metal details
- `GET /api/news` - List news articles
- `GET /api/news/[slug]` - Get article details
- `GET /api/sharia/stocks` - List Sharia-compliant stocks

### Cron Endpoints (Protected)

- `GET /api/cron/update-stocks` - Update stock data
- `GET /api/cron/update-metals` - Update metal prices
- `GET /api/cron/scrape-news` - Scrape news sources
- `GET /api/cron/generate-articles` - Generate AI articles
- `GET /api/cron/update-sharia` - Update Sharia compliance

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Vercel will automatically:
- Set up cron jobs from `vercel.json`
- Handle SSL certificates
- Provide CDN and edge functions

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:
- MongoDB URI
- All API keys
- `NEXT_PUBLIC_SITE_URL` (your production domain)
- `CRON_SECRET` (for protecting cron endpoints)

## Google AdSense Setup

1. Sign up for Google AdSense
2. Get your publisher ID (ca-pub-XXXXXXXXXX)
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
   ```
4. AdSense ads will automatically appear on pages

## SEO Setup

1. Update `app/sitemap.js` with your domain
2. Update `public/robots.txt` with your domain
3. Submit sitemap to Google Search Console
4. Verify site in Google Search Console

## Troubleshooting

### MongoDB Connection Issues
- Check your MongoDB Atlas IP whitelist (allow all IPs for development: 0.0.0.0/0)
- Verify connection string format
- Ensure database user has read/write permissions

### API Rate Limits
- Alpha Vantage has 5 calls/minute limit on free tier
- Implement caching to reduce API calls
- Consider upgrading to paid tiers for production

### Playwright Issues
- Install Playwright browsers: `npx playwright install`
- For Vercel, Playwright may need special configuration

### AI Generation Errors
- Check Hugging Face API key
- Some models may have rate limits
- Fallback to template-based generation if API fails

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
- Check the [PROJECT_PLAN.md](./PROJECT_PLAN.md) for detailed architecture
- Open an issue on GitHub
- Review API documentation in code comments

## Roadmap

- [ ] User accounts and portfolios
- [ ] Price alerts
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Newsletter
- [ ] Social features (comments, sharing)
- [ ] Premium tier

---

Built with ❤️ using Next.js, MongoDB, and AI
