# Contributing to ContextPrune

Thank you for your interest in contributing to **ContextPrune**!

We want to make contributing as clean, simple, and transparent as possible.

## Principles

1. **Zero External Dependencies**: Core engine must remain dependency-free (`node_modules` count = 0) to ensure lightning-fast startup and safe `npx` execution.
2. **Deterministic & Fast**: Code parsing and AST skeletonization must run in milliseconds.
3. **100% Test Coverage**: Every parser feature or language rule must have an accompanying test in `test/run-tests.js`.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/maniraja5599/contextprune.git
cd contextprune

# Run the test suite (Zero install needed!)
node test/run-tests.js

# Test CLI locally
node bin/contextprune.js --help
```

## Adding a New Language Parser

Language skeletonizers live in `src/ast-skeletonizer.js`.
To add support for a new language (e.g. Ruby, Java, C++):
1. Create a `skeletonize<Lang>(code)` function that preserves class/function/type signatures and replaces inner method bodies with a comment stub.
2. Add the file extension mapping in `skeletonizeFile()`.
3. Add a unit test in `test/run-tests.js`.

## Submitting a Pull Request

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add ruby skeletonizer'`).
4. Run tests: `node test/run-tests.js`.
5. Push to your branch and open a Pull Request!
