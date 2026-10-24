import React, { useState, useEffect, useRef } from 'react';
import { storage, isNativePlatform } from './storage';
import { userStorage } from './storageLayers';

/** Aguarda inatividade antes de gravar; flush imediato ao ocultar/fechar. */
const WRITE_DEBOUNCE_MS = 200;

/**
 * Estado persistente com camada dual:
 * - Web/PWA  → localStorage síncrono (inicialização imediata, sem flash)
 * - Nativo   → @capacitor/preferences (hidratação assíncrona após o primeiro render)
 *
 * O web mantém exatamente o comportamento anterior; no nativo, os seeds aparecem
 * por um instante até a hidratação concluir.
 *
 * `namespace` decide o dono do dado (SPEC-M-026 D1): `'device'` (padrão) é
 * estado do aparelho — tema, rascunho, cache — e não entra no backup;
 * `'user'` é dado da usuária (`cecistudy_user_*`) e precisa sobreviver a
 * reinstalação. Chave de usuária gravada pela versão antiga em `cecistudy_*`
 * é lida do prefixo legado e copiada para o novo na primeira leitura.
 */
export const usePersistentState = <T>(
  key: string,
  initialValue: T,
  namespace: 'device' | 'user' = 'device',
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const store = namespace === 'user' ? userStorage : storage;
  /** Preferência da usuária salva no prefixo antigo (`cecistudy_<key>`). */
  const readLegacy = () => (namespace === 'user' ? storage.getSync(key) : null);

  const hydratedRef = useRef(!isNativePlatform);
  const [state, setState] = useState<T>(() => {
    const item = store.getSync(key) ?? readLegacy();
    if (item) {
      try {
        return JSON.parse(item) as T;
      } catch {
        /* fallback abaixo */
      }
    }
    return initialValue;
  });

  // Migração one-shot do prefixo (web): copia a chave legada e mantém a antiga.
  useEffect(() => {
    if (isNativePlatform || namespace !== 'user') return;
    const legacy = readLegacy();
    if (legacy != null && userStorage.getSync(key) == null) userStorage.setSync(key, legacy);
  }, [key, namespace]);

  useEffect(() => {
    if (!isNativePlatform) return;
    let cancelled = false;
    store
      .get(key)
      .then(async (item) => {
        if (cancelled || item != null) return item;
        // Nativo: mesma migração, uma chave por vez.
        const legacy = await storage.get(key);
        if (legacy != null) await userStorage.set(key, legacy);
        return legacy;
      })
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
  }, [key, namespace]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const json = JSON.stringify(state);
    let cancelled = false;

    const write = () => {
      if (!cancelled) void store.set(key, json);
    };

    const timer = window.setTimeout(write, WRITE_DEBOUNCE_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        window.clearTimeout(timer);
        write();
      }
    };
    const onPageHide = () => {
      window.clearTimeout(timer);
      write();
    };
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [key, state]);

  return [state, setState];
};
