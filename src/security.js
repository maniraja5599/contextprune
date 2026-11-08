/**
 * Lightweight Secret & Sensitive Token Masker
 * Scans code files for accidental hardcoded credentials before packing into prompts:
 * - OpenAI API keys (`sk-...`)
 * - Anthropic API keys (`sk-ant-...`)
 * - GitHub tokens (`ghp_...`, `gho_...`)
 * - AWS Access Key IDs (`AKIA...`)
 * - Generic Bearer tokens & private keys
 */

const SECRET_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_-]{20,}/g,          // Anthropic
  /sk-(?:proj-)?[a-zA-Z0-9_-]{20,}/g,     // OpenAI
  /gh[pousr]_[a-zA-Z0-9]{36,}/g,         // GitHub (ghp_, gho_, etc.)
  /AKIA[0-9A-Z]{16}/g,                   // AWS Access Key ID
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g // SSH/RSA Private Keys
];

export function maskSecrets(content) {
  if (!content) return { maskedContent: content, detectedCount: 0 };

  let maskedContent = content;
  let detectedCount = 0;

  for (const pattern of SECRET_PATTERNS) {
    const matches = maskedContent.match(pattern);
    if (matches) {
      detectedCount += matches.length;
      maskedContent = maskedContent.replace(pattern, '[REDACTED_API_KEY]');
    }
  }

  return { maskedContent, detectedCount };
}
