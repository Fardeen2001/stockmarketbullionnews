// Centralized configuration for Hugging Face API
// This ensures all AI components use the same endpoint configuration

export const HUGGINGFACE_CONFIG = {
  // Use router endpoint for text generation
  endpointUrl: process.env.HUGGINGFACE_ENDPOINT_URL || 'https://router.huggingface.co',
  // Embeddings: router often returns 404 for embedding models - use legacy API
  embeddingEndpointUrl: process.env.HUGGINGFACE_EMBEDDING_ENDPOINT_URL || 'https://api-inference.huggingface.co',
  // Embedding model - use one known to work on free Inference API
  embeddingModel: process.env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
  // Default text generation model
  textGenerationModel: 'mistralai/Mistral-7B-Instruct-v0.2',
};

/**
 * Get Hugging Face inference configuration for text generation
 * @param {string} apiKey - Hugging Face API key
 * @returns {Object} Configuration object for HfInference
 */
export function getHfInferenceConfig(apiKey) {
  return {
    endpointUrl: HUGGINGFACE_CONFIG.endpointUrl,
  };
}

/**
 * Get config for embedding calls - uses legacy endpoint (router returns 404 for many embedding models)
 */
export function getEmbeddingInferenceConfig(apiKey) {
  return {
    endpointUrl: HUGGINGFACE_CONFIG.embeddingEndpointUrl,
  };
}
