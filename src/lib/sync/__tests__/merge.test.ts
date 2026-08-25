import { describe, it, expect } from 'vitest';
import { mergeSyncedDatabases } from '../merge';
import { emptySyncIndex, applyStampChange } from '../stamp';
import { emptyDatabase } from '../../../data/empty';
import type { SyncIndex } from '../../../types';
import type { EmptyDatabase } from '../../../data/empty';

/** Banco de teste com índice carimbado via helpers reais. */
function makeDb(mutate: (db: EmptyDatabase, idx: SyncIndex) => void): EmptyDatabase {
  const db = emptyDatabase();
  const idx = emptySyncIndex();
  mutate(db, idx);
  return { ...db, syncIndex: idx };
}

describe('mergeSyncedDatabases', () => {
  it('união de registros criados em lados diferentes', () => {
    const local = makeDb((db) => {
      db.courses = [{ id: 'c1', name: 'local' } as never];
    });
    const remote = makeDb((db) => {
      db.courses = [{ id: 'c2', name: 'remota' } as never];
    });
    const { merged } = mergeSyncedDatabases(local, remote);
    expect(merged.courses.map((c) => c.id).sort()).toEqual(['c1', 'c2']);
  });

  it('LWW por registro: edição mais recente vence nos dois lados', () => {
    let local = makeDb((db) => {
      db.courses = [{ id: 'c1', name: 'v1' } as never];
    });
    let remote = makeDb((db) => {
      db.courses = [{ id: 'c1', name: 'v1' } as never];
    });
    // Edição no local (ts 100)
    local = {
      ...local,
      courses: [{ id: 'c1', name: 'editada no local' } as never],
      syncIndex: applyStampChange(local.syncIndex, 'courses', [{ id: 'c1', name: 'v1' }], [{ id: 'c1', name: 'editada no local' }], 100).index,
    };
    // Edição mais antiga no remoto (ts 50)
    remote = {
      ...remote,
      courses: [{ id: 'c1', name: 'editada no remoto' } as never],
      syncIndex: applyStampChange(remote.syncIndex, 'courses', [{ id: 'c1', name: 'v1' }], [{ id: 'c1', name: 'editada no remoto' }], 50).index,
    };
    const ab = mergeSyncedDatabases(local, remote);
    const ba = mergeSyncedDatabases(remote, local);
    expect(ab.merged).toEqual(ba.merged); // determinístico/simétrico
    expect(ab.merged.courses[0].name).toBe('editada no local');
  });

  it('tombstone mais recente que o registro impede ressurreição', () => {
    // Local criou t1 (ts 100), remoto também tem t1; depois o remoto apagou (ts 200)
    let local = makeDb(() => {});
    local = {
      ...local,
      tasks: [{ id: 't1', title: 'x' } as never],
      syncIndex: applyStampChange(local.syncIndex, 'tasks', [], [{ id: 't1', title: 'x' }], 100).index,
    };
    let remoteBase = emptyDatabase();
    remoteBase.tasks = [{ id: 't1', title: 'x' } as never];
    const stamped = applyStampChange(emptySyncIndex(), 'tasks', [], [{ id: 't1', title: 'x' }], 100);
    const deleted = applyStampChange(stamped.index, 'tasks', [{ id: 't1', title: 'x' }], [], 200);
    const remote = { ...remoteBase, syncIndex: deleted.index };
    const { merged } = mergeSyncedDatabases(local, remote);
    expect(merged.tasks).toHaveLength(0);
  });

  it('registro editado depois da deleção do outro lado sobrevive', () => {
    // Local apagou t1 (ts 100); remoto editou t1 depois (ts 300)
    const createdLocal = applyStampChange(emptySyncIndex(), 'tasks', [], [{ id: 't1', title: 'x' }], 50);
    const deletedLocal = applyStampChange(createdLocal.index, 'tasks', [{ id: 't1', title: 'x' }], [], 100);
    const local = { ...emptyDatabase(), tasks: [], syncIndex: deletedLocal.index };

    const createdRemote = applyStampChange(emptySyncIndex(), 'tasks', [], [{ id: 't1', title: 'antiga' }], 50);
    const editedRemote = applyStampChange(
      createdRemote.index,
      'tasks',
      [{ id: 't1', title: 'antiga' }],
      [{ id: 't1', title: 'nova' }],
      300
    );
    const remote = { ...emptyDatabase(), tasks: [{ id: 't1', title: 'nova' } as never], syncIndex: editedRemote.index };

    const { merged } = mergeSyncedDatabases(local, remote);
    expect(merged.tasks.map((t) => t.title)).toEqual(['nova']);
  });

  it('coleção única (profile) segue LWW pelo stamp da coleção', () => {
    const local = makeDb(() => {});
    local.profile = { ...local.profile, name: 'local' };
    const remote = makeDb(() => {});
    remote.profile = { ...remote.profile, name: 'remoto' };
    remote.syncIndex.stamps.profile = 999;
    const { merged } = mergeSyncedDatabases(local, remote);
    expect(merged.profile.name).toBe('remoto');
  });

  it('sets (salvos/favoritos) e streak fazem união', () => {
    const local = makeDb((db) => {
      db.savedBookIds = ['bk-1'];
      db.bookmarkedCourseIds = ['c1'];
      db.streakData = { activeDays: ['2026-08-01'] };
    });
    const remote = makeDb((db) => {
      db.savedBookIds = ['bk-2'];
      db.bookmarkedCourseIds = ['c2'];
      db.streakData = { activeDays: ['2026-08-02'] };
    });
    const { merged } = mergeSyncedDatabases(local, remote);
    expect(merged.savedBookIds).toEqual(['bk-1', 'bk-2']);
    expect(merged.bookmarkedCourseIds).toEqual(['c1', 'c2']);
    expect(merged.streakData.activeDays).toEqual(['2026-08-01', '2026-08-02']);
  });

  it('stats descrevem o delta de cada lado', () => {
    const local = makeDb((db) => {
      db.tasks = [{ id: 't1', title: 'só local' } as never];
    });
    const remote = makeDb((db) => {
      db.exams = [{ id: 'e9', title: 'só remota' } as never];
    });
    const { local: sl, remote: sr } = mergeSyncedDatabases(local, remote);
    expect(sl.added).toBe(1); // ganha a prova do remoto
    expect(sr.added).toBe(1); // remoto ganha a tarefa local
  });

  it('merge de bancos vazios é vazio e simétrico', () => {
    const a = emptyDatabase();
    const b = emptyDatabase();
    const ab = mergeSyncedDatabases(a, b);
    const ba = mergeSyncedDatabases(b, a);
    expect(ab.merged).toEqual(ba.merged);
    expect(ab.merged.courses).toHaveLength(0);
  });
});
