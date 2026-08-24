/**
 * content:build — gera o banco do catálogo (`cecistudy_catalog`) embutido no app.
 *
 * Fontes em `./content-data.mjs`. Saída:
 *   - `public/assets/databases/cecistudy_catalog.db`  (embutido no bundle nativo)
 *   - `public/assets/databases/version.json`          (manifesto: versão + hash)
 *   - `content/last-build.json`                       (hash p/ `content:diff`)
 *
 * Roda no Node (type-stripping p/ importar `.ts`) — nenhum import do app runtime.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import initSqlJs from 'sql.js';

import {
  BANCO_QUESTOES,
  PSICOTERAPIA_APPROACHES,
  PSICOTERAPIA_FAMILIES,
  mapCatalogBooks,
  mapInterdisciplinaryBooks,
  mapArticles,
  listAreas,
  computeContentHash,
} from './content-data.mjs';
import { CATALOG_TABLES_SQL, CATALOG_DB_NAME } from '../src/lib/db/catalogSchema.ts';
import { USER_SCHEMA_VERSION } from '../src/lib/db/migrations/user.ts';
import catalogVersion from './catalog-version.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'databases');
const OUT_DB = path.join(OUT_DIR, `${CATALOG_DB_NAME}.db`);
const OUT_MANIFEST = path.join(OUT_DIR, 'version.json');
const LAST_BUILD = path.join(__dirname, 'last-build.json');

function run(db, sql, params = []) {
  db.run(sql, params);
}

function insertMany(db, table, columns, rows) {
  const stmt = db.prepare(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
  );
  for (const row of rows) {
    stmt.run(row);
  }
  stmt.free();
}

async function build() {
  const contentHash = computeContentHash();
  const builtAt = new Date().toISOString();
  const version = catalogVersion.version;

  const SQL = await initSqlJs({
    locateFile: () => path.join(ROOT, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
  });
  const db = new SQL.Database();

  db.run(CATALOG_TABLES_SQL);

  run(db, 'DELETE FROM catalog_release');
  run(
    db,
    `INSERT INTO catalog_release (id, version, content_hash, built_at, source_schema_version)
     VALUES (1, ?, ?, ?, ?)`,
    [version, contentHash, builtAt, USER_SCHEMA_VERSION]
  );

  const areas = listAreas();
  insertMany(
    db,
    'area',
    ['id', 'name', 'display_order'],
    areas.map((a, i) => [a, a, i])
  );

  insertMany(
    db,
    'approach_family',
    ['id', 'name', 'description', 'display_order', 'color'],
    PSICOTERAPIA_FAMILIES.map((f) => [f.id, f.name, f.description, f.order, f.color])
  );

  insertMany(
    db,
    'approach',
    ['id', 'family_id', 'name', 'short_name', 'color', 'status', 'sort_order', 'data_json'],
    PSICOTERAPIA_APPROACHES.map((a, i) => [
      a.id,
      a.family ?? null,
      a.name,
      a.shortName ?? null,
      a.color ?? null,
      'published',
      i,
      JSON.stringify(a),
    ])
  );

  insertMany(
    db,
    'question',
    ['id', 'area', 'tema', 'subtema', 'escola', 'dificuldade', 'formato', 'data_json'],
    BANCO_QUESTOES.map((q) => [
      q.id,
      q.area ?? null,
      q.tema ?? null,
      q.subtema ?? null,
      q.escolaOuAbordagem ?? null,
      q.dificuldade ?? null,
      q.formato ?? null,
      JSON.stringify(q),
    ])
  );

  const works = [];
  for (const b of mapCatalogBooks()) {
    works.push(['catalog', b.familia, b.nome, b.autor, b.coverColor, b.accentColor, JSON.stringify(b)]);
  }
  for (const b of mapInterdisciplinaryBooks()) {
    works.push(['interdisciplinary', b.area, b.nome, b.autor, b.coverColor, b.accentColor, JSON.stringify(b)]);
  }
  for (const a of mapArticles()) {
    works.push(['article', a.familia, a.titulo, a.autores, null, null, JSON.stringify(a)]);
  }
  insertMany(
    db,
    'work',
    ['type', 'familia', 'title', 'author', 'cover_color', 'accent_color', 'data_json'],
    works
  );

  const buf = db.export();
  db.close();

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_DB, Buffer.from(buf));
  writeFileSync(
    OUT_MANIFEST,
    JSON.stringify(
      {
        database: `${CATALOG_DB_NAME}.db`,
        version,
        contentHash,
        builtAt,
        sourceSchemaVersion: USER_SCHEMA_VERSION,
        counts: {
          areas: areas.length,
          approachFamilies: PSICOTERAPIA_FAMILIES.length,
          approaches: PSICOTERAPIA_APPROACHES.length,
          questions: BANCO_QUESTOES.length,
          works: works.length,
        },
      },
      null,
      2
    )
  );
  writeFileSync(LAST_BUILD, JSON.stringify({ version, contentHash, builtAt }, null, 2));

  const sizeKb = Math.round(buf.byteLength / 1024);
  console.log(`[content:build] ${CATALOG_DB_NAME}.db → ${sizeKb} kB`);
  console.log(
    `[content:build] ${areas.length} áreas · ${PSICOTERAPIA_FAMILIES.length} famílias · ` +
      `${PSICOTERAPIA_APPROACHES.length} abordagens · ${BANCO_QUESTOES.length} questões · ` +
      `${works.length} obras (versão ${version}, hash ${contentHash.slice(0, 12)}…)`
  );
}

build().catch((e) => {
  console.error('[content:build] falhou:', e);
  process.exit(1);
});