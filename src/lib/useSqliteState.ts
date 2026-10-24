/**
 * Estado persistente tri-modal para o domínio do app:
 *
 * - Web/PWA  → localStorage síncrono (inicialização imediata, sem flash).
 * - Nativo OK → SQLite (`cecistudy_user`): hidratação assíncrona por coleção +
 *   write-through ENFILEIRADO (writeQueue) — coalescido por versão, debounced
 *   200 ms, serializado por chave, com flush em pagehide/visibilitychange.
 * - Nativo com SQLite indisponível → fallback transparente para Preferences
 *   (mesma semântica do `usePersistentState`).
 *
 * Durabilidade é da FILA (spec-performance §7 Fase 7), não do componente:
 * unmount não descarta pendência, erro retém para retry e o último valor
 * sempre vence. Mudança feita DURANTE a hidratação nativa não é mais perdida
 * (nem revertida em memória): o carimbo `dirty` protege a edição da usuária
 * e a escrita entra na fila assim que a hidratação sinaliza `hydrated`.
 *
 * `reminder`/`onboarding`/preferências pequenas continuam no
 * `usePersistentState` (Preferences) — não usar este hook para elas.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';
import { isNativePlatform } from './storage.ts';
import { userStorage, reportStorageHealth } from './storageLayers.ts';
import { getUserDb } from './db/userDb.ts';
import { isUserCollectionKey, loadCollection, saveCollection } from './db/normalize.ts';
import { enqueueWrite } from './db/writeQueue.ts';
import { traceAsync } from './performance/perfMarks.ts';

export function useSqliteState<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [hydrated, setHydrated] = useState(!isNativePlatform);
  /** true quando um `set` aconteceu antes de a hidratação aplicar o disco. */
  const dirtyRef = useRef(false);
  const [state, setStateRaw] = useState<T>(() => {
    // Web: inicialização síncrona do localStorage (sem flash).
    if (!isNativePlatform) {
      const item = userStorage.getSync(key);
      if (item) {
        try {
          return JSON.parse(item) as T;
        } catch {
          /* fallback abaixo */
        }
      }
    }
    return initialValue;
  });

  // `set` público marca `dirty`: a hidratação não pode revertê-lo (LWW em
  // memória — o valor do disco é ignorado se a usuária já editou).
  const setState = useCallback((action: React.SetStateAction<T>) => {
    dirtyRef.current = true;
    setStateRaw(action);
  }, []);

  // Hidratação assíncrona (nativo): SQLite, com fallback p/ legado.
  useEffect(() => {
    if (!isNativePlatform) return;
    let cancelled = false;
    (async () => {
      try {
        const db = await getUserDb();
        if (db && isUserCollectionKey(key)) {
          const value = await loadCollection<T>(db, key);
          if (!cancelled && value !== undefined && !dirtyRef.current) setStateRaw(value);
        } else {
          const item = await userStorage.get(key);
          if (item != null && !dirtyRef.current) setStateRaw(JSON.parse(item) as T);
        }
        // Sinaliza como ESTADO (não ref): o write-through reage e enfileira
        // a edição feita durante a hidratação (bug da F5.4 — antes, a
        // mudança era perdida para sempre).
        if (!cancelled) setHydrated(true);
      } catch (e) {
        // SPEC-M-026 D3: leitura que falha NÃO libera a escrita. Sem isto o
        // write-through gravaria o `initialValue` por cima da coleção — e um
        // JSON corrompido no disco também não deve ser sobrescrito.
        reportStorageHealth(key, e);
        console.error(`[useSqliteState] leitura de "${key}" falhou — escrita bloqueada`, e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Write-through: cada estado novo entra na fila (debounce 200 ms,
  // coalescing por versão, serialização por chave — spec §7.1/§7.2).
  // Sem cleanup de descarte: a fila é dona da pendência.
  useEffect(() => {
    if (!hydrated) return;
    const snapshot = state;
    enqueueWrite(key, () => writeSnapshot(key, snapshot));
  }, [key, state, hydrated]);

  return [state, setState];
}

/** Grava um snapshot pela fila — Preferences quando não há SQLite/coleção. */
async function writeSnapshot<T>(key: string, value: T): Promise<void> {
  const db = await getUserDb();
  await traceAsync('persist-write', async () => {
    if (db && isUserCollectionKey(key)) {
      await saveCollection(db, key, value);
    } else {
      await userStorage.set(key, JSON.stringify(value));
    }
  });
}
