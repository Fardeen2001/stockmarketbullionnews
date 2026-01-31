import axios from 'axios';
import yf from 'yahoo-finance2';

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
    // No API key needed for Yahoo Finance
  }

  async getQuote(symbol, exchange = 'NSE') {
    try {
      const yahooSymbol = formatYahooSymbol(symbol, exchange);
      if (!yahooSymbol) {
        return null;
      }

      const quote = await yf.default.quote(yahooSymbol);
      
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

      const quote = await yf.default.quote(yahooSymbol);
      const quoteSummary = await yf.default.quoteSummary(yahooSymbol, {
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

// Indian stock symbols (NSE/BSE)
export const INDIAN_STOCKS = [
  { symbol: 'RELIANCE', exchange: 'NSE', name: 'Reliance Industries Ltd' },
  { symbol: 'TCS', exchange: 'NSE', name: 'Tata Consultancy Services Ltd' },
  { symbol: 'HDFCBANK', exchange: 'NSE', name: 'HDFC Bank Ltd' },
  { symbol: 'INFY', exchange: 'NSE', name: 'Infosys Ltd' },
  { symbol: 'ICICIBANK', exchange: 'NSE', name: 'ICICI Bank Ltd' },
  { symbol: 'HINDUNILVR', exchange: 'NSE', name: 'Hindustan Unilever Ltd' },
  { symbol: 'ITC', exchange: 'NSE', name: 'ITC Ltd' },
  { symbol: 'SBIN', exchange: 'NSE', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', exchange: 'NSE', name: 'Bharti Airtel Ltd' },
  { symbol: 'KOTAKBANK', exchange: 'NSE', name: 'Kotak Mahindra Bank Ltd' },
];

// Global major stocks
export const GLOBAL_STOCKS = [
  { symbol: 'AAPL', exchange: 'NASDAQ', name: 'Apple Inc' },
  { symbol: 'MSFT', exchange: 'NASDAQ', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', exchange: 'NASDAQ', name: 'Alphabet Inc' },
  { symbol: 'AMZN', exchange: 'NASDAQ', name: 'Amazon.com Inc' },
  { symbol: 'TSLA', exchange: 'NASDAQ', name: 'Tesla Inc' },
];
