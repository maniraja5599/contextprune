#!/usr/bin/env node

import { pruneRepository } from '../src/index.js';
import { startMcpServer } from '../src/mcp.js';

// ANSI color helpers (zero external dependencies)
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

function parseArgs(args) {
  const options = {
    dir: process.cwd(),
    task: '',
    targets: [],
    model: null,
    format: null,
    diff: false,
    staged: false,
    copy: true,
    output: null,
    skeletonAll: false,
    maxTokens: null,
    noMask: false,
    json: false,
    mcp: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'mcp' || arg === '--mcp') {
      options.mcp = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--task' || arg === '-t') {
      options.task = args[++i] || '';
    } else if (arg === '--target') {
      options.targets.push(args[++i]);
    } else if (arg === '--model' || arg === '-m') {
      options.model = args[++i];
    } else if (arg === '--diff') {
      options.diff = true;
    } else if (arg === '--staged') {
      options.staged = true;
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--max-tokens' || arg === '--budget' || arg === '-b') {
      options.maxTokens = parseInt(args[++i], 10);
    } else if (arg === '--no-mask') {
      options.noMask = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--no-copy') {
      options.copy = false;
    } else if (arg === '--skeleton-all') {
      options.skeletonAll = true;
    } else if (!arg.startsWith('-') && !options.task) {
      if (arg === '.' || arg.includes('/') || arg.includes('\\')) {
        options.dir = arg;
      } else {
        options.task = arg;
      }
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${c.bold}${c.cyan}✂️  ContextPrune${c.reset} ${c.dim}v1.2.0${c.reset} - Smart AST Context Optimizer for AI Prompts

${c.bold}USAGE:${c.reset}
  npx contextprune [options] [task description]
  npx contextprune mcp   ${c.dim}# Run as native Model Context Protocol (MCP) server${c.reset}

${c.bold}OPTIONS:${c.reset}
  ${c.green}--task, -t <desc>${c.reset}       Describe your task (e.g. "fix auth token expiry")
  ${c.green}--model, -m <name>${c.reset}     Optimize for model: ${c.yellow}claude${c.reset}, ${c.yellow}gpt-4o${c.reset}, ${c.yellow}ollama${c.reset}, ${c.yellow}deepseek${c.reset}
  ${c.green}--max-tokens, -b <num>${c.reset}  Enforce hard token budget (auto-prunes lower priority files)
  ${c.green}--diff, --staged${c.reset}       Auto-target files modified or staged in git
  ${c.green}--target <path>${c.reset}         Specific file(s) to include with 100% full implementation
  ${c.green}--format, -f <type>${c.reset}     Output format: ${c.yellow}xml${c.reset} (default for Claude) or ${c.yellow}markdown${c.reset}
  ${c.green}--output, -o <file>${c.reset}     Save output to a specific file (e.g. prompt.xml)
  ${c.green}--skeleton-all${c.reset}         Convert all files into type & interface skeletons
  ${c.green}--no-mask${c.reset}              Disable automated secret & API key redaction
  ${c.green}--json${c.reset}                 Output optimization stats in JSON (for agent/IDE plugins)
  ${c.green}--no-copy${c.reset}              Do not automatically copy prompt to clipboard
  ${c.green}--help, -h${c.reset}              Display this help message

${c.bold}EXAMPLES:${c.reset}
  ${c.dim}# 1. Optimize repo for Claude 3.5 Sonnet and copy to clipboard:${c.reset}
  npx contextprune --task "refactor stripe webhook" --model claude

  ${c.dim}# 2. Fit strictly into an 8k local context window (Ollama/Llama 3):${c.reset}
  npx contextprune --task "add rate limiting" --model ollama

  ${c.dim}# 3. Prune around git staged changes for PR code-review:${c.reset}
  npx contextprune --staged --task "review my pull request changes"

  ${c.dim}# 4. Run as MCP Server for Claude Desktop / Cursor:${c.reset}
  npx contextprune mcp
`);
}

async function run() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.mcp) {
    startMcpServer();
    return;
  }

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  const startTime = Date.now();
  if (!options.json) {
    console.log(`\n${c.bold}${c.cyan}⚡ ContextPrune${c.reset} ${c.dim}Optimizing repository for AI prompt...${c.reset}`);
  }

  try {
    const result = await pruneRepository(options.dir, {
      ...options,
      maskSecrets: !options.noMask
    });
    const elapsed = Date.now() - startTime;
    const { savings } = result;

    if (options.json) {
      console.log(JSON.stringify({
        elapsedMs: elapsed,
        savings,
        model: result.modelUsed,
        secretsMasked: result.secretsMasked,
        files: {
          included: result.filesIncluded,
          skeletonized: result.filesSkeletonized,
          omitted: result.filesOmitted,
          total: result.totalFiles
        },
        copied: result.copied,
        outputFile: result.outputFile
      }, null, 2));
      process.exit(0);
    }

    console.log(`
${c.cyan}┌─────────────────────────────────────────────────────────────┐${c.reset}
${c.cyan}│${c.reset} ${c.bold}✂️  ContextPrune Optimization Report${c.reset} ${c.dim}(${elapsed}ms)${c.reset}              ${c.cyan}│${c.reset}
${c.cyan}├───────────────────────────────┬─────────────────────────────┤${c.reset}
${c.cyan}│${c.reset} Raw Dump Baseline Tokens       │ ${c.yellow}${savings.originalTokens.toLocaleString().padEnd(20)}${c.reset}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Pruned Context Tokens         │ ${c.green}${savings.prunedTokens.toLocaleString().padEnd(20)}${c.reset}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} ${c.bold}🚀 Context Reduction Rate${c.reset}      │ ${c.bold}${c.green}${savings.percentSaved}% SAVED${c.reset}               ${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Est. Cost Savings              │ ${c.green}$${savings.costSaved} / query${c.reset}          ${c.cyan}│${c.reset}
${c.cyan}│${c.reset} AI Response Speedup Factor     │ ${c.cyan}${savings.speedup}${c.reset}                        ${c.cyan}│${c.reset}
${c.cyan}├───────────────────────────────┼─────────────────────────────┤${c.reset}
${c.cyan}│${c.reset} Target LLM Profile             │ ${c.bold}${String(result.modelUsed || 'Standard (Claude XML)').padEnd(28)}${c.reset}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Security & Secret Redaction    │ ${c.green}${String(result.secretsMasked ? `${result.secretsMasked} masked` : 'Active (Shield on)').padEnd(28)}${c.reset}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Full Implementation Files      │ ${String(result.filesIncluded - result.filesSkeletonized).padEnd(28)}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Interface Skeleton Stubs       │ ${String(result.filesSkeletonized).padEnd(28)}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Omitted (In Tree Map Only)     │ ${String(result.filesOmitted).padEnd(28)}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Total Files Analyzed           │ ${String(result.totalFiles).padEnd(28)}${c.cyan}│${c.reset}
${options.maxTokens ? `${c.cyan}│${c.reset} Strict Budget Constraint       │ ${c.magenta}≤ ${options.maxTokens.toLocaleString()} tokens${c.reset}               ${c.cyan}│${c.reset}\n` : ''}${c.cyan}└───────────────────────────────┴─────────────────────────────┘${c.reset}
`);

    if (result.copied) {
      console.log(`${c.green}✔ Copied to clipboard!${c.reset} Ready to paste into Claude, Cursor, or ChatGPT.`);
    }

    if (result.outputFile) {
      console.log(`${c.blue}✔ Saved output to:${c.reset} ${result.outputFile}`);
    }

    console.log(`${c.dim}💡 Tip: Use ${c.reset}${c.yellow}--model ollama${c.reset}${c.dim} for local models or ${c.reset}${c.yellow}npx contextprune mcp${c.reset}${c.dim} for Claude/Cursor.${c.reset}\n`);

  } catch (err) {
    console.error(`\n${c.bold}${c.red}Error:${c.reset} ${err.message}\n`);
    process.exit(1);
  }
}

run();
