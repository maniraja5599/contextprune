/**
 * AST Skeletonizer Engine v2.0
 * Extracts contracts, types, exported signatures, and docstrings from code files
 * while replacing deep implementation logic with lightweight stubs.
 *
 * Supports:
 * - TypeScript & JavaScript (React Components, Classes, Interfaces, Enums, Arrow Funcs)
 * - Python (Classes, Methods, Docstrings, Type Hints, Dataclasses)
 * - Go (Structs, Interfaces, Func signatures)
 * - Rust (Traits, Structs, Enums, Impl blocks, Pub fn)
 */

/**
 * Strips string literals from a line to safely count syntactic braces
 */
function sanitizeForBraces(line) {
  return line
    .replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '""') // Replace string literals
    .replace(/\/\/.*$/, ''); // Strip single-line comments
}

/**
 * Skeletonizes TypeScript / JavaScript / TSX / JSX files
 */
export function skeletonizeJS(code) {
  const lines = code.split('\n');
  const result = [];
  let inBlockComment = false;
  let braceDepth = 0;
  let isInsideMethodOrFunc = false;
  let skippedLinesCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Preserve block comments / JSDoc comments
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
      result.push(rawLine);
      if (trimmed.endsWith('*/') && trimmed.length > 2) inBlockComment = false;
      continue;
    }
    if (inBlockComment) {
      result.push(rawLine);
      if (trimmed.endsWith('*/')) inBlockComment = false;
      continue;
    }

    // Preserve imports, exports of types, interfaces, enums entirely
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('export type ') ||
      trimmed.startsWith('export interface ') ||
      trimmed.startsWith('interface ') ||
      trimmed.startsWith('type ') ||
      trimmed.startsWith('export enum ') ||
      trimmed.startsWith('enum ')
    ) {
      result.push(rawLine);
      continue;
    }

    // Safely count syntactic braces
    const sanitized = sanitizeForBraces(rawLine);
    const openBraces = (sanitized.match(/\{/g) || []).length;
    const closeBraces = (sanitized.match(/\}/g) || []).length;

    // Detect function / method signature start
    // Includes standard functions, class methods, arrow functions, and React components
    const isFuncStart =
      /^(export\s+)?(async\s+)?function\s+[\w$]+/i.test(trimmed) ||
      /^(export\s+)?(public|private|protected|static|async|\s)*[\w$]+\s*\([^)]*\)\s*(:\s*[\w<>[\]|&,\s]+)?\s*\{?$/i.test(trimmed) ||
      /^(export\s+)?(const|let|var)\s+[\w$]+\s*(:\s*[\w<>[\]|&,\s.]+)?\s*=\s*(async\s*)?(\([^)]*\)|[\w$]+)\s*(:\s*[\w<>[\]|&,\s.]+)?\s*=>\s*\{?$/i.test(trimmed);

    const isClassOrInterface =
      /^(export\s+)?(abstract\s+)?class\s+[\w$]+/i.test(trimmed);

    if (isClassOrInterface) {
      result.push(rawLine);
      braceDepth += openBraces - closeBraces;
      continue;
    }

    if (isInsideMethodOrFunc) {
      braceDepth += openBraces - closeBraces;
      skippedLinesCount++;

      if (braceDepth <= 0) {
        // Exited function
        isInsideMethodOrFunc = false;
        braceDepth = 0;
        result.push(`  /* ... omitted ${skippedLinesCount} lines of implementation ... */`);
        result.push(rawLine.includes('}') ? rawLine.substring(rawLine.indexOf('}')) : '}');
        skippedLinesCount = 0;
      }
      continue;
    }

    if (isFuncStart) {
      if (openBraces > 0) {
        isInsideMethodOrFunc = true;
        braceDepth = openBraces - closeBraces;
        skippedLinesCount = 0;
        result.push(rawLine);
      } else {
        result.push(rawLine);
      }
      continue;
    }

    // Keep top-level variable declarations without massive bodies
    if (/^(export\s+)?(const|let|var)\s+[\w$]+/i.test(trimmed)) {
      if (rawLine.length > 120) {
        result.push(rawLine.slice(0, 100) + ' /* ... truncated ... */');
      } else {
        result.push(rawLine);
      }
      continue;
    }

    // If inside a class or outer scope, keep it
    if (braceDepth > 0) {
      braceDepth += openBraces - closeBraces;
      result.push(rawLine);
    } else if (trimmed.length > 0 && !trimmed.startsWith('//')) {
      result.push(rawLine);
    }
  }

  return result.join('\n');
}

/**
 * Skeletonizes Python files
 */
export function skeletonizePython(code) {
  const lines = code.split('\n');
  const result = [];
  let inDocstring = false;
  let docstringDelimiter = null;
  let inFuncBody = false;
  let funcIndent = 0;
  let skippedLinesCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Handle multiline docstrings
    if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
      const delim = trimmed.startsWith('"""') ? '"""' : "'''";
      if (!inDocstring) {
        inDocstring = true;
        docstringDelimiter = delim;
        result.push(rawLine);
        if (trimmed.endsWith(delim) && trimmed.length > 3) {
          inDocstring = false;
        }
        continue;
      } else if (delim === docstringDelimiter) {
        inDocstring = false;
        result.push(rawLine);
        continue;
      }
    }
    if (inDocstring) {
      result.push(rawLine);
      continue;
    }

    // Keep imports, decorators, and class definitions
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('from ') ||
      trimmed.startsWith('@') ||
      trimmed.startsWith('class ')
    ) {
      if (inFuncBody) {
        result.push(' '.repeat(funcIndent + 4) + '...');
        inFuncBody = false;
      }
      result.push(rawLine);
      continue;
    }

    // Detect function definition
    if (trimmed.startsWith('def ') || trimmed.startsWith('async def ')) {
      if (inFuncBody) {
        result.push(' '.repeat(funcIndent + 4) + '...');
      }
      result.push(rawLine);
      const indent = rawLine.match(/^\s*/)[0].length;
      funcIndent = indent;
      inFuncBody = true;
      skippedLinesCount = 0;
      continue;
    }

    if (inFuncBody) {
      const currentIndent = rawLine.match(/^\s*/)[0].length;
      if (trimmed.length > 0 && currentIndent <= funcIndent) {
        result.push(' '.repeat(funcIndent + 4) + '...');
        inFuncBody = false;
        result.push(rawLine);
      } else {
        skippedLinesCount++;
      }
      continue;
    }

    if (trimmed.length > 0) {
      result.push(rawLine);
    }
  }

  if (inFuncBody) {
    result.push(' '.repeat(funcIndent + 4) + '...');
  }

  return result.join('\n');
}

/**
 * Skeletonizes Go files
 */
export function skeletonizeGo(code) {
  const lines = code.split('\n');
  const result = [];
  let inFunc = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (
      trimmed.startsWith('package ') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('type ') ||
      trimmed.startsWith('//')
    ) {
      result.push(rawLine);
      continue;
    }

    const sanitized = sanitizeForBraces(rawLine);
    const openBraces = (sanitized.match(/\{/g) || []).length;
    const closeBraces = (sanitized.match(/\}/g) || []).length;

    if (trimmed.startsWith('func ')) {
      if (openBraces > 0) {
        inFunc = true;
        braceDepth = openBraces - closeBraces;
        const sig = rawLine.substring(0, rawLine.indexOf('{') + 1);
        result.push(sig);
      } else {
        result.push(rawLine);
      }
      continue;
    }

    if (inFunc) {
      braceDepth += openBraces - closeBraces;
      if (braceDepth <= 0) {
        inFunc = false;
        result.push('\t// ... logic omitted ...');
        result.push('}');
      }
      continue;
    }

    result.push(rawLine);
  }

  return result.join('\n');
}

/**
 * Skeletonizes Rust files
 */
export function skeletonizeRust(code) {
  const lines = code.split('\n');
  const result = [];
  let inFn = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Preserve use, pub struct, pub enum, pub trait, impl headers
    if (
      trimmed.startsWith('use ') ||
      trimmed.startsWith('pub use ') ||
      trimmed.startsWith('mod ') ||
      trimmed.startsWith('pub mod ') ||
      trimmed.startsWith('pub struct ') ||
      trimmed.startsWith('pub enum ') ||
      trimmed.startsWith('pub trait ') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('///') ||
      trimmed.startsWith('#[')
    ) {
      result.push(rawLine);
      continue;
    }

    const sanitized = sanitizeForBraces(rawLine);
    const openBraces = (sanitized.match(/\{/g) || []).length;
    const closeBraces = (sanitized.match(/\}/g) || []).length;

    // Detect function signatures
    const isFnStart = /^(pub\s+)?(async\s+)?fn\s+[\w]+/i.test(trimmed);
    const isImplStart = /^impl(\s+<[^>]+>)?\s+[\w]+(\s+for\s+[\w]+)?\s*\{?$/i.test(trimmed);

    if (isImplStart) {
      result.push(rawLine);
      braceDepth += openBraces - closeBraces;
      continue;
    }

    if (isFnStart) {
      if (openBraces > 0) {
        inFn = true;
        braceDepth += openBraces - closeBraces;
        const sig = rawLine.substring(0, rawLine.indexOf('{') + 1);
        result.push(sig);
      } else {
        result.push(rawLine);
      }
      continue;
    }

    if (inFn) {
      braceDepth += openBraces - closeBraces;
      if (braceDepth <= 0) {
        inFn = false;
        result.push('    /* ... logic omitted ... */');
        result.push('}');
      }
      continue;
    }

    result.push(rawLine);
  }

  return result.join('\n');
}

/**
 * Main skeletonizer dispatcher by extension
 */
export function skeletonizeFile(content, ext) {
  switch (ext) {
    case '.ts':
    case '.tsx':
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      return skeletonizeJS(content);
    case '.py':
      return skeletonizePython(content);
    case '.go':
      return skeletonizeGo(content);
    case '.rs':
      return skeletonizeRust(content);
    default:
      const lines = content.split('\n');
      if (lines.length > 80) {
        return (
          lines.slice(0, 50).join('\n') +
          `\n/* ... ${lines.length - 50} lines omitted for context efficiency ... */\n`
        );
      }
      return content;
  }
}
