/**
 * Content Quality Scoring System
 * Journalism-grade quality checks for AI-generated articles
 */

export const QUALITY_THRESHOLDS = {
  wordCount: 80,        // Min score to pass
  readability: 70,     // Min Flesch-Kincaid score
  aiPatterns: 85,      // Min AI pattern detection score
  structure: 75,       // Min structure score
  citations: 60,       // Min citation score
};

export const BANNED_PATTERNS = {
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
    { pattern: /industry insiders say/gi, replacement: '', weight: -2 },
    { pattern: /sources say/gi, replacement: '', weight: -2 },
    { pattern: /it has been reported/gi, replacement: '', weight: -2 },
    { pattern: /in today's fast-paced world/gi, replacement: '', weight: -3 },
    { pattern: /in the current climate/gi, replacement: '', weight: -2 },
    { pattern: /in the realm of/gi, replacement: 'in', weight: -1 },
    { pattern: /it is crucial that/gi, replacement: 'make sure', weight: -2 },
    { pattern: /it is essential that/gi, replacement: 'make sure', weight: -2 },
  ],

  weakVerbs: [
    { weak: /\butilize\b/gi, strong: 'use' },
    { weak: /\butilizes\b/gi, strong: 'uses' },
    { weak: /\butilized\b/gi, strong: 'used' },
    { weak: /\bimplement\b/gi, strong: 'do' },
    { weak: /\bimplements\b/gi, strong: 'does' },
    { weak: /\bfacilitate\b/gi, strong: 'help' },
    { weak: /\bendeavor\b/gi, strong: 'try' },
    { weak: /\bcommence\b/gi, strong: 'start' },
    { weak: /\bterminate\b/gi, strong: 'end' },
    { weak: /\bdemonstrate\b/gi, strong: 'show' },
    { weak: /\bascertain\b/gi, strong: 'find out' },
    { weak: /\bconstitute\b/gi, strong: 'make up' },
    { weak: /\bsubsequently\b/gi, strong: 'then' },
    { weak: /\bprior to\b/gi, strong: 'before' },
    { weak: /\bsubsequent to\b/gi, strong: 'after' },
    { weak: /\bin the event of\b/gi, strong: 'if' },
    { weak: /\bat this point\b/gi, strong: 'now' },
    { weak: /\bin order to\b/gi, strong: 'to' },
    { weak: /\bdue to the fact that\b/gi, strong: 'because' },
    { weak: /\bhas the ability to\b/gi, strong: 'can' },
  ],

  // Positive patterns (increase score)
  goodPatterns: [
    { pattern: /however,/gi, weight: 1 },
    { pattern: /meanwhile,/gi, weight: 1 },
    { pattern: /on the other hand,/gi, weight: 1 },
    { pattern: /in contrast,/gi, weight: 1 },
    { pattern: /looking at the data,/gi, weight: 1 },
    { pattern: /this shift/gi, weight: 1 },
    { pattern: /what's more,/gi, weight: 1 },
    { pattern: /as a result,/gi, weight: 1 },
  ]
};

export class ContentQualityScorer {
  constructor() {
    this.thresholds = QUALITY_THRESHOLDS;
  }

  scoreArticle(content) {
    const wordCountScore = this.scoreWordCount(content);
    const readabilityScore = this.scoreReadability(content);
    const aiPatternsScore = this.detectAIPatterns(content);
    const structureScore = this.scoreStructure(content);
    const citationsScore = this.scoreCitations(content);
    const engagementScore = this.scoreEngagement(content);

    const overall = Math.round(
      (wordCountScore * 0.2) +
      (readabilityScore * 0.2) +
      (aiPatternsScore * 0.25) +
      (structureScore * 0.15) +
      (citationsScore * 0.1) +
      (engagementScore * 0.1)
    );

    return {
      wordCount: wordCountScore,
      readability: readabilityScore,
      aiPatterns: aiPatternsScore,
      structure: structureScore,
      citations: citationsScore,
      engagement: engagementScore,
      overall,
      passed: this.checkPassed({ wordCountScore, readabilityScore, aiPatternsScore, structureScore, citationsScore })
    };
  }

  checkPassed(scores) {
    return (
      scores.wordCountScore >= this.thresholds.wordCount &&
      scores.readabilityScore >= this.thresholds.readability &&
      scores.aiPatternsScore >= this.thresholds.aiPatterns &&
      scores.structureScore >= this.thresholds.structure &&
      scores.citationsScore >= this.thresholds.citations
    );
  }

  scoreWordCount(content) {
    const words = content.split(/\s+/).filter(w => w.length > 0).length;

    if (words >= 1500 && words <= 2000) return 100;
    if (words >= 1200 && words < 1500) return 85;
    if (words >= 1000 && words < 1200) return 70;
    if (words >= 800 && words < 1000) return 50;
    if (words < 800) return Math.max(0, Math.round(words / 10));
    if (words > 2200) return Math.max(0, 100 - Math.round((words - 2200) / 50));
    return 80;
  }

  scoreReadability(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (sentences.length === 0) return 0;

    const words = content.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(content);

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;

    // Flesch-Kincaid Grade Level
    const gradeLevel = avgWordsPerSentence > 0
      ? 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
      : 20;

    // Target: 8-12 grade level
    if (gradeLevel >= 8 && gradeLevel <= 12) return 100;
    if (gradeLevel >= 6 && gradeLevel < 8) return 85;
    if (gradeLevel > 12 && gradeLevel <= 14) return 85;
    return Math.max(0, 100 - Math.abs(gradeLevel - 10) * 8);
  }

  countSyllables(text) {
    const words = text.toLowerCase().match(/[bcdfghjklmnpqrstvwxyz][aeiouy]*[bcdfghjklmnpqrstvwxyz]*/g) || [];
    return words.reduce((acc, word) => {
      const vowelGroups = word.match(/[aeiouy]+/g) || [];
      return acc + Math.max(1, vowelGroups.length);
    }, 0);
  }

  detectAIPatterns(content) {
    let score = 100;

    for (const { pattern, weight } of BANNED_PATTERNS.phrases) {
      const matches = content.match(pattern);
      if (matches) {
        score += weight * matches.length;
      }
    }

    for (const { pattern, weight } of BANNED_PATTERNS.goodPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        score += weight * matches.length;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  scoreStructure(content) {
    let score = 50;

    // Check for ## headings (required for SEO)
    const h2Count = (content.match(/^##\s+.+$/gm) || []).length;
    const h3Count = (content.match(/^###\s+.+$/gm) || []).length;

    if (h2Count >= 4) score += 20;
    else if (h2Count >= 3) score += 10;

    if (h3Count >= 2) score += 10;

    // Check for intro paragraph (first non-heading text)
    const lines = content.split('\n');
    const firstNonHeading = lines.find(l => l.trim() && !l.startsWith('#'));
    if (firstNonHeading && firstNonHeading.length > 80) score += 10;

    // Check for proper section transitions
    if (h2Count >= 5) score += 10;

    return Math.min(100, score);
  }

  scoreCitations(content) {
    let score = 30;

    // Check for source attributions
    const citationPatterns = [
      /according to/gi,
      /as reported by/gi,
      /data from/gi,
      /source:/gi,
      /as per/gi,
    ];

    let citationCount = 0;
    for (const pattern of citationPatterns) {
      citationCount += (content.match(pattern) || []).length;
    }

    if (citationCount >= 5) score += 30;
    else if (citationCount >= 3) score += 20;
    else if (citationCount >= 1) score += 10;

    // Check for external link markers
    const externalLinks = (content.match(/\[EXTERNAL:/g) || []).length;
    if (externalLinks >= 3) score += 20;
    else if (externalLinks >= 1) score += 10;

    // Check for internal link markers
    const internalLinks = (content.match(/\[INTERNAL:/g) || []).length;
    if (internalLinks >= 2) score += 10;

    // Check for specific data/numbers
    const numbers = (content.match(/\d+/g) || []).length;
    if (numbers >= 10) score += 10;

    return Math.min(100, score);
  }

  scoreEngagement(content) {
    let score = 50;

    // Check for rhetorical questions
    const questions = (content.match(/\?/g) || []).length;
    if (questions >= 2) score += 15;
    else if (questions >= 1) score += 5;

    // Check for specific data points
    const percentages = (content.match(/\d+%/g) || []).length;
    const currency = (content.match(/[₹$€£]\d+/g) || []).length;
    const numbers = (content.match(/\d+/g) || []).length;

    const dataPoints = percentages + currency + (numbers > 10 ? 10 : numbers);
    if (dataPoints >= 15) score += 15;
    else if (dataPoints >= 8) score += 10;
    else if (dataPoints >= 3) score += 5;

    // Check for quotes (analyst quotes add credibility)
    const quotes = (content.match(/"/g) || []).length;
    if (quotes >= 4) score += 10;
    else if (quotes >= 2) score += 5;

    // Check sentence variety (mix of short and long)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const shortSentences = sentences.filter(s => s.split(/\s+/).length <= 10).length;
    const shortRatio = sentences.length > 0 ? shortSentences / sentences.length : 0;

    // Good variety: 20-40% short sentences
    if (shortRatio >= 0.2 && shortRatio <= 0.4) score += 10;

    return Math.min(100, score);
  }
}

export class QualityEnforcer {
  constructor(thresholds = QUALITY_THRESHOLDS) {
    this.scorer = new ContentQualityScorer();
    this.thresholds = thresholds;
  }

  validate(content) {
    const score = this.scorer.scoreArticle(content);

    const issues = [];

    if (score.wordCount < this.thresholds.wordCount) {
      issues.push(`Word count too low: ${score.wordCount}/100 (min: ${this.thresholds.wordCount})`);
    }

    if (score.readability < this.thresholds.readability) {
      issues.push(`Readability too low: ${score.readability}/100 (min: ${this.thresholds.readability})`);
    }

    if (score.aiPatterns < this.thresholds.aiPatterns) {
      issues.push(`AI patterns detected: ${score.aiPatterns}/100 (min: ${this.thresholds.aiPatterns})`);
    }

    if (score.structure < this.thresholds.structure) {
      issues.push(`Structure needs improvement: ${score.structure}/100 (min: ${this.thresholds.structure})`);
    }

    if (score.citations < this.thresholds.citations) {
      issues.push(`Citations need improvement: ${score.citations}/100 (min: ${this.thresholds.citations})`);
    }

    return {
      passed: issues.length === 0,
      score,
      issues,
      recommendation: score.overall >= 80 ? 'approved' : score.overall >= 60 ? 'needs_revision' : 'needs_regeneration'
    };
  }

  generateFeedback(score) {
    const parts = [];

    if (score.wordCount < 80) {
      const estimatedWords = Math.round(score.wordCount * 15);
      parts.push(`Expand content to 1500-2000 words. Current: ~${estimatedWords} words.`);
    }

    if (score.aiPatterns < 85) {
      parts.push("Remove AI patterns: avoid 'furthermore', 'moreover', 'in conclusion', 'it is important to note'.");
    }

    if (score.readability < 70) {
      parts.push("Use shorter sentences (15-20 words avg), simpler words, active voice.");
    }

    if (score.structure < 75) {
      parts.push("Add more ## section headings (minimum 4) and ### subsections.");
    }

    if (score.citations < 60) {
      parts.push("Add more source citations and data points. Use 'According to [Source]' format.");
    }

    return parts.join("\n");
  }
}

// Standalone function for quick quality check
export function quickQualityCheck(content) {
  const scorer = new ContentQualityScorer();
  return scorer.scoreArticle(content);
}