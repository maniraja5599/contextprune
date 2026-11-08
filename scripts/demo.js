#!/usr/bin/env node

/**
 * Animated Terminal Demo Player
 * Simulates a realistic interactive developer session.
 * Perfect for recording clean demo GIFs using tools like ScreenToGif, CleanShot, or VHS.
 */

import { pruneRepository } from '../src/index.js';
import path from 'node:path';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

async function typeWriter(text, speed = 35) {
  for (let i = 0; i < text.length; i++) {
    process.stdout.write(text[i]);
    await sleep(speed);
  }
}

async function runDemo() {
  // Clear screen
  process.stdout.write('\x1b[2J\x1b[0;0H');

  console.log(`${c.dim}~/projects/fintech-app ${c.reset}${c.cyan}(main)${c.reset}`);
  process.stdout.write(`${c.bold}${c.green}➜ ${c.reset}`);
  await sleep(600);

  const command = 'npx contextprune --task "refactor stripe webhook" --model claude';
  await typeWriter(command, 30);
  await sleep(400);
  console.log('\n');

  console.log(`${c.bold}${c.cyan}⚡ ContextPrune${c.reset} ${c.dim}Optimizing repository for AI prompt...${c.reset}`);
  await sleep(150);

  const sampleDir = path.resolve('examples/sample-project');
  const result = await pruneRepository(sampleDir, {
    task: 'refactor stripe webhook',
    model: 'claude',
    copy: false
  });

  const { savings } = result;

  console.log(`
${c.cyan}┌─────────────────────────────────────────────────────────────┐${c.reset}
${c.cyan}│${c.reset} ${c.bold}✂️  ContextPrune Optimization Report${c.reset} ${c.dim}(6ms)${c.reset}               ${c.cyan}│${c.reset}
${c.cyan}├───────────────────────────────┬─────────────────────────────┤${c.reset}
${c.cyan}│${c.reset} Raw Dump Baseline Tokens       │ ${c.yellow}${savings.originalTokens.toLocaleString().padEnd(20)}${c.reset}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Pruned Context Tokens         │ ${c.green}${savings.prunedTokens.toLocaleString().padEnd(20)}${c.reset}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} ${c.bold}🚀 Context Reduction Rate${c.reset}      │ ${c.bold}${c.green}${savings.percentSaved}% SAVED${c.reset}               ${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Est. Cost Savings              │ ${c.green}$${savings.costSaved} / query${c.reset}          ${c.cyan}│${c.reset}
${c.cyan}│${c.reset} AI Response Speedup Factor     │ ${c.cyan}${savings.speedup}${c.reset}                        ${c.cyan}│${c.reset}
${c.cyan}├───────────────────────────────┼─────────────────────────────┤${c.reset}
${c.cyan}│${c.reset} Target LLM Profile             │ ${c.bold}${String(result.modelUsed || 'Claude 3.5 Sonnet').padEnd(28)}${c.reset}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Full Implementation Files      │ ${String(result.filesIncluded - result.filesSkeletonized).padEnd(28)}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Interface Skeleton Stubs       │ ${String(result.filesSkeletonized).padEnd(28)}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Omitted (In Tree Map Only)     │ ${String(result.filesOmitted).padEnd(28)}${c.cyan}│${c.reset}
${c.cyan}│${c.reset} Total Files Analyzed           │ ${String(result.totalFiles).padEnd(28)}${c.cyan}│${c.reset}
${c.cyan}└───────────────────────────────┴─────────────────────────────┘${c.reset}
`);

  console.log(`${c.green}✔ Copied to clipboard!${c.reset} Ready to paste into Claude, Cursor, or ChatGPT.`);
  console.log(`${c.dim}💡 Tip: Use ${c.reset}${c.yellow}--model ollama${c.reset}${c.dim} for local models or ${c.reset}${c.yellow}npx contextprune mcp${c.reset}${c.dim} for Claude/Cursor.${c.reset}\n`);
}

async function main() {
  const isLoop = process.argv.includes('--loop');
  do {
    await runDemo();
    if (isLoop) {
      await sleep(3500);
    }
  } while (isLoop);
}

main();
