import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export const STORAGE_PREFIX = 'cecistudy_';

/** true quando rodando dentro do app nativo (Capacitor) */
export const isNativePlatform = Capacitor.isNativePlatform();

/**
 * Camada de persistência dual:
 * - Web/PWA  → localStorage (síncrono, mantém comportamento atual intacto)
 * - Nativo   → @capacitor/preferences (assíncrono, mais confiável que o localStorage do WebView)
 */
export const storage = {
  /** leitura síncrona (usada na inicialização do hook; no nativo retorna null e a hidratação é async) */
  getSync(key: string): string | null {
    if (isNativePlatform) return null;
    try {
      return localStorage.getItem(STORAGE_PREFIX + key);
    } catch {
      return null;
    }
  },

  /** gravação síncrona (apenas web) */
  setSync(key: string, value: string): void {
    if (isNativePlatform) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + key, value);
    } catch (e) {
      console.error('Storage error', e);
    }
  },

  async get(key: string): Promise<string | null> {
    if (!isNativePlatform) return storage.getSync(key);
    try {
      const { value } = await Preferences.get({ key: STORAGE_PREFIX + key });
      return value ?? null;
    } catch (e) {
      console.error('Storage get error', e);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    if (!isNativePlatform) {
      storage.setSync(key, value);
      return;
    }
    try {
      await Preferences.set({ key: STORAGE_PREFIX + key, value });
    } catch (e) {
      console.error('Storage set error', e);
    }
  },

  async remove(key: string): Promise<void> {
    if (!isNativePlatform) {
      try {
        localStorage.removeItem(STORAGE_PREFIX + key);
      } catch {
        /* noop */
      }
      return;
    }
    try {
      await Preferences.remove({ key: STORAGE_PREFIX + key });
    } catch (e) {
      console.error('Storage remove error', e);
    }
  },
};