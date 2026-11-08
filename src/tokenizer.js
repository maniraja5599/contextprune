/**
 * Tokenizer & Cost Estimator
 * Calibrated against standard BPE tokenizers (cl100k_base / Claude 3.5 Sonnet / GPT-4o)
 */

export function estimateTokens(text) {
  if (!text || text.length === 0) return 0;

  // Modern BPE tokenizers (OpenAI cl100k_base / Anthropic Claude):
  // 1 token ~ 3.7 characters for mixed code/markdown
  // We combine character ratio with symbol and whitespace entropy:
  const charLength = text.length;
  const wordTokens = (text.match(/[\w]+|[^\w\s]+/g) || []).length;
  
  // Blended estimation (smooths out short lines and dense operator strings)
  const estimated = Math.round((charLength / 3.8) * 0.5 + wordTokens * 0.5);
  return Math.max(1, estimated);
}

/**
 * Calculates token savings metrics and estimated API cost
 */
export function calculateSavings(originalTokens, prunedTokens, costPerMillion = 3.0) {
  const tokensSaved = Math.max(0, originalTokens - prunedTokens);
  const percentSaved = originalTokens > 0 
    ? ((tokensSaved / originalTokens) * 100).toFixed(1)
    : '0.0';
  
  const originalCost = (originalTokens / 1_000_000) * costPerMillion;
  const prunedCost = (prunedTokens / 1_000_000) * costPerMillion;
  const costSaved = Math.max(0, originalCost - prunedCost);

  // Approximate response speedup factor
  const speedup = originalTokens > 0 
    ? Math.max(1.1, (originalTokens / Math.max(prunedTokens, 1)) * 0.8).toFixed(1)
    : '1.0';

  return {
    originalTokens,
    prunedTokens,
    tokensSaved,
    percentSaved: parseFloat(percentSaved),
    originalCost: originalCost.toFixed(4),
    prunedCost: prunedCost.toFixed(4),
    costSaved: costSaved.toFixed(4),
    speedup: `${speedup}x`
  };
}
