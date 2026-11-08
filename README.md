<div align="center">

# ✂️ ContextPrune

**Stop feeding your AI entire codebases. Prune them.**

*Smart AST-driven context optimizer for LLMs. Cuts 50%–85% of tokens while preserving 100% of architectural interfaces and type contracts.*

[![Tests](https://img.shields.io/badge/tests-13%20passing-brightgreen.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-blue.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)]()

```bash
npx contextprune --task "fix stripe webhook handler"
```

<br/>

<p align="center">
  <img src="assets/demo.svg" alt="ContextPrune Animated Demo" width="850">
</p>

</div>

---

## ⚡ The Problem: The "Context Bloat" Crisis

Tools like Repomix or Gitingest revolutionized feeding code into Claude, ChatGPT, and Cursor. But they have a massive flaw: **they dump everything**.

When you pack a 60-file repository into a single prompt:
- 💸 **Token Bills Explode**: A 120,000 token prompt costs **$0.36 to $1.80 per query** on Claude 3.5 Sonnet or GPT-4o.
- 📉 **Attention Degradation ("Lost in the Middle")**: LLMs lose reasoning sharpness when drowned in 2,000 lines of irrelevant utility functions.
- 🐢 **High Latency**: Time-to-First-Token (TTFT) crawls while the model digests 500kb of boilerplate.

### 💡 The Solution: `ContextPrune`

Your AI doesn't need to see the internal implementation of your database connection pool just to fix a payment webhook. **It only needs the type signatures, method contracts, and exported interfaces.**

`ContextPrune` analyzes your task, constructs a symbol dependency graph, and applies **AST Skeletonization**:

```
┌────────────────────────────────────────────────────────┐
│                   YOUR REPOSITORY                      │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
     [Target Files]             [Dependency Files]
    (100% Full Code)         (Interface Skeletons Only)
  e.g. stripe-webhook.ts       e.g. database.ts, logger.ts
             │                           │
             └─────────────┬─────────────┘
                           ▼
          [Clean, High-Density AI Prompt]
             ✨ 50% – 85% Token Reduction
```

---

## 🚀 Quickstart (Zero Install)

Run directly with `npx` in any project folder:

```bash
# 1. Optimize repo for a specific task and auto-copy prompt to clipboard
npx contextprune --task "fix auth refresh token expiry"

# 2. Fit strictly into an 8k local context window (Ollama/Llama 3)
npx contextprune --task "add rate limiting" --max-tokens 7500

# 3. Focus on a specific file with surrounding dependency contracts
npx contextprune --target src/server.ts --output prompt.xml

# 4. Convert all files into pure type and interface skeletons
npx contextprune --skeleton-all

# 5. Output JSON for IDE plugins and autonomous agent pipelines
npx contextprune --task "fix bug" --json
```

---

## 📊 Terminal Benchmark

```text
⚡ ContextPrune Optimizing repository for AI prompt...

┌─────────────────────────────────────────────────────────────┐
│ ✂️  ContextPrune Optimization Report (8ms)                   │
├───────────────────────────────┬─────────────────────────────┤
│ Raw Dump Baseline Tokens       │ 104,800                     │
│ Pruned Context Tokens         │ 18,200                      │
│ 🚀 Context Reduction Rate      │ 82.6% SAVED                 │
│ Est. Cost Savings (Sonnet/GPT) │ $0.26 / query               │
│ AI Response Speedup Factor     │ 3.4x                        │
├───────────────────────────────┼─────────────────────────────┤
│ Full Implementation Files      │ 3                           │
│ Interface Skeleton Stubs       │ 12                          │
│ Omitted (In Tree Map Only)     │ 45                          │
│ Total Files Analyzed           │ 60                          │
└───────────────────────────────┴─────────────────────────────┘

✔ Copied to clipboard! Ready to paste into Claude, Cursor, or ChatGPT.
```

---

## 🔍 How AST Skeletonization Works

When `ContextPrune` marks a file as secondary or architectural context, it strips inner implementation bodies while preserving 100% of what the AI needs to write correct code:

### Before (Raw File — 180 tokens):
```typescript
export class DatabaseClient {
  private pool: Pool;
  constructor(url: string) {
    this.pool = new Pool({ connectionString: url, max: 20, idleTimeoutMillis: 30000 });
    this.pool.on('error', (err) => console.error('Unexpected pool error', err));
  }
  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const res = await client.query(sql, params);
      return res.rows;
    } finally {
      client.release();
    }
  }
}
```

### After `ContextPrune` (Skeleton Stub — 32 tokens, 82% saved!):
```typescript
export class DatabaseClient {
  constructor(url: string) {
  /* ... omitted 4 lines of implementation ... */
}
  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  /* ... omitted 7 lines of implementation ... */
}
}
```

The LLM knows **the exact methods, argument types, and return signatures**, without burning tokens on your connection pool logic!

---

## 🎯 Features

- 🏎️ **Instant Execution (<15ms)**: Written in pure modern ESM with **0 external npm dependencies**. No bloated `node_modules`.
- 🎛️ **Dynamic Token Budget Enforcer**: Pass `--max-tokens 8000` to guarantee your prompt never overflows local Ollama or small context windows.
- 🔗 **Transitive Dependency Graph**: When a target file is identified, its direct `import` / `require` dependencies are automatically boosted to contract skeletons.
- 🔤 **CamelCase & SnakeCase Symbol Search**: Matches compound identifiers (e.g. `TokenBucket`, `payment_intent`) accurately.
- 📋 **Auto-Clipboard**: Instantly copies the ready-to-paste prompt to your clipboard on macOS (`pbcopy`), Linux (`xclip`/`wl-copy`), and Windows (`clip`).
- 🤖 **Claude-Optimized XML & Markdown**: Supports native `<contextprune_repository>` XML schema (Anthropic standard) and clean GitHub Markdown.
- 🌲 **ASCII Architectural Tree**: Always includes a birds-eye directory tree tag so the LLM understands full project structure.
- 🛡️ **Git-Aware**: Automatically respects `.gitignore` and default developer ignore rules (`node_modules`, lockfiles, dist, logs, binaries).
- 🌐 **Multi-Language Support**:
  - TypeScript & React (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`)
  - Python (`.py`) — classes, dataclasses, async defs, docstrings
  - Go (`.go`) — structs, interfaces, func signatures
  - Rust (`.rs`) — structs, traits, enums, impl blocks

---

## 🛠️ CLI Reference

| Flag | Short | Description | Default |
|---|---|---|---|
| `--task <string>` | `-t` | Natural language description of your task | `""` |
| `--target <path>` | | Path to file(s) that must have 100% full content | `[]` |
| `--max-tokens <num>` | `-b` | Hard token budget limit (auto-trims lower-priority files) | `null` |
| `--format <type>` | `-f` | Output format: `xml` (Claude) or `markdown` | `xml` |
| `--output <file>` | `-o` | Save output prompt to file | `stdout` |
| `--skeleton-all` | | Skeletonize all files into interface contracts | `false` |
| `--json` | | Output JSON stats (for agent & IDE integration) | `false` |
| `--no-copy` | | Disable auto-copying to system clipboard | `false` |
| `--help` | `-h` | Show CLI help screen | |

---

## 💻 Programmatic Node.js API

Use `ContextPrune` inside your own agent, VS Code extension, or CI pipeline:

```javascript
import { pruneRepository } from 'contextprune';

const result = await pruneRepository('./my-project', {
  task: 'fix stripe webhook',
  format: 'xml',
  maxTokens: 8000,
  copy: true
});

console.log(`Saved ${result.savings.percentSaved}% tokens!`);
console.log(result.output);
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Check out [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## 📜 License

MIT © [Mani Raja](LICENSE)
