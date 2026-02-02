import axios from 'axios';
import YahooFinance from 'yahoo-finance2';

// Yahoo Finance symbols for precious metals (spot prices in USD)
const METAL_SYMBOLS = {
  gold: 'GC=F',      // Gold futures
  silver: 'SI=F',    // Silver futures
  platinum: 'PL=F',  // Platinum futures
  palladium: 'PA=F', // Palladium futures
};

// Alternative spot price symbols (if futures don't work)
const METAL_SPOT_SYMBOLS = {
  gold: 'XAUUSD=X',
  silver: 'XAGUSD=X',
  platinum: 'XPTUSD=X',
  palladium: 'XPDUSD=X',
};

// Yahoo Finance API wrapper for metals
export class YahooFinanceMetalsAPI {
  constructor() {
    // Initialize YahooFinance instance (required for v3)
    this.yahooFinance = new YahooFinance();
  }

  async getUSDINRRate() {
    try {
      const quote = await this.yahooFinance.quote('INR=X');
      return quote?.regularMarketPrice || 83.0; // Default fallback rate
    } catch (error) {
      console.error('Error fetching USD/INR rate:', error.message);
      return 83.0; // Default fallback
    }
  }

  async getMetalPrice(metalType, currency = 'INR') {
    try {
      const symbol = METAL_SYMBOLS[metalType.toLowerCase()] || METAL_SPOT_SYMBOLS[metalType.toLowerCase()];
      if (!symbol) {
        return null;
      }

      const quote = await this.yahooFinance.quote(symbol);
      
      if (!quote || !quote.regularMarketPrice) {
        // Try spot price symbol as fallback
        const spotSymbol = METAL_SPOT_SYMBOLS[metalType.toLowerCase()];
        if (spotSymbol) {
          const spotQuote = await this.yahooFinance.quote(spotSymbol);
          if (spotQuote && spotQuote.regularMarketPrice) {
            return this.formatMetalData(spotQuote, metalType, currency);
          }
        }
        return null;
      }

      return this.formatMetalData(quote, metalType, currency);
    } catch (error) {
      console.error(`Yahoo Finance Metals API error for ${metalType}:`, error.message);
      return null;
    }
  }

  async formatMetalData(quote, metalType, currency) {
    let price = quote.regularMarketPrice || 0;
    let previousClose = quote.regularMarketPreviousClose || price;
    
    // Get USD/INR rate if converting to INR
    let usdInrRate = 1;
    if (currency === 'INR' && price > 0) {
      usdInrRate = await this.getUSDINRRate();
    }

    // Convert to INR if needed
    if (currency === 'INR' && price > 0) {
      price = price * usdInrRate;
      previousClose = previousClose * usdInrRate;
    }

    // Convert from per ounce to per gram for gold and silver (common in India)
    const unit = metalType.toLowerCase() === 'gold' || metalType.toLowerCase() === 'silver' 
      ? 'per_gram' 
      : 'per_ounce';
    
    if (unit === 'per_gram') {
      price = price / 31.1035; // 1 ounce = 31.1035 grams
      previousClose = previousClose / 31.1035;
    }

    // Calculate change after conversion
    const change = price - previousClose;
    const changePercent = previousClose ? ((change / previousClose) * 100) : 0;

    return {
      metal: metalType.toLowerCase(),
      price: price,
      currency: currency,
      unit: unit,
      change: change,
      changePercent: parseFloat(changePercent.toFixed(2)),
      timestamp: quote.regularMarketTime || new Date(),
      previousClose: previousClose,
    };
  }

  async getAllMetalsPrices(currency = 'INR') {
    try {
      const metals = ['gold', 'silver', 'platinum', 'palladium'];
      const prices = {};
      
      for (const metal of metals) {
        const priceData = await this.getMetalPrice(metal, currency);
        if (priceData) {
          prices[metal] = priceData;
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return prices;
    } catch (error) {
      console.error('Error fetching all metals prices:', error.message);
      return null;
    }
  }
}

// MetalpriceAPI wrapper (kept as fallback)
export class MetalpriceAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.metalpriceapi.com/v1';
  }

  async getLatestPrices(baseCurrency = 'INR') {
    try {
      const response = await axios.get(`${this.baseURL}/latest`, {
        params: {
          api_key: this.apiKey,
          base: baseCurrency,
          currencies: 'XAU,XAG,XPT,XPD', // Gold, Silver, Platinum, Palladium
        },
      });

      if (response.data.success) {
        return {
          gold: {
            price: response.data.rates.XAU,
            currency: baseCurrency,
            unit: 'per_ounce',
          },
          silver: {
            price: response.data.rates.XAG,
            currency: baseCurrency,
            unit: 'per_ounce',
          },
          platinum: {
            price: response.data.rates.XPT,
            currency: baseCurrency,
            unit: 'per_ounce',
          },
          palladium: {
            price: response.data.rates.XPD,
            currency: baseCurrency,
            unit: 'per_ounce',
          },
        };
      }
      return null;
    } catch (error) {
      console.error('MetalpriceAPI error:', error.message);
      return null;
    }
  }
}

// Gold-API.com wrapper
export class GoldAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.goldapi.io/api';
  }

  async getMetalPrice(metal, currency = 'INR') {
    try {
      const symbol = metal.toUpperCase();
      const response = await axios.get(`${this.baseURL}/${symbol}/${currency}`, {
        headers: {
          'x-access-token': this.apiKey,
        },
      });

      return {
        metal: symbol,
        price: response.data.price,
        currency: currency,
        unit: response.data.unit || 'per_gram',
        change: response.data.ch || 0,
        changePercent: response.data.chp || 0,
        timestamp: response.data.timestamp,
      };
    } catch (error) {
      console.error(`Gold-API error for ${metal}:`, error.message);
      return null;
    }
  }
}

export const METAL_TYPES = [
  { type: 'gold', name: 'Gold', symbol: 'XAU' },
  { type: 'silver', name: 'Silver', symbol: 'XAG' },
  { type: 'platinum', name: 'Platinum', symbol: 'XPT' },
  { type: 'palladium', name: 'Palladium', symbol: 'XPD' },
];
