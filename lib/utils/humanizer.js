import axios from 'axios';

/**
 * Humanizer API utility to make AI-generated content more human-like
 * Supports multiple humanizer APIs
 */
export class ContentHumanizer {
  constructor(apiKey, provider = 'stealthwriter') {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  /**
   * Humanize content using the configured API
   * @param {string} content - The AI-generated content to humanize
   * @returns {Promise<string>} - Humanized content
   */
  async humanize(content) {
    if (!this.apiKey) {
      console.warn('Humanizer API key not configured, returning original content');
      return content;
    }

    try {
      switch (this.provider) {
        case 'stealthwriter':
          return await this.humanizeWithStealthWriter(content);
        case 'undetectable':
          return await this.humanizeWithUndetectable(content);
        case 'quillbot':
          return await this.humanizeWithQuillbot(content);
        default:
          return await this.humanizeWithStealthWriter(content);
      }
    } catch (error) {
      console.error('Humanizer API error:', error.message);
      // Rethrow so agent can fall back to basicHumanize (avoid false "Content humanized successfully" log)
      throw error;
    }
  }

  /**
   * Humanize using StealthWriter API
   */
  async humanizeWithStealthWriter(content) {
    const response = await axios.post(
      'https://api.stealthwriter.ai/v1/humanize',
      {
        text: content,
        mode: 'standard',
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.humanized_text || content;
  }

  /**
   * Humanize using Undetectable AI API
   * - Content >= 250 chars: Humanizer Proxy (sync) https://human.undetectable.ai/humanize
   * - Content 50-249 chars: submit + poll https://humanize.undetectable.ai/submit
   * - Content < 50 chars: return as-is (API minimum)
   */
  async humanizeWithUndetectable(content) {
    const PROXY_MIN_CHARS = 250;
    const SUBMIT_MIN_CHARS = 50;

    if (content.length < SUBMIT_MIN_CHARS) {
      return content;
    }

    // Humanizer Proxy: synchronous, requires min 250 chars, header API-Key
    if (content.length >= PROXY_MIN_CHARS) {
      const response = await axios.post(
        'https://human.undetectable.ai/humanize',
        { humanizer: 'undetectable', text: content },
        {
          headers: { 'API-Key': this.apiKey, 'Content-Type': 'application/json' },
          timeout: 60000,
        }
      );
      const out = response.data?.output ?? response.data?.text ?? response.data?.humanized_text;
      return typeof out === 'string' ? out : content;
    }

    // Async flow: submit then poll until output ready (50-249 chars)
    const submitRes = await axios.post(
      'https://humanize.undetectable.ai/submit',
      {
        content,
        readability: 'Journalist',
        purpose: 'Article',
        strength: 'Balanced',
      },
      {
        headers: { apikey: this.apiKey, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    const docId = submitRes.data?.id;
    if (!docId) throw new Error(submitRes.data?.error || 'No document ID returned');

    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const docRes = await axios.post(
        'https://humanize.undetectable.ai/document',
        { id: docId },
        { headers: { apikey: this.apiKey, 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      const output = docRes.data?.output;
      if (output) return output;
      if (docRes.data?.status === 'error') throw new Error(docRes.data?.error || 'Humanization failed');
    }
    throw new Error('Humanization timed out');
  }

  /**
   * Humanize using QuillBot API (if available)
   */
  async humanizeWithQuillbot(content) {
    const response = await axios.post(
      'https://api.quillbot.com/v1/paraphrase',
      {
        text: content,
        mode: 'standard',
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.paraphrased_text || content;
  }

  /**
   * Humanize content in batches (for long articles)
   * @param {string} content - Full content
   * @param {number} chunkSize - Size of each chunk (default: 2000 characters)
   * @returns {Promise<string>} - Fully humanized content
   */
  async humanizeInChunks(content, chunkSize = 2000) {
    if (content.length <= chunkSize) {
      return await this.humanize(content);
    }

    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    const humanizedChunks = await Promise.all(
      chunks.map(chunk => this.humanize(chunk))
    );

    return humanizedChunks.join(' ');
  }
}

/**
 * Fallback humanizer that applies basic transformations
 * Used when API is not available
 */
export function basicHumanize(content) {
  // Basic transformations to make content more natural
  let humanized = content;

  // Add slight variations
  humanized = humanized.replace(/Furthermore/g, 'Additionally');
  humanized = humanized.replace(/Moreover/g, 'What\'s more');
  humanized = humanized.replace(/In conclusion/g, 'To sum up');
  humanized = humanized.replace(/It is important to note/g, 'It\'s worth noting');

  // Ensure natural paragraph breaks
  humanized = humanized.replace(/\n{3,}/g, '\n\n');

  return humanized;
}
