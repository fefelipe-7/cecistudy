/**
 * Banco do catálogo (`cecistudy_catalog`) — **nativo only**, somente-leitura.
 *
 * O `.db` é gerado pela pipeline editorial (`npm run content:build`), embutido
 * no bundle via `public/assets/databases/` (copiado pelo `cap sync`) e aberto
 * com `copyFromAssets` no primeiro uso.
 *
 * No web este módulo retorna sempre `null` — a fonte na web é o facade JS
 * (`src/data/books/index.ts`, `psicoterapiaApproaches`, `bancoQuestoes`).
 */
import { isNativePlatform } from '../storage.ts';
import { CATALOG_DB_NAME } from './catalogSchema.ts';
import type { SqlDriver, SqlRow } from './driver.ts';

interface CatalogCapacitorSQLite {
  isDBExists(opts: { database: string }): Promise<{ value?: boolean }>;
  copyFromAssets(opts?: { overwrite?: boolean }): Promise<void>;
  createConnection(opts: unknown): Promise<void>;
  open(opts: unknown): Promise<void>;
  close(opts: unknown): Promise<void>;
  execute(opts: { database: string; statements: string }): Promise<unknown>;
  run(opts: { database: string; statement: string; values?: unknown[] }): Promise<unknown>;
  query(opts: {
    database: string;
    statement: string;
    values?: unknown[];
  }): Promise<{ values?: unknown[] }>;
}

let catalogDbPromise: Promise<SqlDriver | null> | undefined;

/** Singleton do banco do catálogo. `null` = web ou indisponível. */
export function getCatalogDb(): Promise<SqlDriver | null> {
  if (!isNativePlatform) return Promise.resolve(null);
  if (!catalogDbPromise) catalogDbPromise = bootstrapCatalogDb();
  return catalogDbPromise;
}

async function bootstrapCatalogDb(): Promise<SqlDriver | null> {
  try {
    const mod = (await import('@capacitor-community/sqlite')) as {
      CapacitorSQLite: CatalogCapacitorSQLite;
    };
    const sqlite = mod.CapacitorSQLite;

    // Primeiro uso: copia o `.db` embutido (assets) para o storage do app.
    try {
      const exists = await sqlite.isDBExists({ database: CATALOG_DB_NAME });
      if (!exists.value) await sqlite.copyFromAssets({ overwrite: false });
    } catch {
      // Alguns builds exigem o copy antes de qualquer checagem — idempotente.
      await sqlite.copyFromAssets({ overwrite: false });
    }

    await sqlite.createConnection({
      database: CATALOG_DB_NAME,
      encrypted: false,
      mode: 'no-encryption',
      version: 1,
      readonly: true,
    });
    await sqlite.open({ database: CATALOG_DB_NAME, readonly: true });

    return {
      async open() {
        /* conexão estabelecida acima */
      },
      async run(sql, params) {
        await sqlite.run({ database: CATALOG_DB_NAME, statement: sql, values: params ?? [] });
      },
      async exec(sql) {
        await sqlite.execute({ database: CATALOG_DB_NAME, statements: sql });
      },
      async query(sql, params) {
        const res = await sqlite.query({
          database: CATALOG_DB_NAME,
          statement: sql,
          values: params ?? [],
        });
        return (res.values ?? []) as SqlRow[];
      },
      async close() {
        await sqlite.close({ database: CATALOG_DB_NAME });
      },
    };
  } catch (e) {
    console.error('[catalogDb] catálogo SQLite indisponível — usando facade estático', e);
    return null;
  }
}

/** Uso interno de testes: descarta o singleton memoizado. */
export function resetCatalogDbCache(): void {
  catalogDbPromise = undefined;
}

// ---- consultas de alto nível ----

export interface CatalogReleaseInfo {
  version: string;
  contentHash: string;
  builtAt: string;
}

export async function getCatalogRelease(): Promise<CatalogReleaseInfo | null> {
  const db = await getCatalogDb();
  if (!db) return null;
  const rows = await db.query(
    'SELECT version, content_hash, built_at FROM catalog_release WHERE id = 1'
  );
  if (rows.length === 0) return null;
  return {
    version: String(rows[0].version ?? ''),
    contentHash: String(rows[0].content_hash ?? ''),
    builtAt: String(rows[0].built_at ?? ''),
  };
}

function parseJsonRows(rows: SqlRow[]): unknown[] {
  return rows.map((r) => JSON.parse(String(r.data_json)));
}

/** Abordagens (97) — substitui o seed lazy de `psicoterapiaApproaches`. */
export async function getCatalogApproaches<T = unknown>(): Promise<T[]> {
  const db = await getCatalogDb();
  if (!db) return [];
  const rows = await db.query('SELECT data_json FROM approach ORDER BY sort_order');
  return parseJsonRows(rows) as T[];
}

/** Questões (745) — substitui o seed lazy de `bancoQuestoes`. */
export async function getCatalogQuestions<T = unknown>(): Promise<T[]> {
  const db = await getCatalogDb();
  if (!db) return [];
  const rows = await db.query('SELECT data_json FROM question');
  return parseJsonRows(rows) as T[];
}

/** Obras da biblioteca por tipo (coluna `type`: catalog | interdisciplinary | article). */
export async function getCatalogWorksByType(type: string): Promise<unknown[]> {
  const db = await getCatalogDb();
  if (!db) return [];
  const rows = await db.query('SELECT data_json FROM work WHERE type = ?', [type]);
  return parseJsonRows(rows);
}
