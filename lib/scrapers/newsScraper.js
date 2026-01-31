import { chromium } from 'playwright';
import axios from 'axios';
import Parser from 'rss-parser';

// News scraper using Playwright
export class NewsScraper {
  constructor() {
    this.browser = null;
    this.parser = new Parser();
  }

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
      });
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
              sourceUrl: url, // Store source URL
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
      return [];
    }
  }

  async scrapeNewsSite(url, selectors) {
    try {
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
              sourceUrl: fullUrl, // Store source URL
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
      const page = await this.browser.newPage();
      await page.goto('https://halalstock.in/', {
        waitUntil: 'networkidle',
      });

      const stocks = await page.evaluate(() => {
        const items = [];
        // Adjust selectors based on actual halalstock.in structure
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
    const metals = ['gold', 'silver', 'platinum', 'palladium'];
    const found = metals.filter(metal => 
      text.toLowerCase().includes(metal)
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
    'https://feeds.reuters.com/reuters/businessNews',
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
