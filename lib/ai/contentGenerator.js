import { HfInference } from '@huggingface/inference';
import { HUGGINGFACE_CONFIG, getHfInferenceConfig, formatPromptForLLaMA } from './config';

// AI Content Generator using Hugging Face models
export class ContentGenerator {
  constructor(apiKey) {
    // Use centralized configuration for Hugging Face API endpoint
    this.hf = new HfInference(apiKey, getHfInferenceConfig(apiKey));
    this.model = HUGGINGFACE_CONFIG.textGenerationModel;
  }

  async generateArticle(topic, facts, relatedData) {
    try {
      const rawPrompt = this.buildArticlePrompt(topic, facts, relatedData);
      const prompt = formatPromptForLLaMA(rawPrompt, this.model);
      const response = await this.hf.textGeneration({
        model: this.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false,
          repetition_penalty: 1.15,
        },
      });

      return this.cleanGeneratedText(response.generated_text);
    } catch (error) {
      console.error('Content generation error:', error.message);
      // Fallback to template-based generation
      return this.generateTemplateArticle(topic, facts, relatedData);
    }
  }

  buildArticlePrompt(topic, facts, relatedData) {
    return `Write a professional financial news article about ${topic}.

Key Facts:
${facts.map(f => `- ${f}`).join('\n')}

Related Data:
${JSON.stringify(relatedData, null, 2)}

Write an objective, SEO-friendly news article (500-800 words) that:
1. Has a compelling headline
2. Provides factual information
3. Includes relevant data and statistics
4. Is written in a professional journalistic style
5. Focuses on Indian and global markets
6. Includes relevant keywords naturally

Article:`;
  }

  cleanGeneratedText(text) {
    // Remove any unwanted prefixes/suffixes
    return text
      .replace(/^Article:\s*/i, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  generateTemplateArticle(topic, facts, relatedData) {
    // Fallback template-based article
    const headline = this.generateHeadline(topic);
    const summary = `This article covers the latest developments regarding ${topic} in the stock market and precious metals sector.`;
    
    const content = `
# ${headline}

${summary}

## Key Highlights

${facts.map(f => `- ${f}`).join('\n')}

## Market Analysis

Based on the latest data, ${topic} has shown significant activity in recent trading sessions. Market analysts are closely monitoring these developments as they may impact investor sentiment and market trends.

## Data Insights

${relatedData ? `Current market data indicates: ${JSON.stringify(relatedData)}` : 'Data is being updated.'}

## Conclusion

Stay updated with the latest news and analysis on ${topic} as market conditions continue to evolve.

*This article is for informational purposes only and does not constitute financial advice.*
    `.trim();

    return {
      title: headline,
      summary: summary,
      content: content,
    };
  }

  generateHeadline(topic) {
    const templates = [
      `${topic}: Latest Market Updates and Analysis`,
      `Breaking: ${topic} Shows Significant Market Movement`,
      `${topic} - Market Trends and Investor Insights`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  async generateSummary(content) {
    try {
      const prompt = `Summarize the following article in 2-3 sentences:\n\n${content}`;
      
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

  async generateSEOMetadata(title, content) {
    const metaTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    const metaDescription = content.substring(0, 157) + '...';
    
    // Extract keywords (simple implementation)
    const keywords = this.extractKeywords(title + ' ' + content);
    
    return {
      metaTitle,
      metaDescription,
      keywords: keywords.slice(0, 10),
    };
  }

  extractKeywords(text) {
    // Simple keyword extraction (can be enhanced with NLP)
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
}
