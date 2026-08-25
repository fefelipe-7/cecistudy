/**
 * Schema do banco do catálogo (`cecistudy_catalog`).
 *
 * Banco **somente-leitura**, gerado pela pipeline editorial (`content/build-catalog.mjs`)
 * a partir das fontes em `content/content-data.mjs`. É embutido no bundle nativo via
 * `public/assets/databases/` (copiado pelo `cap sync`) e aberto com
 * `copyFromAssets` no primeiro uso (ver `catalogDb.ts`).
 *
 * O web NÃO usa este banco: o facade JS (`src/data/books/index.ts`,
 * `psicoterapiaApproaches`, `bancoQuestoes`) continua sendo a fonte na web.
 *
 * ⚠️ O DDL abaixo precisa espelhar exatamente o schema do `.db` construído
 * (`PRAGMA integrity_check` + contagens validados por `npm run db:verify`).
 */

/** Nome lógico do banco (sem extensão — convenção do plugin SQLite). */
export const CATALOG_DB_NAME = 'cecistudy_catalog';

/** DDL completo do catálogo (executado pelo builder ao criar o `.db`). */
export const CATALOG_TABLES_SQL = `
CREATE TABLE catalog_release (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  built_at TEXT NOT NULL,
  source_schema_version INTEGER NOT NULL
);

CREATE TABLE area (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE approach_family (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  color TEXT
);

CREATE TABLE approach (
  id TEXT PRIMARY KEY,
  family_id TEXT REFERENCES approach_family(id),
  name TEXT NOT NULL,
  short_name TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL
);

CREATE TABLE question (
  id TEXT PRIMARY KEY,
  area TEXT,
  tema TEXT,
  subtema TEXT,
  escola TEXT,
  dificuldade TEXT,
  formato TEXT,
  data_json TEXT NOT NULL
);

CREATE TABLE work (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  familia TEXT,
  title TEXT NOT NULL,
  author TEXT,
  cover_color TEXT,
  accent_color TEXT,
  data_json TEXT NOT NULL
);

CREATE TABLE concept_domain (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE concept (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES concept_domain(id),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  data_json TEXT NOT NULL
);

CREATE TABLE catalog_author (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL
);

CREATE TABLE technique_category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL
);

CREATE TABLE technique (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES technique_category(id),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  data_json TEXT NOT NULL
);

CREATE TABLE question_category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE topic (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES topic(id),
  name TEXT NOT NULL
);
`.trim();
