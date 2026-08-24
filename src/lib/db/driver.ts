/**
 * Interface de driver SQL + adaptador nativo (`@capacitor-community/sqlite`).
 *
 * O app nunca fala SQL diretamente da UI: views → casos de uso/repositórios
 * (`normalize`, `userDb`, `catalogDb`) → `SqlDriver` → SQLite.
 *
 * - `createNativeSqliteDriver` — Capacitor (iOS/Android). Import dinâmico do
 *   plugin ⇒ **browser-safe**: no web o módulo pode ser importado sem efeito.
 * - `createSqlJsDriver` (`sqlJsDriver.ts`) — sql.js para scripts Node e testes
 *   vitest. NÃO importar deste arquivo no app (entraria no bundle).
 */

export type SqlValue = null | string | number | Uint8Array;

/** Linha genérica de resultado de consulta. */
export interface SqlRow {
  [column: string]: SqlValue;
}

/**
 * Driver mínimo usado por migrações, repositórios e scripts.
 * `run` = 1 statement com params · `exec` = múltiplos statements sem params.
 */
export interface SqlDriver {
  open(): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<void>;
  exec(sql: string): Promise<void>;
  query(sql: string, params?: SqlValue[]): Promise<SqlRow[]>;
  /** Exporta o banco inteiro como bytes (sql.js; nativo usa backup do plugin). */
  exportDb?(): Promise<Uint8Array>;
  close(): Promise<void>;
}

interface NativeCapacitorSQLite {
  createConnection(opts: unknown): Promise<void>;
  open(opts: unknown): Promise<void>;
  close(opts: unknown): Promise<void>;
  execute(opts: { database: string; statements: string; transaction?: boolean }): Promise<unknown>;
  run(opts: {
    database: string;
    statement: string;
    values?: unknown[];
    transaction?: boolean;
  }): Promise<{ changes?: { changes?: number } }>;
  query(opts: {
    database: string;
    statement: string;
    values?: unknown[];
  }): Promise<{ values?: unknown[] }>;
}

function toNativeParams(params?: SqlValue[]): unknown[] | undefined {
  if (!params) return undefined;
  return params.map((p) => (p instanceof Uint8Array ? p : p));
}

/**
 * Abre (ou cria) o banco `database` no plugin comunitário e devolve um driver.
 * `setup` roda após abrir — lugar padrão para `runUserMigrations`/bootstrap.
 */
export async function createNativeSqliteDriver(
  database: string,
  setup?: (driver: SqlDriver) => Promise<void>
): Promise<SqlDriver> {
  const mod = (await import('@capacitor-community/sqlite')) as {
    CapacitorSQLite: NativeCapacitorSQLite;
  };
  const sqlite = mod.CapacitorSQLite;

  await sqlite.createConnection({
    database,
    encrypted: false,
    mode: 'no-encryption',
    version: 1,
    readonly: false,
  });
  await sqlite.open({ database, readonly: false });

  const driver: SqlDriver = {
    async open() {
      /* conexão já estabelecida acima */
    },
    async run(sql, params) {
      await sqlite.run({ database, statement: sql, values: toNativeParams(params) });
    },
    async exec(sql) {
      await sqlite.execute({ database, statements: sql });
    },
    async query(sql, params) {
      const res = await sqlite.query({ database, statement: sql, values: toNativeParams(params) });
      return (res.values ?? []) as SqlRow[];
    },
    async close() {
      await sqlite.close({ database });
    },
  };

  if (setup) await setup(driver);
  return driver;
}
