/**
 * db:legacy-import — dry-run da migração legada (Preferences → SQLite).
 *
 * Lê um dump JSON das chaves `cecistudy_*` (valores como strings JSON brutas ou
 * como objetos já parseados) e importa para um banco `cecistudy_user` em
 * memória usando o MESMO caminho de código do app (migrações + `saveCollection`).
 *
 * Uso:
 *   node scripts/db-legacy-import.mjs --dump dump.json [--out saida.db]
 *
 * Saída padrão: `content/legacy-import.dry.db` (para inspeção).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSqlJsDriver } from '../src/lib/db/sqlJsDriver.ts';
import { runUserMigrations } from '../src/lib/db/migrations.ts';
import {
  saveCollection,
  isUserCollectionKey,
  USER_COLLECTION_KEYS,
} from '../src/lib/db/normalize.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PREFIX = 'cecistudy_';

function args() {
  const a = process.argv.slice(2);
  const get = (flag) => {
    const i = a.indexOf(flag);
    return i >= 0 && a[i + 1] ? a[i + 1] : null;
  };
  return { dump: get('--dump'), out: get('--out') ?? path.join(__dirname, 'legacy-import.dry.db') };
}

async function main() {
  const { dump, out } = args();
  if (!dump) {
    console.error('uso: node scripts/db-legacy-import.mjs --dump dump.json [--out saida.db]');
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(dump, 'utf8'));
  const source = new Map();
  for (const [k, v] of Object.entries(raw)) {
    const bare = k.startsWith(PREFIX) ? k.slice(PREFIX.length) : k;
    source.set(bare, typeof v === 'string' ? v : JSON.stringify(v));
  }

  const driver = createSqlJsDriver();
  await driver.open();
  await runUserMigrations(driver);

  const report = { imported: [], skipped: [], errors: [] };
  for (const key of USER_COLLECTION_KEYS) {
    const already = await driver.query(
      'SELECT source_key FROM legacy_import_map WHERE source_key = ?',
      [key]
    );
    if (already.length > 0) {
      report.skipped.push(key);
      continue;
    }
    const rawValue = source.get(key);
    if (rawValue == null) {
      report.skipped.push(key);
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      report.errors.push({ key, reason: 'JSON inválido' });
      continue;
    }
    const isObject = parsed != null && typeof parsed === 'object' && !Array.isArray(parsed);
    const looksOk = ['profile', 'tcc', 'streakData', 'readingProgress'].includes(key)
      ? isObject
      : Array.isArray(parsed);
    if (!looksOk) {
      report.errors.push({ key, reason: 'formato inesperado' });
      continue;
    }
    try {
      if (isUserCollectionKey(key)) await saveCollection(driver, key, parsed);
      await driver.run(
        'INSERT INTO legacy_import_map (source_key, imported_at, entity_type) VALUES (?, ?, ?)',
        [key, new Date().toISOString(), key]
      );
      report.imported.push(key);
    } catch (e) {
      report.errors.push({ key, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  const buf = await driver.exportDb();
  writeFileSync(path.resolve(ROOT, out), Buffer.from(buf));
  await driver.close();

  console.log(`[db:legacy-import] importadas: ${report.imported.join(', ') || '(nenhuma)'}`);
  console.log(`[db:legacy-import] puladas (já importadas/ausentes): ${report.skipped.join(', ') || '(nenhuma)'}`);
  for (const e of report.errors) {
    console.error(`[db:legacy-import] erro em ${e.key}: ${e.reason}`);
  }
  console.log(`[db:legacy-import] banco gravado em ${out}`);
  if (report.errors.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error('[db:legacy-import] falhou:', e);
  process.exit(1);
});