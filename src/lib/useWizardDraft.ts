import { useCallback, useRef } from 'react';
import { storage, STORAGE_PREFIX } from './storage';

/**
 * Rascunho de wizard longo (docs/modais-wizards.md §5.1).
 * Preserva os campos preenchidos se a usuária sair acidentalmente; o rascunho
 * é limpo explicitamente ao salvar (ou ao descartar de propósito).
 *
 * ```ts
 * const draft = useWizardDraft<InternshipDraft>('internship');
 * const [state, setState] = useState(draft.load() ?? defaults);
 * // ...em cada onChange: draft.save({...state, field: value});
 * // após salvar: draft.clear();
 * ```
 */
export function useWizardDraft<T extends object>(key: string) {
  const storageKey = `wizard_draft_${key}`;
  const lastRef = useRef<T | null>(null);

  const load = useCallback((): T | null => {
    if (lastRef.current) return lastRef.current;
    try {
      const raw = storage.getSync(storageKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const save = useCallback(
    (value: T) => {
      lastRef.current = value;
      try {
        storage.setSync(storageKey, JSON.stringify(value));
      } catch {
        // quota/serialização — rascunho é best-effort
      }
    },
    [storageKey]
  );

  const clear = useCallback(() => {
    lastRef.current = null;
    try {
      localStorage.removeItem(STORAGE_PREFIX + storageKey);
    } catch {
      /* noop */
    }
  }, [storageKey]);

  /** Rascunho salvo nesta sessão (evita reler o storage a cada mudança). */
  const peek = useCallback(() => lastRef.current, []);

  return { load, save, clear, peek };
}
