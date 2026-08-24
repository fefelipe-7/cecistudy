/**
 * Runner de migrações numeradas da base da usuária (`cecistudy_user`).
 *
 * Cada passo registra sua versão em `schema_migrations`; o runner é idempotente
 * e aplica apenas os passos pendentes, em ordem. A v1 cria todo o schema
 * (ver `migrations/user.ts`); versões futuras entram como novos passos com
 * `ALTER`/`CREATE` incrementais — nunca editando um passo já aplicado.
 */
import { USER_TABLES_SQL } from './migrations/user.ts';
import type { SqlDriver } from './driver.ts';

export { USER_SCHEMA_VERSION, USER_DB_NAME } from './migrations/user.ts';

interface MigrationStep {
  version: number;
  up: string;
}

const MIGRATIONS: MigrationStep[] = [{ version: 1, up: USER_TABLES_SQL }];

/** Última versão conhecida deste código (independente do banco aberto). */
export const LATEST_USER_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Versão já aplicada no banco (0 = base nova/vazia). */
export async function getAppliedVersion(driver: SqlDriver): Promise<number> {
  try {
    const rows = await driver.query(
      'SELECT MAX(version) AS v FROM schema_migrations'
    );
    return Number(rows[0]?.v ?? 0);
  } catch {
    // Tabela ainda não existe (base criada fora do runner).
    return 0;
  }
}

/**
 * Aplica os passos pendentes. Idempotente: pode ser chamada em todo boot.
 * Retorna a versão corrente do banco após a execução.
 */
export async function runUserMigrations(driver: SqlDriver): Promise<number> {
  await driver.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const current = await getAppliedVersion(driver);
  for (const step of MIGRATIONS) {
    if (step.version <= current) continue;
    await driver.exec(step.up);
    await driver.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      step.version,
      new Date().toISOString(),
    ]);
  }
  return Math.max(current, LATEST_USER_VERSION);
}
