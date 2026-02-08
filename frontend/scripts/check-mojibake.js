#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const INCLUDED_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md']);
const BAD_PATTERNS = [/Ãƒ/g, /Ã‚/g, /Ã¢â‚¬Â¢/g, /Ã°Å¸/g, /\uFFFD/g];

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
    } else if (INCLUDED_EXT.has(path.extname(entry.name))) {
      out.push(fullPath);
    }
  }
  return out;
}

function hasMojibake(text) {
  return BAD_PATTERNS.some((pattern) => pattern.test(text));
}

function main() {
  const files = walk(SRC_DIR);
  const offenders = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      if (hasMojibake(lines[i])) {
        offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${lines[i].trim()}`);
      }
    }
  }

  if (offenders.length > 0) {
    console.error('Mojibake detectado. Corrige estas lineas:');
    for (const offender of offenders) console.error(`- ${offender}`);
    process.exit(1);
  }

  console.log('OK: no se detecto mojibake en frontend/src.');
}

main();