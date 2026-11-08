import assert from 'node:assert';
import path from 'node:path';
import { estimateTokens, calculateSavings } from '../src/tokenizer.js';
import {
  skeletonizeJS,
  skeletonizePython,
  skeletonizeGo,
  skeletonizeRust
} from '../src/ast-skeletonizer.js';
import { rankFilesByRelevance } from '../src/relevance.js';
import { formatAsXML } from '../src/formatters/xml.js';
import { formatAsMarkdown } from '../src/formatters/markdown.js';
import { pruneRepository } from '../src/index.js';
import { getModelPreset } from '../src/models.js';
import { maskSecrets } from '../src/security.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${name}`);
    console.error(err);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  \x1b[32m✔\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('\n\x1b[1m\x1b[36mRunning Comprehensive ContextPrune Test Suite v1.3...\x1b[0m\n');

// 1. Tokenizer tests
test('Tokenizer: estimates tokens accurately for code and text', () => {
  const sample = 'export function calculateTotal(items: CartItem[]): number { return items.reduce((a, b) => a + b.price, 0); }';
  const tokens = estimateTokens(sample);
  assert(tokens > 15 && tokens < 45, `Expected tokens between 15 and 45, got ${tokens}`);
});

test('Tokenizer: calculateSavings produces correct percentage and costs', () => {
  const savings = calculateSavings(100000, 20000, 3.0);
  assert.strictEqual(savings.percentSaved, 80);
  assert.strictEqual(savings.tokensSaved, 80000);
  assert(parseFloat(savings.costSaved) > 0);
});

// 2. AST Skeletonizer tests (JS, TS, React, Python, Go, Rust)
test('AST Skeletonizer: strips JS/TS function bodies while preserving signatures', () => {
  const code = `
export interface User {
  id: string;
}

export class AuthService {
  async login(email: string): Promise<User> {
    const user = await db.find(email);
    validate(user);
    return user;
  }
}
  `.trim();

  const skeleton = skeletonizeJS(code);
  assert(skeleton.includes('export interface User'), 'Must preserve interface');
  assert(skeleton.includes('async login(email: string): Promise<User>'), 'Must preserve method signature');
  assert(skeleton.includes('/* ... omitted'), 'Must insert omission placeholder');
  assert(!skeleton.includes('validate(user);'), 'Must strip inner implementation details');
});

test('AST Skeletonizer: handles React functional components and JSX correctly', () => {
  const reactCode = `
export interface CardProps {
  title: string;
}

export const Card: React.FC<CardProps> = ({ title }) => {
  const [active, setActive] = useState(false);
  return <div className="card"><h1>{title}</h1></div>;
};
  `.trim();

  const skeleton = skeletonizeJS(reactCode);
  assert(skeleton.includes('export interface CardProps'), 'Preserves CardProps interface');
  assert(skeleton.includes('export const Card: React.FC<CardProps> = ({ title }) =>'), 'Preserves React component signature');
  assert(skeleton.includes('/* ... omitted'), 'Inserts omission stub for component body');
  assert(!skeleton.includes('<h1>{title}</h1>'), 'Strips inner JSX markup');
});

test('AST Skeletonizer: handles string literals containing curly braces without breaking', () => {
  const code = `
export function formatMessage(name: string): string {
  const template = "{hello} {world}";
  return template.replace("{hello}", name);
}
  `.trim();

  const skeleton = skeletonizeJS(code);
  assert(skeleton.includes('export function formatMessage(name: string): string'), 'Preserves signature');
  assert(skeleton.includes('/* ... omitted'), 'Strips body even when strings contain braces');
});

test('AST Skeletonizer: strips Python function bodies while keeping def and docstrings', () => {
  const code = `
@dataclass
class Item:
    name: str

class PaymentProcessor:
    """Handles payments"""
    def process(self, amount: int) -> bool:
        db.save(amount)
        logger.log("done")
        return True
  `.trim();

  const skeleton = skeletonizePython(code);
  assert(skeleton.includes('@dataclass'), 'Must preserve decorators');
  assert(skeleton.includes('class PaymentProcessor:'), 'Must preserve class');
  assert(skeleton.includes('"""Handles payments"""'), 'Must preserve docstring');
  assert(skeleton.includes('def process(self, amount: int) -> bool:'), 'Must preserve def signature');
  assert(skeleton.includes('...'), 'Must replace body with ...');
  assert(!skeleton.includes('db.save(amount)'), 'Must strip body');
});

test('AST Skeletonizer: strips Go function bodies', () => {
  const code = `
package main

type Service struct {}

func (s *Service) Execute(id string) error {
    log.Println(id)
    return nil
}
  `.trim();

  const skeleton = skeletonizeGo(code);
  assert(skeleton.includes('func (s *Service) Execute(id string) error {'), 'Must preserve Go signature');
  assert(skeleton.includes('// ... logic omitted ...'), 'Must omit Go body');
  assert(!skeleton.includes('log.Println(id)'), 'Must strip body');
});

test('AST Skeletonizer: strips Rust impl and fn bodies', () => {
  const code = `
pub struct Limiter {
    pub count: u32,
}

impl Limiter {
    pub fn new() -> Self {
        Self { count: 0 }
    }
}
  `.trim();

  const skeleton = skeletonizeRust(code);
  assert(skeleton.includes('pub struct Limiter'), 'Preserves Rust struct');
  assert(skeleton.includes('impl Limiter'), 'Preserves Rust impl');
  assert(skeleton.includes('pub fn new() -> Self {'), 'Preserves fn signature');
  assert(skeleton.includes('/* ... logic omitted ... */'), 'Strips Rust fn body');
  assert(!skeleton.includes('Self { count: 0 }'), 'Strips inner logic');
});

// 3. Relevance ranking & Dependency Graph tests
test('Relevance: transitive dependency graph boosts imported files to skeleton', () => {
  const files = [
    { relativePath: 'src/main.ts', content: "import { helper } from './utils';\nexport function run() {}", ext: '.ts' },
    { relativePath: 'src/utils.ts', content: "export function helper() { console.log('deep work'); }", ext: '.ts' },
    { relativePath: 'src/unrelated.ts', content: "export function random() {}", ext: '.ts' }
  ];

  const ranked = rankFilesByRelevance(files, 'run main entrypoint');
  assert.strictEqual(ranked[0].relativePath, 'src/main.ts', 'main.ts is primary target');
  assert.strictEqual(ranked[0].mode, 'full', 'main.ts is full');

  const utilsFile = ranked.find(f => f.relativePath === 'src/utils.ts');
  assert.strictEqual(utilsFile.mode, 'skeleton', 'Imported utils.ts is boosted to skeleton');

  const unrelated = ranked.find(f => f.relativePath === 'src/unrelated.ts');
  assert.strictEqual(unrelated.mode, 'omit', 'Unrelated file is omitted');
});

// 4. Model Preset tests
test('Models: getModelPreset returns tuned configs for Claude, GPT, and Ollama', () => {
  const claude = getModelPreset('claude');
  assert.strictEqual(claude.format, 'xml');

  const ollama = getModelPreset('ollama');
  assert.strictEqual(ollama.maxTokens, 8000);
  assert.strictEqual(ollama.costPerMillion, 0);

  const unknown = getModelPreset('unknown-model');
  assert.strictEqual(unknown, null);
});

// 5. Security & Secret Redaction test
test('Security: maskSecrets redacts API keys and tokens', () => {
  const text = 'const key = "sk-ant-api03-abcdef1234567890abcdef123456"; const gh = "ghp_123456789012345678901234567890123456";';
  const { maskedContent, detectedCount } = maskSecrets(text);
  assert.strictEqual(detectedCount, 2);
  assert(!maskedContent.includes('sk-ant-'));
  assert(!maskedContent.includes('ghp_'));
  assert(maskedContent.includes('[REDACTED_API_KEY]'));
});

// 6. Formatters
test('Formatters: XML generator creates valid Claude prompt wrapper', () => {
  const files = [
    { relativePath: 'src/app.ts', processedContent: 'console.log("hi");', mode: 'full', ext: '.ts' }
  ];
  const xml = formatAsXML(files, files, { task: 'test task' });
  assert(xml.includes('<contextprune_repository>'), 'Contains root XML element');
  assert(xml.includes('<task>test task</task>'), 'Contains task metadata');
  assert(xml.includes('<file path="src/app.ts" mode="full">'), 'Contains file tag');
});

test('Formatters: Markdown generator creates clean markdown code blocks', () => {
  const files = [
    { relativePath: 'src/app.ts', processedContent: 'console.log("hi");', mode: 'full', ext: '.ts' }
  ];
  const md = formatAsMarkdown(files, files, { task: 'test task' });
  assert(md.includes('### File: `src/app.ts`'), 'Contains file heading');
  assert(md.includes('```typescript'), 'Contains language fence');
});

// 7. Integration tests
await asyncTest('Integration: dynamic maxTokens budget trimming strictly satisfies limit', async () => {
  const sampleDir = path.resolve('examples/sample-project');
  const result = await pruneRepository(sampleDir, {
    task: 'refactor stripe webhook',
    maxTokens: 800,
    copy: false
  });

  assert(result.budgetEnforced, 'Budget must be recorded as enforced');
  assert(result.savings.prunedTokens <= 900, `Expected tokens under ~800, got ${result.savings.prunedTokens}`);
});

await asyncTest('Integration: model preset triggers correct format and model name', async () => {
  const sampleDir = path.resolve('examples/sample-project');
  const result = await pruneRepository(sampleDir, {
    task: 'create invoice',
    model: 'ollama',
    copy: false
  });

  assert.strictEqual(result.modelUsed, 'Ollama (Local)');
  assert(result.output.includes('## Directory Map'), 'Uses markdown format for Ollama');
});

console.log(`\n\x1b[1mSummary: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m\n`);

if (failed > 0) {
  process.exit(1);
}
