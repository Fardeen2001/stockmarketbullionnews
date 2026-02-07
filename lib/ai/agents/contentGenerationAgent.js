import { BaseAgent } from './baseAgent';
import { HfInference } from '@huggingface/inference';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';
import { HUGGINGFACE_CONFIG, getHfInferenceConfig, formatPromptForLLaMA } from '@/lib/ai/config';
import { getVectorDB } from '@/lib/vector/vectorDB';
import { getNewsCollection, getScrapedContentCollection, getStocksCollection, getMetalsCollection } from '@/lib/db';
import { UnsplashAPI } from '@/lib/api/imageAPI';
import { createSlug } from '@/lib/utils/slugify';
import { ContentHumanizer, basicHumanize } from '@/lib/utils/humanizer';

// AI Agent for generating high-quality news articles using RAG (Retrieval Augmented Generation)
export class ContentGenerationAgent extends BaseAgent {
  constructor(config = {}) {
    super('ContentGenerationAgent', config);
    this.hf = null;
    this.embeddingGenerator = null;
    this.vectorDB = getVectorDB();
    this.imageAPI = null;
    this.humanizer = null;
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

      // Retrieve relevant context using vector search (RAG)
      const contextData = await this.retrieveContext(topic, relatedSymbols, relatedMetals);

      // Generate article using retrieved context
      const article = await this.generateArticle(topic, contextData);

      // Humanize the content if humanizer is available
      let humanizedContent = article.content;
      if (this.humanizer) {
        try {
          this.log('Humanizing content...');
          humanizedContent = await this.humanizer.humanizeInChunks(article.content);
          this.log('Content humanized successfully');
        } catch (error) {
          this.log('Humanization failed, using basic humanization', { error: error.message });
          humanizedContent = basicHumanize(article.content);
        }
      } else {
        humanizedContent = basicHumanize(article.content);
      }

      // Generate additional metadata (FAQs, tags, entities, topics, TL;DR)
      const metadata = await this.generateMetadata(article.title, humanizedContent, contextData);

      // Determine category
      const category = contextData.category || 
        (contextData.relatedSymbols && contextData.relatedSymbols.length > 0 ? 'stocks' : 
         contextData.relatedMetals && contextData.relatedMetals.length > 0 ? 'metals' : 'stocks');

      // Generate image
      const image = await this.generateImage(topic, category);

      // Generate SEO metadata
      const seoMetadata = await this.generateSEOMetadata(article.title, humanizedContent);

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

      // Store article
      const storedArticle = await this.storeArticle({
        ...article,
        content: humanizedContent,
        topic,
        contextData: { ...contextData, category },
        image,
        seoMetadata,
        embedding,
        relatedSymbols,
        relatedMetals,
        internalLinks: article.internalLinks || [],
        externalLinks: article.externalLinks || [],
        ...metadata,
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

    // Aggregate facts from scraped content (all stored embedded data)
    const facts = similarScraped.map(item => ({
      title: item.metadata?.title || item.text?.substring(0, 100) || '',
      source: item.metadata?.sourceUrl || item.metadata?.source || '',
      sourceUrl: item.metadata?.sourceUrl || item.metadata?.source || '',
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
    };
  }

  async generateArticle(topic, contextData) {
    try {
      // Build comprehensive prompt with retrieved context
      const prompt = this.buildRAGPrompt(topic, contextData);

      // Generate article using LLM
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 1200, // Increased for 500+ words
          temperature: 0.75,
          top_p: 0.9,
          return_full_text: false,
          repetition_penalty: 1.2,
        },
      });

      const generatedText = this.cleanGeneratedText(response.generated_text);

      // Extract title and content
      const title = this.extractTitle(generatedText) || this.generateTitle(topic);
      let content = this.extractContent(generatedText);
      
      // Ensure minimum word count
      const wordCount = content.split(/\s+/).length;
      if (wordCount < 500 && content.length > 0) {
        // Add expansion if content is too short
        content += '\n\nMarket analysts are closely monitoring these developments as they may impact investor sentiment and market trends. The data suggests significant activity in recent trading sessions, with various factors contributing to the current market dynamics. Investors should stay informed about these changes and consider how they might affect their investment strategies. The interplay of economic indicators, market conditions, and global events creates a complex landscape that requires careful analysis and understanding.';
      }
      
      // Process links: find related articles and inject internal/external links
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
    } catch (error) {
      this.log('Article generation error, using template', { error: error.message });
      return this.generateTemplateArticle(topic, contextData);
    }
  }

  buildRAGPrompt(topic, contextData) {
    const factsText = (contextData.facts || [])
      .map((f, i) => `${i + 1}. ${f.title} (Source: ${f.source || 'N/A'})\n   ${(f.text || '').substring(0, 400)}`)
      .join('\n\n') || 'No scraped sources found. Write based on the topic and any data below.';

    const stockInfo = contextData.stockData
      ? `\n\nStock Data:\n- Symbol: ${contextData.stockData.symbol}\n- Price: ₹${contextData.stockData.currentPrice}\n- Change: ${contextData.stockData.changePercent}%\n- Market Cap: ₹${(contextData.stockData.marketCap / 10000000).toFixed(2)} Cr`
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
      ? `\n\nExisting Similar Articles (write something different and more valuable):\n${existingArticlesText}`
      : '';

    const sourcesList = (contextData.facts || [])
      .map((f, i) => `${i + 1}. ${f.title} - ${f.sourceUrl || f.source || 'N/A'}`)
      .join('\n');

    const rawPrompt = `You are a world-class financial content writer with 10+ years of experience in SEO-optimized content creation for stock markets and precious metals. You have deep expertise in:
- Advanced SEO techniques (keyword optimization, semantic SEO, E-A-T principles)
- Content marketing best practices
- Financial journalism and market analysis
- Link building and internal linking strategies
- User engagement and readability optimization

Write a comprehensive, engaging, SEO-optimized news article about: ${topic}

Context and Facts from Retrieved Sources (use this embedded data to ground your article):
${factsText}
${stockInfo}
${metalInfo}
${trendsSection}
${existingSection}

Sources Available for External Linking:
${sourcesList}

CRITICAL SEO & CONTENT REQUIREMENTS:

1. HOOK & INTRODUCTION (First 2-3 paragraphs):
   - Start with a compelling, attention-grabbing hook that addresses the reader's intent
   - Include primary keyword naturally in the first 100 words
   - Provide context and set expectations
   - Use power words and emotional triggers

2. CONTENT STRUCTURE (600-800 words minimum):
   - Write in PLAIN TEXT format - NO markdown, NO headers, NO bullet points, NO special formatting
   - Use natural, flowing paragraphs (3-5 sentences each) with smooth transitions
   - Structure: Introduction → Analysis → Insights → Data → Conclusion
   - Include semantic variations of keywords throughout
   - Use LSI (Latent Semantic Indexing) keywords naturally

3. INTERNAL LINKING STRATEGY:
   - Naturally mention related topics that could link to other articles (e.g., "similar market trends", "related stock analysis", "precious metals investment")
   - Use anchor text variations (don't repeat the same phrase)
   - Place internal link opportunities in contextually relevant places
   - Mention related stocks, metals, or market concepts that readers might want to explore

4. EXTERNAL LINKING STRATEGY:
   - Naturally cite sources within the content (e.g., "According to [Source Name]", "Data from [Source] shows...", "As reported by [Source]...")
   - Link to authoritative sources when mentioning specific data or statistics
   - Use natural anchor text that flows with the sentence
   - Include 3-5 external source citations naturally throughout the article

5. SEO OPTIMIZATION:
   - Include primary keyword in first paragraph, middle, and near conclusion
   - Use related keywords and synonyms naturally (avoid keyword stuffing)
   - Include long-tail keywords where appropriate
   - Optimize for featured snippets with clear, concise answers
   - Use natural language that matches search intent

6. READABILITY & ENGAGEMENT:
   - Use varied sentence structure (short, medium, long sentences)
   - Include specific numbers, percentages, and data points
   - Use active voice where possible
   - Break complex concepts into digestible chunks
   - Include rhetorical questions to engage readers
   - Use transition words for flow (however, furthermore, consequently, etc.)

7. CONTENT QUALITY:
   - Professional, objective journalistic tone
   - Focus on Indian and global markets
   - Include actionable insights for investors
   - Provide context and background information
   - Use third person, present tense where appropriate

8. LINK PLACEMENT MARKERS:
   - For INTERNAL links, use format: [INTERNAL:keyword phrase] where you want internal links
   - For EXTERNAL links, use format: [EXTERNAL:Source Name|source_url] where you want external links
   - Place links naturally within sentences, not at the end
   - Use descriptive anchor text that provides context

EXAMPLE LINK USAGE:
- "Recent analysis of [INTERNAL:gold prices in India] shows significant movement..."
- "According to [EXTERNAL:Economic Times|https://example.com], market data indicates..."
- "Investors interested in [INTERNAL:silver investment strategies] should consider..."

IMPORTANT: 
- Output ONLY the article text with link markers
- Do NOT include title, summary, or markdown formatting
- Write in plain paragraphs with natural link markers embedded
- Ensure links enhance readability, not distract from it

Article:`;

    return formatPromptForLLaMA(rawPrompt, this.model);
  }

  extractTitle(text) {
    const titleMatch = text.match(/^#\s*(.+)$/m) || text.match(/^(.{10,80})$/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  extractContent(text) {
    // Remove title if present (markdown or plain)
    let content = text
      .replace(/^#+\s*.+$/gm, '') // Remove markdown headers
      .replace(/^Article:\s*/i, '') // Remove "Article:" prefix
      .replace(/^Title:\s*.+$/im, '') // Remove title lines
      .replace(/^Summary:\s*.+$/im, '') // Remove summary lines
      .trim();
    
    // Remove markdown formatting (but preserve our link markers)
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
      .replace(/^#+\s*.+$/gm, '') // Remove markdown headers
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

  async generateTemplateArticle(topic, contextData) {
    const title = this.generateTitle(topic);
    const summary = `This article covers the latest developments regarding ${topic} in the stock market and precious metals sector.`;
    
    // Generate a longer, better-structured article without markdown
    const hook = `In a market that never sleeps, ${topic} has emerged as a focal point for investors and analysts alike, with recent developments signaling potential shifts in market dynamics that could reshape investment strategies.`;
    
    const introduction = `${hook} The financial landscape is constantly evolving, and understanding these changes is crucial for making informed investment decisions. This comprehensive analysis delves into the latest market movements, data insights, and expert perspectives surrounding ${topic}.`;
    
    const highlights = contextData.facts.slice(0, 5).map(f => f.title).join(', ');
    const keyPoints = `Recent market data reveals several key developments. ${highlights}. These factors collectively contribute to the current market sentiment and investor behavior.`;
    
    const analysis = `Market analysts are closely monitoring these developments as they may impact investor sentiment and market trends. Based on the latest data from multiple sources, ${topic} has shown significant activity in recent trading sessions. The interplay of various economic factors, market conditions, and investor behavior creates a complex landscape that requires careful analysis and understanding.`;
    
    const stockPerformance = contextData.stockData 
      ? `${contextData.stockData.symbol} is currently trading at ₹${contextData.stockData.currentPrice}, with a ${contextData.stockData.changePercent >= 0 ? 'gain' : 'decline'} of ${Math.abs(contextData.stockData.changePercent)}%. This performance reflects the broader market trends and investor sentiment towards this particular stock. Market capitalization stands at ₹${(contextData.stockData.marketCap / 10000000).toFixed(2)} crores, indicating its significance in the market.`
      : '';
    
    const metalPrices = contextData.metalData
      ? `${contextData.metalData.metalType.charAt(0).toUpperCase() + contextData.metalData.metalType.slice(1)} is currently priced at ₹${contextData.metalData.currentPrice} per ${contextData.metalData.unit === 'per_gram' ? 'gram' : 'ounce'}, with a change of ${contextData.metalData.changePercent}%. Precious metals continue to play a crucial role in investment portfolios, serving as both a hedge against inflation and a store of value.`
      : '';
    
    // Add source citation if available
    const sourceCitation = contextData.facts.length > 0 && contextData.facts[0].sourceUrl
      ? ` According to [EXTERNAL:${this.extractDomain(contextData.facts[0].sourceUrl)}|${contextData.facts[0].sourceUrl}], these trends are expected to continue.`
      : '';
    
    const implications = `These market movements have broader implications for investors. Understanding the underlying factors driving these changes is essential for making informed decisions. Market volatility, economic indicators, and global events all contribute to the current state of the market. Investors should consider these factors when evaluating their investment strategies and portfolio allocations.${sourceCitation}`;
    
    const conclusion = `As market conditions continue to evolve, staying informed about developments related to ${topic} becomes increasingly important. The financial markets are dynamic, and what seems like a minor change today could have significant implications tomorrow. Investors are advised to monitor these trends closely and consult with financial advisors to make decisions aligned with their investment goals and risk tolerance.`;
    
    const content = `${introduction}\n\n${keyPoints}\n\n${analysis}\n\n${stockPerformance}\n\n${metalPrices}\n\n${implications}\n\n${conclusion}`.trim();

    // Process links even for template articles
    const { processedContent, internalLinks, externalLinks } = await this.processLinks(
      content,
      contextData,
      topic
    );

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

  async generateSEOMetadata(title, content) {
    const metaTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    const metaDescription = content.substring(0, 157) + '...';
    
    // Extract keywords
    const keywords = this.extractKeywords(title + ' ' + content);
    
    return {
      metaTitle,
      metaDescription,
      keywords: keywords.slice(0, 10),
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
      relatedStockId: articleData.contextData.stockData?._id || null,
      relatedMetalId: articleData.contextData.metalData?._id || null,
      imageUrl: articleData.image?.url || null,
      imageAlt: articleData.image?.alt || articleData.title,
      sources: (articleData.contextData?.facts ?? []).map(f => {
        // Extract domain from source URL if it's a URL
        let domain = 'multiple';
        let url = f.source || '';
        
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
          url: url,
          domain: domain,
          title: f.title || url,
          scrapedAt: new Date(),
        };
      }),
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
