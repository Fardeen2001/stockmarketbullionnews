import axios from 'axios';
import YahooFinance from 'yahoo-finance2';

// Helper function to format symbol for Yahoo Finance
// NSE stocks: SYMBOL.NS, BSE stocks: SYMBOL.BO
export function formatYahooSymbol(symbol, exchange) {
  if (!symbol) return null;
  
  const cleanSymbol = symbol.toUpperCase().trim();
  
  // If already has .NS or .BO suffix, return as is
  if (cleanSymbol.includes('.NS') || cleanSymbol.includes('.BO')) {
    return cleanSymbol;
  }
  
  // Add suffix based on exchange
  if (exchange === 'NSE' || exchange === 'BSE') {
    return exchange === 'NSE' ? `${cleanSymbol}.NS` : `${cleanSymbol}.BO`;
  }
  
  // Default to NSE for Indian stocks
  return `${cleanSymbol}.NS`;
}

// Yahoo Finance API wrapper for Indian stocks (NSE/BSE)
export class YahooFinanceAPI {
  constructor() {
    // Initialize YahooFinance instance (required for v3)
    this.yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  }

  async getQuote(symbol, exchange = 'NSE') {
    try {
      const yahooSymbol = formatYahooSymbol(symbol, exchange);
      if (!yahooSymbol) {
        return null;
      }

      const quote = await this.yahooFinance.quote(yahooSymbol);
      
      if (!quote || !quote.regularMarketPrice) {
        return null;
      }

      return {
        symbol: symbol.toUpperCase(),
        open: quote.regularMarketOpen || quote.previousClose || 0,
        high: quote.regularMarketDayHigh || 0,
        low: quote.regularMarketDayLow || 0,
        price: quote.regularMarketPrice || 0,
        volume: quote.regularMarketVolume || 0,
        latestTradingDay: quote.regularMarketTime ? new Date(quote.regularMarketTime).toISOString().split('T')[0] : null,
        previousClose: quote.regularMarketPreviousClose || 0,
        change: (quote.regularMarketPrice || 0) - (quote.regularMarketPreviousClose || 0),
        changePercent: quote.regularMarketPreviousClose 
          ? (((quote.regularMarketPrice || 0) - quote.regularMarketPreviousClose) / quote.regularMarketPreviousClose * 100).toFixed(2)
          : '0',
      };
    } catch (error) {
      console.error(`Yahoo Finance API error for ${symbol}:`, error.message);
      return null;
    }
  }

  async getCompanyOverview(symbol, exchange = 'NSE') {
    try {
      const yahooSymbol = formatYahooSymbol(symbol, exchange);
      if (!yahooSymbol) {
        return null;
      }

      const quote = await this.yahooFinance.quote(yahooSymbol);
      const quoteSummary = await this.yahooFinance.quoteSummary(yahooSymbol, {
        modules: ['summaryProfile', 'summaryDetail', 'defaultKeyStatistics']
      });

      if (!quote) {
        return null;
      }

      const profile = quoteSummary?.summaryProfile || {};
      const detail = quoteSummary?.summaryDetail || {};
      const keyStats = quoteSummary?.defaultKeyStatistics || {};

      return {
        name: quote.longName || quote.shortName || symbol,
        description: profile.longBusinessSummary || '',
        sector: profile.sector || '',
        industry: profile.industry || '',
        marketCap: detail.marketCap?.raw || keyStats.marketCap?.raw || 0,
        peRatio: detail.trailingPE || keyStats.trailingPE || 0,
        high52Week: detail.fiftyTwoWeekHigh || keyStats.fiftyTwoWeekHigh || 0,
        low52Week: detail.fiftyTwoWeekLow || keyStats.fiftyTwoWeekLow || 0,
      };
    } catch (error) {
      console.error(`Yahoo Finance Overview error for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch all NSE stocks dynamically
   * Uses multiple methods to get all listed stocks
   */
  async getAllNSEStocks() {
    const stocks = new Map(); // Use Map to avoid duplicates
    
    // Method 1: Try NSE official API endpoints
    const nseEndpoints = [
      'https://www.nseindia.com/api/equity-stockIndices?index=SECURITIES%20IN%20F%26O',
      'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050',
      'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20NEXT%2050',
      'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20100',
      'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20200',
      'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20500',
    ];

    for (const endpoint of nseEndpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.nseindia.com/',
          },
          timeout: 30000,
        });

        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          response.data.data.forEach(stock => {
            const symbol = stock.symbol || stock.meta?.symbol;
            if (symbol && !stocks.has(symbol)) {
              stocks.set(symbol, {
                symbol: symbol,
                exchange: 'NSE',
                name: stock.meta?.companyName || stock.symbol || symbol,
              });
            }
          });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        // Continue to next endpoint
        continue;
      }
    }

    if (stocks.size > 0) {
      return Array.from(stocks.values());
    }

    // Method 2: Try using Yahoo Finance search/autocomplete (if available)
    // This is a fallback when official APIs don't work
    
    console.warn('Could not fetch NSE stocks from official APIs. Will use discovery method.');
    return [];
  }

  /**
   * Fetch all BSE stocks dynamically
   * Uses BSE official API or alternative sources
   */
  async getAllBSEStocks() {
    const stocks = new Map(); // Use Map to avoid duplicates
    
    // Method 1: Try BSE official API endpoints
    const bseEndpoints = [
      'https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w',
      'https://www.bseindia.com/corporates/List_Scrips.aspx',
    ];

    for (const endpoint of bseEndpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/html',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.bseindia.com/',
          },
          timeout: 30000,
        });

        if (response.data) {
          let data = response.data;
          
          // Handle different response formats
          if (Array.isArray(data)) {
            data.forEach(stock => {
              const symbol = stock.SCRIP_CD || stock.SCRIP_ID || stock.symbol;
              if (symbol && !stocks.has(symbol)) {
                stocks.set(symbol, {
                  symbol: symbol,
                  exchange: 'BSE',
                  name: stock.SCRIP_NAME || stock.companyName || stock.name || symbol,
                });
              }
            });
          } else if (data.data && Array.isArray(data.data)) {
            data.data.forEach(stock => {
              const symbol = stock.SCRIP_CD || stock.SCRIP_ID || stock.symbol;
              if (symbol && !stocks.has(symbol)) {
                stocks.set(symbol, {
                  symbol: symbol,
                  exchange: 'BSE',
                  name: stock.SCRIP_NAME || stock.companyName || stock.name || symbol,
                });
              }
            });
          }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        // Continue to next endpoint
        continue;
      }
    }

    if (stocks.size > 0) {
      return Array.from(stocks.values());
    }

    console.warn('Could not fetch BSE stocks from official APIs. Will use discovery method.');
    return [];
  }

  /**
   * Get all Indian stocks (NSE + BSE) dynamically
   */
  async getAllIndianStocks() {
    try {
      const [nseStocks, bseStocks] = await Promise.all([
        this.getAllNSEStocks(),
        this.getAllBSEStocks(),
      ]);
      return [...nseStocks, ...bseStocks];
    } catch (error) {
      console.error('Error fetching all Indian stocks:', error.message);
      return [];
    }
  }

  /**
   * Discover stocks by trying common patterns and validating with Yahoo Finance
   * This is a fallback method when official APIs are not available
   */
  async discoverStocksByPattern(exchange = 'NSE', maxAttempts = 1000) {
    const discoveredStocks = [];
    const commonSymbols = this.generateCommonSymbols(exchange);
    
    for (let i = 0; i < Math.min(commonSymbols.length, maxAttempts); i++) {
      try {
        const symbol = commonSymbols[i];
        const quote = await this.getQuote(symbol, exchange);
        
        if (quote && quote.price > 0) {
          const overview = await this.getCompanyOverview(symbol, exchange);
          discoveredStocks.push({
            symbol: symbol,
            exchange: exchange,
            name: overview?.name || symbol,
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        // Continue to next symbol
        continue;
      }
    }
    
    return discoveredStocks;
  }

  /**
   * Generate common stock symbols for discovery
   */
  generateCommonSymbols(exchange) {
    const symbols = [];
    
    // Common Indian stock symbols
    const commonSymbols = [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN',
      'BHARTIARTL', 'KOTAKBANK', 'LT', 'AXISBANK', 'MARUTI', 'ASIANPAINT', 'NESTLEIND',
      'ULTRACEMCO', 'TITAN', 'BAJFINANCE', 'WIPRO', 'ONGC', 'NTPC', 'POWERGRID',
      'COALINDIA', 'TECHM', 'HCLTECH', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB',
      'BAJAJFINSV', 'M&M', 'HEROMOTOCO', 'EICHERMOT', 'ADANIENT', 'ADANIPORTS',
      'JSWSTEEL', 'TATASTEEL', 'VEDL', 'HINDALCO', 'GRASIM', 'DABUR', 'BRITANNIA',
      'GODREJCP', 'MARICO', 'COLPAL', 'PIDILITIND', 'BERGEPAINT', 'INDIGO', 'ZOMATO',
      'PAYTM', 'NYKAA', 'POLICYBZR', 'DELHIVERY', 'ZOMATO', 'PAYTM', 'IRCTC', 'IRFC',
    ];
    
    // Add common symbols
    symbols.push(...commonSymbols);
    
    // Generate alphabet combinations (A-Z, AA-ZZ, etc.)
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      symbols.push(letter);
      
      for (let j = 0; j < 26; j++) {
        const letter2 = String.fromCharCode(65 + j);
        symbols.push(letter + letter2);
      }
    }
    
    return symbols;
  }
}

// Alpha Vantage API wrapper (kept for global stocks if needed)
export class AlphaVantageAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.alphavantage.co/query';
  }

  async getQuote(symbol) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey,
        },
      });

      if (response.data['Error Message']) {
        throw new Error(response.data['Error Message']);
      }

      if (response.data['Note']) {
        throw new Error('API call frequency limit reached');
      }

      const quote = response.data['Global Quote'];
      if (!quote || !quote['01. symbol']) {
        return null;
      }

      return {
        symbol: quote['01. symbol'],
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        price: parseFloat(quote['05. price']),
        volume: parseInt(quote['06. volume']),
        latestTradingDay: quote['07. latest trading day'],
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'].replace('%', ''),
      };
    } catch (error) {
      console.error(`Alpha Vantage API error for ${symbol}:`, error.message);
      return null;
    }
  }

  async getCompanyOverview(symbol) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
          apikey: this.apiKey,
        },
      });

      if (response.data['Error Message'] || response.data['Note']) {
        return null;
      }

      return {
        name: response.data.Name,
        description: response.data.Description,
        sector: response.data.Sector,
        industry: response.data.Industry,
        marketCap: parseFloat(response.data.MarketCapitalization) || 0,
        peRatio: parseFloat(response.data.PERatio) || 0,
        high52Week: parseFloat(response.data['52WeekHigh']) || 0,
        low52Week: parseFloat(response.data['52WeekLow']) || 0,
      };
    } catch (error) {
      console.error(`Alpha Vantage Overview error for ${symbol}:`, error.message);
      return null;
    }
  }
}

/**
 * Get all stocks dynamically - no hardcoding
 * Fetches all stocks from NSE and BSE exchanges
 */
export async function getAllStocks(useDatabase = false) {
  const yahooAPI = new YahooFinanceAPI();
  let stocks = await yahooAPI.getAllIndianStocks();
  
  // If no stocks found from APIs, try database fallback
  if (stocks.length === 0 && useDatabase) {
    try {
      const { getStocksCollection } = await import('@/lib/db');
      const collection = await getStocksCollection();
      const dbStocks = await collection.find({ 
        exchange: { $in: ['NSE', 'BSE'] } 
      }).toArray();
      stocks = dbStocks.map(stock => ({
        symbol: stock.symbol,
        exchange: stock.exchange,
        name: stock.name || stock.symbol,
      }));
      console.log(`Found ${stocks.length} stocks from database`);
    } catch (error) {
      console.error('Error fetching stocks from database:', error.message);
    }
  }
  
  // If still no stocks, try discovery method (slower but comprehensive)
  if (stocks.length === 0) {
    console.log('No stocks from APIs or database, trying discovery method...');
    const [nseStocks, bseStocks] = await Promise.all([
      yahooAPI.discoverStocksByPattern('NSE', 200),
      yahooAPI.discoverStocksByPattern('BSE', 200),
    ]);
    stocks = [...nseStocks, ...bseStocks];
  }
  
  return stocks;
}
