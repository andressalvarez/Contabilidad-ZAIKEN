#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'pipe',
    encoding: 'utf8',
    ...opts,
  });

  if (result.status !== 0) {
    const stderr = result.stderr || result.stdout || `Command failed: ${command} ${args.join(' ')}`;
    throw new Error(stderr.trim());
  }
  return (result.stdout || '').trim();
}

function runInherit(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function getStagedFiles() {
  const output = run('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
  if (!output) return [];
  return output
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function maybeDecodeMojibake(text) {
  let normalized = text;
  for (let i = 0; i < 2; i += 1) {
    if (!/[\u00C3\u00C2]/.test(normalized)) break;
    try {
      normalized = decodeURIComponent(escape(normalized));
    } catch {
      break;
    }
  }
  return normalized;
}

function cleanSuspiciousText(content) {
  let out = maybeDecodeMojibake(content);

  const replacements = [
    [/á/g, '\u00E1'],
    [/é/g, '\u00E9'],
    [/í/g, '\u00ED'],
    [/ó/g, '\u00F3'],
    [/ú/g, '\u00FA'],
    [/ñ/g, '\u00F1'],
    [/Á/g, '\u00C1'],
    [/É/g, '\u00C9'],
    [/Í/g, '\u00CD'],
    [/Ó/g, '\u00D3'],
    [/Ú/g, '\u00DA'],
    [/Ñ/g, '\u00D1'],
    [/ü/g, '\u00FC'],
    [/Ü/g, '\u00DC'],
    [/¿/g, '\u00BF'],
    [/¡/g, '\u00A1'],
    [/\uFFFD/g, ''],
  ];

  for (const [pattern, value] of replacements) {
    out = out.replace(pattern, value);
  }

  return out;
}

function shouldTextClean(filePath) {
  return /\.(ts|tsx|js|jsx|json|md|yml|yaml|css|scss|html)$/i.test(filePath);
}

function runFrontendLint(files) {
  const relFiles = files
    .filter((filePath) => filePath.startsWith('frontend/'))
    .map((filePath) => filePath.replace(/^frontend\//, ''))
    .filter((filePath) => /\.(ts|tsx|js|jsx)$/i.test(filePath));

  if (relFiles.length === 0) return;

  const nextBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['next', 'lint'];
  for (const filePath of relFiles) {
    args.push('--file', filePath);
  }
  args.push('--fix');

  try {
    runInherit(nextBin, args, path.join(repoRoot, 'frontend'));
  } catch (error) {
    console.warn('[pre-commit] Frontend lint warnings/errors (non-blocking).');
  }
}

function runBackendLint(files) {
  const relFiles = files
    .filter((filePath) => filePath.startsWith('backend/'))
    .map((filePath) => filePath.replace(/^backend\//, ''))
    .filter((filePath) => /\.(ts|tsx|js|jsx)$/i.test(filePath));

  if (relFiles.length === 0) return;

  const eslintBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['eslint', '--fix', ...relFiles];

  try {
    runInherit(eslintBin, args, path.join(repoRoot, 'backend'));
  } catch (error) {
    console.warn('[pre-commit] Backend lint warnings/errors (non-blocking).');
  }
}

function runMojibakeCheck() {
  const script = path.join(repoRoot, 'frontend', 'scripts', 'check-mojibake.js');
  if (!fs.existsSync(script)) return;

  const nodeBin = process.platform === 'win32' ? 'node.exe' : 'node';
  runInherit(nodeBin, [script], path.join(repoRoot, 'frontend'));
}

function main() {
  const staged = getStagedFiles();
  if (staged.length === 0) {
    console.log('[pre-commit] No staged files.');
    return;
  }

  const cleanedFiles = [];
  for (const stagedFile of staged) {
    if (!shouldTextClean(stagedFile)) continue;

    const fullPath = path.join(repoRoot, stagedFile);
    if (!fs.existsSync(fullPath)) continue;

    const original = fs.readFileSync(fullPath, 'utf8');
    const cleaned = cleanSuspiciousText(original);
    if (cleaned !== original) {
      fs.writeFileSync(fullPath, cleaned, 'utf8');
      cleanedFiles.push(stagedFile);
    }
  }

  runFrontendLint(staged);
  runBackendLint(staged);
  runMojibakeCheck();

  if (cleanedFiles.length > 0) {
    console.log(`[pre-commit] Cleaned mojibake in ${cleanedFiles.length} file(s).`);
  }

  run('git', ['add', '--', ...staged]);
  console.log('[pre-commit] OK');
}

try {
  main();
} catch (error) {
  console.error('[pre-commit] Error:', error.message);
  process.exit(1);
}
