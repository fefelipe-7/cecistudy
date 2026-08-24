/**
 * Driver sql.js (wasm) — usado APENAS por scripts Node (`scripts/*.mjs`,
 * `content/*.mjs`) e testes vitest. Nada no app runtime importa este módulo:
 * o `import 'sql.js'` puxaria ~1.5 MB de wasm para o bundle.
 *
 * Mesma interface do driver nativo (`driver.ts`), com `exportDb()` extra
 * para persistir o banco em arquivo/bytes.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import type { SqlDriver, SqlRow, SqlValue } from './driver.ts';

interface SqlJsDatabase {
  run(sql: string, params?: SqlValue[]): void;
  exec(sql: string): unknown;
  prepare(sql: string): { bind(p: SqlValue[]): void; step(): boolean; getAsObject(): SqlRow; free(): void };
  export(): Uint8Array;
  close(): void;
}

type SqlJsStatic = {
  Database: new (data?: Uint8Array | Buffer) => SqlJsDatabase;
};

/**
 * Cria o driver (banco em memória, opcionalmente inicializado com bytes de um
 * `.db` existente). `open()` inicializa o wasm — separado do construtor porque
 * os scripts chamam `createSqlJsDriver()` de forma síncrona.
 */
export function createSqlJsDriver(
  initialBytes?: Uint8Array
): SqlDriver & { exportDb(): Promise<Uint8Array> } {
  // Estado preenchido no open(); as chamadas antes disso falham alto.
  let db: SqlJsDatabase | null = null;

  function requireDb(): SqlJsDatabase {
    if (!db) throw new Error('[sqlJsDriver] open() não foi chamado');
    return db;
  }

  return {
    async open() {
      const req = createRequire(import.meta.url);
      const initSqlJs = req('sql.js') as (cfg?: unknown) => Promise<SqlJsStatic>;
      const wasmDir = path.dirname(req.resolve('sql.js/dist/sql-wasm.wasm'));
      const SQL = await initSqlJs({ locateFile: (file: string) => path.join(wasmDir, file) });
      db = new SQL.Database(initialBytes);
    },

    async run(sql, params) {
      requireDb().run(sql, params ?? []);
    },

    async exec(sql) {
      requireDb().exec(sql);
    },

    async query(sql, params) {
      const database = requireDb();
      const stmt = database.prepare(sql);
      try {
        if (params && params.length > 0) stmt.bind(params);
        const rows: SqlRow[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        return rows;
      } finally {
        stmt.free();
      }
    },

    async exportDb() {
      return requireDb().export();
    },

    async close() {
      requireDb().close();
      db = null;
    },
  };
}
