import { generateDirectoryTree } from './tree.js';

/**
 * Formats pruned repository content into Claude-optimized XML prompt structure
 */
export function formatAsXML(processedFiles, allFiles, metadata = {}) {
  const tree = generateDirectoryTree(allFiles);

  const fileNodes = processedFiles
    .filter(f => f.mode !== 'omit')
    .map(f => {
      const modeAttr = f.mode === 'skeleton' ? ' mode="skeleton_interface_only"' : ' mode="full"';
      return `  <file path="${f.relativePath}"${modeAttr}>\n${f.processedContent}\n  </file>`;
    })
    .join('\n\n');

  return `<!-- Optimized with ContextPrune (https://github.com/maniraja5599/contextprune) - AST Skeletonizer & Token Saver -->
<contextprune_repository>
  <metadata>
    <optimizer>ContextPrune (https://github.com/maniraja5599/contextprune)</optimizer>
    <task>${metadata.task || 'General codebase inspection'}</task>
    <target_files>${(metadata.targets || []).join(', ') || 'Auto-detected'}</target_files>
    <files_included>${processedFiles.filter(f => f.mode !== 'omit').length}</files_included>
    <total_repo_files>${allFiles.length}</total_repo_files>
  </metadata>

  <directory_structure>
${tree}
  </directory_structure>

  <repository_files>
${fileNodes}
  </repository_files>
</contextprune_repository>`;
}
