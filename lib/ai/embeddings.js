import { HfInference } from '@huggingface/inference';

// Embedding generator using Hugging Face models
export class EmbeddingGenerator {
  constructor(apiKey) {
    // Use direct inference endpoint to bypass Inference Provider routing
    // This avoids permission errors when API key doesn't have provider access
    this.hf = new HfInference(apiKey, {
      endpointUrl: 'https://api-inference.huggingface.co',
    });
    this.model = 'sentence-transformers/all-MiniLM-L6-v2'; // Free embedding model
  }

  async generateEmbedding(text) {
    try {
      const response = await this.hf.featureExtraction({
        model: this.model,
        inputs: text,
      });

      // Response is an array of numbers (embedding vector)
      return Array.isArray(response) ? response : response[0];
    } catch (error) {
      console.error('Embedding generation error:', error.message);
      // Return a zero vector as fallback (not ideal, but prevents crashes)
      return new Array(384).fill(0);
    }
  }

  async generateEmbeddings(texts) {
    try {
      const response = await this.hf.featureExtraction({
        model: this.model,
        inputs: texts,
      });

      return Array.isArray(response) ? response : [response];
    } catch (error) {
      console.error('Batch embedding generation error:', error.message);
      // Return zero vectors as fallback
      return texts.map(() => new Array(384).fill(0));
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  findSimilar(embedding, embeddings, threshold = 0.7) {
    const similarities = embeddings.map((emb, index) => ({
      index,
      similarity: this.cosineSimilarity(embedding, emb),
    }));

    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
  }
}
