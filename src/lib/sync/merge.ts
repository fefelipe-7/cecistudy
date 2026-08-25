/**
 * Merge bidirecional determinístico entre dois bancos sincronizados.
 *
 * Regras (Fase Sync S1):
 * - Coleções de registros → LWW por registro usando `SyncIndex.records`,
 *   com tombstones vencendo registros mais antigos que a deleção.
 * - Coleções de valor único → LWW pelo `stamps` da coleção.
 * - Coleções-set (ids salvos/favoritos) e dias de streak → união.
 * - Empates de timestamp → desempate simétrico por serialização
 *   (`tieBreak`) — ambos os dispositivos chegam ao MESMO resultado.
 *
 * Os bancos estáticos (`approaches`/`questions`-catálogo) não participam:
 * são re-semeados sob demanda em cada dispositivo.
 */
import type { SyncIndex } from '../../types';
import { EmptyDatabase, emptyDatabase } from '../../data/empty';
import {
  RECORD_COLLECTION_KEYS,
  SET_COLLECTION_KEYS,
  SINGLE_COLLECTION_KEYS,
  applyStampChange,
  mergeIndexes,
  recordTs,
  tieBreak,
  tombstoneTs,
} from './stamp';

/** Banco sincronizável = banco persistido + índice de sync. */
export type SyncableDatabase = EmptyDatabase;

export interface MergeStatsSide {
  added: number;
  updated: number;
  removed: number;
}

export interface MergeResult {
  merged: SyncableDatabase;
  /** Mudanças do ponto de vista do banco local (o que ele vai ganhar/perder). */
  local: MergeStatsSide;
  /** Mudanças do ponto de vista do banco remoto (o que o outro lado vai receber). */
  remote: MergeStatsSide;
}

const emptyStats = (): MergeStatsSide => ({ added: 0, updated: 0, removed: 0 });

function diffStats(before: unknown[], after: unknown[]): MergeStatsSide {
  const stats = emptyStats();
  const beforeMap = new Map<string, unknown>();
  for (const item of before) {
    const id = (item as { id?: unknown }).id;
    if (typeof id === 'string') beforeMap.set(id, item);
  }
  for (const item of after) {
    const id = (item as { id?: unknown }).id;
    if (typeof id !== 'string') continue;
    const prev = beforeMap.get(id);
    if (prev === undefined) stats.added++;
    else if (JSON.stringify(prev) !== JSON.stringify(item)) stats.updated++;
  }
  for (const id of beforeMap.keys()) {
    if (!after.some((item) => (item as { id?: unknown }).id === id)) stats.removed++;
  }
  return stats;
}

function pickLww(localValue: unknown, remoteValue: unknown, localTs: number, remoteTs: number): unknown {
  if (remoteValue === undefined) return localValue;
  if (localValue === undefined) return remoteValue;
  if (remoteTs > localTs) return remoteValue;
  if (localTs > remoteTs) return localValue;
  return tieBreak(localValue, remoteValue);
}

function mergeRecordCollection(
  key: string,
  localItems: Array<Record<string, unknown>>,
  remoteItems: Array<Record<string, unknown>>,
  localIndex: SyncIndex,
  remoteIndex: SyncIndex
): Array<Record<string, unknown>> {
  const localById = new Map(localItems.map((i) => [i.id as string, i]));
  const remoteById = new Map(remoteItems.map((i) => [i.id as string, i]));
  const ids = new Set<string>([...localById.keys(), ...remoteById.keys()]);
  const merged: Array<Record<string, unknown>> = [];

  for (const id of ids) {
    const l = localById.get(id);
    const r = remoteById.get(id);
    const lAlive = l !== undefined;
    const rAlive = r !== undefined;
    // Tombstone mais recente que o registro vivo → deleção vence.
    const tTs = Math.max(tombstoneTs(localIndex, key, id), tombstoneTs(remoteIndex, key, id));
    let winner: Record<string, unknown> | undefined;
    if (lAlive && rAlive) {
      const lTs = recordTs(localIndex, key, id);
      const rTs = recordTs(remoteIndex, key, id);
      winner =
        rTs > lTs ? r : lTs > rTs ? l : (tieBreak(l, r) as Record<string, unknown>);
    } else {
      winner = lAlive ? l : rAlive ? r : undefined;
    }
    if (winner !== undefined && tTs <= Math.max(recordTs(localIndex, key, id), recordTs(remoteIndex, key, id))) {
      merged.push(winner);
    }
  }

  // Ordenação estável por id — mesma saída nos dois dispositivos.
  merged.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return merged;
}

/**
 * Calcula o merge dos dois bancos. Puro e determinístico: chamado
 * independentemente nos dois dispositivos, produz o mesmo `merged`.
 */
export function mergeSyncedDatabases(
  localDb: SyncableDatabase,
  remoteDb: SyncableDatabase
): MergeResult {
  const base = emptyDatabase();
  const mergedRecords = {} as Record<string, Array<Record<string, unknown>>>;
  const statsLocal = emptyStats();
  const statsRemote = emptyStats();

  for (const key of RECORD_COLLECTION_KEYS) {
    const l = (localDb[key] ?? []) as Array<Record<string, unknown>>;
    const r = (remoteDb[key] ?? []) as Array<Record<string, unknown>>;
    const m = mergeRecordCollection(key, l, r, localDb.syncIndex, remoteDb.syncIndex);
    mergedRecords[key] = m;
    const sL = diffStats(l, m);
    const sR = diffStats(r, m);
    statsLocal.added += sL.added;
    statsLocal.updated += sL.updated;
    statsLocal.removed += sL.removed;
    statsRemote.added += sR.added;
    statsRemote.updated += sR.updated;
    statsRemote.removed += sR.removed;
  }

  // Coleções de valor único (LWW pela coleção).
  const singles = {} as Record<string, unknown>;
  for (const key of SINGLE_COLLECTION_KEYS) {
    singles[key] = pickLww(
      localDb[key],
      remoteDb[key],
      localDb.syncIndex.stamps[key] ?? 0,
      remoteDb.syncIndex.stamps[key] ?? 0
    );
  }

  // Coleções-set (união).
  const sets = {} as Record<string, string[]>;
  for (const key of SET_COLLECTION_KEYS) {
    const union = new Set<string>([...((localDb[key] ?? []) as string[]), ...((remoteDb[key] ?? []) as string[])]);
    sets[key] = Array.from(union).sort();
  }

  const streakDays = new Set<string>([
    ...(localDb.streakData?.activeDays ?? []),
    ...(remoteDb.streakData?.activeDays ?? []),
  ]);

  const merged: SyncableDatabase = {
    ...base,
    ...mergedRecords,
    ...singles,
    ...sets,
    streakData: { activeDays: Array.from(streakDays).sort() },
    // Bancos estáticos ficam de fora do merge (re-semeados sob demanda).
    approaches: localDb.approaches,
    syncIndex: mergeIndexes(localDb.syncIndex, remoteDb.syncIndex),
  } as unknown as SyncableDatabase;

  return { merged, local: statsLocal, remote: statsRemote };
}
