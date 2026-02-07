/**
 * Single source-of-truth for workflow scraping sources.
 * Reddit is excluded from the automated news pipeline by design.
 * Use this for scrape-news-v2 and full-workflow.
 */
export const WORKFLOW_SOURCES = {
  rss: [
    'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    'https://www.moneycontrol.com/rss/business.xml',
    'https://www.livemint.com/rss/markets',
    'https://www.business-standard.com/rss/home_page_top_stories.rss',
    'https://www.business-standard.com/rss/markets-106.rss',
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

/**
 * Convert WORKFLOW_SOURCES to the format expected by ScrapingAgent
 */
export function getWorkflowScrapeSources() {
  return [
    ...WORKFLOW_SOURCES.rss.map((url) => ({ type: 'rss', url })),
    ...WORKFLOW_SOURCES.websites.map((site) => ({
      type: 'website',
      url: site.url,
      selectors: site.selectors,
    })),
  ];
}
