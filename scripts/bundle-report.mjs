/**
 * Relatório de bundle — spec-performance.md §10 e F7.6 do todo-performance.
 *
 * O que faz:
 * 1. Mede o build web (`dist/`): bytes brutos e gzip por chunk, entrada
 *    crítica (o que o index.html referencia) e totais.
 * 2. Compara com o relatório anterior (`artifacts/bundle-report.json`, se
 *    existir) e FALHA (exit 1) nas regressões da spec §10:
 *    - entrada crítica crescendo mais de 10%;
 *    - chunk NOVO acima de 500 KiB comprimido sem justificativa anotada.
 * 3. Grava o relatório novo (versionado, fora do bundle público).
 *
 * `--force` pula a fiscalização (para atualizar o baseline depois de uma
 * mudança intencional documentada).
 *
 * Uso: `npm run bundle:report` (após `npm run build:web`).
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const reportPath = path.join(root, 'artifacts', 'bundle-report.json');
const FORCE = process.argv.includes('--force');

const CRITICAL_GROWTH_LIMIT = 1.1; // +10% na entrada crítica (spec §10)
const NEW_CHUNK_GZIP_LIMIT = 500 * 1024; // novo chunk crítico > 500 KiB comprimido

if (!fs.existsSync(distDir)) {
  console.error('[bundle-report] dist/ não existe — rode `npm run build:web` antes.');
  process.exit(1);
}

/** Nome sem hash: `bancoQuestoes-CCdRHTP9.js` → `bancoQuestoes`. */
const baseName = (file) => file.replace(/-[A-Za-z0-9_]{8,}(\.(js|css))$/, '$1');

const gzipOf = (buf) => zlib.gzipSync(buf, { level: 9 }).length;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = walk(distDir);
const jsCss = allFiles.filter((f) => /\.(js|css)$/.test(f));
const fonts = allFiles.filter((f) => /\.(woff2?)$/.test(f));

const chunkInfo = (file) => {
  const buf = fs.readFileSync(file);
  return {
    file: path.relative(distDir, file).replaceAll('\\', '/'),
    base: baseName(path.basename(file)),
    bytes: buf.length,
    gzip: gzipOf(buf),
  };
};

const chunks = jsCss.map(chunkInfo).sort((a, b) => b.bytes - a.bytes);

// Entrada crítica: o que o index.html referencia direto.
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const referenced = [...indexHtml.matchAll(/(?:src|href)="(\/?assets\/[^"]+\.(?:js|css))"/g)]
  .map((m) => m[1].replace(/^\/?assets\//, ''));
const criticalChunks = chunks.filter((c) => referenced.includes(path.basename(c.file)));
const totalBytesEntry = criticalChunks.reduce((acc, c) => acc + c.bytes, 0);

const totals = {
  js: {
    files: chunks.filter((c) => c.file.endsWith('.js')).length,
    bytes: chunks.filter((c) => c.file.endsWith('.js')).reduce((a, c) => a + c.bytes, 0),
  },
  css: {
    files: chunks.filter((c) => c.file.endsWith('.css')).length,
    bytes: chunks.filter((c) => c.file.endsWith('.css')).reduce((a, c) => a + c.bytes, 0),
  },
  fonts: {
    files: fonts.length,
    bytes: fonts.reduce((a, f) => a + fs.statSync(f).size, 0),
  },
};

const classification = (base, isEntry) => {
  if (isEntry || base.startsWith('vendor-')) return 'critical';
  if (/^(bancoQuestoes|ThreeDPaper)$/.test(base)) return 'opportunistic';
  if (/^(authors|comparisons|psicoterapiaApproaches|techniques|domain-)/.test(base)) return 'deferred';
  return 'route';
};

const report = {
  version: 2,
  generatedAt: new Date().toISOString(),
  generator: 'scripts/bundle-report.mjs (npm run bundle:report)',
  totals,
  critical: {
    chunks: criticalChunks.map((c) => ({ ...c, classification: 'critical' })),
    totalBytesEntry,
    totalGzipEntry: criticalChunks.reduce((a, c) => a + c.gzip, 0),
  },
  chunks: chunks.map((c) => ({
    ...c,
    classification: classification(c.base, referenced.includes(path.basename(c.file))),
  })),
};

// ---------------------------------------------------------------------------
// Regras de regressão (spec §10) — comparam com o relatório anterior
// ---------------------------------------------------------------------------

const failures = [];
const warnings = [];

if (fs.existsSync(reportPath) && !FORCE) {
  const prev = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

  const prevCritical = prev.critical?.totalBytesEntry;
  if (typeof prevCritical === 'number') {
    if (totalBytesEntry > prevCritical * CRITICAL_GROWTH_LIMIT) {
      failures.push(
        `entrada crítica cresceu ${Math.round((totalBytesEntry / prevCritical - 1) * 100)}% ` +
          `(antes ${prevCritical} B, agora ${totalBytesEntry} B) — limite da spec §10 é +10%`,
      );
    } else if (totalBytesEntry > prevCritical) {
      warnings.push(`entrada crítica cresceu para ${totalBytesEntry} B (dentro do limite de 10%)`);
    }
  }

  const prevBases = new Set(
    (prev.chunks ?? prev.topChunks ?? []).map((c) => baseName(path.basename(c.file ?? c.name))),
  );
  const known = new Set();
  for (const c of (prev.chunks ?? prev.topChunks ?? [])) {
    known.add(baseName(path.basename(c.file ?? c.name)));
  }
  void prevBases;
  for (const c of chunks) {
    if (!known.has(c.base) && c.gzip > NEW_CHUNK_GZIP_LIMIT) {
      failures.push(
        `chunk novo "${c.file}" tem ${Math.round(c.gzip / 1024)} KiB gzip ` +
          `(> 500 KiB sem justificativa anotada — spec §10)`,
      );
    }
  }

  const prevJs = prev.totals?.js?.bytes;
  if (typeof prevJs === 'number' && report.totals.js.bytes > prevJs) {
    warnings.push(
      `JS total: ${Math.round(prevJs / 1024)} → ${Math.round(report.totals.js.bytes / 1024)} KiB`,
    );
  } else if (typeof prevJs === 'number') {
    warnings.push(
      `JS total: ${Math.round(prevJs / 1024)} → ${Math.round(report.totals.js.bytes / 1024)} KiB (reduziu ✓)`,
    );
  }
} else if (!fs.existsSync(reportPath)) {
  warnings.push('sem relatório anterior — este build vira o baseline');
} else if (FORCE) {
  warnings.push('--force: fiscalização de regressão pulada (baseline atualizado de propósito)');
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(`[bundle-report] gravado: ${reportPath}`);

console.log(
  `[bundle-report] entrada crítica: ${Math.round(totalBytesEntry / 1024)} KiB raw · ` +
    `${Math.round(report.critical.totalGzipEntry / 1024)} KiB gzip · ` +
    `JS total ${Math.round(totals.js.bytes / 1024 / 10.24) / 100} MiB · ` +
    `fontes ${totals.fonts.files} arquivos (${Math.round(totals.fonts.bytes / 1024)} KiB)`,
);
for (const w of warnings) console.warn(`[bundle-report] aviso: ${w}`);

if (failures.length > 0) {
  for (const f of failures) console.error(`[bundle-report] REGRESSÃO: ${f}`);
  console.error(
    '[bundle-report] se a mudança for intencional e justificada, atualize o baseline com `npm run bundle:report -- --force` e registre o motivo no to-do.',
  );
  process.exit(1);
}
console.log('[bundle-report] OK: nenhuma regressão da spec §10.');
