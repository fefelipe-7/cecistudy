/**
 * Import legado: coleções JSON (`cecistudy_*` em Preferences) → SQLite.
 *
 * Roda UMA vez por chave (registro em `legacy_import_map` impede reimport —
 * dados novos no SQLite nunca são sobrescritos pelo legado). O resolver
 * `readSource` é injetável: no app lê de `storage.get` (Preferences); nos
 * scripts/testes, de um dump/arquivo.
 */
import type { SqlDriver } from './driver.ts';
import { isUserCollectionKey, saveCollection, type UserCollectionKey } from './normalize.ts';

/** Coleções singleton (objeto) — as demais são arrays. */
const SINGLETON_KEYS: readonly string[] = ['profile', 'tcc', 'streakData', 'readingProgress'];

export interface LegacyImportReport {
  imported: UserCollectionKey[];
  skipped: UserCollectionKey[];
  errors: { key: UserCollectionKey; reason: string }[];
}

export type LegacySourceReader = (key: UserCollectionKey) => Promise<string | null>;

/** A chave já foi importada antes? */
export async function hasLegacyImport(driver: SqlDriver, key: string): Promise<boolean> {
  const rows = await driver.query(
    'SELECT source_key FROM legacy_import_map WHERE source_key = ?',
    [key]
  );
  return rows.length > 0;
}

async function markImported(driver: SqlDriver, key: string): Promise<void> {
  await driver.run(
    'INSERT OR REPLACE INTO legacy_import_map (source_key, imported_at, entity_type) VALUES (?, ?, ?)',
    [key, new Date().toISOString(), key]
  );
}

/**
 * Importa as chaves ainda não migradas. Chaves ausentes na fonte são
 * consideradas "puladas" (nada a fazer). Nunca sobrescreve dados existentes.
 */
export async function importLegacyCollections(
  driver: SqlDriver,
  keys: readonly string[],
  readSource: LegacySourceReader
): Promise<LegacyImportReport> {
  const report: LegacyImportReport = { imported: [], skipped: [], errors: [] };

  for (const raw of keys) {
    if (!isUserCollectionKey(raw)) continue;
    const key = raw;

    if (await hasLegacyImport(driver, key)) {
      report.skipped.push(key);
      continue;
    }

    let rawValue: string | null;
    try {
      rawValue = await readSource(key);
    } catch {
      report.skipped.push(key);
      continue;
    }
    if (rawValue == null) {
      report.skipped.push(key);
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      report.errors.push({ key, reason: 'JSON inválido' });
      continue;
    }

    const isObject = parsed != null && typeof parsed === 'object' && !Array.isArray(parsed);
    const looksOk = SINGLETON_KEYS.includes(key) ? isObject : Array.isArray(parsed);
    if (!looksOk) {
      report.errors.push({ key, reason: 'formato inesperado' });
      continue;
    }

    try {
      await saveCollection(driver, key, parsed);
      await markImported(driver, key);
      report.imported.push(key);
    } catch (e) {
      report.errors.push({ key, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  return report;
}
