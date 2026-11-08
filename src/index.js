import fs from 'node:fs';
import path from 'node:path';
import { scanRepository } from './scanner.js';
import { skeletonizeFile } from './ast-skeletonizer.js';
import { rankFilesByRelevance } from './relevance.js';
import { estimateTokens, calculateSavings } from './tokenizer.js';
import { formatAsXML } from './formatters/xml.js';
import { formatAsMarkdown } from './formatters/markdown.js';
import { copyToClipboard } from './clipboard.js';
import { getModelPreset } from './models.js';
import { getGitChangedFiles } from './git.js';
import { maskSecrets } from './security.js';

/**
 * Loads project-level .contextprunerc.json if present
 */
function loadProjectConfig(rootDir) {
  const candidates = [
    path.join(rootDir, '.contextprunerc.json'),
    path.join(rootDir, '.contextprunerc')
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const raw = fs.readFileSync(c, 'utf8');
        return JSON.parse(raw);
      } catch {
        // Ignore malformed config
      }
    }
  }
  return {};
}

/**
 * Formats files according to chosen syntax
 */
function renderPrompt(format, processedFiles, allFiles, metadata) {
  return (format === 'markdown' || format === 'md')
    ? formatAsMarkdown(processedFiles, allFiles, metadata)
    : formatAsXML(processedFiles, allFiles, metadata);
}

export async function pruneRepository(targetDir = process.cwd(), cliOptions = {}) {
  const absoluteDir = path.resolve(targetDir);
  const config = loadProjectConfig(absoluteDir);

  const modelName = cliOptions.model ?? config.model ?? null;
  const modelPreset = getModelPreset(modelName);

  let gitTargets = [];
  if (cliOptions.diff || cliOptions.staged) {
    gitTargets = getGitChangedFiles(absoluteDir, Boolean(cliOptions.staged));
  }

  const combinedTargets = [
    ...(cliOptions.targets || []),
    ...gitTargets,
    ...(config.targets || [])
  ];

  const options = {
    task: cliOptions.task ?? config.task ?? '',
    targets: combinedTargets,
    model: modelPreset ? modelPreset.name : null,
    format: cliOptions.format ?? modelPreset?.format ?? config.format ?? 'xml',
    costPerMillion: modelPreset?.costPerMillion ?? 3.00,
    copy: cliOptions.copy ?? config.copy ?? true,
    output: cliOptions.output ?? config.output ?? null,
    skeletonAll: cliOptions.skeletonAll ?? config.skeletonAll ?? false,
    maxTokens: cliOptions.maxTokens ?? modelPreset?.maxTokens ?? config.maxTokens ?? null,
    maskSecrets: cliOptions.maskSecrets ?? config.maskSecrets ?? true,
    exclude: [...(config.exclude || []), ...(cliOptions.exclude || [])]
  };

  // 1. Scan filesystem
  const scanned = await scanRepository(absoluteDir, {
    exclude: options.exclude
  });

  if (scanned.length === 0) {
    throw new Error(`No code files found in directory: ${absoluteDir}`);
  }

  // 2. Read contents & estimate baseline tokens
  const loadedFiles = [];
  for (const item of scanned) {
    try {
      const content = fs.readFileSync(item.fullPath, 'utf8');
      const tokens = estimateTokens(content);
      loadedFiles.push({
        ...item,
        content,
        rawTokens: tokens
      });
    } catch {
      // Skip unreadable files
    }
  }

  // 3. Rank files by relevance and construct dependency graph
  const rankedFiles = rankFilesByRelevance(loadedFiles, options.task, options.targets);

  // 4. Initial processing (Full vs Skeleton vs Omit) + Secret Masking
  let totalSecretsMasked = 0;
  let processedFiles = rankedFiles.map(file => {
    let mode = file.mode;
    let processedContent = file.content;

    if (options.skeletonAll || mode === 'skeleton') {
      processedContent = skeletonizeFile(file.content, file.ext);
      mode = 'skeleton';
    } else if (mode === 'omit') {
      processedContent = '';
    }

    if (options.maskSecrets && processedContent) {
      const { maskedContent, detectedCount } = maskSecrets(processedContent);
      processedContent = maskedContent;
      totalSecretsMasked += detectedCount;
    }

    return {
      ...file,
      mode,
      processedContent,
      finalTokens: estimateTokens(processedContent)
    };
  });

  const metadata = {
    task: options.task,
    targets: options.targets,
    dir: absoluteDir,
    model: options.model
  };

  // 5. Dynamic Token Budget Enforcement (if maxTokens is specified)
  if (options.maxTokens && options.maxTokens > 0) {
    let currentTokens = estimateTokens(renderPrompt(options.format, processedFiles, rankedFiles, metadata));

    // Pass 1: Demote secondary 'full' files to 'skeleton' (keep top 1 primary full)
    if (currentTokens > options.maxTokens) {
      let isFirstFull = true;
      for (let i = 0; i < processedFiles.length; i++) {
        if (processedFiles[i].mode === 'full') {
          if (isFirstFull) {
            isFirstFull = false;
            continue;
          }
          processedFiles[i].mode = 'skeleton';
          processedFiles[i].processedContent = skeletonizeFile(processedFiles[i].content, processedFiles[i].ext);
          if (options.maskSecrets) {
            processedFiles[i].processedContent = maskSecrets(processedFiles[i].processedContent).maskedContent;
          }
          processedFiles[i].finalTokens = estimateTokens(processedFiles[i].processedContent);
        }
      }
      currentTokens = estimateTokens(renderPrompt(options.format, processedFiles, rankedFiles, metadata));
    }

    // Pass 2: Demote lowest-ranked skeleton files to 'omit' until under budget
    if (currentTokens > options.maxTokens) {
      for (let i = processedFiles.length - 1; i >= 0; i--) {
        if (currentTokens <= options.maxTokens) break;
        if (processedFiles[i].mode === 'skeleton') {
          processedFiles[i].mode = 'omit';
          processedFiles[i].processedContent = '';
          processedFiles[i].finalTokens = 0;
          currentTokens = estimateTokens(renderPrompt(options.format, processedFiles, rankedFiles, metadata));
        }
      }
    }
  }

  // 6. Generate final prompt and baseline comparison
  const formattedOutput = renderPrompt(options.format, processedFiles, rankedFiles, metadata);

  // Baseline comparison (unpruned raw full dump)
  const unprunedBaseline = rankedFiles.map(f => ({
    ...f,
    mode: 'full',
    processedContent: f.content
  }));
  const baselineOutput = renderPrompt(options.format, unprunedBaseline, rankedFiles, metadata);

  const originalPromptTokens = estimateTokens(baselineOutput);
  const outputTokens = estimateTokens(formattedOutput);
  const savings = calculateSavings(originalPromptTokens, outputTokens, options.costPerMillion);

  // 7. Clipboard and File Output
  let copied = false;
  if (options.copy) {
    copied = await copyToClipboard(formattedOutput);
  }

  if (options.output) {
    const outPath = path.resolve(options.output);
    fs.writeFileSync(outPath, formattedOutput, 'utf8');
  }

  return {
    output: formattedOutput,
    savings,
    modelUsed: options.model,
    secretsMasked: totalSecretsMasked,
    filesIncluded: processedFiles.filter(f => f.mode !== 'omit').length,
    filesSkeletonized: processedFiles.filter(f => f.mode === 'skeleton').length,
    filesOmitted: processedFiles.filter(f => f.mode === 'omit').length,
    totalFiles: rankedFiles.length,
    budgetEnforced: Boolean(options.maxTokens),
    copied,
    outputFile: options.output ? path.resolve(options.output) : null
  };
}
