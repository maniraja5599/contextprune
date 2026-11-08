import path from 'node:path';

/**
 * Extracts import/require paths from file content
 */
export function extractImports(content, ext) {
  const imports = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (ext === '.js' || ext === '.ts' || ext === '.tsx' || ext === '.jsx' || ext === '.mjs') {
      const match = trimmed.match(/from\s+['"]([^'"]+)['"]/i) || trimmed.match(/require\(['"]([^'"]+)['"]\)/i);
      if (match && match[1]) {
        imports.push(match[1]);
      }
    } else if (ext === '.py') {
      const match = trimmed.match(/^from\s+([\w.]+)\s+import/i) || trimmed.match(/^import\s+([\w.]+)/i);
      if (match && match[1]) {
        imports.push(match[1].replace(/\./g, '/'));
      }
    } else if (ext === '.go') {
      const match = trimmed.match(/^import\s+['"]([^'"]+)['"]/i);
      if (match && match[1]) {
        imports.push(match[1]);
      }
    } else if (ext === '.rs') {
      const match = trimmed.match(/^use\s+([^;]+);/i);
      if (match && match[1]) {
        imports.push(match[1].replace(/::/g, '/'));
      }
    }
  }

  return imports;
}

/**
 * Resolves an import statement relative to the importer's directory
 */
function resolveImportPath(importStr, importerRelPath, allRelativePaths) {
  const importerDir = path.dirname(importerRelPath);
  const candidate = path.normalize(path.join(importerDir, importStr));

  if (allRelativePaths.has(candidate)) return candidate;

  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'];
  for (const ext of extensions) {
    if (allRelativePaths.has(candidate + ext)) return candidate + ext;
    if (allRelativePaths.has(path.join(candidate, 'index' + ext))) return path.join(candidate, 'index' + ext);
  }

  for (const p of allRelativePaths) {
    if (p.includes(candidate)) return p;
  }

  return null;
}

/**
 * Tokenizes task query into search terms
 */
function extractKeywords(taskQuery) {
  if (!taskQuery) return [];
  return taskQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'fix', 'add', 'make', 'update', 'into', 'from', 'this', 'that'].includes(w));
}

/**
 * Splits camelCase, snake_case, and kebab-case code text into plain lowercase words
 */
function normalizeCodeText(text) {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // split CamelCase
    .replace(/[_/\\.-]+/g, ' ')           // split snake, kebab, paths
    .toLowerCase();
}

/**
 * Calculates relevance score for each file based on:
 * 1. Explicit target matches
 * 2. Keyword density in path & code symbols (handling camelCase & snake_case)
 * 3. Transitive dependency graph (imports from target files)
 */
export function rankFilesByRelevance(files, taskQuery = '', targetPaths = []) {
  const keywords = extractKeywords(taskQuery);
  const normalizedTargets = targetPaths.map(t => path.normalize(t.toLowerCase()));
  const allRelPathsSet = new Set(files.map(f => f.relativePath));

  // 1. Initial scoring based on keywords and paths
  const scoredFiles = files.map(file => {
    let score = 0;
    const relLower = file.relativePath.toLowerCase();
    const normalizedPath = normalizeCodeText(file.relativePath);
    const normalizedContent = normalizeCodeText(file.content || '');

    // Explicit target match
    if (normalizedTargets.some(t => relLower.includes(t))) {
      score += 1000;
    }

    // Keyword matches in path & filename
    for (const kw of keywords) {
      if (normalizedPath.includes(kw)) {
        score += 150;
      }
    }

    // Keyword matches in code symbols & content
    for (const kw of keywords) {
      const occurrences = (normalizedContent.match(new RegExp(`\\b${kw}\\b`, 'g')) || []).length;
      score += Math.min(occurrences * 15, 80);
    }

    // Boost types/interfaces/models if query touches domain
    if (relLower.includes('type') || relLower.includes('model') || relLower.includes('schema') || relLower.includes('interface')) {
      if (keywords.some(kw => normalizedPath.includes(kw) || normalizedContent.includes(kw))) {
        score += 50;
      }
    }

    const imports = extractImports(file.content || '', file.ext);

    return {
      ...file,
      score,
      imports
    };
  });

  // Sort descending to find primary targets
  scoredFiles.sort((a, b) => b.score - a.score);

  // 2. Dependency Graph Resolution
  const primaryTargets = scoredFiles.filter(f => f.score >= 50);
  const dependencyBoosts = new Set();

  for (const target of primaryTargets) {
    for (const imp of target.imports) {
      const resolved = resolveImportPath(imp, target.relativePath, allRelPathsSet);
      if (resolved) {
        dependencyBoosts.add(resolved);
      }
    }
  }

  for (const file of scoredFiles) {
    if (dependencyBoosts.has(file.relativePath)) {
      file.score += 75;
      file.isDirectDependency = true;
    }
  }

  // Re-sort after dependency boost
  scoredFiles.sort((a, b) => b.score - a.score);

  const hasSpecificQuery = keywords.length > 0 || normalizedTargets.length > 0;

  return scoredFiles.map((file, index) => {
    let mode = 'full';

    if (hasSpecificQuery) {
      if (file.score >= 100 || (index === 0 && file.score > 0)) {
        mode = 'full';
      } else if (file.score > 0 || file.isDirectDependency) {
        mode = 'skeleton';
      } else {
        mode = 'omit';
      }
    } else {
      if (index < 3) {
        mode = 'full';
      } else {
        mode = 'skeleton';
      }
    }

    return {
      ...file,
      mode
    };
  });
}
