/**
 * Estado persistente tri-modal para o domínio do app:
 *
 * - Web/PWA  → localStorage síncrono (idêntico a `usePersistentState`; zero
 *   mudança de comportamento — sem flash, inicialização imediata).
 * - Nativo OK → SQLite (`cecistudy_user`): hidratação assíncrona por coleção +
 *   write-through serializado em cada mudança de estado.
 * - Nativo com SQLite indisponível → fallback transparente para Preferences
 *   (mesma semântica do `usePersistentState`).
 *
 * `reminder`/`onboarding`/preferências pequenas continuam no
 * `usePersistentState` (Preferences) — não usar este hook para elas.
 */
import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { storage, isNativePlatform } from './storage.ts';
import { getUserDb } from './db/userDb.ts';
import {
  isUserCollectionKey,
  loadCollection,
  saveCollection,
} from './db/normalize.ts';

export function useSqliteState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const hydratedRef = useRef(!isNativePlatform);
  const [state, setState] = useState<T>(() => {
    // Web: inicialização síncrona do localStorage (sem flash).
    if (!isNativePlatform) {
      const item = storage.getSync(key);
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

  // Hidratação assíncrona (nativo): SQLite, com fallback p/ legado.
  useEffect(() => {
    if (!isNativePlatform) return;
    let cancelled = false;
    (async () => {
      const db = await getUserDb();
      try {
        if (db && isUserCollectionKey(key)) {
          const value = await loadCollection<T>(db, key);
          if (!cancelled && value !== undefined) setState(value);
        } else {
          const item = await storage.get(key);
          if (!cancelled && item != null) {
            try {
              setState(JSON.parse(item) as T);
            } catch {
              /* mantém estado atual */
            }
          }
        }
      } finally {
        if (!cancelled) hydratedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Write-through: grava após hidratação (evita sobrescrever com seeds).
  useEffect(() => {
    if (!hydratedRef.current) return;
    let cancelled = false;
    (async () => {
      const db = await getUserDb();
      try {
        if (db && isUserCollectionKey(key)) {
          if (!cancelled) await saveCollection(db, key, state);
        } else {
          if (!cancelled) await storage.set(key, JSON.stringify(state));
        }
      } catch (e) {
        console.error(`[useSqliteState] falha ao gravar "${key}"`, e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, state]);

  return [state, setState];
}
