import { BaseAgent } from './baseAgent';
import { HfInference } from '@huggingface/inference';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';
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
    this.model = config.model || 'mistralai/Mistral-7B-Instruct-v0.2';
  }

  async initialize(apiKey) {
    // Use the new router endpoint (required as of 2024)
    this.hf = new HfInference(apiKey, {
      endpoint: 'https://router.huggingface.co',
    });
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

      // Generate image
      const image = await this.generateImage(topic, contextData.category);

      // Generate SEO metadata
      const seoMetadata = await this.generateSEOMetadata(article.title, humanizedContent);

      // Generate embedding for the article
      const embedding = await this.embeddingGenerator.generateEmbedding(
        `${article.title} ${article.content}`
      );

      // Store article
      const storedArticle = await this.storeArticle({
        ...article,
        content: humanizedContent,
        topic,
        contextData,
        image,
        seoMetadata,
        embedding,
        relatedSymbols,
        relatedMetals,
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
    // Generate query embedding
    const queryEmbedding = await this.embeddingGenerator.generateEmbedding(topic);

    // Search for similar scraped content
    const similarScraped = await this.vectorDB.searchSimilar(
      'scraped',
      queryEmbedding,
      10,
      0.7
    );

    // Search for similar news articles (to avoid duplication)
    const similarNews = await this.vectorDB.searchSimilar(
      'news',
      queryEmbedding,
      5,
      0.8
    );

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

    // Aggregate facts from scraped content
    const facts = similarScraped.map(item => ({
      title: item.metadata?.title || item.text.substring(0, 100),
      source: item.metadata?.sourceUrl || item.metadata?.source || '',
      sourceUrl: item.metadata?.sourceUrl || item.metadata?.source || '',
      text: item.text,
    }));

    return {
      facts,
      similarArticles: similarNews,
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
      
      const summary = await this.generateSummary(content);

      return {
        title,
        content,
        summary,
      };
    } catch (error) {
      this.log('Article generation error, using template', { error: error.message });
      return this.generateTemplateArticle(topic, contextData);
    }
  }

  buildRAGPrompt(topic, contextData) {
    const factsText = contextData.facts
      .map((f, i) => `${i + 1}. ${f.title} (Source: ${f.source})\n   ${f.text.substring(0, 300)}`)
      .join('\n\n');

    const stockInfo = contextData.stockData
      ? `\n\nStock Data:\n- Symbol: ${contextData.stockData.symbol}\n- Price: ₹${contextData.stockData.currentPrice}\n- Change: ${contextData.stockData.changePercent}%\n- Market Cap: ₹${(contextData.stockData.marketCap / 10000000).toFixed(2)} Cr`
      : '';

    const metalInfo = contextData.metalData
      ? `\n\nMetal Data:\n- Type: ${contextData.metalData.metalType}\n- Price: ₹${contextData.metalData.currentPrice}\n- Change: ${contextData.metalData.changePercent}%`
      : '';

    return `You are an expert financial journalist writing for StockMarket Bullion. Write a comprehensive, engaging news article about: ${topic}

Context and Facts from Multiple Sources:
${factsText}
${stockInfo}
${metalInfo}

CRITICAL REQUIREMENTS:
1. Start with a STRONG HOOK - an attention-grabbing opening sentence that makes readers want to continue
2. Write a minimum of 500 words (aim for 600-800 words)
3. Use PLAIN TEXT format - NO markdown, NO headers (# or ##), NO bullet points (- or *), NO special formatting
4. Write in natural, flowing paragraphs with proper transitions
5. Structure the article with:
   - Compelling hook and introduction (2-3 paragraphs)
   - Detailed analysis section (3-4 paragraphs)
   - Market insights and implications (2-3 paragraphs)
   - Expert perspectives and data (2-3 paragraphs)
   - Forward-looking conclusion (1-2 paragraphs)
6. Use professional, objective journalistic tone
7. Include specific numbers, percentages, and data points from sources
8. Make it readable, analyzable, and understandable for investors
9. Include relevant keywords naturally (stock market, India, NSE, BSE, gold, silver, investment, etc.)
10. Focus on Indian and global markets
11. Cite information naturally within the text (e.g., "According to sources...", "Data shows...")
12. Use varied sentence structure and engaging language
13. Write in third person, present tense where appropriate

IMPORTANT: Output ONLY the article text. Do NOT include title, summary, or any markdown formatting. Just write the article content in plain paragraphs.

Article:`;
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
    
    // Remove markdown formatting
    content = content
      .replace(/^[-*+]\s+/gm, '') // Remove bullet points
      .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
      .replace(/`(.+?)`/g, '$1') // Remove code blocks
      .replace(/^>\s+/gm, '') // Remove blockquotes
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
    
    return content || text;
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
      const prompt = `Summarize this article in 2-3 sentences, focusing on key points:\n\n${content.substring(0, 1000)}`;
      
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

  generateTemplateArticle(topic, contextData) {
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
    
    const implications = `These market movements have broader implications for investors. Understanding the underlying factors driving these changes is essential for making informed decisions. Market volatility, economic indicators, and global events all contribute to the current state of the market. Investors should consider these factors when evaluating their investment strategies and portfolio allocations.`;
    
    const conclusion = `As market conditions continue to evolve, staying informed about developments related to ${topic} becomes increasingly important. The financial markets are dynamic, and what seems like a minor change today could have significant implications tomorrow. Investors are advised to monitor these trends closely and consult with financial advisors to make decisions aligned with their investment goals and risk tolerance.`;
    
    const content = `${introduction}\n\n${keyPoints}\n\n${analysis}\n\n${stockPerformance}\n\n${metalPrices}\n\n${implications}\n\n${conclusion}`.trim();

    return { title, summary, content };
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
      const tldrPrompt = `Extract 3-4 key points from this article. Return only the points, one per line, without any formatting or bullets:\n\n${content.substring(0, 2000)}`;
      const tldrResponse = await this.hf.textGeneration({
        model: this.model,
        inputs: tldrPrompt,
        parameters: { max_new_tokens: 200, temperature: 0.5 },
      });
      const tldr = this.parseBulletPoints(tldrResponse.generated_text);

      // Generate FAQs (4-5 questions and answers)
      const faqPrompt = `Generate 4-5 frequently asked questions and answers based on this article. Make questions practical and useful for investors. Format as:\nQ: [question]\nA: [answer]\n\nArticle: ${content.substring(0, 2000)}`;
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
      category: articleData.contextData.category || 'stocks',
      relatedSymbol: articleData.relatedSymbols?.[0]?.toUpperCase() || '',
      relatedStockId: articleData.contextData.stockData?._id || null,
      relatedMetalId: articleData.contextData.metalData?._id || null,
      imageUrl: articleData.image?.url || null,
      imageAlt: articleData.image?.alt || articleData.title,
      sources: articleData.contextData.facts.map(f => {
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
      trendingScore: articleData.contextData.facts.length * 10,
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
