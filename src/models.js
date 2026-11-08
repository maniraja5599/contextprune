/**
 * Model Presets & Specifications
 * Automatically tunes token budgets, output formats, and cost rates
 * based on the target LLM.
 */

export const MODEL_PRESETS = {
  // Anthropic Claude
  'claude-3-5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    format: 'xml',
    maxTokens: 180000,
    costPerMillion: 3.00,
    description: 'Optimized for Claude XML tags (<contextprune_repository>)'
  },
  'claude': {
    name: 'Claude 3.5 Sonnet',
    format: 'xml',
    maxTokens: 180000,
    costPerMillion: 3.00
  },

  // OpenAI
  'gpt-4o': {
    name: 'GPT-4o',
    format: 'markdown',
    maxTokens: 120000,
    costPerMillion: 2.50,
    description: 'Formatted in GitHub markdown with fenced code blocks'
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    format: 'markdown',
    maxTokens: 64000,
    costPerMillion: 0.15
  },

  // Local / Open Source LLMs (Strict Token Windows)
  'ollama': {
    name: 'Ollama (Local)',
    format: 'markdown',
    maxTokens: 8000,
    costPerMillion: 0.00,
    description: 'Aggressive pruning strictly tailored for 8k local context windows'
  },
  'llama3': {
    name: 'Llama 3 / 3.1',
    format: 'markdown',
    maxTokens: 8000,
    costPerMillion: 0.00
  },
  'deepseek': {
    name: 'DeepSeek V3 / R1',
    format: 'markdown',
    maxTokens: 64000,
    costPerMillion: 0.27
  },

  // Google Gemini
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    format: 'xml',
    maxTokens: 500000,
    costPerMillion: 3.50
  },
  'gemini-flash': {
    name: 'Gemini Flash',
    format: 'xml',
    maxTokens: 250000,
    costPerMillion: 0.075
  }
};

export function getModelPreset(modelName) {
  if (!modelName) return null;
  const key = modelName.toLowerCase().trim();
  return MODEL_PRESETS[key] || null;
}
