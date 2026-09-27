import { describe, it, expect } from 'vitest';
import {
  COLLECTIONS,
  USER_COLLECTION_KEYS,
  SYNCABLE_COLLECTION_KEYS,
  SET_LIKE_COLLECTION_KEYS,
  getCollection,
  getCollectionTable,
  isUserCollectionKey,
} from '@/lib/collections';
import { emptyDatabase } from '@/data/empty';
import { buildBackupData, type PersistedStateSnapshot } from '@/lib/persistentData';

/**
 * `emptyDatabase()` é `PersistedDatabase`; `buildBackupData` quer o snapshot do
 * contexto. Aqui só interessa o conjunto de chaves, então o cast é seguro.
 */
const snapshot = () => emptyDatabase() as unknown as PersistedStateSnapshot;

describe('registry de coleções (T0.3)', () => {
  it('não tem chaves duplicadas', () => {
    const keys = COLLECTIONS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('toda coleção persistida tem tabela física', () => {
    const semTabela = COLLECTIONS.filter((c) => c.table === null).map((c) => c.key);
    expect(semTabela).toEqual([]);
  });

  it('kind idList tem itemType e kind map não tem', () => {
    for (const c of COLLECTIONS) {
      const spec = getCollection(c.key);
      if (spec?.kind === 'idList') expect(spec.itemType, c.key).toBeTruthy();
      if (spec?.kind === 'map') expect(spec.itemType, c.key).toBeUndefined();
    }
  });

  it('savedBookIds e bookmarkedCourseIds compartilham tabela com item_type distinto', () => {
    const book = getCollection('savedBookIds');
    const course = getCollection('bookmarkedCourseIds');
    expect(book?.table).toBe('saved_catalog_item');
    expect(book?.itemType).toBe('book');
    expect(course?.table).toBe('saved_catalog_item');
    expect(course?.itemType).toBe('course');
  });

  it('isUserCollectionKey aceita persistidas e recusa prefs/estáticas', () => {
    expect(isUserCollectionKey('courses')).toBe(true);
    expect(isUserCollectionKey('decks')).toBe(true);
    expect(isUserCollectionKey('reminder')).toBe(false);
    expect(isUserCollectionKey('onboarding')).toBe(false);
    expect(isUserCollectionKey('approaches')).toBe(false);
    expect(isUserCollectionKey('questions')).toBe(false);
    expect(isUserCollectionKey('syncIndex')).toBe(false);
  });

  it('getCollection/getCollectionTable são totais para chaves do registry', () => {
    for (const key of USER_COLLECTION_KEYS) {
      expect(getCollection(key), key).toBeDefined();
      expect(getCollectionTable(key), key).toBeTruthy();
    }
  });

  it('SYNCABLE + não-syncable cobrem todas as coleções, sem sobreposição', () => {
    const sync = new Set<string>(SYNCABLE_COLLECTION_KEYS);
    const naoSync = COLLECTIONS.filter((c) => !c.syncable).map((c) => c.key);
    expect(sync.size + naoSync.length).toBe(COLLECTIONS.length);
    for (const key of naoSync) expect(sync.has(key)).toBe(false);
  });

  it('supervision fica fora do sync (não sai no payload de backup)', () => {
    // lacuna de contrato conhecida: supervision nunca entrou em buildBackupData.
    expect(getCollection('supervision')?.syncable).toBe(false);
  });

  it('toda coleção sincronizável aparece no payload de backup', () => {
    const payload = buildBackupData(snapshot()) as Record<string, unknown>;
    const faltando = SYNCABLE_COLLECTION_KEYS.filter((key) => !(key in payload));
    expect(faltando).toEqual([]);
  });

  it('toda coleção sincronizável existe no EmptyDatabase (contrato único)', () => {
    const db = emptyDatabase() as unknown as Record<string, unknown>;
    const faltando = SYNCABLE_COLLECTION_KEYS.filter((key) => !(key in db));
    expect(faltando).toEqual([]);
  });

  it('ordem do registry é congelada (import legado depende da sequência)', () => {
    // A ordem NÃO é a do payload (buildBackupData diverge: `techniques` vem
    // depois de `bookmarkedCourseIds` lá). É a ordem de hidratação/import
    // legado. Reordenar muda o comportamento do import de Preferences.
    expect([...USER_COLLECTION_KEYS]).toEqual([
      'profile',
      'courses',
      'classes',
      'tasks',
      'exams',
      'authors',
      'concepts',
      'readings',
      'flashcards',
      'decks',
      'materials',
      'techniques',
      'internshipLogs',
      'supervision',
      'tcc',
      'stickers',
      'sessions',
      'streakData',
      'looseNotes',
      'savedBookIds',
      'bookmarkedCourseIds',
      'readingProgress',
      'quizSessions',
      'academicTerms',
    ]);
  });

  it('coleções set-like exigem merge por conjunto/mappa, não LWW', () => {
    for (const key of SET_LIKE_COLLECTION_KEYS) {
      expect(getCollection(key)?.syncable, key).toBe(true);
    }
  });

  it('kind declarado bate com o valor do emptyDatabase', () => {
    const db = emptyDatabase() as unknown as Record<string, unknown>;
    for (const c of COLLECTIONS) {
      const valor = db[c.key];
      // `supervision` é legada: não existe mais no contrato de payload.
      if (!(c.key in db)) {
        expect(c.syncable, `${c.key} ausente do EmptyDatabase precisa ser syncable: false`).toBe(
          false
        );
        continue;
      }
      if (c.kind === 'array' || c.kind === 'idList') {
        expect(Array.isArray(valor), c.key).toBe(true);
      }
      if (c.kind === 'singleton') {
        expect(valor !== null && !Array.isArray(valor), c.key).toBe(true);
      }
      if (c.kind === 'map') {
        expect(
          valor !== null && typeof valor === 'object' && !Array.isArray(valor),
          c.key
        ).toBe(true);
      }
    }
  });
});
