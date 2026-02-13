#!/usr/bin/env node

/**
 * Script para validar que el manejo de errores sigue las directrices
 *
 * Busca patrones problemáticos:
 * - onError con toast.error (duplicado)
 * - window.alert/confirm/prompt (no permitido)
 * - getErrorMessage manual en toast (innecesario)
 *
 * Uso:
 *   npm run error:check        # Solo validar
 *   npm run error:check --fix  # Corregir automáticamente lo posible
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const FIX_MODE = process.argv.includes('--fix');

// Patrones problemáticos
const PATTERNS = [
  {
    name: 'onError con toast.error',
    regex: /onError:\s*\([^)]*\)\s*=>\s*\{[^}]*toast\.error[^}]*\}\s*,?/gs,
    suggestion: 'REMOVER - El interceptor ya maneja los errores automáticamente',
    severity: 'error',
    autofix: true,
  },
  {
    name: 'onError con error.response?.data?.message',
    regex: /onError:\s*\([^)]*\)\s*=>\s*\{[^}]*error\.response\?\.data\?\.message[^}]*\}\s*,?/gs,
    suggestion: 'REMOVER - El interceptor ya formatea los mensajes',
    severity: 'error',
    autofix: true,
  },
  {
    name: 'window.alert',
    regex: /window\.alert\(/g,
    suggestion: 'REEMPLAZAR con showAlert() de @/lib/app-dialog',
    severity: 'error',
    autofix: false,
  },
  {
    name: 'window.confirm',
    regex: /window\.confirm\(/g,
    suggestion: 'REEMPLAZAR con showConfirm() de @/lib/app-dialog',
    severity: 'error',
    autofix: false,
  },
  {
    name: 'window.prompt',
    regex: /window\.prompt\(/g,
    suggestion: 'REEMPLAZAR con showPrompt() de @/lib/app-dialog',
    severity: 'error',
    autofix: false,
  },
  {
    name: 'toast.error con getErrorMessage',
    regex: /toast\.error\(\s*getErrorMessage\([^)]*\)\s*\)/g,
    suggestion: 'REMOVER - El interceptor ya usa getErrorMessage',
    severity: 'warning',
    autofix: false,
  },
];

let filesScanned = 0;
let filesWithIssues = 0;
let filesFixed = 0;
let totalIssues = 0;
let issuesFixed = 0;

function fixContent(content) {
  let fixed = content;
  let modified = false;

  PATTERNS.forEach((pattern) => {
    if (!pattern.autofix) return;

    const matches = fixed.match(pattern.regex);
    if (matches) {
      fixed = fixed.replace(pattern.regex, '');
      modified = true;
      issuesFixed += matches.length;
    }
  });

  return { content: fixed, modified };
}

function scanFile(filePath) {
  filesScanned++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];

  PATTERNS.forEach((pattern) => {
    const matches = Array.from(content.matchAll(pattern.regex));

    matches.forEach((match) => {
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;

      issues.push({
        file: path.relative(SRC_DIR, filePath),
        fullPath: filePath,
        line: lineNumber,
        pattern: pattern.name,
        suggestion: pattern.suggestion,
        severity: pattern.severity,
        autofix: pattern.autofix,
        snippet: match[0].substring(0, 80).replace(/\n/g, ' '),
      });
    });
  });

  if (issues.length > 0) {
    filesWithIssues++;
    totalIssues += issues.length;

    // Auto-fix si está habilitado
    if (FIX_MODE) {
      const { content: fixedContent, modified } = fixContent(content);
      if (modified) {
        fs.writeFileSync(filePath, fixedContent, 'utf-8');
        filesFixed++;
      }
    }
  }

  return issues;
}

function scanDirectory(dir) {
  const allIssues = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          allIssues.push(...scanDirectory(fullPath));
        }
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        allIssues.push(...scanFile(fullPath));
      }
    }
  } catch (error) {
    console.error(`Error escaneando ${dir}:`, error.message);
  }

  return allIssues;
}

// Ejecutar scan
console.log('━'.repeat(60));
console.log(FIX_MODE ? '🔧 MODO FIX - Corrigiendo automáticamente...' : '🔍 VALIDANDO manejo de errores...');
console.log('━'.repeat(60));
console.log('');

const allIssues = scanDirectory(SRC_DIR);

// Agrupar por archivo
const byFile = {};
allIssues.forEach((issue) => {
  if (!byFile[issue.file]) {
    byFile[issue.file] = [];
  }
  byFile[issue.file].push(issue);
});

// Mostrar resultados
if (allIssues.length === 0) {
  console.log('✅ ¡PERFECTO! No se encontraron problemas');
  console.log(`   ${filesScanned} archivos escaneados`);
  console.log('');
  process.exit(0);
}

console.log(`⚠️  Encontrados ${totalIssues} problemas en ${filesWithIssues} archivos:\n`);

Object.entries(byFile).forEach(([file, issues]) => {
  console.log(`📄 ${file}`);

  issues.forEach((issue) => {
    const icon = issue.severity === 'error' ? '❌' : '⚠️';
    const fixIcon = issue.autofix ? (FIX_MODE ? '✅' : '🔧') : '👉';

    console.log(`   ${icon} Línea ${issue.line}: ${issue.pattern}`);
    console.log(`   ${fixIcon} ${issue.suggestion}`);

    if (!issue.autofix) {
      console.log(`      "${issue.snippet}..."`);
    }
    console.log('');
  });
});

// Resumen
console.log('━'.repeat(60));
console.log('📊 RESUMEN');
console.log('━'.repeat(60));

PATTERNS.forEach((pattern) => {
  const count = allIssues.filter((i) => i.pattern === pattern.name).length;
  if (count > 0) {
    const icon = pattern.severity === 'error' ? '❌' : '⚠️';
    const status = pattern.autofix ? (FIX_MODE ? '✅ CORREGIDO' : '🔧 Auto-corregible') : '👉 Manual';
    console.log(`${icon} ${status} - ${pattern.name}: ${count}`);
  }
});

console.log('');
console.log(`📁 Archivos escaneados: ${filesScanned}`);
console.log(`⚠️  Archivos con problemas: ${filesWithIssues}`);
console.log(`🔢 Total de problemas: ${totalIssues}`);

if (FIX_MODE) {
  console.log(`✅ Archivos corregidos: ${filesFixed}`);
  console.log(`✅ Problemas auto-corregidos: ${issuesFixed}`);
  const remaining = totalIssues - issuesFixed;
  if (remaining > 0) {
    console.log(`👉 Requieren corrección manual: ${remaining}`);
  }
} else {
  const canAutofix = allIssues.filter((i) => i.autofix).length;
  if (canAutofix > 0) {
    console.log(`💡 ${canAutofix} pueden corregirse con: npm run error:check -- --fix`);
  }
}

console.log('');
console.log('━'.repeat(60));
console.log('📚 RECURSOS');
console.log('━'.repeat(60));
console.log('• Guía: docs/ERROR_HANDLING_GUIDE.md');
console.log('• README: MANEJO_ERRORES_README.md');
console.log('• Ejemplo: src/components/examples/ErrorHandlingExample.tsx');
console.log('• Directrices: ../../CLAUDE.md (sección "Manejo de Errores HTTP")');
console.log('');

process.exit(totalIssues > 0 ? 1 : 0);
