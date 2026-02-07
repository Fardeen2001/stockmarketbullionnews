// Centralized configuration for Hugging Face API
// Token: Create at hf.co/settings/tokens with "Make calls to Inference Providers" (fine-grained).

export const HUGGINGFACE_CONFIG = {
  // Do NOT pass endpointUrl - the SDK uses router.huggingface.co/hf-inference correctly.
  // Passing endpointUrl causes the SDK to treat it as the full request URL (no model path) → 404.
  // Embedding model (768 dims for all-mpnet-base-v2; must match vector DB dimension)
  embeddingModel: process.env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/all-mpnet-base-v2',
  // Text generation model (use Inference Providers compatible model)
  textGenerationModel: process.env.HUGGINGFACE_TEXT_GENERATION_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',
};

/**
 * Get Hugging Face inference configuration for text generation
 * @param {string} apiKey - Hugging Face API key
 * @returns {Object} Configuration object for HfInference
 */
export function getHfInferenceConfig(apiKey) {
  return {};
}

/**
 * Get config for embedding calls - no custom endpointUrl (SDK uses Inference Providers)
 */
export function getEmbeddingInferenceConfig(apiKey) {
  return {};
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
