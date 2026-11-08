import { execSync } from 'node:child_process';

/**
 * Detects modified or staged files using git
 */
export function getGitChangedFiles(dir, stagedOnly = false) {
  try {
    const gitCommand = stagedOnly
      ? 'git diff --name-only --cached'
      : 'git status --porcelain';

    const output = execSync(gitCommand, {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    if (!output) return [];

    const changedFiles = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      if (stagedOnly) {
        changedFiles.push(line.trim());
      } else {
        // e.g. " M src/index.ts" or "?? src/new.ts"
        const filePath = line.substring(3).trim();
        // Handle renamed files "old -> new"
        const actualPath = filePath.includes('->')
          ? filePath.split('->')[1].trim()
          : filePath;
        changedFiles.push(actualPath);
      }
    }

    return changedFiles;
  } catch {
    // Return empty array if not a git repo or git is unavailable
    return [];
  }
}
