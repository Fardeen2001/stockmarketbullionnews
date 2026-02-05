// IMPORTANT: Suppress deprecation warnings BEFORE importing yahoo-finance2
// This must be imported first to catch warnings from the dependency
import '@/lib/utils/suppressDeprecation';
import axios from 'axios';
import YahooFinance from 'yahoo-finance2';

// Yahoo Finance API wrapper for metals
export class YahooFinanceMetalsAPI {
  constructor() {
    // Initialize YahooFinance instance (required for v3)
    this.yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    // Cache for discovered metal symbols (dynamically populated)
    this.metalSymbolCache = new Map();
    this.discoveryInProgress = false;
  }

  /**
   * Get metal symbol dynamically - no hardcoding
   * Tries cache first, then discovery, then common patterns
   */
  async getMetalSymbol(metalType) {
    const metalTypeLower = metalType.toLowerCase();
    
    // Check cache first
    if (this.metalSymbolCache.has(metalTypeLower)) {
      return this.metalSymbolCache.get(metalTypeLower);
    }

    // If discovery not in progress, discover all metals to populate cache
    if (!this.discoveryInProgress) {
      this.discoveryInProgress = true;
      try {
        const discoveredMetals = await this.discoverAllMetals();
        discoveredMetals.forEach(metal => {
          this.metalSymbolCache.set(metal.type.toLowerCase(), metal.symbol);
        });
      } catch (error) {
        console.error('Error discovering metals for cache:', error.message);
      } finally {
        this.discoveryInProgress = false;
      }
    }

    // Check cache again after discovery
    if (this.metalSymbolCache.has(metalTypeLower)) {
      return this.metalSymbolCache.get(metalTypeLower);
    }

    // Try common symbol patterns dynamically
    const commonPatterns = this.generateMetalSymbolPatterns(metalTypeLower);
    for (const symbol of commonPatterns) {
      try {
        const quote = await this.yahooFinance.quote(symbol);
        if (quote && quote.regularMarketPrice) {
          // Cache the successful symbol
          this.metalSymbolCache.set(metalTypeLower, symbol);
          return symbol;
        }
      } catch (error) {
        // Try next pattern
        continue;
      }
    }

    return null;
  }

  /**
   * Generate possible symbol patterns for a metal type
   */
  generateMetalSymbolPatterns(metalType) {
    const patterns = [];
    
    // Common futures pattern: METAL=F
    patterns.push(`${metalType.toUpperCase().charAt(0)}${metalType.toUpperCase().charAt(1)}=F`);
    
    // Spot price patterns: XMETALUSD=X
    const metalCodes = {
      gold: 'XAU',
      silver: 'XAG',
      platinum: 'XPT',
      palladium: 'XPD',
      copper: 'XCU',
      aluminum: 'XAL',
      rhodium: 'XRH',
      ruthenium: 'XRUT',
      iridium: 'XIR',
      osmium: 'XOS',
    };
    
    if (metalCodes[metalType]) {
      patterns.push(`${metalCodes[metalType]}USD=X`);
    }
    
    // Generic patterns
    patterns.push(`${metalType.toUpperCase()}=F`);
    patterns.push(`X${metalType.toUpperCase()}USD=X`);
    
    return patterns;
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
      // Get symbol dynamically - no hardcoding
      const symbol = await this.getMetalSymbol(metalType);
      if (!symbol) {
        console.warn(`No symbol found for metal type: ${metalType}. Trying direct patterns...`);
        // Last resort: try patterns directly
        const patterns = this.generateMetalSymbolPatterns(metalType.toLowerCase());
        for (const patternSymbol of patterns) {
          try {
            const quote = await this.yahooFinance.quote(patternSymbol);
            if (quote && quote.regularMarketPrice) {
              // Cache it for future use
              this.metalSymbolCache.set(metalType.toLowerCase(), patternSymbol);
              return this.formatMetalData(quote, metalType, currency);
            }
          } catch (error) {
            continue;
          }
        }
        return null;
      }

      const quote = await this.yahooFinance.quote(symbol);
      
      if (!quote || !quote.regularMarketPrice) {
        // Try alternative patterns if primary symbol fails
        const patterns = this.generateMetalSymbolPatterns(metalType.toLowerCase());
        for (const patternSymbol of patterns) {
          if (patternSymbol === symbol) continue; // Skip already tried
          try {
            const altQuote = await this.yahooFinance.quote(patternSymbol);
            if (altQuote && altQuote.regularMarketPrice) {
              // Cache the working symbol
              this.metalSymbolCache.set(metalType.toLowerCase(), patternSymbol);
              return this.formatMetalData(altQuote, metalType, currency);
            }
          } catch (error) {
            continue;
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

  /**
   * Discover all available metals dynamically
   * Tries common metal symbols and validates them
   */
  async discoverAllMetals() {
    const discoveredMetals = [];
    
    // Comprehensive list of precious and industrial metals
    const metalSymbols = [
      // Precious metals
      { type: 'gold', name: 'Gold', symbols: ['GC=F', 'XAUUSD=X'] },
      { type: 'silver', name: 'Silver', symbols: ['SI=F', 'XAGUSD=X'] },
      { type: 'platinum', name: 'Platinum', symbols: ['PL=F', 'XPTUSD=X'] },
      { type: 'palladium', name: 'Palladium', symbols: ['PA=F', 'XPDUSD=X'] },
      // Industrial metals
      { type: 'copper', name: 'Copper', symbols: ['HG=F', 'XCUUSD=X'] },
      { type: 'aluminum', name: 'Aluminum', symbols: ['ALI=F', 'XALUSD=X'] },
      { type: 'zinc', name: 'Zinc', symbols: ['ZN=F'] },
      { type: 'nickel', name: 'Nickel', symbols: ['NI=F'] },
      { type: 'lead', name: 'Lead', symbols: ['PB=F'] },
      { type: 'tin', name: 'Tin', symbols: ['SN=F'] },
      // Other metals
      { type: 'rhodium', name: 'Rhodium', symbols: ['XRHUSD=X'] },
      { type: 'ruthenium', name: 'Ruthenium', symbols: ['XRUTUSD=X'] },
      { type: 'iridium', name: 'Iridium', symbols: ['XIRUSD=X'] },
      { type: 'osmium', name: 'Osmium', symbols: ['XOSUSD=X'] },
    ];
    
    for (const metal of metalSymbols) {
      try {
        // Try each symbol for this metal
        for (const symbol of metal.symbols) {
          try {
            const quote = await this.yahooFinance.quote(symbol);
            if (quote && quote.regularMarketPrice) {
              discoveredMetals.push({
                type: metal.type,
                name: metal.name,
                symbol: symbol,
              });
              break; // Found valid symbol, move to next metal
            }
          } catch (error) {
            // Try next symbol
            continue;
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error discovering metal ${metal.type}:`, error.message);
        continue;
      }
    }
    
    return discoveredMetals;
  }

  async getAllMetalsPrices(currency = 'INR') {
    try {
      // First, discover all available metals
      const discoveredMetals = await this.discoverAllMetals();
      
      if (discoveredMetals.length === 0) {
        // Fallback to common metals if discovery fails
        console.log('Metal discovery failed, using fallback list');
        // Fallback: try common metal types with dynamic symbol discovery
        const commonMetalTypes = ['gold', 'silver', 'platinum', 'palladium', 'copper', 'aluminum'];
        const prices = {};
        
        for (const metalType of commonMetalTypes) {
          const priceData = await this.getMetalPrice(metalType, currency);
          if (priceData) {
            prices[metalType] = priceData;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        return prices;
      }
      
      // Fetch prices for all discovered metals
      const prices = {};
      for (const metal of discoveredMetals) {
        try {
          const priceData = await this.getMetalPrice(metal.type, currency);
          if (priceData) {
            prices[metal.type] = priceData;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error fetching price for ${metal.type}:`, error.message);
        }
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

/**
 * Get all available metals dynamically - no hardcoding
 * Discovers all metals from Yahoo Finance
 */
export async function getAllMetals() {
  const metalsAPI = new YahooFinanceMetalsAPI();
  return await metalsAPI.discoverAllMetals();
}
