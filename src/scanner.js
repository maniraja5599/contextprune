import fs from 'node:fs';
import path from 'node:path';

// Standard ignore patterns
const DEFAULT_IGNORES = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  'target',
  '.next',
  '.nuxt',
  '.turbo',
  'coverage',
  '.DS_Store',
  'Thumbs.db',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'venv',
  'env',
  '.env',
  '.env.local',
  '.env.*',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'Cargo.lock',
  'poetry.lock',
  'Gemfile.lock'
];

// Binary and non-code asset extensions to ignore
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.mp4', '.mov', '.avi', '.mp3', '.wav',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.woff', '.woff2', '.ttf', '.eot',
  '.exe', '.dll', '.so', '.dylib', '.class', '.pyc', '.o',
  '.wasm', '.bin', '.db', '.sqlite', '.sqlite3'
]);

/**
 * Checks if a path matches simple glob-like ignore patterns
 */
function shouldIgnore(relPath, customIgnores = []) {
  const parts = relPath.split(path.sep);
  
  for (const ignore of [...DEFAULT_IGNORES, ...customIgnores]) {
    const cleanIgnore = ignore.trim().replace(/^\/+|\/+$/g, '');
    if (!cleanIgnore || cleanIgnore.startsWith('#')) continue;
    
    // Check direct part match or path prefix
    if (parts.includes(cleanIgnore) || relPath === cleanIgnore || relPath.startsWith(cleanIgnore + path.sep)) {
      return true;
    }
  }

  const ext = path.extname(relPath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) {
    return true;
  }

  return false;
}

/**
 * Parses .gitignore file if it exists in the root
 */
function loadGitignore(rootDir) {
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      return content.split('\n').map(line => line.trim()).filter(Boolean);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Recursively scans directory and collects all valid code files
 */
export async function scanRepository(rootDir, options = {}) {
  const customIgnores = [
    ...loadGitignore(rootDir),
    ...(options.exclude || [])
  ];

  const results = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(rootDir, fullPath);

      if (shouldIgnore(relPath, customIgnores)) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = fs.statSync(fullPath);
          // Skip files larger than 1MB by default to prevent token blowup
          if (stats.size > (options.maxFileSize || 1024 * 1024)) {
            continue;
          }

          results.push({
            fullPath,
            relativePath: relPath,
            size: stats.size,
            ext: path.extname(entry.name).toLowerCase()
          });
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  walk(rootDir);
  return results;
}
