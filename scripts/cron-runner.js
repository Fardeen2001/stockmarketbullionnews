#!/usr/bin/env node

/**
 * Automatic Cron Job Runner
 * 
 * This script automatically runs all cron jobs on schedule without manual intervention.
 * It works by making HTTP requests to the cron API endpoints.
 * 
 * Usage:
 *   npm run cron:start    - Start cron jobs in background
 *   npm run cron:dev      - Start cron jobs with dev server
 */

const cron = require('node-cron');
const http = require('http');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${PORT}`;
const CRON_SECRET = process.env.CRON_SECRET || '';

// Cron job endpoints and schedules (optimized to avoid API rate limits)
const CRON_JOBS = [
  {
    name: 'Update Stocks',
    path: '/api/cron/update-stocks',
    schedule: '0 * * * *', // Every hour at minute 0
    description: 'Updates stock prices and data'
  },
  {
    name: 'Update Metals',
    path: '/api/cron/update-metals',
    schedule: '5 * * * *', // Every hour at minute 5
    description: 'Updates precious metals prices'
  },
  {
    name: 'Scrape News',
    path: '/api/cron/scrape-news-v2',
    schedule: '10 * * * *', // Every hour at minute 10
    description: 'Scrapes news from various sources'
  },
  {
    name: 'Detect Trends',
    path: '/api/cron/detect-trends',
    schedule: '20 * * * *', // Every hour at minute 20
    description: 'Detects trending topics'
  },
  {
    name: 'Generate Articles',
    path: '/api/cron/generate-articles-v2',
    schedule: '30 * * * *', // Every hour at minute 30
    description: 'Generates AI articles from trends'
  },
  {
    name: 'Update Sharia',
    path: '/api/cron/update-sharia',
    schedule: '0 0 * * 0', // Every Sunday at midnight
    description: 'Updates Sharia compliance data'
  }
];

/**
 * Make HTTP request to cron endpoint
 */
function callCronEndpoint(job) {
  return new Promise((resolve, reject) => {
    // Ensure BASE_URL has protocol
    const baseUrl = BASE_URL.startsWith('http') ? BASE_URL : `http://${BASE_URL}`;
    const url = new URL(job.path, baseUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': CRON_SECRET ? `Bearer ${CRON_SECRET}` : '',
        'User-Agent': 'Cron-Runner/1.0',
        'Host': url.hostname
      }
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const timestamp = new Date().toISOString();
        if (res.statusCode === 200) {
          console.log(`[${timestamp}] ✓ ${job.name} - Success`);
          try {
            const result = JSON.parse(data);
            if (result.message) {
              console.log(`    ${result.message}`);
            }
          } catch (e) {
            // Ignore parse errors
          }
          resolve({ success: true, statusCode: res.statusCode, data });
        } else {
          console.error(`[${timestamp}] ✗ ${job.name} - Failed (${res.statusCode})`);
          console.error(`    ${data.substring(0, 200)}`);
          resolve({ success: false, statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ✗ ${job.name} - Error: ${error.message}`);
      reject(error);
    });

    req.setTimeout(300000, () => { // 5 minute timeout
      req.destroy();
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ✗ ${job.name} - Timeout`);
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Wait for server to be ready
 */
function waitForServer(maxAttempts = 30, delay = 2000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkServer = () => {
      attempts++;
      const baseUrl = BASE_URL.startsWith('http') ? BASE_URL : `http://${BASE_URL}`;
      const url = new URL('/api/health', baseUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 5000
      };
      
      const req = httpModule.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log('✓ Server is ready');
          resolve();
        } else {
          if (attempts >= maxAttempts) {
            reject(new Error('Server not ready after maximum attempts'));
          } else {
            setTimeout(checkServer, delay);
          }
        }
      });

      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error('Server not ready after maximum attempts'));
        } else {
          setTimeout(checkServer, delay);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          reject(new Error('Server not ready after maximum attempts'));
        } else {
          setTimeout(checkServer, delay);
        }
      });

      req.end();
    };

    checkServer();
  });
}

/**
 * Start all cron jobs
 */
function startCronJobs(waitForServerReady = true) {
  console.log('🚀 Starting Automatic Cron Jobs...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Cron Secret: ${CRON_SECRET ? '✓ Set' : '⚠ Not set (development mode)'}\n`);

  if (waitForServerReady) {
    console.log('Waiting for server to be ready...');
    waitForServer()
      .then(() => {
        scheduleAllJobs();
      })
      .catch((error) => {
        console.error('Error waiting for server:', error.message);
        console.log('Continuing anyway...');
        scheduleAllJobs();
      });
  } else {
    scheduleAllJobs();
  }
}

/**
 * Schedule all cron jobs
 */
function scheduleAllJobs() {
  console.log('\n📅 Scheduled Cron Jobs:\n');
  
  CRON_JOBS.forEach((job) => {
    console.log(`  • ${job.name}`);
    console.log(`    Schedule: ${job.schedule}`);
    console.log(`    Description: ${job.description}\n`);

    cron.schedule(job.schedule, async () => {
      try {
        await callCronEndpoint(job);
      } catch (error) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ✗ ${job.name} - Exception: ${error.message}`);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });
  });

  console.log('✅ All cron jobs are now running automatically!\n');
  console.log('Press Ctrl+C to stop.\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping cron jobs...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Stopping cron jobs...');
  process.exit(0);
});

// Export for programmatic use
module.exports = { startCronJobs, callCronEndpoint, CRON_JOBS };

// Run if called directly
if (require.main === module) {
  const waitForServer = process.argv.includes('--no-wait') ? false : true;
  startCronJobs(waitForServer);
}
