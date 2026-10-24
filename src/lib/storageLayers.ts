/**
 * Camadas de armazenamento (SPEC-M-026 D1).
 *
 * Dois donos, e só dois:
 *
 * - `userStorage` — dado da usuária. Chaves `cecistudy_user_*`. É o que precisa
 *   sobreviver a reinstalação: coleções vão para o SQLite cifrado
 *   (`cecistudy_user`), preferências pequenas ficam aqui.
 * - `storage` (`storage.ts`) — estado do aparelho. Chaves `cecistudy_*`: tema,
 *   hash do catálogo, último preload, `deviceId`, rascunhos. Não entra no
 *   backup; perder na reinstalação é aceitável.
 *
 * Conteúdo fixo (templo, abordagens, questões, obras, comparações) **não** é
 * armazenamento: é asset do bundle (`public/assets/databases` + facades JS).
 * A `appStorage` da SPEC-M-024 D1 foi removida — nunca teve consumidor, e a
 * cifra XOR que ela carregava perdia a chave a cada reload.
 */
import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './storage.ts';

const USER_PREFIX = 'cecistudy_user_';

type StorageShape = {
  getSync(key: string): string | null;
  setSync(key: string, value: string): void;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

function prefixNamespace(prefix: string): StorageShape {
  return {
    getSync(key: string): string | null {
      if (isNativePlatform) return null;
      try {
        return localStorage.getItem(prefix + key);
      } catch {
        return null;
      }
    },
    setSync(key: string, value: string): void {
      if (isNativePlatform) return;
      try {
        localStorage.setItem(prefix + key, value);
      } catch (e) {
        console.error('Storage error', e);
      }
    },
    async get(key: string): Promise<string | null> {
      if (!isNativePlatform) return this.getSync(key);
      try {
        const { value } = await Preferences.get({ key: prefix + key });
        return value ?? null;
      } catch (e) {
        console.error('Storage get error', e);
        return null;
      }
    },
    async set(key: string, value: string): Promise<void> {
      if (!isNativePlatform) {
        this.setSync(key, value);
        return;
      }
      try {
        await Preferences.set({ key: prefix + key, value });
      } catch (e) {
        console.error('Storage set error', e);
      }
    },
    async remove(key: string): Promise<void> {
      if (!isNativePlatform) {
        try {
          localStorage.removeItem(prefix + key);
        } catch {
          /* noop */
        }
        return;
      }
      try {
        await Preferences.remove({ key: prefix + key });
      } catch (e) {
        console.error('Storage remove error', e);
      }
    },
  };
}

/** Dado da usuária (read/write, backupável). No nativo, coleções vivem no
 * SQLite cifrado — aqui ficam as preferências pequenas do domínio. */
export const userStorage = prefixNamespace(USER_PREFIX);

/**
 * Saúde da hidratação (SPEC-M-026 D3): uma coleção cuja leitura falhou fica
 * **sem escrita** até o próximo boot — gravar ali apagaria o disco com o valor
 * inicial. A tela de Configurações lê este mapa.
 */
const health = new Map<string, string>();

export function reportStorageHealth(key: string, erro: unknown): void {
  health.set(key, erro instanceof Error ? erro.message : String(erro));
}

export function getStorageHealth(): { key: string; erro: string }[] {
  return [...health].map(([key, erro]) => ({ key, erro }));
}
