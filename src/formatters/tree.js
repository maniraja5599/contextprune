/**
 * Generates a clean ASCII file tree representation of the repository
 */
export function generateDirectoryTree(files) {
  const tree = {};

  for (const file of files) {
    const parts = file.relativePath.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = file.mode ? `[${file.mode.toUpperCase()}]` : null;
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }

  const lines = [];

  function printBranch(node, prefix = '') {
    const keys = Object.keys(node).sort();
    keys.forEach((key, index) => {
      const isLast = index === keys.length - 1;
      const marker = isLast ? '└── ' : '├── ';
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');

      if (node[key] && typeof node[key] === 'object') {
        lines.push(`${prefix}${marker}${key}/`);
        printBranch(node[key], nextPrefix);
      } else {
        const tag = node[key] ? ` ${node[key]}` : '';
        lines.push(`${prefix}${marker}${key}${tag}`);
      }
    });
  }

  printBranch(tree);
  return lines.join('\n');
}
