/**
 * cecistudy — verificador do contrato de banco (Fase 0.1)
 *
 * Executa `contracts/schema.sql` em SQLite em memória e confere:
 *   1. O DDL completo roda sem erro (IF NOT EXISTS — idempotente).
 *   2. As tabelas dos DOIS bancos lógicos existem (cecistudy_user + catalog).
 *   3. A versão de schema no header do .sql bate com `packages/data/src/schema.ts`.
 *
 * Uso: `node cecistudy-rust/contracts/verify-schema.mjs`
 * Em falha → exit 1. Em sucesso → exit 0.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const require = createRequire(import.meta.url);

// node:sqlite (Node 22+ experimental) — usa só se disponível; senão o Node sqlite3.
const { DatabaseSync } = await import('node:sqlite');

const sql = readFileSync(resolve(HERE, 'schema.sql'), 'utf8');

// ---- 3. Versão de schema no header vs packages/data/src/schema.ts ----
const schemaTs = readFileSync(resolve(ROOT, 'packages/data/src/schema.ts'), 'utf8');
const tsSchemaVersion = schemaTs.match(/SCHEMA_VERSION = (\d+)/)?.[1];
const sqlHeaderVersion = sql.match(/SCHEMA_VERSION\s*=\s*(\d+)/)?.[1];
if (!tsSchemaVersion || sqlHeaderVersion !== tsSchemaVersion) {
  console.error(
    `✗ versão divergente: schema.sql="${sqlHeaderVersion}" vs packages/data/src/schema.ts="${tsSchemaVersion}"`
  );
  process.exit(1);
}

// ---- 1. Aplica o DDL num banco único em memória ----
// (O .sql declara DOIS bancos lógicos num só arquivo; em memória rodamos tudo
// no mesmo arquivo — o objetivo aqui é validar sintaxe DDL e completude.)
let db;
try {
  db = new DatabaseSync(':memory:');
  db.exec(sql);
} catch (err) {
  console.error('✗ DDL exec falhou:', err.message);
  process.exit(1);
}

// ---- 2. Completude de tabelas por banco lógico ----
const allTables = new Set(
  db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => r.name)
);

/** Tabelas esperadas do banco da usuária (spelhadas de `src/lib/db/migrations/user.ts`). */
const USER_TABLES = [
  'profile', 'course', 'course_schedule', 'class_note', 'class_note_link',
  'task', 'task_link', 'assessment', 'assessment_topic', 'study_session',
  'flashcard', 'reading', 'reading_highlight', 'reading_progress', 'author',
  'concept', 'concept_course', 'concept_author', 'material', 'technique',
  'note', 'note_link', 'internship', 'internship_concept', 'internship_topic',
  'supervision_notebook', 'thesis_project', 'thesis_chapter', 'thesis_reference',
  'achievement', 'quiz_session', 'quiz_answer', 'saved_catalog_item', 'streak',
  'activity_event', 'legacy_import_map',
];

/** Tabelas esperadas do catálogo (espelhadas de `src/lib/db/catalogSchema.ts`). */
const CATALOG_TABLES = [
  'catalog_release', 'area', 'approach_family', 'approach', 'question', 'work',
  'concept_domain', 'concept', 'catalog_author', 'technique_category', 'technique',
  'comparison', 'question_category', 'topic',
];

const missing = [...USER_TABLES, ...CATALOG_TABLES].filter((t) => !allTables.has(t));
if (missing.length) {
  console.error(`✗ tabelas ausentes: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`✓ schema.sql válido (SCHEMA_VERSION=${tsSchemaVersion}); ${allTables.size} tabelas criadas.`);
db.close();