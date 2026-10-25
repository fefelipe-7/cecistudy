import { describe, it, expect, vi } from 'vitest';
import { createSqlJsDriver } from '../sqlJsDriver';
import { runUserMigrations, getAppliedVersion, LATEST_USER_VERSION } from '../migrations';
import { USER_TABLES_SQL } from '../migrations/user';
import type { SqlDriver } from '../driver';

/**
 * SPEC-M-026 D2 / I3-I4 — migração é atômica e tem cópia antes.
 *
 * Antes, cada passo rodava solto: uma queda no meio deixava tabela pela metade
 * e versão não registrada (ou registrada sem o passo). Nenhum outro gate
 * cobria isso, e o passo 4 tem o único `DROP TABLE` do projeto.
 */

/** Driver que aplica o passo 4 pela metade e estoura no meio, como uma queda. */
function driverQueFalhaNoPasso4(base: SqlDriver): SqlDriver {
  return {
    ...base,
    async exec(sql: string) {
      if (!sql.includes('DROP TABLE IF EXISTS thesis_chapter')) return base.exec(sql);
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const [i, statement] of statements.entries()) {
        if (i === 2) throw new Error('disco cheio');
        await base.exec(statement);
      }
    },
  };
}

describe('runUserMigrations (SPEC-M-026 D2)', () => {
  it('passo que falha no meio não perde linha nem deixa tabela nova', async () => {
    const base = createSqlJsDriver();
    await base.open();
    // O passo 1 cria `thesis_chapter`; o passo 4 a derruba e recria. Uma linha
    // nela prova que o `DROP` foi desfeito pelo `ROLLBACK`.
    await base.exec(USER_TABLES_SQL);
    await base.run('INSERT INTO thesis_chapter (thesis_id, position, title) VALUES (?, ?, ?)', [
      1,
      0,
      'cap 1',
    ]);

    await expect(runUserMigrations(driverQueFalhaNoPasso4(base), async () => {})).rejects.toThrow(
      'disco cheio',
    );

    expect(await getAppliedVersion(base)).toBe(3);
    const linhas = await base.query('SELECT title FROM thesis_chapter');
    expect(linhas.map((l) => l.title)).toEqual(['cap 1']);
    // `thesis_meeting` só nasce no passo 4: se existir, o passo ficou pela metade.
    const novas = await base.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'thesis_meeting'",
    );
    expect(novas).toHaveLength(0);
  });

  it('snapshot roda uma vez, antes do primeiro passo pendente', async () => {
    const base = createSqlJsDriver();
    await base.open();
    const snapshot = vi.fn(async () => {});

    await runUserMigrations(base, snapshot);

    expect(snapshot).toHaveBeenCalledTimes(1);
    expect(snapshot).toHaveBeenCalledWith(base, 0, LATEST_USER_VERSION);
    expect(await getAppliedVersion(base)).toBe(LATEST_USER_VERSION);
  });

  it('sem passo pendente, não tira snapshot', async () => {
    const base = createSqlJsDriver();
    await base.open();
    await runUserMigrations(base, async () => {});

    const snapshot = vi.fn(async () => {});
    await runUserMigrations(base, snapshot);

    expect(snapshot).not.toHaveBeenCalled();
  });

  it('snapshot que falha impede a migração', async () => {
    const base = createSqlJsDriver();
    await base.open();

    await expect(
      runUserMigrations(base, async () => {
        throw new Error('sem espaço para a cópia');
      }),
    ).rejects.toThrow('sem espaço para a cópia');

    expect(await getAppliedVersion(base)).toBe(0);
  });
});
