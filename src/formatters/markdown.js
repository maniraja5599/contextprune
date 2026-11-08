import { generateDirectoryTree } from './tree.js';

function getLanguage(ext) {
  const map = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'jsx',
    '.tsx': 'tsx',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.sql': 'sql',
    '.sh': 'bash'
  };
  return map[ext] || '';
}

/**
 * Formats pruned repository content into clean GitHub-flavored Markdown
 */
export function formatAsMarkdown(processedFiles, allFiles, metadata = {}) {
  const tree = generateDirectoryTree(allFiles);

  const fileSections = processedFiles
    .filter(f => f.mode !== 'omit')
    .map(f => {
      const lang = getLanguage(f.ext);
      const modeBadge = f.mode === 'skeleton' ? ' *(Interface Skeleton)*' : ' *(Full)*';
      return `### File: \`${f.relativePath}\`${modeBadge}\n\n\`\`\`${lang}\n${f.processedContent}\n\`\`\``;
    })
    .join('\n\n---\n\n');

  return `# Repository Context (Optimized with ContextPrune)

> **Task**: ${metadata.task || 'General Analysis'}  
> **Included Files**: ${processedFiles.filter(f => f.mode !== 'omit').length} / ${allFiles.length}

## Directory Map
\`\`\`text
${tree}
\`\`\`

## Source Files

${fileSections}
`;
}
