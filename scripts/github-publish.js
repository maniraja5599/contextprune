#!/usr/bin/env node

/**
 * 1-Command Atomic GitHub Tree & Commit Publisher
 * Uses the official GitHub Git Database API to push all project files
 * in a single atomic commit without requiring local git installation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { scanRepository } from '../src/scanner.js';

const OWNER = 'maniraja5599';
const REPO_NAME = 'contextprune';
const COMMIT_MSG = '🚀 feat: initial release of ContextPrune v1.2.0 - Smart AST Context Optimizer for AI Prompts';

async function ghRequest(endpoint, token, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ContextPrune-Publisher',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = body.message || `GitHub API error ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function publish() {
  const args = process.argv.slice(2);
  const token = args[0] || process.env.GITHUB_TOKEN;
  const commitMsg = args[1] || '✨ feat: add viral prompt watermark loop and smithery.yaml MCP registry config';

  if (!token) {
    console.error('Error: GitHub token required.');
    process.exit(1);
  }

  console.log('\n\x1b[36m⚡ Connecting to GitHub...\x1b[0m');
  const user = await ghRequest('/user', token);
  console.log(`\x1b[32m✔ Authenticated as:\x1b[0m @${user.login}`);

  // 1. Get latest commit on main branch
  const refData = await ghRequest(`/repos/${OWNER}/${REPO_NAME}/git/ref/heads/main`, token);
  const latestCommitSha = refData.object.sha;
  console.log(`\x1b[32m✔ Base commit on main:\x1b[0m ${latestCommitSha.substring(0, 7)}`);

  // 2. Scan all files
  console.log('\x1b[36m⚡ Scanning project files...\x1b[0m');
  const allFiles = await scanRepository(process.cwd());
  // Exclude .github workflow files as standard repo tokens lack workflow scope
  const files = allFiles.filter(f => !f.relativePath.startsWith('.github/'));
  console.log(`\x1b[32m✔ Packing ${files.length} project files...\x1b[0m`);

  // 3. Build tree entries with content directly
  const treeEntries = files.map(file => {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    const mode = file.relativePath.startsWith('bin/') ? '100755' : '100644';
    return {
      path: file.relativePath,
      mode,
      type: 'blob',
      content
    };
  });

  // 4. Create new tree
  console.log('\x1b[36m⚡ Creating Git Tree...\x1b[0m');
  const newTree = await ghRequest(`/repos/${OWNER}/${REPO_NAME}/git/trees`, token, {
    method: 'POST',
    body: JSON.stringify({
      tree: treeEntries
    })
  });
  console.log(`\x1b[32m✔ Created Tree:\x1b[0m ${newTree.sha.substring(0, 7)}`);

  // 5. Create commit
  console.log('\x1b[36m⚡ Creating release commit...\x1b[0m');
  const newCommit = await ghRequest(`/repos/${OWNER}/${REPO_NAME}/git/commits`, token, {
    method: 'POST',
    body: JSON.stringify({
      message: commitMsg,
      tree: newTree.sha,
      parents: [latestCommitSha]
    })
  });
  console.log(`\x1b[32m✔ Created Commit:\x1b[0m ${newCommit.sha.substring(0, 7)}`);

  // 6. Update branch head
  console.log('\x1b[36m⚡ Updating branch "main"...\x1b[0m');
  await ghRequest(`/repos/${OWNER}/${REPO_NAME}/git/refs/heads/main`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: newCommit.sha,
      force: true
    })
  });

  console.log(`
\x1b[1m\x1b[32m🎉 SUCCESS! All Files Successfully Published to GitHub!\x1b[0m
🔗 \x1b[1m\x1b[36mhttps://github.com/${OWNER}/${REPO_NAME}\x1b[0m

All ${files.length} files, assets, vector SVG animation, tests, and docs are now LIVE on GitHub!
`);
}

publish().catch(err => {
  console.error(`\n\x1b[31mError:\x1b[0m ${err.message}\n`);
  process.exit(1);
});
