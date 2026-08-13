import React, { useState, useEffect, useRef } from 'react';
import { storage, isNativePlatform } from './storage';

/**
 * Estado persistente com camada dual:
 * - Web/PWA  → localStorage síncrono (inicialização imediata, sem flash)
 * - Nativo   → @capacitor/preferences (hidratação assíncrona após o primeiro render)
 *
 * O web mantém exatamente o comportamento anterior; no nativo, os seeds aparecem
 * por um instante até a hidratação concluir.
 */
export const usePersistentState = <T,>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const hydratedRef = useRef(!isNativePlatform);
  const [state, setState] = useState<T>(() => {
    const item = storage.getSync(key);
    if (item) {
      try {
        return JSON.parse(item) as T;
      } catch {
        /* fallback abaixo */
      }
    }
    return initialValue;
  });

  useEffect(() => {
    if (!isNativePlatform) return;
    let cancelled = false;
    storage
      .get(key)
      .then((item) => {
        if (cancelled || item == null) return;
        try {
          setState(JSON.parse(item) as T);
        } catch {
          /* mantém o estado atual */
        }
      })
      .finally(() => {
        hydratedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    storage.set(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};