import axios from 'axios';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

// Utility to detect serverless environment
function isServerlessEnvironment() {
  return !!(
    process.env.VERCEL_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.GOOGLE_CLOUD_FUNCTION ||
    process.env.AZURE_FUNCTIONS_ENVIRONMENT ||
    process.env.K_SERVICE || // Cloud Run
    process.env.FUNCTION_TARGET || // Cloud Functions
    // Check for serverless indicators
    (typeof process.env.AWS_EXECUTION_ENV !== 'undefined') ||
    (process.env.NODE_ENV === 'production' && !process.env.PLAYWRIGHT_BROWSERS_PATH)
  );
}

// Check if Playwright browsers are actually installed (root cause fix)
async function checkBrowserInstalled(chromium) {
  try {
    // Use Playwright's built-in method to check if browser is installed
    // This prevents warnings by checking availability before attempting launch
    const executablePath = chromium.executablePath();
    if (!executablePath) {
      return false;
    }
    
    // Additional check: verify the executable actually exists
    const fs = await import('fs/promises');
    const { constants } = await import('fs');
    try {
      await fs.access(executablePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  } catch (error) {
    // Browser not installed or not accessible - this is expected in serverless
    // Return false to prevent launch attempts that would generate warnings
    return false;
  }
}

// News scraper using Playwright (when available) or Cheerio (fallback)
export class NewsScraper {
  constructor() {
    this.browser = null;
    this.parser = new Parser();
    this.playwrightAvailable = null; // Lazy-loaded
    this.chromium = null; // Lazy-loaded
    this.isServerless = isServerlessEnvironment();
  }

  async checkPlaywrightAvailable() {
    if (this.playwrightAvailable !== null) {
      return this.playwrightAvailable;
    }

    // ROOT CAUSE FIX: In serverless environments, skip Playwright unless explicitly enabled
    // This prevents attempting to use Playwright when browsers aren't installed
    if (this.isServerless && !process.env.ENABLE_PLAYWRIGHT) {
      this.playwrightAvailable = false;
      this.chromium = null;
      return false;
    }

    // Try to import and use Playwright
    try {
      const playwright = await import('playwright');
      this.chromium = playwright.chromium;
      
      // ROOT CAUSE FIX: Check if browsers are actually installed before marking as available
      // This prevents warnings by verifying browser availability upfront
      const browserInstalled = await checkBrowserInstalled(this.chromium);
      
      if (browserInstalled) {
        this.playwrightAvailable = true;
        // Only log in non-serverless environments to reduce noise
        if (!this.isServerless) {
          console.log('Playwright loaded successfully');
        }
      } else {
        // Browsers not installed - mark as unavailable to prevent launch attempts
        this.playwrightAvailable = false;
        this.chromium = null;
        if (process.env.NODE_ENV === 'development') {
          console.log('Playwright browsers not installed, will use fallback methods');
        }
      }
    } catch (error) {
      // Playwright not available - fallback to Cheerio/API methods
      this.playwrightAvailable = false;
      this.chromium = null;
      // Only log in development to reduce noise in production
      if (process.env.NODE_ENV === 'development') {
        console.log('Playwright import failed, will use fallback methods:', error.message);
      }
    }

    return this.playwrightAvailable;
  }

  async init() {
    // Check if Playwright is available
    const available = await this.checkPlaywrightAvailable();
    
    // Try to initialize Playwright if available
    if (available && this.chromium) {
      try {
        if (!this.browser) {
          // Optimized launch options for serverless vs regular environments
          const launchOptions = {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--disable-gpu',
              '--disable-software-rasterizer',
            ],
          };

          // Add serverless-specific args
          if (this.isServerless) {
            launchOptions.args.push(
              '--no-zygote',
              '--single-process' // Important for serverless
            );
          }

          // ROOT CAUSE FIX: Launch browser (we already verified it's installed in checkPlaywrightAvailable)
          // No need for warning suppression since we check availability before attempting launch
          try {
            this.browser = await this.chromium.launch(launchOptions);
            // Only log in non-serverless environments to reduce noise
            if (!this.isServerless) {
              console.log('Playwright browser launched successfully');
            }
          } catch (error) {
            // If launch fails, mark as unavailable and use fallback
            // Only log in development to reduce noise
            if (process.env.NODE_ENV === 'development') {
              console.warn('Playwright launch failed, using fallback methods:', error.message);
            }
            this.playwrightAvailable = false;
            this.browser = null;
          }
        }
      } catch (error) {
        // Only log in development to reduce noise
        if (process.env.NODE_ENV === 'development') {
          console.warn('Playwright initialization failed, using fallback methods:', error.message);
        }
        this.playwrightAvailable = false;
        this.browser = null;
        // Fallback methods will be used automatically
      }
    } else {
      // Only log in development to reduce noise
      if (process.env.NODE_ENV === 'development' && !this.isServerless) {
        console.log('Playwright not available, will use fallback methods (Cheerio/API)');
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeReddit(subreddit, limit = 10) {
    try {
      // Check Playwright availability
      const available = await this.checkPlaywrightAvailable();
      
      // Use Reddit JSON API if Playwright not available (serverless)
      if (!available || !this.browser) {
        return await this.scrapeRedditAPI(subreddit, limit);
      }

      const page = await this.browser.newPage();
      await page.goto(`https://www.reddit.com/r/${subreddit}/hot/`, {
        waitUntil: 'networkidle',
      });

      const posts = await page.evaluate((limit) => {
        const items = [];
        const postElements = document.querySelectorAll('[data-testid="post-container"]');
        
        for (let i = 0; i < Math.min(postElements.length, limit); i++) {
          const post = postElements[i];
          const titleElement = post.querySelector('h3');
          const linkElement = post.querySelector('a[data-testid="outbound-link"]');
          const scoreElement = post.querySelector('[data-testid="vote-count"]');
          const commentElement = post.querySelector('[data-testid="comment-count"]');
          
          if (titleElement) {
            const url = linkElement?.href || `https://reddit.com${post.querySelector('a')?.getAttribute('href') || ''}`;
            items.push({
              title: titleElement.innerText,
              url: url,
              sourceUrl: url,
              score: scoreElement ? parseInt(scoreElement.innerText) || 0 : 0,
              comments: commentElement ? parseInt(commentElement.innerText) || 0 : 0,
              source: 'reddit',
              sourceType: 'reddit',
              subreddit: subreddit,
            });
          }
        }
        return items;
      }, limit);

      await page.close();
      return posts;
    } catch (error) {
      console.error(`Reddit scraping error for r/${subreddit}:`, error.message);
      // Fallback to API method
      return await this.scrapeRedditAPI(subreddit, limit);
    }
  }

  async scrapeRedditAPI(subreddit, limit = 10) {
    try {
      // Use Reddit's JSON API (no authentication needed for public data)
      const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StockMarketBullionNews/1.0; Financial news aggregator; +https://stockmarketbullion.com)',
          'Accept': 'application/json',
        },
      });

      if (response.data?.data?.children) {
        return response.data.data.children.map((post) => {
          const data = post.data;
          return {
            title: data.title,
            url: `https://reddit.com${data.permalink}`,
            sourceUrl: data.url,
            score: data.score || 0,
            comments: data.num_comments || 0,
            source: 'reddit',
            sourceType: 'reddit',
            subreddit: subreddit,
            summary: data.selftext || '',
          };
        });
      }
      return [];
    } catch (error) {
      console.error(`Reddit API error for r/${subreddit}:`, error.message);
      return [];
    }
  }

  async scrapeNewsSite(url, selectors) {
    try {
      // Check Playwright availability
      const available = await this.checkPlaywrightAvailable();
      
      // Use Cheerio if Playwright not available (serverless)
      if (!available || !this.browser) {
        return await this.scrapeNewsSiteCheerio(url, selectors);
      }

      const page = await this.browser.newPage();
      await page.goto(url, {
        waitUntil: 'networkidle',
      });

      const articles = await page.evaluate((selectors) => {
        const items = [];
        const articleElements = document.querySelectorAll(selectors.article);
        
        articleElements.forEach((article) => {
          const titleElement = article.querySelector(selectors.title);
          const linkElement = article.querySelector(selectors.link);
          const summaryElement = article.querySelector(selectors.summary);
          const dateElement = article.querySelector(selectors.date);
          
          if (titleElement && linkElement) {
            const href = linkElement.getAttribute('href');
            const fullUrl = href.startsWith('http') ? href : new URL(href, window.location.origin).href;
            
            items.push({
              title: titleElement.innerText.trim(),
              url: fullUrl,
              sourceUrl: fullUrl,
              summary: summaryElement?.innerText.trim() || '',
              publishedAt: dateElement?.innerText.trim() || new Date().toISOString(),
              source: new URL(window.location.href).hostname,
              sourceType: 'website',
            });
          }
        });
        
        return items;
      }, selectors);

      await page.close();
      return articles;
    } catch (error) {
      console.error(`News site scraping error for ${url}:`, error.message);
      // Fallback to Cheerio method
      return await this.scrapeNewsSiteCheerio(url, selectors);
    }
  }

  async scrapeNewsSiteCheerio(url, selectors) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const articles = [];

      $(selectors.article).each((i, article) => {
        const $article = $(article);
        const titleElement = $article.find(selectors.title).first();
        const linkElement = $article.find(selectors.link).first();
        const summaryElement = $article.find(selectors.summary).first();
        const dateElement = $article.find(selectors.date).first();

        if (titleElement.length && linkElement.length) {
          let href = linkElement.attr('href') || '';
          if (href && !href.startsWith('http')) {
            const baseUrl = new URL(url);
            href = new URL(href, baseUrl.origin).href;
          }

          articles.push({
            title: titleElement.text().trim(),
            url: href || url,
            sourceUrl: href || url,
            summary: summaryElement.text().trim() || '',
            publishedAt: dateElement.text().trim() || new Date().toISOString(),
            source: new URL(url).hostname,
            sourceType: 'website',
          });
        }
      });

      return articles;
    } catch (error) {
      console.error(`Cheerio scraping error for ${url}:`, error.message);
      return [];
    }
  }

  async parseRSSFeed(feedUrl) {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      return feed.items.map(item => ({
        title: item.title || '',
        url: item.link || '',
        sourceUrl: item.link || '', // Store source URL
        summary: item.contentSnippet || item.content || '',
        publishedAt: item.pubDate || new Date().toISOString(),
        source: new URL(feedUrl).hostname,
        sourceType: 'rss',
      }));
    } catch (error) {
      console.error(`RSS parsing error for ${feedUrl}:`, error.message);
      return [];
    }
  }

  async scrapeHalalStock() {
    try {
      // Check Playwright availability
      const available = await this.checkPlaywrightAvailable();
      
      // Use Cheerio if Playwright not available (serverless)
      if (!available || !this.browser) {
        return await this.scrapeHalalStockCheerio();
      }

      const page = await this.browser.newPage();
      await page.goto('https://halalstock.in/', {
        waitUntil: 'networkidle',
      });

      const stocks = await page.evaluate(() => {
        const items = [];
        const stockRows = document.querySelectorAll('table tbody tr, .stock-row, [class*="stock"]');
        
        stockRows.forEach((row) => {
          const symbolElement = row.querySelector('td:first-child, .symbol, [class*="symbol"]');
          const nameElement = row.querySelector('td:nth-child(2), .name, [class*="name"]');
          const complianceElement = row.querySelector('.compliant, [class*="compliant"]');
          
          if (symbolElement) {
            items.push({
              symbol: symbolElement.innerText.trim(),
              name: nameElement?.innerText.trim() || '',
              isCompliant: complianceElement ? true : false,
              source: 'halalstock.in',
            });
          }
        });
        
        return items;
      });

      await page.close();
      return stocks;
    } catch (error) {
      console.error('HalalStock scraping error:', error.message);
      // Fallback to Cheerio method
      return await this.scrapeHalalStockCheerio();
    }
  }

  async scrapeHalalStockCheerio() {
    try {
      const response = await axios.get('https://halalstock.in/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const stocks = [];

      $('table tbody tr, .stock-row, [class*="stock"]').each((i, row) => {
        const $row = $(row);
        const symbolElement = $row.find('td:first-child, .symbol, [class*="symbol"]').first();
        const nameElement = $row.find('td:nth-child(2), .name, [class*="name"]').first();
        const complianceElement = $row.find('.compliant, [class*="compliant"]').first();

        if (symbolElement.length) {
          stocks.push({
            symbol: symbolElement.text().trim(),
            name: nameElement.text().trim() || '',
            isCompliant: complianceElement.length > 0,
            source: 'halalstock.in',
          });
        }
      });

      return stocks;
    } catch (error) {
      console.error('HalalStock Cheerio scraping error:', error.message);
      return [];
    }
  }

  extractStockSymbols(text) {
    // Simple regex to extract potential stock symbols
    const patterns = [
      /\b([A-Z]{2,5})\b/g, // 2-5 uppercase letters
      /\b([A-Z]{2,5}\.NS)\b/g, // NSE format
      /\b([A-Z]{2,5}\.BO)\b/g, // BSE format
    ];

    const symbols = new Set();
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        symbols.add(match[1].replace(/\.(NS|BO)$/, ''));
      }
    });

    return Array.from(symbols);
  }

  extractMetalTypes(text) {
    // Comprehensive list of all metals - dynamically covers all available metals
    const metals = [
      // Precious metals
      'gold', 'silver', 'platinum', 'palladium', 'rhodium', 'ruthenium', 'iridium', 'osmium',
      // Industrial metals
      'copper', 'aluminum', 'aluminium', 'zinc', 'nickel', 'lead', 'tin',
      // Other metals
      'iron', 'steel', 'titanium', 'tungsten', 'molybdenum', 'cobalt', 'lithium', 'uranium',
      // Metal alloys
      'bronze', 'brass', 'stainless steel'
    ];
    const textLower = text.toLowerCase();
    const found = metals.filter(metal => 
      textLower.includes(metal)
    );
    return found;
  }
}

// Predefined news sources
export const NEWS_SOURCES = {
  reddit: [
    'IndianStockMarket',
    'investing',
    'stocks',
    'Gold',
    'Silver',
    'StockMarket',
  ],
  rss: [
    'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    'https://www.moneycontrol.com/rss/business.xml',
    'https://www.livemint.com/rss/markets',
  ],
  websites: [
    {
      url: 'https://economictimes.indiatimes.com/markets/stocks',
      selectors: {
        article: 'article, .newsItem, .story',
        title: 'h2, h3, .title, .headline',
        link: 'a',
        summary: '.summary, .excerpt, p',
        date: '.date, time',
      },
    },
  ],
};
