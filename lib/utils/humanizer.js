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
      // Return original content if humanization fails
      return content;
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
   */
  async humanizeWithUndetectable(content) {
    const response = await axios.post(
      'https://api.undetectable.ai/v1/humanize',
      {
        text: content,
        readability: 'high',
        purpose: 'general',
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.output || content;
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
