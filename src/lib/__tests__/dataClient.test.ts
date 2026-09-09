import { describe, expect, it, vi } from 'vitest';
import {
  repositories,
  applyDatabaseToSetters,
  snapshotFromState,
  buildBackupPayload,
  importAppDatabase,
  createSyncAdapter,
  type DataClientSetters,
  type PersistedDatabase,
  type PersistedStateSnapshot,
} from '@/lib/dataClient';
import { emptyDatabase } from '@/data/empty';
import type { Sticker } from '@/types';

const sticker = (id: string, name = 's'): Sticker => ({
  id,
  name,
  emoji: '🌷',
  description: 'd',
  unlocked: false,
  category: 'faculdade',
});

describe('repositories (CRUD puro)', () => {
  it('upsert insere quando não existe e atualiza por id quando existe', () => {
    const repo = repositories.stickers;
    const base = [sticker('a'), sticker('b')];
    const inserted = repo.upsert(base, sticker('c'));
    expect(inserted).toHaveLength(3);
    const updated = repo.upsert(inserted, { ...sticker('a'), name: 'A2' });
    expect(updated).toHaveLength(3);
    expect(updated.find((s) => s.id === 'a')?.name).toBe('A2');
    // imutabilidade
    expect(base).toHaveLength(2);
  });

  it('remove filtra por id e getById busca corretamente', () => {
    const repo = repositories.stickers;
    const base = [sticker('a'), sticker('b')];
    expect(repo.getById({ stickers: base } as any, 'b')?.id).toBe('b');
    const removed = repo.remove(base, 'a');
    expect(removed.map((s) => s.id)).toEqual(['b']);
  });

  it('replaceAll troca a coleção inteira', () => {
    const repo = repositories.stickers;
    const next = repo.replaceAll([sticker('x')]);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe('x');
  });
});

describe('applyDatabaseToSetters', () => {
const makeSetters = (): DataClientSetters => ({
      profile: vi.fn(),
      courses: vi.fn(),
      classes: vi.fn(),
      tasks: vi.fn(),
      exams: vi.fn(),
      authors: vi.fn(),
      concepts: vi.fn(),
      readings: vi.fn(),
      flashcards: vi.fn(),
      materials: vi.fn(),
      internshipLogs: vi.fn(),
      stickers: vi.fn(),
      sessions: vi.fn(),
      techniques: vi.fn(),
      quizSessions: vi.fn(),
      streakData: vi.fn(),
      reminder: vi.fn(),
      looseNotes: vi.fn(),
      savedBookIds: vi.fn(),
      readingProgress: vi.fn(),
      bookmarkedCourseIds: vi.fn(),
      tcc: vi.fn(),
      onboarding: vi.fn(),
      syncIndex: vi.fn(),
    });

  it('aplica cada coleção no setter correspondente (e ignora bancos estáticos)', () => {
    const db = emptyDatabase();
    const s = makeSetters();
    applyDatabaseToSetters(db, s);
    expect(s.profile).toHaveBeenCalledWith(db.profile);
    expect(s.courses).toHaveBeenCalledWith(db.courses);
    expect(s.stickers).toHaveBeenCalledWith(db.stickers);
    expect(s.syncIndex).toHaveBeenCalledWith(db.syncIndex);
  });

  it('aplica transformStickers e usa syncIndex padrão quando ausente', () => {
    const db = { ...emptyDatabase(), syncIndex: undefined } as unknown as PersistedDatabase;
    const transform = vi.fn((list: Sticker[]) => [...list, sticker('x')]);
    const s = makeSetters();
    applyDatabaseToSetters(db, s, { transformStickers: transform });
    expect(transform).toHaveBeenCalled();
    expect(s.stickers).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'x' })]));
    expect(s.syncIndex).toHaveBeenCalledWith({ stamps: {}, records: {}, tombstones: {} });
  });
});

describe('snapshotFromState', () => {
  it('normaliza readingProgress/syncIndex ausentes', () => {
    const snap = {
      ...emptyDatabase(),
      readingProgress: undefined as any,
      syncIndex: undefined as any,
    } as any;
    const out = snapshotFromState(snap);
    expect(out.readingProgress).toEqual({});
    expect(out.syncIndex).toEqual({ stamps: {}, records: {}, tombstones: {} });
  });
});

describe('backup/restore round-trip', () => {
  it('exporta e reimporta preservando as coleções do usuário', async () => {
    const db = emptyDatabase() as unknown as PersistedStateSnapshot;
    db.courses = [
      {
        id: 'c1',
        name: 'psicologia',
        code: 'PSI-1',
        professor: 'prof',
        semester: '1',
        schedule: [],
        room: '',
        color: '#fff',
        icon: 'BookOpen' as any,
        progress: 0,
        description: '',
      } as any,
    ];
    const payload = await buildBackupPayload(db);
    const json = JSON.stringify(payload);
    const restored = importAppDatabase(json);
    expect(restored).not.toBeNull();
    expect(restored?.courses[0]?.id).toBe('c1');
    // bancos estáticos NÃO viajam no backup
    expect((payload.payload as any).approaches).toBeUndefined();
  });

  it('rejeita payload de formato desconhecido', () => {
    expect(importAppDatabase('{"format":"x"}')).toBeNull();
  });
});

describe('createSyncAdapter', () => {
  it('delega o merge para a função injetada', () => {
    const merge = (local: PersistedDatabase) => ({ ...local, courses: [] });
    const adapter = createSyncAdapter(merge);
    const out = adapter.merge(emptyDatabase(), undefined, undefined);
    expect(out.courses).toEqual([]);
  });
});
