/**
 * Camada de armazenamento com dois namespaces explícitos (SPEC-M-024 D1, D7).
 *
 * - `appStorage` — dados fixos do app (templo, abordagens, questões, obras,
 *   comparações), somente-leitura, do bundle. Chaves `cecistudy_app_*`.
 * - `userStorage` — dados da usuária (perfil, cursos, tarefas, estágio, TCC,
 *   leituras, flashcards…), read/write, backupável. Chaves `cecistudy_user_*`.
 *
 * Ambos acessam `localStorage` na web e `@capacitor/preferences` no nativo
 * **diretamente**, sem passar pelo `storage.ts` (que já adiciona seu próprio
 * prefixo `cecistudy_` — senão teríamos prefixo duplicado). Nenhum comportamento
 * muda ao importar este módulo — a separação é de código, não de destino.
 */
import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './storage.ts';

const APP_PREFIX = 'cecistudy_app_';
const USER_PREFIX = 'cecistudy_user_';

/** Chave de cifragem em memória (web). Gerada na primeira gravação/leitura.
 * Perdida ao recarregar a página — dados cifrados ficam inacessíveis sem ela. */
let cipherKey: string | null = null;

function ensureCipherKey(): string {
  if (!cipherKey && typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    cipherKey = Array.from(array, (b) => String.fromCharCode(b)).join('');
  }
  return cipherKey ?? '';
}

function xorCipher(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function encrypt(value: string): string {
  const key = ensureCipherKey();
  const xored = xorCipher(value, key);
  return btoa(xored);
}

function decrypt(value: string): string | null {
  const key = ensureCipherKey();
  try {
    const xored = atob(value);
    return xorCipher(xored, key);
  } catch {
    return null;
  }
}

type StorageShape = {
  getSync(key: string): string | null;
  setSync(key: string, value: string): void;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

const isNative = isNativePlatform;

function prefixNamespace(prefix: string, shouldEncrypt: boolean = false): StorageShape {
  return {
    getSync(key: string): string | null {
      if (isNative) return null;
      try {
        const raw = localStorage.getItem(prefix + key);
        if (raw == null) return null;
        return shouldEncrypt ? decrypt(raw) : raw;
      } catch {
        return null;
      }
    },
    setSync(key: string, value: string): void {
      if (isNative) return;
      try {
        localStorage.setItem(prefix + key, shouldEncrypt ? encrypt(value) : value);
      } catch (e) {
        console.error('Storage error', e);
      }
    },
    async get(key: string): Promise<string | null> {
      if (!isNative) {
        return this.getSync(key);
      }
      try {
        const { value } = await Preferences.get({ key: prefix + key });
        return value ?? null;
      } catch (e) {
        console.error('Storage get error', e);
        return null;
      }
    },
    async set(key: string, value: string): Promise<void> {
      if (!isNative) {
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
      if (!isNative) {
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

/** Dados fixos do app (readonly, do bundle, nunca no backup do usuário). */
export const appStorage = prefixNamespace(APP_PREFIX);

/** Dados da usuária (read/write, backupável, isolados de dados fixos).
 * Na web, os valores são gravados em texto claro no localStorage; a cifragem
 * da web com chave em memória fica pendente (chave é perdida ao recarregar a
 * página — sem mecanismo de recuperação). No nativo, o SQLite do usuário usa
 * `encrypted: true` (driver.ts + userDb.ts, SPEC-M-024 D4). */
export const userStorage = prefixNamespace(USER_PREFIX, false);
