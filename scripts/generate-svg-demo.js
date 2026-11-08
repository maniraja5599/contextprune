import fs from 'node:fs';
import path from 'node:path';

/**
 * Generates a crisp, animated vector SVG terminal hero
 * Embeddable directly into GitHub READMEs and social previews
 */

function generateSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 480" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&amp;display=swap');
      .term-bg { fill: #0d1117; rx: 12px; }
      .header-bg { fill: #161b22; }
      .text { font-family: 'JetBrains Mono', monospace, -apple-system, sans-serif; font-size: 13.5px; }
      .dim { fill: #8b949e; }
      .cyan { fill: #58a6ff; font-weight: 600; }
      .green { fill: #3fb950; font-weight: 600; }
      .yellow { fill: #d29922; }
      .magenta { fill: #bc8cff; }
      .white { fill: #c9d1d9; }
      .bold { font-weight: 700; }
      .cursor {
        animation: blink 0.8s infinite;
      }
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      .fade-in-1 { animation: fadeIn 0.4s ease forwards; animation-delay: 0.8s; opacity: 0; }
      .fade-in-2 { animation: fadeIn 0.4s ease forwards; animation-delay: 1.4s; opacity: 0; }
      .fade-in-3 { animation: fadeIn 0.4s ease forwards; animation-delay: 1.9s; opacity: 0; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    </style>
  </defs>

  <!-- Window Container -->
  <rect width="850" height="480" class="term-bg" stroke="#30363d" stroke-width="1.5"/>

  <!-- Window Header -->
  <path d="M 0 12 C 0 5.37 5.37 0 12 0 L 838 0 C 844.63 0 850 5.37 850 12 L 850 38 L 0 38 Z" class="header-bg"/>
  <circle cx="24" cy="19" r="6" fill="#ff5f56"/>
  <circle cx="44" cy="19" r="6" fill="#ffbd2e"/>
  <circle cx="64" cy="19" r="6" fill="#27c93f"/>
  <text x="425" y="24" fill="#8b949e" font-size="12" font-family="-apple-system, sans-serif" text-anchor="middle">terminal — contextprune (zsh)</text>

  <!-- Prompt Command -->
  <g transform="translate(30, 75)" class="text">
    <text x="0" y="0" class="dim">~/projects/fintech-app <tspan class="cyan">(main)</tspan></text>
    <text x="0" y="24">
      <tspan class="green bold">➜ </tspan>
      <tspan class="white bold">npx contextprune </tspan>
      <tspan class="cyan">--task </tspan>
      <tspan class="yellow">"refactor stripe webhook" </tspan>
      <tspan class="cyan">--model </tspan>
      <tspan class="yellow">claude</tspan>
      <tspan class="green cursor"> █</tspan>
    </text>
  </g>

  <!-- Scanning Line -->
  <g transform="translate(30, 135)" class="text fade-in-1">
    <text x="0" y="0">
      <tspan class="cyan bold">⚡ ContextPrune </tspan>
      <tspan class="dim">Optimizing repository for AI prompt...</tspan>
    </text>
  </g>

  <!-- Terminal Report Box -->
  <g transform="translate(30, 160)" class="text fade-in-2">
    <!-- Box frame -->
    <rect width="650" height="230" fill="#161b22" rx="8" stroke="#388bfd" stroke-width="1.2" opacity="0.9"/>
    
    <!-- Title -->
    <text x="20" y="28" class="cyan bold">✂️  ContextPrune Optimization Report <tspan class="dim" font-weight="normal">(6ms)</tspan></text>
    <line x1="0" y1="42" x2="650" y2="42" stroke="#30363d" stroke-width="1"/>

    <!-- Row 1 -->
    <text x="20" y="68" class="white">Raw Dump Baseline Tokens</text>
    <text x="460" y="68" class="yellow bold">104,800 tokens</text>

    <!-- Row 2 -->
    <text x="20" y="94" class="white">Pruned Context Tokens</text>
    <text x="460" y="94" class="green bold">18,200 tokens</text>

    <!-- Row 3 (Highlight) -->
    <rect x="10" y="106" width="630" height="30" fill="#238636" fill-opacity="0.18" rx="4"/>
    <text x="20" y="126" class="green bold">🚀 Context Reduction Rate</text>
    <text x="460" y="126" class="green bold">82.6% SAVED</text>

    <!-- Row 4 -->
    <text x="20" y="156" class="white">Est. Cost Savings (Sonnet/GPT)</text>
    <text x="460" y="156" class="green">$0.26 / prompt</text>

    <!-- Row 5 -->
    <text x="20" y="182" class="white">AI Response Speedup Factor</text>
    <text x="460" y="182" class="cyan bold">3.4x faster TTFT</text>

    <line x1="0" y1="196" x2="650" y2="196" stroke="#30363d" stroke-width="1"/>
    
    <!-- Row 6 -->
    <text x="20" y="216" class="dim">Target LLM Profile: <tspan class="white">Claude 3.5 Sonnet</tspan> | Secrets: <tspan class="green">Shield Active</tspan></text>
  </g>

  <!-- Success Toast -->
  <g transform="translate(30, 422)" class="text fade-in-3">
    <text x="0" y="0">
      <tspan class="green bold">✔ Copied to clipboard! </tspan>
      <tspan class="white">Ready to paste into Claude, Cursor, or ChatGPT.</tspan>
    </text>
    <text x="0" y="22" class="dim font-size-11">
      💡 Tip: Use <tspan class="yellow">--model ollama</tspan> for local models or <tspan class="yellow">npx contextprune mcp</tspan> for Cursor/Windsurf.
    </text>
  </g>
</svg>`;
}

const outputPath = path.resolve('assets/demo.svg');
fs.writeFileSync(outputPath, generateSvg(), 'utf8');
console.log(`✔ Generated animated SVG hero banner at: ${outputPath}`);
