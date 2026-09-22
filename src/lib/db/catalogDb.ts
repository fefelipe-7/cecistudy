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

/** Questões (3.002 — MC 2.283 · C/E 719) — substitui o seed lazy de `bancoQuestoes`. */
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

// ---- consultas do templo de conhecimento ----

/** Domínios de conceitos (12), em ordem de exibição. */
export async function getCatalogConceptDomains(): Promise<Array<{ id: string; name: string }>> {
  const db = await getCatalogDb();
  if (!db) return [];
  const rows = await db.query(
    'SELECT id, name FROM concept_domain ORDER BY display_order'
  );
  return rows.map((r) => ({ id: String(r.id), name: String(r.name) }));
}

/** Índice leve dos conceitos (sem o corpo — vem do data_json no detalhe). */
export async function getCatalogConceptIndex(): Promise<
  Array<{ id: string; name: string; domainId: string; domainName: string | null; definition: string }>
> {
  const db = await getCatalogDb();
  if (!db) return [];
  const rows = await db.query(
    `SELECT c.id, c.name, c.domain_id, d.name AS domain_name
     FROM concept c JOIN concept_domain d ON d.id = c.domain_id
     ORDER BY d.display_order, c.display_order`
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    domainId: String(r.domain_id),
    domainName: r.domain_name != null ? String(r.domain_name) : null,
    definition: '',
  }));
}

/** Conceitos de um domínio (corpo completo via data_json). */
export async function getCatalogConceptsByDomain<T = unknown>(domainId: string): Promise<T[]> {
  const db = await getCatalogDb();
  if (!db) return [];
  const rows = await db.query(
    'SELECT data_json FROM concept WHERE domain_id = ? ORDER BY display_order',
    [domainId]
  );
  return parseJsonRows(rows) as T[];
}

/** Um conceito pelo id. */
export async function getCatalogConcept<T = unknown>(id: string): Promise<T | null> {
  const db = await getCatalogDb();
  if (!db) return null;
  const rows = await db.query('SELECT data_json FROM concept WHERE id = ?', [id]);
  return rows.length > 0 ? (JSON.parse(String(rows[0].data_json)) as T) : null;
}

/** Autores curados (person + institution), mais citados primeiro. */
export async function getCatalogAuthors<T = unknown>(): Promise<T[]> {
  const db = await getCatalogDb();
  if (!db) return [];
  const rows = await db.query(
    'SELECT data_json FROM catalog_author ORDER BY question_count DESC, name ASC'
  );
  return parseJsonRows(rows) as T[];
}

/** Categorias de técnicas (10), em ordem de exibição. */
export async function getCatalogTechniqueCategories<
  T = unknown,
>(): Promise<T[]> {
  const db = await getCatalogDb();
  if (!db) return [];
  const rows = await db.query(
    'SELECT data_json FROM technique_category ORDER BY display_order'
  );
  return parseJsonRows(rows) as T[];
}

/** Técnicas canônicas (135), opcionalmente por categoria. */
export async function getCatalogTechniques<T = unknown>(categoryId?: string): Promise<T[]> {
  const db = await getCatalogDb();
  if (!db) return [];
  const rows = categoryId
    ? await db.query('SELECT data_json FROM technique WHERE category_id = ? ORDER BY display_order', [
        categoryId,
      ])
    : await db.query(
        'SELECT t.data_json FROM technique t JOIN technique_category c ON c.id = t.category_id ORDER BY c.display_order, t.display_order'
      );
  return parseJsonRows(rows) as T[];
}

/** Comparações editoriais, na ordem de prioridade, fase e título. */
export async function getCatalogComparisons<T = unknown>(): Promise<T[]> {
  const db = await getCatalogDb();
  if (!db) return [];
  const rows = await db.query(
    `SELECT data_json FROM comparison
     ORDER BY CASE priority WHEN 'P1' THEN 0 ELSE 1 END, phase ASC, id ASC`
  );
  return parseJsonRows(rows) as T[];
}

/** Uma comparação editorial pelo slug. */
export async function getCatalogComparison<T = unknown>(slug: string): Promise<T | null> {
  const db = await getCatalogDb();
  if (!db) return null;
  const rows = await db.query('SELECT data_json FROM comparison WHERE slug = ?', [slug]);
  return rows.length > 0 ? (JSON.parse(String(rows[0].data_json)) as T) : null;
}
