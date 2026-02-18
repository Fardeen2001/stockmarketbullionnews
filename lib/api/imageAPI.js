import axios from 'axios';

// Unsplash API wrapper
export class UnsplashAPI {
  constructor(accessKey) {
    this.accessKey = accessKey;
    this.baseURL = 'https://api.unsplash.com';
    /** After 403/401, skip all further Unsplash calls this instance to avoid log spam and timeout */
    this.disabledDueToAuthError = false;
  }

  async searchImage(query, orientation = 'landscape') {
    if (this.disabledDueToAuthError) return null;
    try {
      const response = await axios.get(`${this.baseURL}/search/photos`, {
        params: {
          query: query,
          orientation: orientation,
          per_page: 1,
        },
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const photo = response.data.results[0];
        return {
          url: photo.urls.regular,
          thumbUrl: photo.urls.thumb,
          alt: photo.alt_description || query,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html,
        };
      }
      return null;
    } catch (error) {
      const status = error.response?.status;
      if (status === 403 || status === 401) {
        this.disabledDueToAuthError = true;
        console.warn('Unsplash API access denied (403/401). Skipping Unsplash for the rest of this run. Check UNSPLASH_ACCESS_KEY and Unsplash app approval.');
      } else {
        console.error('Unsplash API error:', error.message);
      }
      return null;
    }
  }

  async getStockImage(stockName) {
    const queries = [
      `${stockName} stock market`,
      `${stockName} company`,
      'stock market trading',
      'financial markets',
    ];
    
    for (const query of queries) {
      const result = await this.searchImage(query);
      if (result) return result;
    }
    return null;
  }

  async getMetalImage(metalType) {
    const queries = [
      `${metalType} bullion`,
      `${metalType} bars`,
      `${metalType} precious metal`,
      'gold silver precious metals',
    ];
    
    for (const query of queries) {
      const result = await this.searchImage(query);
      if (result) return result;
    }
    return null;
  }
}

// Pexels API wrapper (fallback)
export class PexelsAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.pexels.com/v1';
  }

  async searchImage(query) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          query: query,
          per_page: 1,
          orientation: 'landscape',
        },
        headers: {
          Authorization: this.apiKey,
        },
      });

      if (response.data.photos && response.data.photos.length > 0) {
        const photo = response.data.photos[0];
        return {
          url: photo.src.large,
          thumbUrl: photo.src.medium,
          alt: photo.alt || query,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
        };
      }
      return null;
    } catch (error) {
      console.error('Pexels API error:', error.message);
      return null;
    }
  }
}
