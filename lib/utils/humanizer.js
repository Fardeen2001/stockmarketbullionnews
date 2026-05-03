import axios from 'axios';

/**
 * Banned AI patterns for journalism-grade content
 */
const BANNED_PATTERNS = {
  phrases: [
    { pattern: /furthermore/gi, replacement: '', weight: -2 },
    { pattern: /moreover/gi, replacement: '', weight: -2 },
    { pattern: /in conclusion/gi, replacement: '', weight: -3 },
    { pattern: /it is important to note/gi, replacement: '', weight: -3 },
    { pattern: /it is worth noting/gi, replacement: '', weight: -3 },
    { pattern: /it should be noted/gi, replacement: '', weight: -2 },
    { pattern: /as previously mentioned/gi, replacement: '', weight: -2 },
    { pattern: /it goes without saying/gi, replacement: '', weight: -2 },
    { pattern: /needless to say/gi, replacement: '', weight: -2 },
    { pattern: /last but not least/gi, replacement: '', weight: -2 },
    { pattern: /at the end of the day/gi, replacement: '', weight: -2 },
    { pattern: /when all is said and done/gi, replacement: '', weight: -2 },
    { pattern: /it is clear that/gi, replacement: '', weight: -2 },
    { pattern: /there is no doubt that/gi, replacement: '', weight: -2 },
    { pattern: /it is evident that/gi, replacement: '', weight: -2 },
    { pattern: /one of the most/gi, replacement: '', weight: -1 },
    { pattern: /a variety of/gi, replacement: 'various', weight: -1 },
    { pattern: /a number of/gi, replacement: 'several', weight: -1 },
    { pattern: /many experts believe/gi, replacement: '', weight: -2 },
    { pattern: /studies have shown/gi, replacement: '', weight: -2 },
    { pattern: /research suggests/gi, replacement: '', weight: -2 },
    { pattern: /according to experts/gi, replacement: '', weight: -2 },
    { pattern: /in today's fast-paced world/gi, replacement: '', weight: -3 },
    { pattern: /in the current climate/gi, replacement: '', weight: -2 },
    { pattern: /in the realm of/gi, replacement: 'in', weight: -1 },
  ],

  weakVerbs: [
    { weak: /\butilize\b/gi, strong: 'use' },
    { weak: /\butilizes\b/gi, strong: 'uses' },
    { weak: /\butilized\b/gi, strong: 'used' },
    { weak: /\bimplement\b/gi, strong: 'do' },
    { weak: /\bfacilitate\b/gi, strong: 'help' },
    { weak: /\bendeavor\b/gi, strong: 'try' },
    { weak: /\bsubsequently\b/gi, strong: 'then' },
    { weak: /\bprior to\b/gi, strong: 'before' },
    { weak: /\bin order to\b/gi, strong: 'to' },
  ],

  goodPatterns: [
    { pattern: /however,/gi, weight: 1 },
    { pattern: /meanwhile,/gi, weight: 1 },
    { pattern: /on the other hand,/gi, weight: 1 },
    { pattern: /in contrast,/gi, weight: 1 },
    { pattern: /as a result,/gi, weight: 1 },
  ]
};

/**
 * Journalism-Grade Humanizer
 * Removes AI patterns and makes content more human-like
 */
export class JournalismHumanizer {
  constructor() {
    this.bannedPatterns = BANNED_PATTERNS;
  }

  /**
   * Apply all humanization transformations
   * @param {string} content - The AI-generated content
   * @returns {{ content: string, changes: string[] }}
   */
  humanize(content) {
    let result = content;
    const changes = [];

    // 1. Remove banned phrases
    result = this.removeBannedPhrases(result, changes);

    // 2. Replace weak verbs with strong alternatives
    result = this.replaceWeakVerbs(result, changes);

    // 3. Fix passive voice patterns
    result = this.fixPassiveVoice(result, changes);

    // 4. Improve sentence flow
    result = this.improveSentenceFlow(result, changes);

    // 5. Add natural transitions
    result = this.addNaturalTransitions(result, changes);

    // 6. Break overly long sentences
    result = this.breakLongSentences(result, changes);

    // 7. Normalize formatting
    result = this.normalizeFormatting(result);

    return { content: result, changes };
  }

  removeBannedPhrases(content, changes = []) {
    let result = content;

    for (const { pattern, replacement, weight } of this.bannedPatterns.phrases) {
      const matches = result.match(pattern);
      if (matches) {
        const before = matches[0];
        result = result.replace(pattern, replacement);
        changes.push(`Removed: "${before}" (${matches.length}x)`);
      }
    }

    // Clean up any double commas or awkward spaces left behind
    result = result.replace(/,\s*,/g, ',');
    result = result.replace(/\s+/g, ' ').trim();

    return result;
  }

  replaceWeakVerbs(content, changes = []) {
    let result = content;

    for (const { weak, strong } of this.bannedPatterns.weakVerbs) {
      const before = result.match(weak);
      if (before) {
        result = result.replace(weak, strong);
        changes.push(`Replaced weak verb: ${before[0]} → ${strong}`);
      }
    }

    return result;
  }

  fixPassiveVoice(content, changes = []) {
    // Common passive patterns to active voice
    const passiveFixes = [
      // "was announced" → "announced"
      { pattern: /was announced/gi, replacement: 'announced' },
      // "is being considered" → "is considering"
      { pattern: /is being considered/gi, replacement: 'is being considered' }, // keep as-is for now
      // "has been seen" → "we have seen"
      { pattern: /has been seen/gi, replacement: 'has been seen' },
      // "was created" → "created"
      { pattern: /was created/gi, replacement: 'created' },
      // "is expected to" → "expected to"
      { pattern: /is expected to be/gi, replacement: 'is expected to be' },
    ];

    let result = content;
    for (const { pattern, replacement } of passiveFixes) {
      const matches = result.match(pattern);
      if (matches && replacement !== pattern) {
        result = result.replace(pattern, replacement);
        changes.push(`Fixed passive: ${matches[0]}`);
      }
    }

    return result;
  }

  improveSentenceFlow(content, changes = []) {
    let result = content;

    // Replace formal transitions with natural ones
    const formalToNatural = {
      'in addition to': 'plus',
      'in spite of': 'despite',
      'for the purpose of': 'to',
      'in regard to': 'about',
      'with regard to': 'about',
      'with respect to': 'for',
      'in terms of': 'for',
      'as a matter of fact': 'actually',
      'in the near future': 'soon',
      'at the present time': 'now',
      'due to the fact that': 'because',
      'in the event that': 'if',
      'for the reason that': 'because',
      'on the grounds that': 'because',
    };

    for (const [formal, natural] of Object.entries(formalToNatural)) {
      const regex = new RegExp(formal, 'gi');
      const matches = result.match(regex);
      if (matches) {
        result = result.replace(regex, natural);
        changes.push(`Natural transition: "${matches[0]}" → "${natural}"`);
      }
    }

    return result;
  }

  addNaturalTransitions(content, changes = []) {
    let result = content;

    // Add variety to transition words
    const transitions = [
      'Meanwhile',
      'In contrast',
      'Looking at the data',
      'This shift',
      "What's more",
      'As a result',
      'In practice',
      'On balance',
    ];

    // Find paragraphs without transitions and add them
    const paragraphs = result.split(/\n\n+/);
    let transitionIndex = 0;

    const resultParagraphs = paragraphs.map((para, i) => {
      // Skip if it's a heading
      if (para.startsWith('##') || para.startsWith('###')) {
        return para;
      }

      // Check if paragraph needs a transition
      const hasTransition = /^(Meanwhile|In contrast|What's more|As a result|However|Moreover)/.test(para.trim());

      if (!hasTransition && para.length > 100 && i > 0) {
        // Add transition to some paragraphs
        if (transitionIndex < transitions.length && Math.random() > 0.6) {
          const transition = transitions[transitionIndex] + ', ';
          const resultPara = transition + para.charAt(0).toLowerCase() + para.slice(1);
          transitionIndex++;
          return resultPara;
        }
      }

      return para;
    });

    if (transitionIndex > 0) {
      changes.push(`Added ${transitionIndex} natural transitions`);
    }

    return resultParagraphs.join('\n\n');
  }

  breakLongSentences(content, changes = []) {
    let result = content;

    // Find sentences longer than 40 words and break them
    const sentences = result.split(/([.!?]+\s*)/);
    const processedSentences = [];

    for (const sentence of sentences) {
      if (sentence.length > 0 && !/^[.!?]+$/.test(sentence)) {
        const wordCount = sentence.split(/\s+/).length;

        if (wordCount > 40 && sentence.includes(',')) {
          // Try to break at comma
          const parts = sentence.split(',');
          let currentPart = parts[0];

          for (let i = 1; i < parts.length; i++) {
            const nextPart = parts[i];
            const currentWords = currentPart.split(/\s+/).length;

            if (currentWords > 25 && i < parts.length - 1) {
              processedSentences.push(currentPart.trim() + '.');
              currentPart = parts[i].trim();
            } else {
              currentPart += ',' + nextPart;
            }
          }

          if (currentPart.trim()) {
            processedSentences.push(currentPart.trim());
          }

          changes.push(`Broke long sentence (${wordCount} words)`);
        } else {
          processedSentences.push(sentence);
        }
      } else {
        processedSentences.push(sentence);
      }
    }

    return processedSentences.join(' ');
  }

  normalizeFormatting(content) {
    let result = content;

    // Normalize multiple newlines
    result = result.replace(/\n{3,}/g, '\n\n');

    // Normalize spaces
    result = result.replace(/\s+/g, ' ');

    // Ensure proper spacing after headings
    result = result.replace(/(##\s+[^\n]+)\n([^#\n])/g, '$1\n\n$2');
    result = result.replace(/(###\s+[^\n]+)\n([^#\n])/g, '$1\n\n$2');

    // Remove leading/trailing whitespace from each line
    result = result.split('\n')
      .map(line => line.trim())
      .join('\n');

    return result.trim();
  }

  /**
   * Quick check for AI patterns
   * @param {string} content
   * @returns {{ hasPatterns: boolean, patterns: string[] }}
   */
  quickAIPatternCheck(content) {
    const foundPatterns = [];

    for (const { pattern } of this.bannedPatterns.phrases) {
      const matches = content.match(pattern);
      if (matches) {
        foundPatterns.push(matches[0]);
      }
    }

    return {
      hasPatterns: foundPatterns.length > 0,
      patterns: foundPatterns,
      score: Math.max(0, 100 - (foundPatterns.length * 10))
    };
  }
}

/**
 * Content Humanizer with External API support
 * Supports multiple providers: stealthwriter, undetectable, quillbot
 */
export class ContentHumanizer {
  constructor(apiKey, provider = 'stealthwriter') {
    this.apiKey = apiKey;
    this.provider = provider;
    this.journalismHumanizer = new JournalismHumanizer();
  }

  /**
   * Humanize content - first applies local transformations, then external API if available
   * @param {string} content
   * @returns {Promise<string>}
   */
  async humanize(content) {
    // First: Apply local journalism humanizer
    const { content: localHumanized } = this.journalismHumanizer.humanize(content);

    if (!this.apiKey) {
      return localHumanized;
    }

    try {
      // Then: Apply external API humanizer
      const externallyHumanized = await this.humanizeWithAPI(localHumanized);
      return externallyHumanized;
    } catch (error) {
      console.error('External humanizer failed, returning local result:', error.message);
      return localHumanized;
    }
  }

  /**
   * Humanize using external API
   */
  async humanizeWithAPI(content) {
    switch (this.provider) {
      case 'stealthwriter':
        return await this.humanizeWithStealthWriter(content);
      case 'undetectable':
        return await this.humanizeWithUndetectable(content);
      case 'quillbot':
        return await this.humanizeWithQuillbot(content);
      default:
        return content;
    }
  }

  async humanizeWithStealthWriter(content) {
    const response = await axios.post(
      'https://api.stealthwriter.ai/v1/humanize',
      { text: content, mode: 'standard' },
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

  async humanizeWithUndetectable(content) {
    const PROXY_MIN_CHARS = 250;
    const SUBMIT_MIN_CHARS = 50;

    if (content.length < SUBMIT_MIN_CHARS) return content;

    if (content.length >= PROXY_MIN_CHARS) {
      const response = await axios.post(
        'https://human.undetectable.ai/humanize',
        { humanizer: 'undetectable', text: content },
        { headers: { 'API-Key': this.apiKey, 'Content-Type': 'application/json' }, timeout: 60000 }
      );
      const out = response.data?.output ?? response.data?.text ?? response.data?.humanized_text;
      return typeof out === 'string' ? out : content;
    }

    const submitRes = await axios.post(
      'https://humanize.undetectable.ai/submit',
      { content, readability: 'Journalist', purpose: 'Article', strength: 'Balanced' },
      { headers: { apikey: this.apiKey, 'Content-Type': 'application/json' }, timeout: 15000 }
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

  async humanizeWithQuillbot(content) {
    const response = await axios.post(
      'https://api.quillbot.com/v1/paraphrase',
      { text: content, mode: 'standard' },
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
   * Humanize content in chunks for long articles
   * @param {string} content
   * @param {number} chunkSize
   * @returns {Promise<string>}
   */
  async humanizeInChunks(content, chunkSize = 2000) {
    // First apply local humanizer to entire content
    const { content: localHumanized } = this.journalismHumanizer.humanize(content);

    if (localHumanized.length <= chunkSize) {
      return await this.humanize(localHumanized);
    }

    // Split by paragraph boundaries
    const paragraphs = localHumanized.split(/\n\n+/).filter((p) => p.trim());
    const chunks = [];
    let current = [];
    let currentLen = 0;

    for (const p of paragraphs) {
      const pLen = p.length + 2;
      if (currentLen + pLen > chunkSize && current.length > 0) {
        chunks.push(current.join('\n\n'));
        current = [];
        currentLen = 0;
      }
      current.push(p);
      currentLen += pLen;
    }
    if (current.length > 0) {
      chunks.push(current.join('\n\n'));
    }

    const humanizedChunks = await Promise.all(
      chunks.map((chunk) => this.humanize(chunk))
    );

    return humanizedChunks.join('\n\n');
  }
}

/**
 * Fallback basic humanizer (no API required)
 */
export function basicHumanize(content) {
  const humanizer = new JournalismHumanizer();
  const { content: result } = humanizer.humanize(content);
  return result;
}