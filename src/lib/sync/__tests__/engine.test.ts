import { describe, expect, it } from 'vitest';
import { emptyDatabase } from '@/data/empty';
import { SyncEngine, INITIAL_CHECKPOINT, type SyncCheckpoint } from '../engine';
import type {
  RemotePackage,
  SyncManifest,
  SyncPackage,
  SyncProvider,
} from '../provider';
import type { SyncableDatabase } from '../../../../packages/sync/src/merge';

class InMemoryProvider implements SyncProvider {
  private pkg: RemotePackage | null = null;
  async getManifest() {
    return this.pkg?.package.manifest ?? null;
  }
  async downloadPackage() {
    return this.pkg;
  }
  async uploadPackage(p: SyncPackage, _baseSha?: string) {
    const sha = `sha-${p.manifest.revision}`;
    this.pkg = { package: p, sha };
    return { revision: p.manifest.revision, sha };
  }
}

const deps = (deviceId: string) => ({
  deviceId,
  appVersion: '1.0.0',
  schemaVersion: 10,
  parseBackup: async (j: string) => JSON.parse(j) as SyncableDatabase,
  stringifyBackup: (d: SyncableDatabase) => JSON.stringify(d),
});

function withCourse(db: ReturnType<typeof emptyDatabase>, id: string, name: string) {
  db.courses = [
    { id, name, code: '', professor: '', semester: 1, schedule: [], room: '', color: '#fff', icon: 'book', progress: 0, description: '' },
  ] as unknown as ReturnType<typeof emptyDatabase>['courses'];
  return db;
}

describe('SyncEngine', () => {
  it('inspect retorna sem remoto inicialmente', async () => {
    const engine = new SyncEngine(new InMemoryProvider(), deps('notebook'));
    expect(await engine.inspect()).toEqual({ hasRemote: false, manifest: null });
  });

  it('push sobe o pacote e incrementa a revisão (CAS via checkpoint)', async () => {
    const provider = new InMemoryProvider();
    const engine = new SyncEngine(provider, deps('notebook'));
    const local = withCourse(emptyDatabase(), 'c1', 'Local');
    const res = await engine.push(JSON.stringify(local), INITIAL_CHECKPOINT);
    expect(res.revision).toBe(1);
    const manifest = (await provider.getManifest()) as SyncManifest;
    expect(manifest.revision).toBe(1);
    expect(manifest.deviceId).toBe('notebook');
    expect(manifest.parentRevision).toBe(0);
  });

  it('needsUpload é falso logo após o push (stamp não mudou)', async () => {
    const engine = new SyncEngine(new InMemoryProvider(), deps('notebook'));
    const cp: SyncCheckpoint = { ...INITIAL_CHECKPOINT, baseRevision: 1, lastLocalMaxStamp: 0 };
    expect(engine.needsUpload(cp, 0)).toBe(false);
    expect(engine.needsUpload(cp, 42)).toBe(true);
  });

  it('pullAndMerge baixa o remoto e funde com o local (reutiliza merge)', async () => {
    const provider = new InMemoryProvider();
    const local = withCourse(emptyDatabase(), 'c1', 'Local');
    const pushRes = await new SyncEngine(provider, deps('notebook')).push(
      JSON.stringify(local),
      INITIAL_CHECKPOINT,
    );

    const remoteDb = withCourse(emptyDatabase(), 'c2', 'Remote');
    const engine2 = new SyncEngine(provider, deps('celular'));
    const pull = await engine2.pullAndMerge(JSON.stringify(remoteDb));
    // device2 (sem cursos) ganha c1 do remoto
    expect(pull.preview.local.added).toBe(1);
    expect(pull.remoteManifest.revision).toBe(pushRes.revision);
    const merged = JSON.parse(pull.mergedJson) as ReturnType<typeof emptyDatabase>;
    expect(merged.courses.map((c: { id: string }) => c.id).sort()).toEqual(['c1', 'c2']);
  });

  it('push após pull atualiza checkpoint com sha e revisão remota', async () => {
    const provider = new InMemoryProvider();
    const local = withCourse(emptyDatabase(), 'c1', 'Local');
    const engine = new SyncEngine(provider, deps('notebook'));
    await engine.push(JSON.stringify(local), INITIAL_CHECKPOINT);

    const engine2 = new SyncEngine(provider, deps('celular'));
    const pull = await engine2.pullAndMerge(JSON.stringify(emptyDatabase()));
    // device2 sobe sua versão (revision 2) com base no sha remoto
    const push2 = await engine2.push(JSON.stringify(withCourse(emptyDatabase(), 'c3', 'C3')), {
      ...INITIAL_CHECKPOINT,
      baseRevision: pull.remoteManifest.revision,
      baseBlobSha: pull.remoteSha,
      lastLocalMaxStamp: 0,
    });
    expect(push2.revision).toBe(2);
  });
});
