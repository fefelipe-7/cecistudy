/**
 * db:verify — valida o banco do catálogo embutido (`public/assets/databases/cecistudy_catalog.db`).
 *
 * Verifica: integridade (PRAGMA integrity_check), presença das tabelas esperadas,
 * contagens mínimas por tabela e consistência com o manifesto `version.json`.
 * Sai com código ≠ 0 quando algo falha (gate de build/CI).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';

import { CATALOG_TABLES_SQL, CATALOG_DB_NAME } from '../src/lib/db/catalogSchema.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DB_PATH = path.join(ROOT, 'public', 'assets', 'databases', `${CATALOG_DB_NAME}.db`);
const MANIFEST_PATH = path.join(ROOT, 'public', 'assets', 'databases', 'version.json');

const EXPECTED_TABLES = [
  'catalog_release',
  'area',
  'approach_family',
  'approach',
  'question',
  'work',
  'concept_domain',
  'concept',
  'catalog_author',
  'technique_category',
  'technique',
  'question_category',
  'topic',
];

const MIN_COUNTS = {
  area: 1,
  approach_family: 1,
  approach: 1,
  question: 1000,
  work: 1,
  concept_domain: 10,
  concept: 200,
  catalog_author: 120,
  technique_category: 10,
  technique: 130,
  question_category: 18,
  topic: 1400,
};

async function main() {
  const SQL = await initSqlJs({
    locateFile: () => path.join(ROOT, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
  });
  const db = new SQL.Database(readFileSync(DB_PATH));

  const integrity = db.exec('PRAGMA integrity_check')[0]?.values?.[0]?.[0];
  if (integrity !== 'ok') {
    console.error(`[db:verify] integridade falhou: ${integrity}`);
    process.exit(1);
  }

  const tables = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  )[0]?.values.map((r) => r[0]) ?? [];
  const missing = EXPECTED_TABLES.filter((t) => !tables.includes(t));
  if (missing.length > 0) {
    console.error(`[db:verify] tabelas ausentes: ${missing.join(', ')}`);
    process.exit(1);
  }

  const counts = {};
  for (const [table, min] of Object.entries(MIN_COUNTS)) {
    const n = Number(db.exec(`SELECT COUNT(*) FROM ${table}`)[0]?.values?.[0]?.[0] ?? 0);
    counts[table] = n;
    if (n < min) {
      console.error(`[db:verify] ${table} com contagem abaixo do mínimo (${n} < ${min})`);
      process.exit(1);
    }
  }

  const release = db.exec(
    'SELECT version, content_hash, built_at, source_schema_version FROM catalog_release WHERE id = 1'
  )[0]?.values?.[0];
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

  if (!release) {
    console.error('[db:verify] catalog_release vazia');
    process.exit(1);
  }
  const [dbVersion, dbHash, dbBuiltAt, dbSourceVersion] = release;
  if (manifest.version !== dbVersion || manifest.contentHash !== dbHash) {
    console.error('[db:verify] manifesto diverge do banco (re-executar content:build)');
    process.exit(1);
  }

  db.close();
  console.log('[db:verify] ok — integridade, schema e manifesto consistentes.');
  console.log(
    `[db:verify] release ${dbVersion} (hash ${dbHash.slice(0, 12)}…) · ` +
      `${counts.area} áreas · ${counts.approach_family} famílias · ${counts.approach} abordagens · ` +
      `${counts.question} questões · ${counts.work} obras · ` +
      `${counts.concept_domain} domínios · ${counts.concept} conceitos · ` +
      `${counts.catalog_author} autores · ${counts.technique} técnicas · ` +
      `${counts.question_category} categorias de questão · ${counts.topic} tópicos`
  );
}

main().catch((e) => {
  console.error('[db:verify] falhou:', e);
  process.exit(1);
});