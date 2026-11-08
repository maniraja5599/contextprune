# 🚀 ContextPrune: Viral Launch Playbook

This document contains ready-to-publish launch copy, hooks, and distribution strategies to take **ContextPrune** viral across Hacker News, X (Twitter), Reddit, and Developer Discords.

---

## 1. Show HN (Hacker News) Launch

**Title:**
> Show HN: ContextPrune – Stop feeding your AI entire codebases, prune them (Zero dependencies)

**Post Body:**
```text
Hey HN,

Like many of you, I've been using tools like Repomix to pack codebases into Claude 3.5 Sonnet and Cursor. But on large repos, dumping 60+ full files was burning 120k+ tokens per prompt ($0.50-$1.50 per query) and causing serious "lost in the middle" attention degradation.

I realized something obvious: your LLM doesn't need 500 lines of connection pool logic in database.ts just to fix a Stripe webhook. It only needs the function contracts, type definitions, and signatures.

So I built ContextPrune (https://github.com/maniraja5599/contextprune).

What it does:
1. AST Skeletonization: Keeps 100% of class/function signatures, interfaces, and docstrings, but strips internal implementation bodies with a comment placeholder.
2. Task-Aware Pruning: Given `--task "fix payment webhook"`, it includes the target file at 100% full detail, skeletonizes relevant dependencies, and collapses unrelated files into an architectural tree map.
3. Zero dependencies: Pure modern Node ESM. Starts in <15ms. Auto-copies to system clipboard on Mac/Linux/Windows.

Run it with zero installation:
$ npx contextprune --task "your task description"

Benchmarks:
- 50-file TypeScript repo: 104k tokens -> 18k tokens (82% reduction)
- Saves ~$0.25+ on every single Claude 3.5 query

Code is MIT licensed: https://github.com/maniraja5599/contextprune

Would love to hear your thoughts and feedback!
```

---

## 2. X (Twitter) Viral Thread

**Tweet 1 (Hook with Video/GIF Demo):**
> Stop feeding your AI the whole repository.
>
> Dumping 60 full files into Claude or Cursor burns 100k+ tokens ($$$) and causes hallucinations.
>
> Your LLM only needs the type signatures, not your internal connection pool logic.
>
> Introducing ContextPrune ✂️:
> 80% token reduction via AST skeletonization in <15ms.
>
> 🧵👇 [Attach 10s terminal GIF]

**Tweet 2 (Before/After Proof):**
> Here’s how it works:
>
> ❌ Repomix: Dumps 200 lines of `database.ts` (1,200 tokens)
> ✅ ContextPrune: Keeps method signatures and returns types, strips the rest (85 tokens)
>
> The LLM still knows 100% of the type contracts, but runs 3x faster with zero context rot.

**Tweet 3 (Zero Install & Open Source):**
> - 0 npm dependencies
> - Runs via `npx contextprune`
> - Auto-copies directly to your clipboard
> - Supports TS/JS, Python, Go
>
> Star the repo on GitHub:
> 🔗 https://github.com/maniraja5599/contextprune

---

## 3. Reddit Launch Plan

### Subreddits to Post:
1. **r/ClaudeAI** — *"I built a tool to stop burning millions of tokens when prompting Claude with codebases"*
2. **r/LocalLLaMA** — *"ContextPrune: AST-based token minifier for small context window local models (8k/32k)"* (Super high resonance here because local models have small context limits!)
3. **r/programming** — *"AST Skeletonization: How to cut 80% of prompt tokens without losing type safety"*
4. **r/Cursor** — *"Using ContextPrune to feed lean context into Composer / Cursor"*

---

## 4. Key Metrics to Track
- GitHub Stars
- Forks & PRs
- `npx` weekly downloads
- Community issues for adding new languages (Rust, Kotlin, C#)
