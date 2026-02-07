// Centralized configuration for Hugging Face API
// This ensures all AI components use the same endpoint configuration

export const HUGGINGFACE_CONFIG = {
  // Hugging Face Inference: use router (api-inference.huggingface.co is deprecated)
  endpointUrl: process.env.HUGGINGFACE_ENDPOINT_URL || 'https://router.huggingface.co',
  // Embeddings use the same router (legacy api-inference.huggingface.co is no longer supported)
  embeddingEndpointUrl: process.env.HUGGINGFACE_EMBEDDING_ENDPOINT_URL || 'https://router.huggingface.co',
  // Embedding model (768 dims for all-mpnet-base-v2)
  embeddingModel: process.env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/all-mpnet-base-v2',
  // LLaMA-based open model for content generation (7B default; set HUGGINGFACE_TEXT_GENERATION_MODEL to 13B e.g. meta-llama/Llama-2-13b-chat-hf)
  textGenerationModel: process.env.HUGGINGFACE_TEXT_GENERATION_MODEL || 'meta-llama/Llama-2-7b-chat-hf',
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
 * Get config for embedding calls (same router as text generation)
 */
export function getEmbeddingInferenceConfig(apiKey) {
  return {
    endpointUrl: HUGGINGFACE_CONFIG.embeddingEndpointUrl,
  };
}

/**
 * Format prompt for LLaMA-based chat models (Llama-2, Llama-3, etc.).
 * Uses [INST] ... [/INST] and optional system block for best results.
 * @param {string} userPrompt - The main instruction/content prompt
 * @param {string} [modelId] - Model ID; if not provided uses HUGGINGFACE_CONFIG.textGenerationModel
 * @param {string} [systemPrompt] - Optional system instruction
 * @returns {string} Formatted prompt for textGeneration
 */
export function formatPromptForLLaMA(userPrompt, modelId, systemPrompt) {
  const id = (modelId || HUGGINGFACE_CONFIG.textGenerationModel).toLowerCase();
  if (!id.includes('llama')) {
    return userPrompt;
  }
  const system = systemPrompt || 'You are a professional financial content writer. Write accurate, SEO-friendly articles based on the provided context.';
  return `<s>[INST] <<SYS>>\n${system}\n<</SYS>>\n\n${userPrompt} [/INST]`;
}
