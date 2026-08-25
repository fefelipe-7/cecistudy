/**
 * Carimbos de alteração para sincronização entre dispositivos (Fase Sync S1).
 *
 * Funções PURAS — sem acesso a React/storage. Consumidas por `useStampedState`
 * (gravação automática) e por `merge.ts` (merge LWW bidirecional).
 *
 * Modelo:
 * - Cada coleção tem `stamps[chave]` = última alteração (epoch ms).
 * - Coleções-array têm ainda `records[chave][id]` = última alteração do registro.
 * - Remoções viram `tombstones[chave][id]` — propagam a deleção e impedem
 *   ressurreição no merge.
 */
import type { SyncIndex } from '../../types';

export const RECORD_COLLECTION_KEYS = [
  'courses',
  'classes',
  'tasks',
  'exams',
  'authors',
  'concepts',
  'readings',
  'flashcards',
  'materials',
  'internshipLogs',
  'supervision',
  'sessions',
  'techniques',
  'quizSessions',
  'looseNotes',
  'questions',
] as const;

export type RecordCollectionKey = (typeof RECORD_COLLECTION_KEYS)[number];

/** Coleções de valor único — merge por LWW da coleção inteira. */
export const SINGLE_COLLECTION_KEYS = [
  'profile',
  'tcc',
  'stickers',
  'streakData',
  'reminder',
  'onboarding',
  'readingProgress',
] as const;

/** Coleções-set (ids) — merge por união. */
export const SET_COLLECTION_KEYS = ['savedBookIds', 'bookmarkedCourseIds'] as const;

export function emptySyncIndex(): SyncIndex {
  return { stamps: {}, records: {}, tombstones: {} };
}

const isRecordCollection = (key: string): key is RecordCollectionKey =>
  (RECORD_COLLECTION_KEYS as readonly string[]).includes(key);

interface IdRecord {
  id?: unknown;
}

function idOf(item: unknown): string | null {
  if (!item || typeof item !== 'object') return null;
  const id = (item as IdRecord).id;
  return typeof id === 'string' ? id : null;
}

function indexById(items: unknown[]): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const item of items) {
    const id = idOf(item);
    if (id !== null) map.set(id, item);
  }
  return map;
}

/** Serialização estável o suficiente para detectar mudança de conteúdo. */
function stableKey(item: unknown): string {
  try {
    return JSON.stringify(item);
  } catch {
    return String(item);
  }
}

/**
 * Desempate simétrico do LWW (dois lados com timestamp igual): escolhe a
 * serialização "maior". Determinístico nos dois dispositivos → convergem.
 */
export function tieBreak(local: unknown, remote: unknown): unknown {
  const l = stableKey(local);
  const r = stableKey(remote);
  return r > l ? remote : local;
}

export interface StampChangeResult {
  index: SyncIndex;
  /** Quantidade de registros criados/alterados (para stats). */
  changedRecords: number;
  removedIds: string[];
}

/**
 * Aplica uma mudança de coleção ao índice.
 * - Array de registros: carimba criados/alterados e gera tombstones dos removidos.
 * - Qualquer valor: bump do stamp da coleção.
 * Retorna um NOVO índice (imutável) — nunca muta `prev`.
 */
export function applyStampChange(
  prev: SyncIndex,
  key: string,
  oldValue: unknown,
  newValue: unknown,
  now: number
): StampChangeResult {
  const stamps = { ...prev.stamps, [key]: now };
  let records = prev.records;
  let tombstones = prev.tombstones;
  let changedRecords = 0;
  let removedIds: string[] = [];

  if (isRecordCollection(key) && Array.isArray(newValue)) {
    const oldMap = Array.isArray(oldValue) ? indexById(oldValue) : new Map<string, unknown>();
    const newIds = new Set<string>();

    for (const item of newValue) {
      const id = idOf(item);
      if (id === null) continue;
      newIds.add(id);
      const before = oldMap.get(id);
      if (before === undefined || stableKey(before) !== stableKey(item)) {
        records = {
          ...records,
          [key]: { ...(records[key] ?? {}), [id]: now },
        };
        changedRecords++;
      }
    }

    for (const [id] of oldMap) {
      if (!newIds.has(id)) {
        removedIds.push(id);
        tombstones = {
          ...tombstones,
          [key]: { ...(tombstones[key] ?? {}), [id]: now },
        };
        // Limpa o stamp do registro removido (o tombstone passa a valer).
        const keyRecords = { ...(records[key] ?? {}) };
        delete keyRecords[id];
        records = { ...records, [key]: keyRecords };
      }
    }
  }

  return { index: { stamps, records, tombstones }, changedRecords, removedIds };
}

/** Timestamp efetivo de um registro vivo (0 quando desconhecido). */
export function recordTs(index: SyncIndex, key: string, id: string): number {
  return index.records[key]?.[id] ?? 0;
}

/** Timestamp efetivo de um tombstone (0 quando inexistente). */
export function tombstoneTs(index: SyncIndex, key: string, id: string): number {
  return index.tombstones[key]?.[id] ?? 0;
}

/**
 * Une dois índices (pós-merge): mantém o máximo de cada carimbo/tombstone.
 * Simétrico → ambos os dispositivos chegam ao mesmo índice.
 */
export function mergeIndexes(a: SyncIndex, b: SyncIndex): SyncIndex {
  const maxMap = (
    x: Record<string, number> | undefined,
    y: Record<string, number> | undefined
  ): Record<string, number> => {
    const out: Record<string, number> = { ...(x ?? {}) };
    for (const [k, v] of Object.entries(y ?? {})) out[k] = Math.max(out[k] ?? 0, v);
    return out;
  };
  return {
    stamps: maxMap(a.stamps, b.stamps),
    records: Object.fromEntries(
      Array.from(new Set([...Object.keys(a.records ?? {}), ...Object.keys(b.records ?? {})])).map(
        (k) => [k, maxMap(a.records?.[k], b.records?.[k])]
      )
    ),
    tombstones: Object.fromEntries(
      Array.from(new Set([...Object.keys(a.tombstones ?? {}), ...Object.keys(b.tombstones ?? {})])).map(
        (k) => [k, maxMap(a.tombstones?.[k], b.tombstones?.[k])]
      )
    ),
  };
}
