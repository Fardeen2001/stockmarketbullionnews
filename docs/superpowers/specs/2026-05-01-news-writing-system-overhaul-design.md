# News Writing System Overhaul Design

**Date:** 2026-05-01  
**Project:** StockMarket Bullion News Generator  
**Goal:** Transform AI-generated news from "detectable AI output" to "award-winning journalism quality"

---

## Executive Summary

The current news generation system produces content that:
- Scores poorly on AI-detection tools
- Lacks depth and research quality
- Falls short of 1500-2000 word targets
- Uses formulaic, robotic language patterns

This design proposes a comprehensive overhaul implementing:
- **A) Enhanced AI Prompts** (free, immediate improvement)
- **B) AI-Writing-Detox** (eliminate robotic patterns at generation)
- **C) Full Research Pipeline** (journalism-grade depth and sourcing)

---

## 1. PROBLEM ANALYSIS

### 1.1 Current State Issues

| Issue | Impact | Root Cause |
|-------|--------|------------|
| AI detection flags | SEO penalties, reader distrust | Formulaic patterns, generic transitions |
| Word count under target | SEO weakness | `max_new_tokens: 1200` caps at ~900 words |
| Shallow content | No reader value | Brief context, no research phase |
| Robotic voice | Bounce rate high | "Furthermore", "Moreover", "In conclusion" |
| Missing citations | Credibility low | No attribution framework in prompt |
| Generic structure | No differentiation | Always same headings, same flow |

### 1.2 Industry Standards (Target Metrics)

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| Word count | ~600-800 | 1500-2000 | Increase tokens 3x |
| Readability score | 40-50 | 60-70 | Use Hemingway app |
| AI detection score | Failed | <15% AI | Zero AI patterns |
| Research depth | 1 source | 5-10 sources | Multi-phase RAG |
| Time on page | Low | 4+ minutes | Engaging writing |

---

## 2. APPROACH A: ENHANCED AI PROMPTS

### 2.1 Prompt Architecture Overhaul

**Current:** Single-pass, brief context, 1200 tokens  
**New:** Multi-phase, deep context, 3500+ tokens

#### Phase 1: Deep Research Context (First 800 tokens of output)

```
CONTEXT BUILDING PHASE:
- Gather 10+ facts from RAG with proper citations
- Include 3-5 expert quotes (attributed)
- Add market data with specific figures
- Include contrarian perspectives
- Add historical context (5-year trends where relevant)
```

#### Phase 2: Journalism-Style Prompt (Remaining tokens)

**Section 1: Voice & Tone**
- Active voice (90% of sentences)
- First-person expert commentary allowed
- Varied sentence length (10-25 words average)
- No: "It is important to note", "Furthermore", "In conclusion"

**Section 2: Structure Requirements**
```
REQUIRED HEADINGS (## = H2):
1. ## [Compelling Hook Headline] - sets up the story
2. ## Market Context & Background - 2 paragraphs
3. ## Key Developments [with ### subsections]
4. ## Expert Analysis & Market Impact
5. ## What This Means For Investors
6. ## Looking Ahead (forward-looking, specific)
7. ## Conclusion

Each ## section: 2-3 paragraphs (150-200 words each)
Total: 7 sections × ~180 words = ~1260 words minimum
+ Intro hook: ~200 words
+ Transitions: ~100 words
= ~1560 words target
```

**Section 3: SEO Optimization**
- Primary keyword in first 100 words
- LSI keywords naturally integrated
- Schema markup hints in content
- FAQ-friendly content sections

**Section 4: Link Attribution**
```
FOR EACH FACT:
- "According to [Source Name],..."
- "As reported by [Domain],..."
- "Data from [Authoritative Source] shows..."

EXTERNAL LINKS:
- 5-7 citations to authoritative sources
- Natural anchor text (not "click here")
- Contextual links within sentences

INTERNAL LINKS:
- 3-5 contextual mentions of related topics
- Use [INTERNAL:topic] markers
```

### 2.2 Token Allocation

| Component | Current | New | Rationale |
|-----------|---------|-----|-----------|
| max_new_tokens | 1200 | 3500 | 1500-2000 words output |
| temperature | 0.75 | 0.7 | Slight creativity without chaos |
| top_p | 0.9 | 0.85 | More focused output |
| repetition_penalty | 1.2 | 1.15 | Natural variation |

### 2.3 Prompt Template (Full)

```javascript
const JOURNALISM_PROMPT = `
ROLE: You are a senior financial journalist with 15 years of experience writing for:
- The Economic Times
- Bloomberg
- Financial Express
- Reuters
- MarketWatch

You have won 3 journalism awards for market analysis and investigative reporting.

WRITING STYLE (NON-NEGOTIABLE):
✓ ACTIVE VOICE: "Investors are buying gold" NOT "Gold is being bought by investors"
✓ SHORT PARAGRAPHS: 2-3 sentences max, 15-20 words average
✓ SPECIFIC DATA: "₹7,432 per gram" NOT "significant price increase"
✓ EXPERT QUOTES: Include realistic analyst commentary with proper attribution
✓ VARIETY: Mix of short punchy sentences and longer explanatory ones
✓ TRANSITIONS: "Meanwhile", "In contrast", "Looking at the data", "This shift"
✗ FORBIDDEN: "Furthermore", "Moreover", "In conclusion", "It is important to note"
✗ FORBIDDEN: "It is worth noting that", "As previously mentioned"
✗ FORBIDDEN: "In today's fast-paced world", "In the current climate"

ARTICLE TOPIC: {topic}

RESEARCH CONTEXT (use these facts, cite properly):
{facts}

MARKET DATA:
{stockInfo}
{metalInfo}

TRENDING CONTEXT:
{trends}

EXISTING SIMILAR ARTICLES (write something DIFFERENT and MORE VALUABLE):
{existingArticles}

SOURCES FOR CITATION:
{sources}

STRUCTURE REQUIREMENTS:
Write a 1500-2000 word article with this EXACT structure:

## [Powerful headline that creates curiosity]

[HOOK - First paragraph must:
- Start with a specific number, quote, or surprising fact
- Create immediate tension or question
- Include primary keyword within first 50 words
- Be 3-4 sentences, 80-120 words
]

## Market Snapshot

[2 paragraphs explaining the current market context with specific data]

## What's Driving This

[3 paragraphs with ### subsections:
### Supply Factors
### Demand Signals  
### Policy Impact
Each 80-100 words, includes data points and citations]

## Expert Voices

[2 paragraphs featuring analyst quotes:
"Quote from realistic analyst name" - Analyst Title, Firm Name
Ensure quotes are specific and add value, not generic statements]

## What Investors Need To Know

[Practical advice section:
- 2-3 specific action items
- Risk factors to consider
- Timeline expectations
With specific figures and data]

## Looking Ahead

[Forward-looking section:
- Next 3-6 month expectations
- Key dates/events to watch
- Scenario analysis (bull/bear/base cases)]

## The Bottom Line

[1-2 paragraph conclusion:
- Clear takeaway
- No generic advice
- Specific next step readers can take]

INTERNAL LINK PLACEMENT:
- Within first 3 sections, naturally mention: [INTERNAL:related topic]
- Use varied anchor text, not repeated phrases

EXTERNAL CITATIONS:
- Throughout article: "According to [Source],..."
- At least 5 different sources cited
- Use [EXTERNAL:Source Name|url] format

OUTPUT FORMAT:
- Article body ONLY (no title line)
- ## headings on their own line
- ### subsections with 2-3 paragraph content
- Natural paragraph breaks (double newlines)
- Total: 1500-2000 words
`;
```

---

## 3. APPROACH B: AI-WRITING-DETOX

### 3.1 Banned Patterns (Eliminate at Generation)

```javascript
const BANNED_PATTERNS = {
  phrases: [
    "it is important to note",
    "it is worth noting",
    "furthermore",
    "moreover",
    "in conclusion",
    "in today's fast-paced world",
    "in the current climate",
    "as previously mentioned",
    "it goes without saying",
    "needless to say",
    "last but not least",
    "at the end of the day",
    "when all is said and done",
    "it is clear that",
    "there is no doubt that",
    "it is evident that",
    "one of the most",
    "a variety of",
    "a number of",
    "many experts believe",
    "studies have shown",
    "research suggests",
    "according to experts",
    "industry insiders say",
    "sources say",
    "it has been reported",
  ],
  
  structures: [
    { pattern: /This (technique|strategy|approach) (is|can be)/g, replace: "Use this" },
    { pattern: /It is (crucial|essential|important) that/g, replace: "Make sure" },
    { pattern: /In order to/g, replace: "To" },
    { pattern: /Due to the fact that/g, replace: "Because" },
    { pattern: /At this point in time/g, replace: "Now" },
    { pattern: /Has the ability to/g, replace: "Can" },
    { pattern: /The fact that/g, replace: "That" },
    { pattern: /In the event that/g, replace: "If" },
  ],
  
  sentenceStarters: [
    "It is",
    "This is",
    "There are",
    "It should be noted",
    "As previously",
    "In terms of",
    "With regards to",
    "When it comes to",
    "In order to",
  ],
  
  weakVerbs: [
    { weak: "utilize", strong: "use" },
    { weak: "implement", strong: "do" },
    { weak: "facilitate", strong: "help" },
    { weak: "endeavor", strong: "try" },
    { weak: "commence", strong: "start" },
    { weak: "terminate", strong: "end" },
    { weak: "demonstrate", strong: "show" },
    { weak: "ascertain", strong: "find out" },
    { weak: "constitute", strong: "make up" },
    { weak: "comprise", strong: "include" },
  ]
};
```

### 3.2 Humanizing Layer (Post-Generation)

```javascript
class JournalismHumanizer {
  constructor() {
    this.bannedPatterns = BANNED_PATTERNS;
  }

  humanize(content) {
    return content
      .pipe(removeBannedPhrases)
      .pipe(addSlangColloquialisms)  // subtle
      .pipe(fixPassiveVoice)
      .pipe(addRhetoricalQuestions)
      .pipe(addReaderEngagement)
      .pipe(breakLongSentences)
      .pipe(addTransitionVariety);
  }

  // Specific transformations
  removeBannedPhrases(text) {
    let result = text;
    for (const phrase of this.bannedPatterns.phrases) {
      result = result.replace(new RegExp(phrase, 'gi'), '[REMOVED]');
    }
    // Replace with natural alternatives
    result = result.replace(/\[REMOVED\],/g, ',');
    result = result.replace(/\[REMOVED\]/g, '');
    return result;
  }

  fixPassiveVoice(text) {
    // Target common passive patterns
    const passives = [
      /was created/g,
      /was announced/g,
      /was reported/g,
      /has been seen/g,
      /is being considered/g,
    ];
    return text; // Keep as-is for now, AI should generate active
  }

  addSlangColloquialisms(text) {
    // Subtle: replace some formal words
    const replacements = {
      "approximately": "about",
      "subsequently": "then",
      "prior to": "before",
      "subsequent to": "after",
      "in the event of": "if",
      "at this point": "now",
    };
    let result = text;
    for (const [formal, casual] of Object.entries(replacements)) {
      result = result.replace(new RegExp(formal, 'gi'), casual);
    }
    return result;
  }

  breakLongSentences(text) {
    // Find sentences > 35 words and break them
    return text;
  }

  addRhetoricalQuestions(text) {
    // Add engaging questions in strategic places
    return text;
  }
}
```

### 3.3 Quality Scoring System

```javascript
class ContentQualityScorer {
  scoreArticle(content) {
    return {
      wordCount: this.scoreWordCount(content),
      readability: this.scoreReadability(content),
      aiPatterns: this.detectAIPatterns(content),
      structure: this.scoreStructure(content),
      engagement: this.scoreEngagement(content),
      citations: this.scoreCitations(content),
      overall: this.calculateOverall()
    };
  }

  detectAIPatterns(content) {
    const patterns = [
      { regex: /moreover/gi, weight: -2 },
      { regex: /furthermore/gi, weight: -2 },
      { regex: /in conclusion/gi, weight: -3 },
      { regex: /it is important to note/gi, weight: -3 },
      { regex: /it is worth noting/gi, weight: -3 },
      { regex: /studies have shown/gi, weight: -2 },
      { regex: /research suggests/gi, weight: -2 },
      { regex: /many experts believe/gi, weight: -2 },
      { regex: /however,/gi, weight: 1 }, // Natural transition
      { regex: /meanwhile,/gi, weight: 1 },
    ];

    let score = 100;
    for (const pattern of patterns) {
      const matches = content.match(pattern.regex);
      if (matches) {
        score += pattern.weight * matches.length;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  scoreReadability(content) {
    // Flesch-Kincaid Grade Level
    // Target: 8-12 grade level (accessible but not dumbed down)
    const sentences = content.split(/[.!?]+/);
    const words = content.split(/\s+/);
    const syllables = this.countSyllables(content);

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
    
    // Score: 8-12 = 100, higher/lower = lower score
    if (gradeLevel >= 8 && gradeLevel <= 12) return 100;
    return Math.max(0, 100 - Math.abs(gradeLevel - 10) * 10);
  }

  scoreWordCount(content) {
    const words = content.split(/\s+/).length;
    if (words >= 1500 && words <= 2000) return 100;
    if (words >= 1200 && words < 1500) return 80;
    if (words >= 1000 && words < 1200) return 60;
    if (words < 1000) return Math.max(0, words / 10);
    if (words > 2500) return Math.max(0, 100 - (words - 2500) / 50);
    return 80;
  }
}
```

---

## 4. APPROACH C: FULL RESEARCH PIPELINE

### 4.1 Multi-Phase Article Generation

```javascript
class JournalismArticleGenerator {
  async generateArticle(topic, config) {
    // Phase 1: Deep Research (5-10 minutes simulated)
    const research = await this.performDeepResearch(topic, config);
    
    // Phase 2: First Draft (with quality constraints)
    const draft = await this.generateFirstDraft(topic, research);
    
    // Phase 3: Self-Edit (apply AI-writing-detox)
    const edited = await this.selfEdit(draft);
    
    // Phase 4: Quality Check
    const quality = this.checkQuality(edited);
    
    // Phase 5: Final Polish (if needed)
    if (quality.overall < 80) {
      return await this.regenerateWithFeedback(edited, quality);
    }
    
    return edited;
  }

  async performDeepResearch(topic, config) {
    // 1. Gather diverse sources (min 10)
    const sources = await this.gatherSources(topic, {
      minSources: 10,
      includeContradictory: true,
      includeHistorical: true,
    });

    // 2. Extract key facts with citations
    const facts = this.extractFactsWithCitations(sources);

    // 3. Find expert quotes
    const quotes = await this.findExpertQuotes(sources);

    // 4. Identify market data points
    const dataPoints = this.extractDataPoints(sources);

    // 5. Find contrarian perspectives
    const perspectives = this.findContrarianViews(sources);

    return {
      facts,
      quotes,
      dataPoints,
      perspectives,
      sources,
      researchDepth: 'comprehensive'
    };
  }

  async generateFirstDraft(topic, research) {
    const prompt = this.buildJournalismPrompt(topic, research);
    
    // Use higher token limit for longer articles
    const response = await this.hf.textGeneration({
      model: this.model,
      inputs: prompt,
      parameters: {
        max_new_tokens: 3500,
        temperature: 0.7,
        top_p: 0.85,
        repetition_penalty: 1.15,
      },
    });

    return this.cleanDraft(response.generated_text);
  }

  async selfEdit(draft) {
    // Apply AI-writing-detox
    const humanizer = new JournalismHumanizer();
    let edited = humanizer.humanize(draft);

    // Additional editing passes
    edited = this.improveFlow(edited);
    edited = this.strengthenTransitions(edited);
    edited = this.addReaderEngagement(edited);

    return edited;
  }

  checkQuality(content) {
    const scorer = new ContentQualityScorer();
    return scorer.scoreArticle(content);
  }
}
```

### 4.2 Source Gathering Enhancement

```javascript
async gatherSources(topic, config) {
  const { minSources, includeContradictory, includeHistorical } = config;
  
  // Primary sources (current news)
  const currentSources = await this.vectorSearch(topic, {
    collection: 'scraped',
    limit: 5,
    minSimilarity: 0.65
  });

  // Expert analysis sources
  const expertSources = await this.vectorSearch(topic + " analyst", {
    collection: 'scraped',
    limit: 3,
    minSimilarity: 0.6
  });

  // Contrarian/bearish perspectives (if enabled)
  let contrarianSources = [];
  if (includeContradictory) {
    contrarianSources = await this.vectorSearch(topic + " bearish risk", {
      collection: 'scraped',
      limit: 2,
      minSimilarity: 0.55
    });
  }

  // Historical context (5-year data if available)
  let historicalSources = [];
  if (includeHistorical) {
    historicalSources = await this.vectorSearch(topic + " historical trend", {
      collection: 'scraped',
      limit: 2,
      minSimilarity: 0.5
    });
  }

  return {
    current: currentSources,
    expert: expertSources,
    contrarian: contrarianSources,
    historical: historicalSources,
    totalCount: currentSources.length + expertSources.length + 
                 contrarianSources.length + historicalSources.length
  };
}
```

### 4.3 Quality Enforcement

```javascript
class QualityEnforcer {
  constructor(minScores = { wordCount: 80, readability: 70, aiPatterns: 85 }) {
    this.minScores = minScores;
  }

  validate(content) {
    const scorer = new ContentQualityScorer();
    const score = scorer.scoreArticle(content);
    
    const issues = [];
    
    if (score.wordCount < this.minScores.wordCount) {
      issues.push(`Word count too low: ${score.wordCount}/100`);
    }
    
    if (score.readability < this.minScores.readability) {
      issues.push(`Readability too low: ${score.readability}/100`);
    }
    
    if (score.aiPatterns < this.minScores.aiPatterns) {
      issues.push(`AI patterns detected: ${score.aiPatterns}/100`);
    }

    return {
      passed: issues.length === 0,
      score,
      issues
    };
  }

  async regenerateWithFeedback(content, score) {
    // Generate feedback prompt
    const feedback = this.generateFeedback(score);
    
    // Regenerate with constraints
    const prompt = `
      Previous article had these issues:
      ${feedback}
      
      Rewrite the article fixing these problems.
      Target: 1500-2000 words, no AI patterns, high readability.
    `;

    return await this.hf.textGeneration({ inputs: prompt, ... });
  }

  generateFeedback(score) {
    const parts = [];
    
    if (score.wordCount < 80) {
      parts.push(`Expand to 1500-2000 words. Current: ~${score.wordCount * 15} words.`);
    }
    
    if (score.aiPatterns < 85) {
      parts.push("Remove AI patterns: avoid 'furthermore', 'moreover', 'in conclusion', 'it is important to note'.");
    }
    
    if (score.readability < 70) {
      parts.push("Use shorter sentences, simpler words, active voice.");
    }
    
    return parts.join("\n");
  }
}
```

---

## 5. IMPLEMENTATION PHASES

### Phase 1: Quick Wins (Week 1)
- [ ] Update `max_new_tokens` from 1200 to 3500
- [ ] Add banned phrases to prompt
- [ ] Add journalism style requirements to prompt
- [ ] Test with live articles

### Phase 2: AI-Writing-Detox (Week 2)
- [ ] Create `JournalismHumanizer` class
- [ ] Implement banned pattern detection
- [ ] Add post-generation quality check
- [ ] Add quality scoring to storage

### Phase 3: Research Pipeline (Week 3-4)
- [ ] Implement multi-phase generation
- [ ] Add source diversity requirements
- [ ] Add self-edit pass
- [ ] Add quality enforcement loop

### Phase 4: Monitoring (Week 5+)
- [ ] Track AI detection scores
- [ ] Monitor engagement metrics
- [ ] A/B test different styles
- [ ] Continuous improvement

---

## 6. FILE CHANGES

| File | Change |
|------|--------|
| `lib/ai/agents/contentGenerationAgent.js` | Major prompt overhaul, quality scoring |
| `lib/utils/humanizer.js` | Add `JournalismHumanizer` class |
| `lib/utils/contentQuality.js` | New file: quality scoring system |
| `lib/workflow/runArticleGeneration.js` | Add quality thresholds |

---

## 7. SUCCESS METRICS

| Metric | Current | Target | Measure |
|--------|---------|--------|---------|
| Word count | ~800 | 1500-2000 | Auto-check |
| AI detection | Failed | <15% | Originality.ai |
| Readability | 40-50 | 60-70 | Hemingway App |
| Time on page | <2min | 4+ min | GA4 |
| Bounce rate | High | <50% | GA4 |

---

## Approval Required

Please review this design and let me know:
1. ✅ Approve for implementation
2. 📝 Request changes to specific sections
3. ❓ Need clarification on any points

Once approved, I'll proceed with writing the implementation plan.