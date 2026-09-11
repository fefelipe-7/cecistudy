/**
 * useStampedState — camada de gravação com carimbos de sync.
 *
 * Envolve o `useSqliteState` e mantém automaticamente o `SyncIndex`
 * (stamps por coleção, stamps por registro e tombstones de deleção)
 * a cada mudança — sem tocar nos ~40 pontos de chamada do AppContext.
 *
 * - `set` (default) → carimba a mudança no índice.
 * - `setRaw` → grava sem carimbar (hidratação/import/sync/applyDatabase).
 *
 * O índice em si é persistido via `useSqliteState('syncIndex')` no
 * AppContext e passado como parâmetro (fonte única compartilhada por
 * todas as coleções).
 */
import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SyncIndex } from '../types';
import { useSqliteState } from './useSqliteState.ts';
import { applyStampChange } from './sync/stamp';

export interface StampedState<T> {
  value: T;
  set: Dispatch<SetStateAction<T>>;
  setRaw: Dispatch<SetStateAction<T>>;
}

export function useStampedState<T>(
  key: string,
  initialValue: T,
  syncIndex: SyncIndex,
  setSyncIndex: Dispatch<SetStateAction<SyncIndex>>
): StampedState<T> {
  const [value, rawSet] = useSqliteState<T>(key, initialValue);

  // Espelho do valor atual para resolver functional updates fora do updater
  // (evita efeitos colaterais dentro da função de update do React).
  const valueRef = useRef(value);
  useEffect(() => {
    // Hidratação/applyDatabase mudam o valor por fora do `set` — ressincroniza.
    if (valueRef.current !== value) valueRef.current = value;
  }, [value]);

  // Espelho do índice de sync: `set` lê o índice mais recente no momento da
  // chamada (mesmo raciocínio do `valueRef`), tornando o callback estável.
  // Sem isso, QUALQUER gravação em qualquer coleção trocaria a identidade de
  // todos os `set`, inviabilizando memoizações por domínio (PERF-001 A.3).
  // Atribuição idempotente durante o render (espelho que não afeta a saída).
  const syncIndexRef = useRef(syncIndex);
  if (syncIndexRef.current !== syncIndex) syncIndexRef.current = syncIndex;

  const set = useCallback(
    (action: SetStateAction<T>) => {
      const prev = valueRef.current;
      const next =
        typeof action === 'function' ? (action as (p: T) => T)(prev) : action;
      if (next === prev) return;
      valueRef.current = next;
      rawSet(next);
      const now = Date.now();
      const { index } = applyStampChange(syncIndexRef.current, key, prev, next, now);
      if (index !== syncIndexRef.current) setSyncIndex(index);
    },
    [rawSet, key, setSyncIndex]
  );

  const setRaw = useCallback(
    (action: SetStateAction<T>) => {
      const prev = valueRef.current;
      const next =
        typeof action === 'function' ? (action as (p: T) => T)(prev) : action;
      valueRef.current = next;
      rawSet(next);
    },
    [rawSet]
  );

  return { value, set, setRaw };
}
