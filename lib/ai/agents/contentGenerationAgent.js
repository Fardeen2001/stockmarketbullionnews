import { BaseAgent } from './baseAgent';
import { HfInference } from '@huggingface/inference';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';
import { HUGGINGFACE_CONFIG, getHfInferenceConfig, formatPromptForLLaMA } from '@/lib/ai/config';

const TEXT_GEN_PROVIDER = HUGGINGFACE_CONFIG.textGenerationProvider || 'hf-inference';

import { getVectorDB } from '@/lib/vector/vectorDB';
import { getNewsCollection, getScrapedContentCollection, getStocksCollection, getMetalsCollection, getTrendingTopicsCollection } from '@/lib/db';
import { UnsplashAPI } from '@/lib/api/imageAPI';
import { createSlug } from '@/lib/utils/slugify';
import { ContentHumanizer, basicHumanize, JournalismHumanizer } from '@/lib/utils/humanizer';
import { generateNewsArticleSchema, generateFAQPageSchema, SITE_URL } from '@/lib/utils/seo';
import { ContentQualityScorer, QualityEnforcer, BANNED_PATTERNS } from '@/lib/utils/contentQuality';
import { screenStockForSharia, normalizeSymbol } from '@/lib/utils/shariaCompliance';

// AI Agent for generating high-quality news articles using RAG (Retrieval Augmented Generation)
export class ContentGenerationAgent extends BaseAgent {
  constructor(config = {}) {
    super('ContentGenerationAgent', config);
    this.hf = null;
    this.embeddingGenerator = null;
    this.vectorDB = getVectorDB();
    this.imageAPI = null;
    this.humanizer = null;
    this.journalismHumanizer = new JournalismHumanizer();
    this.qualityScorer = new ContentQualityScorer();
    this.qualityEnforcer = new QualityEnforcer();
    this.model = config.model || HUGGINGFACE_CONFIG.textGenerationModel;
  }

  async initialize(apiKey) {
    // Use centralized configuration for Hugging Face API endpoint
    this.hf = new HfInference(apiKey, getHfInferenceConfig(apiKey));
    this.embeddingGenerator = new EmbeddingGenerator(apiKey);
    this.imageAPI = new UnsplashAPI(process.env.UNSPLASH_ACCESS_KEY);
    
    // Initialize humanizer if API key is provided
    const humanizerApiKey = process.env.HUMANIZER_API_KEY;
    const humanizerProvider = process.env.HUMANIZER_PROVIDER || 'stealthwriter';
    if (humanizerApiKey) {
      this.humanizer = new ContentHumanizer(humanizerApiKey, humanizerProvider);
    }
    
    await this.vectorDB.initialize();
  }

  async execute(task, context = {}) {
    this.log('Starting content generation', { task });

    try {
      const { topic, trendId, relatedSymbols, relatedMetals } = task;

      // Strict Sharia compliance check for all referenced stocks before generation
      let stockComplianceMetadata = {
        stockMentions: [],
        containsNonCompliantStocks: [],
        isShariaTagged: false,
        shariaComplianceVersion: '1.0',
      };

      if (relatedSymbols && relatedSymbols.length > 0) {
        const symbolSet = [...new Set(relatedSymbols.map(s => normalizeSymbol(s)))];
        const complianceResults = {};

        for (const sym of symbolSet) {
          try {
            complianceResults[sym] = await screenStockForSharia(sym);
          } catch (err) {
            this.log('Sharia screening failed for ${sym}', { error: err.message });
            complianceResults[sym] = { isShariaCompliant: false, shariaComplianceData: { complianceStatus: 'unknown' } };
          }
        }

        const stockMentions = symbolSet.map(sym => ({
          symbol: sym,
          isShariaCompliant: complianceResults[sym]?.isShariaCompliant ?? false,
          complianceStatus: complianceResults[sym]?.shariaComplianceData?.complianceStatus ?? 'unknown',
        }));

        const nonCompliant = stockMentions.filter(s => !s.isShariaCompliant).map(s => s.symbol);

        stockComplianceMetadata = {
          stockMentions,
          containsNonCompliantStocks: nonCompliant,
          isShariaTagged: nonCompliant.length === 0 && stockMentions.length > 0,
          shariaComplianceVersion: '1.0',
        };

        this.log('Sharia compliance check completed', stockComplianceMetadata);
      }

      // Retrieve relevant context using vector search (RAG)
      const contextData = await this.retrieveContext(topic, relatedSymbols, relatedMetals);

      // Generate article using retrieved context
      const article = await this.generateArticle(topic, contextData);

      // Humanize the content - first apply local journalism humanizer, then external API if available
      let humanizedContent = article.content;

      // Step 1: Apply local journalism humanizer (removes AI patterns, fixes passive voice, etc.)
      const { content: locallyHumanized, changes: localChanges } = this.journalismHumanizer.humanize(article.content);
      this.log('Applied local journalism humanization', { changesApplied: localChanges.length });

      // Step 2: If external humanizer API available, apply it for additional polish
      if (this.humanizer) {
        try {
          this.log('Applying external API humanization...');
          humanizedContent = await this.humanizer.humanize(locallyHumanized);
          this.log('External humanization successful');
        } catch (error) {
          this.log('External humanization failed, using locally humanized content', { error: error.message });
          humanizedContent = locallyHumanized;
        }
      } else {
        humanizedContent = locallyHumanized;
      }

      // Step 3: Final quality check on humanized content
      const qualityScore = this.qualityScorer.scoreArticle(humanizedContent);
      this.log('Final quality score', { score: qualityScore });

      if (qualityScore.aiPatterns < 70) {
        this.log('Warning: AI patterns still present after humanization', {
          aiPatternScore: qualityScore.aiPatterns,
          issues: this.qualityEnforcer.validate(humanizedContent).issues
        });
      }

      // Generate additional metadata (FAQs, tags, entities, topics, TL;DR)
      const metadata = await this.generateMetadata(article.title, humanizedContent, contextData);
      metadata.summary = article.summary;

      // Determine category
      const category = contextData.category || 
        (contextData.relatedSymbols && contextData.relatedSymbols.length > 0 ? 'stocks' : 
         contextData.relatedMetals && contextData.relatedMetals.length > 0 ? 'metals' : 'stocks');

      // Generate image
      const image = await this.generateImage(topic, category);

      // Generate SEO metadata (meta title, meta description, keywords, JSON-LD schema)
      const seoMetadata = await this.generateSEOMetadata(
        article.title,
        humanizedContent,
        metadata,
        image
      );

      // ROOT CAUSE FIX: Handle embedding generation failures gracefully
      let embedding;
      try {
        embedding = await this.embeddingGenerator.generateEmbedding(
          `${article.title} ${article.content}`
        );
      } catch (error) {
        this.log('Embedding generation failed for article, using fallback', { 
          error: error.message 
        });
        // Use zero vector as fallback - allows article to be stored
        embedding = new Array(768).fill(0);
      }

      // Store article (pass trendId so trend source URLs can be merged into sources)
      const storedArticle = await this.storeArticle({
        ...article,
        content: humanizedContent,
        topic,
        trendId,
        contextData: { ...contextData, category },
        image,
        seoMetadata,
        embedding,
        relatedSymbols,
        relatedMetals,
        internalLinks: article.internalLinks || [],
        externalLinks: article.externalLinks || [],
        ...metadata,
        // Strict Sharia compliance metadata
        stockMentions: stockComplianceMetadata.stockMentions,
        containsNonCompliantStocks: stockComplianceMetadata.containsNonCompliantStocks,
        isShariaTagged: stockComplianceMetadata.isShariaTagged,
        shariaComplianceVersion: stockComplianceMetadata.shariaComplianceVersion,
      });

      this.log('Content generation completed', { article: article.title });

      return {
        success: true,
        article: storedArticle,
      };
    } catch (error) {
      this.log('Content generation failed', { error: error.message });
      throw error;
    }
  }

  async retrieveContext(topic, relatedSymbols, relatedMetals) {
    // ROOT CAUSE FIX: Handle embedding generation failures gracefully
    let queryEmbedding;
    try {
      queryEmbedding = await this.embeddingGenerator.generateEmbedding(topic);
    } catch (error) {
      this.log('Embedding generation failed for context retrieval, using fallback', { 
        error: error.message 
      });
      // Use zero vector as fallback - allows article generation to continue
      queryEmbedding = new Array(768).fill(0);
    }

    // Search all stored embedded data: scraped content (primary RAG source)
    let similarScraped = [];
    try {
      similarScraped = await this.vectorDB.searchSimilar(
        'scraped',
        queryEmbedding,
        15,
        0.65
      );
    } catch (error) {
      this.log('Vector search failed for scraped content', { error: error.message });
    }

    // Trending topics from embedded data (align article with current trends)
    let similarTrends = [];
    try {
      similarTrends = await this.vectorDB.searchSimilar(
        'trending',
        queryEmbedding,
        5,
        0.6
      );
    } catch (error) {
      this.log('Vector search failed for trending topics', { error: error.message });
    }

    // Similar news articles (avoid duplication, differentiate content)
    let similarNews = [];
    try {
      similarNews = await this.vectorDB.searchSimilar(
        'news',
        queryEmbedding,
        5,
        0.75
      );
    } catch (error) {
      this.log('Vector search failed for news articles', { error: error.message });
    }

    // Get related stock/metal data
    let stockData = null;
    let metalData = null;

    if (relatedSymbols && relatedSymbols.length > 0) {
      const stocksCollection = await getStocksCollection();
      stockData = await stocksCollection.findOne({
        symbol: relatedSymbols[0].toUpperCase(),
      });
    }

    if (relatedMetals && relatedMetals.length > 0) {
      const metalsCollection = await getMetalsCollection();
      metalData = await metalsCollection.findOne({
        metalType: relatedMetals[0].toLowerCase(),
      });
    }

    // Aggregate facts from scraped content (all stored embedded data; include source URLs and scrapedAt for citations)
    const facts = similarScraped.map(item => ({
      title: item.metadata?.title || item.text?.substring(0, 100) || '',
      source: item.metadata?.sourceUrl || item.metadata?.source || '',
      sourceUrl: item.metadata?.sourceUrl || item.metadata?.source || '',
      scrapedAt: item.metadata?.scrapedAt || null,
      text: item.text || '',
    }));

    return {
      facts,
      similarArticles: similarNews,
      relatedTrends: similarTrends,
      stockData,
      metalData,
      relatedSymbols,
      relatedMetals,
      // Additional research context for Approach C (Full Research Pipeline)
      contrarianViews: [], // Will be populated if available
      historicalContext: [], // Will be populated if available
    };
  }

  async generateArticle(topic, contextData) {
    const maxRetries = 3; // Increased retries for quality
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = this.buildRAGPrompt(topic, contextData);

        const response = await this.hf.textGeneration({
          model: this.model,
          provider: TEXT_GEN_PROVIDER,
          inputs: prompt,
          parameters: {
            max_new_tokens: 3500, // Increased from 1200 to support 1500-2000 words
            temperature: 0.7, // Slightly creative without being chaotic
            top_p: 0.85, // More focused output
            return_full_text: false,
            repetition_penalty: 1.15,
          },
        });

        const generatedText = this.cleanGeneratedText(response.generated_text);
        const title = this.extractTitle(generatedText) || this.generateTitle(topic);
        let content = this.extractContent(generatedText);

        // Quality check before accepting
        const qualityScore = this.qualityScorer.scoreArticle(content);
        const wordCount = content.split(/\s+/).length;
        const hasHeadings = /^##\s+/m.test(content);

        this.log(`Article generation attempt ${attempt}/${maxRetries}`, {
          wordCount,
          qualityScore: qualityScore.overall,
          hasHeadings
        });

        // Accept if meets minimum thresholds
        if (wordCount >= 1000 && hasHeadings) {
          const { processedContent, internalLinks, externalLinks } = await this.processLinks(
            content,
            contextData,
            topic
          );

          const summary = await this.generateSummary(processedContent);

          return {
            title,
            content: processedContent,
            summary,
            internalLinks,
            externalLinks,
          };
        }

        // If too short, throw to retry
        if (attempt < maxRetries) {
          throw new Error(`AI output too short (${wordCount} words, target: 1500+). Retrying...`);
        }
      } catch (error) {
        lastError = error;
        this.log(`Article generation attempt ${attempt}/${maxRetries} failed`, { error: error.message });
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1500 * attempt)); // Longer wait between retries
        }
      }
    }

    this.log('All AI attempts failed, using fact-based fallback', { error: lastError?.message });
    return this.generateFactBasedArticle(topic, contextData);
  }

  buildRAGPrompt(topic, contextData) {
    const factsText = (contextData.facts || [])
      .map((f, i) => `${i + 1}. ${f.title} (Source: ${f.source || 'N/A'})\n   ${(f.text || '').substring(0, 400)}`)
      .join('\n\n') || 'No scraped sources found. Write based on the topic and any data below.';

    const stockInfo = contextData.stockData
      ? `\n\nStock Data:\n- Symbol: ${contextData.stockData.symbol}\n- Sharia Compliant: ${contextData.stockData.isShariaCompliant ? 'YES (halal)' : 'NO (not Sharia-compliant)'}\n- Price: ₹${contextData.stockData.currentPrice}\n- Change: ${contextData.stockData.changePercent}%\n- Market Cap: ₹${(contextData.stockData.marketCap / 10000000).toFixed(2)} Cr`
      : '';

    const metalInfo = contextData.metalData
      ? `\n\nMetal Data:\n- Type: ${contextData.metalData.metalType}\n- Price: ₹${contextData.metalData.currentPrice}\n- Change: ${contextData.metalData.changePercent}%`
      : '';

    const trendsText = (contextData.relatedTrends || [])
      .map((t, i) => `${i + 1}. ${t.metadata?.title || t.text || 'Trend'} (relevance: ${(t.similarity || 0).toFixed(2)})`)
      .join('\n');
    const trendsSection = trendsText
      ? `\n\nRelated Trending Topics (use for angle, do not copy):\n${trendsText}`
      : '';

    const existingArticlesText = (contextData.similarArticles || [])
      .map((a, i) => `${i + 1}. ${a.metadata?.title || a.text?.substring(0, 80)}`)
      .join('\n');
    const existingSection = existingArticlesText
      ? `\n\nExisting Similar Articles (write something DIFFERENT and MORE VALUABLE):\n${existingArticlesText}`
      : '';

    const sourcesList = (contextData.facts || [])
      .map((f, i) => `${i + 1}. ${f.title} - ${f.sourceUrl || f.source || 'N/A'}`)
      .join('\n');

    // Include contrarian perspectives if available
    const contrarianSection = contextData.contrarianViews && contextData.contrarianViews.length > 0
      ? `\n\nContrarian/Bearish Perspectives (include balanced view):\n${contextData.contrarianViews.join('\n')}`
      : '';

    const historicalSection = contextData.historicalContext && contextData.historicalContext.length > 0
      ? `\n\nHistorical Context (5-year trends):\n${contextData.historicalContext.join('\n')}`
      : '';

    const rawPrompt = `ROLE: You are a senior financial journalist with 15 years of experience writing for The Economic Times, Bloomberg, Financial Express, and Reuters. You have won journalism awards for market analysis.

WRITING STYLE (NON-NEGOTIABLE):
✓ ACTIVE VOICE: "Investors are buying gold" NOT "Gold is being bought by investors"
✓ SHORT PARAGRAPHS: 2-3 sentences max, 15-20 words average
✓ SPECIFIC DATA: "₹7,432 per gram" NOT "significant price increase"
✓ EXPERT QUOTES: Include realistic analyst commentary with proper attribution
✓ VARIETY: Mix of short punchy sentences and longer explanatory ones
✓ TRANSITIONS: "Meanwhile", "In contrast", "Looking at the data", "This shift"
✗ FORBIDDEN PHRASES: "Furthermore", "Moreover", "In conclusion", "It is important to note", "It is worth noting", "As previously mentioned", "Studies have shown", "Research suggests", "Many experts believe", "In today's fast-paced world", "In the current climate", "It goes without saying", "At the end of the day", "One of the most", "A variety of", "A number of"
✗ FORBIDDEN WORDS: "utilize" (use), "implement" (do), "facilitate" (help), "endeavor" (try), "commence" (start), "subsequently" (then), "prior to" (before)
✗ FORBIDDEN SENTENCE STARTERS: "It is", "This is", "There are", "It should be noted", "When it comes to", "In terms of"

SHARIA COMPLIANCE INSTRUCTION (MANDATORY):
- PRIORITIZE Sharia-compliant stocks when discussing "top stocks", "best investments", "recommendations", or any selection-based list.
- If a non-compliant stock must be featured (e.g., breaking news), explicitly state its compliance status in the article: "Note: [SYMBOL] is not Sharia-compliant and should not be considered for halal investment portfolios."
- NEVER describe a non-compliant stock as "halal", "sharia-compliant", or "Islamic finance friendly."
- All stock mentions must be factually accurate regarding their compliance status.

ARTICLE TOPIC: ${topic}

RESEARCH CONTEXT (use these facts, cite properly):
${factsText}
${stockInfo}
${metalInfo}
${trendsSection}
${existingSection}
${contrarianSection}
${historicalSection}

SOURCES FOR CITATION:
${sourcesList}

STRUCTURE REQUIREMENTS - Write 1500-2000 word article with EXACT structure:

## [Compelling headline that creates curiosity and includes primary keyword]

[HOOK - First paragraph MUST:
- Start with a specific number, quote, or surprising fact
- Create immediate tension or question
- Include primary keyword within first 50 words
- Be 3-4 sentences, 80-120 words
]

## Market Snapshot

[2 paragraphs explaining the current market context with specific data and prices]

## What's Driving This

[3 paragraphs with ### subsections:
### Supply Factors - data on supply constraints
### Demand Signals - investor behavior data
### Policy Impact - government/central bank actions
Each 80-100 words with specific data points and citations]

## Expert Voices

[2 paragraphs featuring analyst quotes with proper attribution:
"Quote from realistic analyst name" - Analyst Title, Firm Name
Ensure quotes are specific and add value, not generic statements]

## What Investors Need To Know

[Practical advice section:
- 2-3 specific action items with data
- Risk factors to consider
- Timeline expectations
With specific figures and market data]

## Looking Ahead

[Forward-looking section:
- Next 3-6 month expectations
- Key dates/events to watch
- Scenario analysis (bull/bear/base cases)
Specific price targets or ranges if available]

## The Bottom Line

[1-2 paragraph conclusion:
- Clear takeaway
- No generic advice
- Specific next step readers can take]

INTERNAL LINK PLACEMENT:
- Within first 3 sections, naturally mention: [INTERNAL:related topic]
- Use varied anchor text (not repeated phrases)
- Examples: "gold prices in India", "silver investment strategies", "NSE market trends"

EXTERNAL CITATIONS (5-7 required):
- Throughout article: "According to [Source],..."
- Use [EXTERNAL:Source Name|source_url] format for every citation
- Natural anchor text, not "click here"

OUTPUT FORMAT:
- Article body ONLY (no title line)
- ## headings on their own line, followed by 2-3 paragraphs
- ### subsections with paragraph content
- Natural paragraph breaks (double newlines)
- Total: 1500-2000 words
- Include at least 5 different source citations

Article:`;

    return formatPromptForLLaMA(rawPrompt, this.model);
  }

  extractTitle(text) {
    const titleMatch = text.match(/^#\s*(.+)$/m) || text.match(/^(.{10,80})$/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  extractContent(text) {
    // Remove title if present (h1 only - preserve ## h2 and ### h3 for SEO structure)
    let content = text
      .replace(/^#\s+.+$/gm, '') // Remove h1 title only (single #)
      .replace(/^Article:\s*/i, '') // Remove "Article:" prefix
      .replace(/^Title:\s*.+$/im, '') // Remove title lines
      .replace(/^Summary:\s*.+$/im, '') // Remove summary lines
      .trim();
    
    // Remove markdown formatting (but preserve ## h2, ### h3, and link markers)
    content = content
      .replace(/^[-*+]\s+/gm, '') // Remove bullet points
      .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove markdown links, keep text
      .replace(/`(.+?)`/g, '$1') // Remove code blocks
      .replace(/^>\s+/gm, '') // Remove blockquotes
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
    
    return content || text;
  }

  async processLinks(content, contextData, topic) {
    const internalLinks = [];
    const externalLinks = [];
    let processedContent = content;
    const usedLinkPositions = new Set(); // Track where links are placed to avoid overlap

    // Find related articles for internal linking
    const relatedArticles = await this.findRelatedArticlesForLinking(topic, contextData);

    // ROOT CAUSE FIX: Process both markers (if AI includes them) AND automatic content analysis
    
    // Step 1: Process AI-generated link markers (if present)
    processedContent = this.processLinkMarkers(processedContent, relatedArticles, contextData, internalLinks, externalLinks, usedLinkPositions);

    // Step 2: ROOT CAUSE - Automatically analyze content and inject links
    // Extract keywords and entities from content for automatic linking
    const contentKeywords = this.extractLinkableKeywords(processedContent, contextData);
    
    // Inject internal links automatically based on content analysis
    processedContent = this.injectInternalLinksAutomatically(
      processedContent,
      contentKeywords,
      relatedArticles,
      internalLinks,
      usedLinkPositions
    );

    // Inject external links automatically based on content and sources
    processedContent = this.injectExternalLinksAutomatically(
      processedContent,
      contextData,
      externalLinks,
      usedLinkPositions
    );

    return {
      processedContent,
      internalLinks,
      externalLinks,
    };
  }

  processLinkMarkers(content, relatedArticles, contextData, internalLinks, externalLinks, usedLinkPositions) {
    let processedContent = content;

    // Process internal link markers: [INTERNAL:keyword phrase]
    const internalLinkPattern = /\[INTERNAL:([^\]]+)\]/g;
    let internalMatch;
    let internalLinkIndex = 0;

    while ((internalMatch = internalLinkPattern.exec(content)) !== null && internalLinkIndex < 5) {
      const keyword = internalMatch[1].trim();
      const matchedArticle = this.findBestMatchArticle(keyword, relatedArticles);

      if (matchedArticle) {
        const linkUrl = `/news/${matchedArticle.slug}`;
        const linkText = keyword;
        
        processedContent = processedContent.replace(
          internalMatch[0],
          `[INTERNAL_LINK:${linkText}|${linkUrl}]`
        );

        internalLinks.push({
          text: linkText,
          url: linkUrl,
          slug: matchedArticle.slug,
          title: matchedArticle.title,
        });

        usedLinkPositions.add(internalMatch.index);
        internalLinkIndex++;
      } else {
        processedContent = processedContent.replace(internalMatch[0], keyword);
      }
    }

    // Process external link markers: [EXTERNAL:Source Name|source_url]
    const externalLinkPattern = /\[EXTERNAL:([^|]+)\|([^\]]+)\]/g;
    let externalMatch;
    let externalLinkIndex = 0;

    while ((externalMatch = externalLinkPattern.exec(content)) !== null && externalLinkIndex < 5) {
      const sourceName = externalMatch[1].trim();
      const sourceUrl = externalMatch[2].trim();

      if (sourceUrl && (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://'))) {
        processedContent = processedContent.replace(
          externalMatch[0],
          `[EXTERNAL_LINK:${sourceName}|${sourceUrl}]`
        );

        externalLinks.push({
          text: sourceName,
          url: sourceUrl,
        });

        usedLinkPositions.add(externalMatch.index);
        externalLinkIndex++;
      } else {
        const matchingFact = contextData.facts.find(f => 
          f.title.toLowerCase().includes(sourceName.toLowerCase()) ||
          f.source.toLowerCase().includes(sourceName.toLowerCase())
        );

        if (matchingFact && matchingFact.sourceUrl) {
          processedContent = processedContent.replace(
            externalMatch[0],
            `[EXTERNAL_LINK:${sourceName}|${matchingFact.sourceUrl}]`
          );

          externalLinks.push({
            text: sourceName,
            url: matchingFact.sourceUrl,
          });

          usedLinkPositions.add(externalMatch.index);
          externalLinkIndex++;
        } else {
          processedContent = processedContent.replace(externalMatch[0], sourceName);
        }
      }
    }

    return processedContent;
  }

  extractLinkableKeywords(content, contextData) {
    const keywords = [];
    const contentLower = content.toLowerCase();

    // Extract stock symbols and metal types mentioned in content
    if (contextData.relatedSymbols) {
      contextData.relatedSymbols.forEach(symbol => {
        const symbolUpper = symbol.toUpperCase();
        const symbolLower = symbol.toLowerCase();
        // Look for mentions of the symbol
        if (contentLower.includes(symbolLower) || contentLower.includes(symbolUpper)) {
          keywords.push({
            text: symbolUpper,
            type: 'stock',
            priority: 10,
          });
        }
      });
    }

    if (contextData.relatedMetals) {
      contextData.relatedMetals.forEach(metal => {
        const metalLower = metal.toLowerCase();
        const metalCapitalized = metal.charAt(0).toUpperCase() + metal.slice(1);
        if (contentLower.includes(metalLower)) {
          keywords.push({
            text: metalCapitalized,
            type: 'metal',
            priority: 9,
          });
        }
      });
    }

    // Extract common financial terms that could link to related articles
    const financialTerms = [
      { term: 'gold price', priority: 8 },
      { term: 'silver price', priority: 8 },
      { term: 'stock market', priority: 7 },
      { term: 'investment', priority: 6 },
      { term: 'trading', priority: 6 },
      { term: 'market analysis', priority: 7 },
      { term: 'precious metals', priority: 8 },
      { term: 'bullion', priority: 7 },
      { term: 'NSE', priority: 6 },
      { term: 'BSE', priority: 6 },
    ];

    financialTerms.forEach(({ term, priority }) => {
      if (contentLower.includes(term.toLowerCase())) {
        keywords.push({
          text: term,
          type: 'topic',
          priority,
        });
      }
    });

    // Extract entities from tags if available (entities are generated later in metadata)
    // We'll rely on financial terms and related symbols/metals for now

    // Sort by priority and remove duplicates
    return keywords
      .filter((k, index, self) => 
        index === self.findIndex(t => t.text.toLowerCase() === k.text.toLowerCase())
      )
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8); // Limit to top 8 keywords
  }

  injectInternalLinksAutomatically(content, keywords, relatedArticles, internalLinks, usedLinkPositions) {
    if (relatedArticles.length === 0 || keywords.length === 0) {
      return content;
    }

    let processedContent = content;
    let linksAdded = 0;
    const maxLinks = 5;

    // Process keywords in priority order
    for (const keyword of keywords) {
      if (linksAdded >= maxLinks) break;

      // Find the best matching article for this keyword
      const matchedArticle = this.findBestMatchArticle(keyword.text, relatedArticles);
      if (!matchedArticle) continue;

      // Find first occurrence of keyword in content (avoiding already linked positions)
      const keywordRegex = new RegExp(`\\b${this.escapeRegex(keyword.text)}\\b`, 'gi');
      let match;
      let foundPosition = -1;

      while ((match = keywordRegex.exec(processedContent)) !== null) {
        // Check if this position is already used or too close to another link
        const position = match.index;
        const isTooClose = Array.from(usedLinkPositions).some(usedPos => 
          Math.abs(position - usedPos) < 50
        );

        if (!isTooClose && !processedContent.substring(Math.max(0, position - 20), position).includes('[INTERNAL_LINK:')) {
          foundPosition = position;
          break;
        }
      }

      if (foundPosition !== -1) {
        const linkUrl = `/news/${matchedArticle.slug}`;
        const linkText = match[0]; // Preserve original case
        const linkPlaceholder = `[INTERNAL_LINK:${linkText}|${linkUrl}]`;

        // Replace first occurrence
        processedContent = processedContent.replace(
          new RegExp(`\\b${this.escapeRegex(match[0])}\\b`),
          linkPlaceholder
        );

        internalLinks.push({
          text: linkText,
          url: linkUrl,
          slug: matchedArticle.slug,
          title: matchedArticle.title,
        });

        usedLinkPositions.add(foundPosition);
        linksAdded++;
      }
    }

    return processedContent;
  }

  injectExternalLinksAutomatically(content, contextData, externalLinks, usedLinkPositions) {
    const facts = contextData?.facts ?? [];
    if (facts.length === 0) {
      return content;
    }

    let processedContent = content;
    let linksAdded = 0;
    const maxLinks = 3;

    // Find citation patterns and add external links
    const citationPatterns = [
      /(According to|As reported by|Data from|Source:|As per|Per)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(reports?|sources?|data|analysis)\s+(from|by|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    ];

    // Get available sources
    const availableSources = facts
      .filter(f => f.sourceUrl && (f.sourceUrl.startsWith('http://') || f.sourceUrl.startsWith('https://')))
      .slice(0, 5);

    if (availableSources.length === 0) {
      return processedContent;
    }

    for (const pattern of citationPatterns) {
      if (linksAdded >= maxLinks) break;

      let match;
      while ((match = pattern.exec(processedContent)) !== null && linksAdded < maxLinks) {
        const position = match.index;
        
        // Check if position is already used
        const isTooClose = Array.from(usedLinkPositions).some(usedPos => 
          Math.abs(position - usedPos) < 50
        );

        if (isTooClose || processedContent.substring(Math.max(0, position - 20), position).includes('[EXTERNAL_LINK:')) {
          continue;
        }

        // Find matching source
        const sourceName = match[match.length - 1]; // Last capture group
        const matchingSource = availableSources.find(s => {
          const domain = this.extractDomain(s.sourceUrl);
          return domain.toLowerCase().includes(sourceName.toLowerCase()) ||
                 sourceName.toLowerCase().includes(domain.toLowerCase());
        });

        if (matchingSource) {
          const sourceDomain = this.extractDomain(matchingSource.sourceUrl);
          const linkPlaceholder = `[EXTERNAL_LINK:${sourceDomain}|${matchingSource.sourceUrl}]`;
          
          // Replace the source name with link
          processedContent = processedContent.replace(
            new RegExp(`\\b${this.escapeRegex(sourceName)}\\b`),
            linkPlaceholder
          );

          externalLinks.push({
            text: sourceDomain,
            url: matchingSource.sourceUrl,
          });

          usedLinkPositions.add(position);
          linksAdded++;
        }
      }
    }

    // If still no links, add one from first source in a natural way
    if (linksAdded === 0 && availableSources.length > 0) {
      const firstSource = availableSources[0];
      const sourceDomain = this.extractDomain(firstSource.sourceUrl);
      
      // Find a good place to add citation (preferably in first half of content)
      const midPoint = Math.floor(processedContent.length / 2);
      const searchText = processedContent.substring(0, midPoint);
      
      // Look for sentences with data/statistics
      const dataPattern = /([A-Z][^.!?]*\d+[^.!?]*[.!?])/g;
      const dataMatch = dataPattern.exec(searchText);
      
      if (dataMatch) {
        const insertPosition = dataMatch.index + dataMatch[0].length;
        const linkPlaceholder = `[EXTERNAL_LINK:${sourceDomain}|${firstSource.sourceUrl}]`;
        const citation = ` According to ${linkPlaceholder},`;
        
        processedContent = processedContent.substring(0, insertPosition) + 
                          citation + 
                          processedContent.substring(insertPosition);

        externalLinks.push({
          text: sourceDomain,
          url: firstSource.sourceUrl,
        });
      }
    }

    return processedContent;
  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async findRelatedArticlesForLinking(topic, contextData) {
    try {
      const newsCollection = await getNewsCollection();
      const relatedArticles = [];

      // Determine category
      const category = contextData.category || 
        (contextData.relatedSymbols && contextData.relatedSymbols.length > 0 ? 'stocks' : 
         contextData.relatedMetals && contextData.relatedMetals.length > 0 ? 'metals' : 'stocks');

      // Find articles by category
      if (category) {
        const categoryArticles = await newsCollection
          .find({
            category: category,
            isPublished: true,
          })
          .sort({ publishedAt: -1 })
          .limit(10)
          .toArray();
        relatedArticles.push(...categoryArticles);
      }

      // Find articles by related symbols
      if (contextData.relatedSymbols && contextData.relatedSymbols.length > 0) {
        const symbolArticles = await newsCollection
          .find({
            relatedSymbol: { $in: contextData.relatedSymbols.map(s => s.toUpperCase()) },
            isPublished: true,
          })
          .sort({ publishedAt: -1 })
          .limit(5)
          .toArray();
        relatedArticles.push(...symbolArticles);
      }

      // Find articles by related metals
      if (contextData.relatedMetals && contextData.relatedMetals.length > 0) {
        const metalArticles = await newsCollection
          .find({
            $or: contextData.relatedMetals.map(metal => ({
              $or: [
                { title: { $regex: metal, $options: 'i' } },
                { tags: { $in: [metal] } },
                { entities: { $in: [metal] } },
              ],
            })),
            isPublished: true,
          })
          .sort({ publishedAt: -1 })
          .limit(5)
          .toArray();
        relatedArticles.push(...metalArticles);
      }

      // Remove duplicates and return
      const uniqueArticles = Array.from(
        new Map(relatedArticles.map(article => [article._id.toString(), article])).values()
      );

      return uniqueArticles.slice(0, 10);
    } catch (error) {
      this.log('Error finding related articles for linking', { error: error.message });
      return [];
    }
  }

  findBestMatchArticle(keyword, articles) {
    if (!articles || articles.length === 0) return null;

    const keywordLower = keyword.toLowerCase();
    
    // Score articles by relevance
    const scored = articles.map(article => {
      let score = 0;
      const titleLower = (article.title || '').toLowerCase();
      const tagsLower = (article.tags || []).map(t => t.toLowerCase());
      const entitiesLower = (article.entities || []).map(e => e.toLowerCase());

      // Check title match
      if (titleLower.includes(keywordLower)) score += 10;
      
      // Check tag match
      if (tagsLower.some(tag => tag.includes(keywordLower) || keywordLower.includes(tag))) score += 5;
      
      // Check entity match
      if (entitiesLower.some(entity => entity.includes(keywordLower) || keywordLower.includes(entity))) score += 5;
      
      // Check category match
      if (article.category && keywordLower.includes(article.category.toLowerCase())) score += 3;

      return { article, score };
    });

    // Sort by score and return best match
    scored.sort((a, b) => b.score - a.score);
    return scored[0] && scored[0].score > 0 ? scored[0].article : null;
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (e) {
      return 'Source';
    }
  }


  generateTitle(topic) {
    const templates = [
      `${topic}: Latest Market Updates and Analysis`,
      `Breaking: ${topic} Shows Significant Market Movement`,
      `${topic} - Market Trends and Investor Insights`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  async generateSummary(content) {
    try {
      const prompt = formatPromptForLLaMA(
        `Summarize this article in 2-3 sentences, focusing on key points:\n\n${content.substring(0, 1000)}`,
        this.model
      );
      const response = await this.hf.textGeneration({
        model: this.model,
        provider: TEXT_GEN_PROVIDER,
        inputs: prompt,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.5,
        },
      });

      return response.generated_text.trim();
    } catch (error) {
      // Fallback: extract first paragraph
      const firstParagraph = content.split('\n\n')[0];
      return firstParagraph.substring(0, 200) + '...';
    }
  }

  cleanGeneratedText(text) {
    return text
      .replace(/^Article:\s*/i, '')
      .replace(/^#\s+.+$/gm, '') // Remove h1 title only; preserve ## h2 and ### h3 for SEO
      .replace(/^[-*+]\s+/gm, '') // Remove markdown bullets
      .replace(/^\d+\.\s+/gm, '') // Remove markdown numbered lists
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.+?)\*/g, '$1') // Remove italic markdown
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
      .replace(/`(.+?)`/g, '$1') // Remove code markdown
      .replace(/^>\s+/gm, '') // Remove blockquotes
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
  }

  /**
   * Fact-based fallback when AI fails. Builds structured content from RAG context
   * with real data (stock/metal prices, scraped facts) and ## headings. No generic filler.
   */
  async generateFactBasedArticle(topic, contextData) {
    const title = this.generateTitle(topic);
    const facts = contextData.facts || [];
    const stock = contextData.stockData;
    const metal = contextData.metalData;

    const introFromFacts = facts[0]?.text
      ? facts[0].text.substring(0, 400).trim() + (facts[0].text.length > 400 ? '...' : '')
      : null;

    const intro = introFromFacts
      ? `${introFromFacts} This analysis examines the key developments and market implications for ${topic}.`
      : `Recent developments in ${topic} have drawn attention from investors and analysts. This article summarizes the latest data and market context.`;

    const sections = [intro, ''];

    if (facts.length > 0) {
      sections.push('## Key Developments', '');
      const factParagraphs = facts.slice(0, 5).map((f) => {
        const text = (f.text || f.title || '').substring(0, 350).trim();
        if (!text) return null;
        const citation = f.sourceUrl
          ? ` According to [EXTERNAL:${this.extractDomain(f.sourceUrl)}|${f.sourceUrl}].`
          : '';
        return text + citation;
      }).filter(Boolean);
      sections.push(factParagraphs.join('\n\n'), '');
    }

    if (stock) {
      sections.push('## Stock Performance', '');
      const dir = stock.changePercent >= 0 ? 'gain' : 'decline';
      sections.push(
        `${stock.symbol} is trading at ₹${stock.currentPrice}, a ${dir} of ${Math.abs(stock.changePercent)}%. Market cap: ₹${(stock.marketCap / 10000000).toFixed(2)} Cr.`,
        ''
      );
    }

    if (metal) {
      sections.push('## Metal Prices', '');
      const unit = metal.unit === 'per_gram' ? 'per gram' : 'per ounce';
      sections.push(
        `${metal.metalType.charAt(0).toUpperCase() + metal.metalType.slice(1)}: ₹${metal.currentPrice} ${unit}, change ${metal.changePercent}%.`,
        ''
      );
    }

    sections.push('## Summary', '');
    sections.push(
      `For the latest on ${topic}, monitor official sources and consult a financial advisor before making investment decisions.`,
      ''
    );

    const content = sections.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    const { processedContent, internalLinks, externalLinks } = await this.processLinks(
      content,
      contextData,
      topic
    );

    const summary = introFromFacts
      ? introFromFacts.substring(0, 200) + (introFromFacts.length > 200 ? '...' : '')
      : processedContent.substring(0, 200) + (processedContent.length > 200 ? '...' : '');

    return {
      title,
      summary,
      content: processedContent,
      internalLinks,
      externalLinks,
    };
  }

  async generateImage(topic, category) {
    try {
      if (category === 'stocks') {
        const result = await this.imageAPI.getStockImage(topic);
        return result ? { url: result.url, alt: result.alt } : null;
      } else {
        const result = await this.imageAPI.getMetalImage(topic);
        return result ? { url: result.url, alt: result.alt } : null;
      }
    } catch (error) {
      this.log('Image generation error', { error: error.message });
      return null;
    }
  }

  async generateSEOMetadata(title, content, metadata = {}, image = null) {
    const metaTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    const metaDescription = content.substring(0, 157) + '...';

    const keywords = this.extractKeywords(title + ' ' + content);
    const tags = metadata.tags || keywords.slice(0, 8);
    const summary = metadata.summary || content.substring(0, 200) + '...';

    // Generate JSON-LD NewsArticle schema
    const articleUrl = `${SITE_URL}/news/${createSlug(title)}`;
    const jsonLdNewsArticle = generateNewsArticleSchema({
      headline: title,
      description: summary,
      image: image?.url || null,
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      url: articleUrl,
      category: metadata.topics?.[0] || 'Business',
      keywords: tags,
      articleBody: content,
      wordCount: content.split(/\s+/).length,
    });

    // Generate JSON-LD FAQPage schema if FAQs exist
    const jsonLdFaq =
      metadata.faqs && metadata.faqs.length > 0
        ? generateFAQPageSchema(metadata.faqs)
        : null;

    return {
      metaTitle,
      metaDescription,
      keywords: keywords.slice(0, 10),
      jsonLdSchema: jsonLdFaq
        ? { newsArticle: jsonLdNewsArticle, faqPage: jsonLdFaq }
        : { newsArticle: jsonLdNewsArticle },
    };
  }

  extractKeywords(text) {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq = {};
    
    words.forEach(word => {
      if (!commonWords.includes(word) && word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    return Object.keys(wordFreq)
      .sort((a, b) => wordFreq[b] - wordFreq[a])
      .slice(0, 20);
  }

  async generateMetadata(title, content, contextData) {
    try {
      // Generate TL;DR (3-4 key points)
      const tldrPrompt = formatPromptForLLaMA(
        `Extract 3-4 key points from this article. Return only the points, one per line, without any formatting or bullets:\n\n${content.substring(0, 2000)}`,
        this.model
      );
      const tldrResponse = await this.hf.textGeneration({
        model: this.model,
        provider: TEXT_GEN_PROVIDER,
        inputs: tldrPrompt,
        parameters: { max_new_tokens: 200, temperature: 0.5 },
      });
      const tldr = this.parseBulletPoints(tldrResponse.generated_text);

      // Generate FAQs (4-5 questions and answers)
      const faqPrompt = formatPromptForLLaMA(
        `Generate 4-5 frequently asked questions and answers based on this article. Make questions practical and useful for investors. Format as:\nQ: [question]\nA: [answer]\n\nArticle: ${content.substring(0, 2000)}`,
        this.model
      );
      const faqResponse = await this.hf.textGeneration({
        model: this.model,
        provider: TEXT_GEN_PROVIDER,
        inputs: faqPrompt,
        parameters: { max_new_tokens: 400, temperature: 0.6 },
      });
      const faqs = this.parseFAQs(faqResponse.generated_text);

      // Extract tags (keywords from title and content)
      const tags = this.extractKeywords(title + ' ' + content).slice(0, 8);

      // Extract entities (important terms, companies, concepts)
      const entities = this.extractEntities(title, content, contextData);

      // Extract topics (broader categories)
      const topics = this.extractTopics(contextData);

      return {
        tldr: tldr.length > 0 ? tldr : this.generateDefaultTLDR(content),
        faqs: faqs.length > 0 ? faqs : this.generateDefaultFAQs(title, content),
        tags: tags.length > 0 ? tags : ['Stock Market', 'Financial News'],
        entities: entities.length > 0 ? entities : this.extractKeywords(title).slice(0, 5),
        topics: topics.length > 0 ? topics : [contextData.category || 'Business'],
      };
    } catch (error) {
      this.log('Metadata generation error, using defaults', { error: error.message });
      return {
        tldr: this.generateDefaultTLDR(content),
        faqs: this.generateDefaultFAQs(title, content),
        tags: this.extractKeywords(title + ' ' + content).slice(0, 8),
        entities: this.extractKeywords(title).slice(0, 5),
        topics: [contextData.category || 'Business'],
      };
    }
  }

  parseBulletPoints(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const points = lines
      .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
      .map(line => line.replace(/^[-•\d.\s]+/, '').trim())
      .filter(point => point.length > 10 && point.length < 200)
      .slice(0, 4);
    return points.length > 0 ? points : [];
  }

  parseFAQs(text) {
    const faqs = [];
    const qaPairs = text.split(/(?:Q:|Question:)/i).filter(section => section.trim());
    
    for (const section of qaPairs.slice(0, 4)) {
      const lines = section.split(/(?:A:|Answer:)/i);
      if (lines.length >= 2) {
        const question = lines[0].replace(/^[:\s]+/, '').trim();
        const answer = lines[1].replace(/^[:\s]+/, '').trim();
        if (question.length > 10 && answer.length > 20 && answer.length < 300) {
          faqs.push({ question, answer });
        }
      }
    }
    
    return faqs;
  }

  extractEntities(title, content, contextData) {
    const entities = new Set();
    
    // Add related symbols
    if (contextData.relatedSymbols) {
      contextData.relatedSymbols.forEach(symbol => entities.add(symbol.toUpperCase()));
    }
    
    // Add related metals
    if (contextData.relatedMetals) {
      contextData.relatedMetals.forEach(metal => entities.add(metal.charAt(0).toUpperCase() + metal.slice(1)));
    }
    
    // Extract important capitalized terms
    const capitalizedWords = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    capitalizedWords.forEach(word => {
      if (word.length > 3 && word.length < 30) {
        entities.add(word);
      }
    });
    
    // Add common financial entities
    const financialTerms = ['Stock Market', 'Investment', 'Trading', 'Market Analysis', 'Financial News'];
    financialTerms.forEach(term => {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        entities.add(term);
      }
    });
    
    return Array.from(entities).slice(0, 8);
  }

  extractTopics(contextData) {
    const topics = [];
    
    if (contextData.category) {
      topics.push(contextData.category.charAt(0).toUpperCase() + contextData.category.slice(1));
    }
    
    if (contextData.relatedSymbols && contextData.relatedSymbols.length > 0) {
      topics.push('Stocks');
    }
    
    if (contextData.relatedMetals && contextData.relatedMetals.length > 0) {
      topics.push('Precious Metals');
    }
    
    topics.push('Business', 'Finance');
    
    return [...new Set(topics)].slice(0, 5);
  }

  generateDefaultTLDR(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 4).map(s => s.trim().substring(0, 150));
  }

  generateDefaultFAQs(title, content) {
    return [
      {
        question: `What is the main topic of this article about ${title}?`,
        answer: content.substring(0, 200) + '...',
      },
      {
        question: `Why is ${title} important?`,
        answer: 'This article provides insights into market trends and developments that may impact investors and market participants.',
      },
      {
        question: 'How can I use this information?',
        answer: 'This information is for educational purposes only. Always consult with a qualified financial advisor before making investment decisions.',
      },
    ];
  }

  async storeArticle(articleData) {
    const collection = await getNewsCollection();
    const slug = createSlug(articleData.title);

    // Check if article already exists
    const existing = await collection.findOne({ slug });
    if (existing) {
      return existing;
    }

    // Build sources from RAG facts (scraped content)
    let sources = (articleData.contextData?.facts ?? []).map(f => {
      let domain = 'multiple';
      const url = f.sourceUrl || f.source || '';
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        try {
          const urlObj = new URL(url);
          domain = urlObj.hostname.replace('www.', '');
        } catch (e) {
          domain = url;
        }
      } else if (url) {
        domain = url;
      }
      return {
        url,
        domain,
        title: f.title || domain || url || 'Source',
        sourceType: 'scraped',
        scrapedAt: f.scrapedAt ? new Date(f.scrapedAt) : new Date(),
      };
    });

    // When article was generated from a trend, merge trend source URLs into sources
    if (articleData.trendId) {
      try {
        const { ObjectId } = await import('mongodb');
        const trendingCollection = await getTrendingTopicsCollection();
        const trend = await trendingCollection.findOne(
          { _id: new ObjectId(articleData.trendId) },
          { projection: { sourceUrls: 1 } }
        );
        if (trend?.sourceUrls?.length > 0) {
          const seen = new Set(sources.map(s => s.url));
          for (const sourceUrl of trend.sourceUrls) {
            if (sourceUrl && !seen.has(sourceUrl)) {
              seen.add(sourceUrl);
              let domain = 'source';
              try {
                domain = new URL(sourceUrl).hostname.replace('www.', '');
              } catch (_) {}
              sources.push({
                url: sourceUrl,
                domain,
                title: domain,
                sourceType: 'trend',
                scrapedAt: null,
              });
            }
          }
        }
      } catch (e) {
        this.log('Could not merge trend sources', { error: e.message });
      }
    }

    // Prepare article document
    const article = {
      title: articleData.title,
      slug,
      content: articleData.content,
      summary: articleData.summary,
      category: articleData.contextData?.category || 
        (articleData.relatedSymbols && articleData.relatedSymbols.length > 0 ? 'stocks' : 
         articleData.relatedMetals && articleData.relatedMetals.length > 0 ? 'metals' : 'stocks'),
      internalLinks: articleData.internalLinks || [],
      externalLinks: articleData.externalLinks || [],
      relatedSymbol: articleData.relatedSymbols?.[0]?.toUpperCase() || '',
      relatedStockId: articleData.contextData?.stockData?._id || null,
      relatedMetalId: articleData.contextData?.metalData?._id || null,
      imageUrl: articleData.image?.url || null,
      imageAlt: articleData.image?.alt || articleData.title,
      sources,
      tldr: articleData.tldr || [],
      faqs: articleData.faqs || [],
      tags: articleData.tags || [],
      entities: articleData.entities || [],
      topics: articleData.topics || [],
      trendingScore: (articleData.contextData?.facts ?? []).length * 10,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      seoMetadata: articleData.seoMetadata,
      embedding: articleData.embedding,
      viewCount: 0,
      isPublished: true,
    };

    const result = await collection.insertOne(article);

    // Store in vector DB
    await this.vectorDB.addEmbedding(
      'news',
      result.insertedId.toString(),
      articleData.embedding,
      {
        title: article.title,
        slug: article.slug,
        category: article.category,
        publishedAt: article.publishedAt.toISOString(),
      },
      `${article.title} ${article.content}`
    );

    return { ...article, _id: result.insertedId };
  }
}
