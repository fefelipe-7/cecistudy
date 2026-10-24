/**
 * Fila de escrita SQLite — spec-performance.md §7 Fase 7.
 *
 * Propriedades (todas testáveis — ver `__tests__/writeQueue.test.ts`):
 *
 * - **Serializada por chave**: no máximo UMA escrita em andamento por coleção
 *   (spec §9: "writes SQLite concorrentes por chave: 0"). A escrita em
 *   andamento termina (nunca é cancelada no meio da transação); a próxima só
 *   começa depois.
 * - **Coalescida por versão**: mudanças durante uma escrita/pending viram UMA
 *   pendência — a mais nova. 50 atualizações rápidas = no máximo 2 escritas
 *   (a em andamento + a última), e o resultado no banco é SEMPRE o último
 *   valor — sem regressão à versão anterior.
 * - **Debounce de 200 ms** por chave (spec §7.2): a escrita começa após a
 *   rajada assentar; `flush` ignora o debounce e drena na hora.
 * - **Durabilidade da fila, não do componente** (spec §7.2): `pagehide` e
 *   `visibilitychange→hidden` drenam a fila. O unmount de um hook **não**
 *   descarta pendência — quem dava drop era o cleanup antigo do
 *   `useSqliteState`, e pendência descartada era edição perdida.
 * - **Erro retém a pendência para retry** (spec §7.2), sem auto-retry: a
 *   próxima tentativa vem de um novo `enqueueWrite` ou de um `flush` explícito
 *   — falha persistente NÃO vira loop infinito (spec §7.3).
 * - **Invalidação para reset/import** (spec §7.2): `invalidatePendingWrites`
 *   descarta TODAS as pendências e aguarda as escritas em andamento — o
 *   snapshot velho não volta a gravar depois do reset/import.
 *
 * A versão é monotônica POR CHAVE e atribuída pela fila (não pela instância
 * do hook): um remount não pode enfileirar "versão 1" depois de "versão 5".
 */

export interface WriteTask {
  key: string;
  version: number;
  write: () => Promise<void>;
}

export interface EnqueueWriteOptions {
  /** Atraso antes de a pendência começar a valer como escrita (default 200 ms). */
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 200;

interface KeyState {
  /** Última versão enfileirada (monotônica por chave). */
  version: number;
  pending: WriteTask | null;
  inFlight: WriteTask | null;
  /** Nunca rejeita — erro vira pendência retida. */
  inFlightPromise: Promise<void> | null;
  debounceTimer: number | undefined;
  lastError: unknown;
}

const keyStates = new Map<string, KeyState>();

function stateOf(key: string): KeyState {
  let s = keyStates.get(key);
  if (!s) {
    s = {
      version: 0,
      pending: null,
      inFlight: null,
      inFlightPromise: null,
      debounceTimer: undefined,
      lastError: undefined,
    };
    keyStates.set(key, s);
  }
  return s;
}

function cancelDebounce(s: KeyState): void {
  if (s.debounceTimer !== undefined) {
    window.clearTimeout(s.debounceTimer);
    s.debounceTimer = undefined;
  }
}

/**
 * Enfileira uma escrita para a coleção `key`. A pendência anterior é
 * substituída por esta (coalescing) — só a versão mais nova é gravada.
 */
export function enqueueWrite(
  key: string,
  write: () => Promise<void>,
  options?: EnqueueWriteOptions,
): void {
  const s = stateOf(key);
  s.version += 1;
  s.pending = { key, version: s.version, write };
  s.lastError = undefined;

  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  cancelDebounce(s);
  s.debounceTimer = window.setTimeout(() => {
    s.debounceTimer = undefined;
    pump(key);
  }, debounceMs);

  installHideFlush();
}

/** Escreve a pendência se não há nada em andamento (serialização por chave). */
function pump(key: string): void {
  const s = stateOf(key);
  if (s.inFlightPromise || !s.pending) return;

  const task = s.pending;
  s.pending = null;
  s.inFlight = task;

  const guarded = (async () => {
    try {
      await task.write();
      s.lastError = undefined;
    } catch (e) {
      // Erro mantém a versão pendente para retry (spec §7.2) — SEM auto-retry:
      // a próxima tentativa vem de um novo enqueue ou de um flush explícito.
      s.lastError = e;
      s.pending = s.pending ?? task;
      console.error(`[writeQueue] escrita de "${key}" falhou — pendência retida para retry`, e);
    }
  })();

  s.inFlightPromise = guarded.then(() => {
    s.inFlight = null;
    s.inFlightPromise = null;
    // Só retoma se houver pendência ESTRISSO mais nova. A tarefa retida por
    // erro tem a MESMA versão desta — reagendá-la aqui seria auto-retry em
    // loop (a falha persistente viraria alocação infinita). Retry é explícito:
    // novo enqueue ou flush.
    if (s.pending && s.pending.version > task.version) pump(key);
  });
}

/** Drena uma chave: ignora o debounce, escreve e aguarda tudo assentar. */
async function drainKey(key: string): Promise<void> {
  // No máximo 2 tentativas por flush: a pendência retida por erro tem UMA
  // nova chance; falhar de novo para o flush ali (sem loop infinito).
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const s = keyStates.get(key);
    if (!s) return;
    cancelDebounce(s);
    pump(key);
    const inFlight = keyStates.get(key)?.inFlightPromise;
    if (inFlight) await inFlight;
    const after = keyStates.get(key);
    if (!after?.pending) return;
    if (attempt === 1) return;
  }
}

/**
 * Drena a fila: escreve as pendências (sem esperar o debounce) e resolve
 * quando nada mais está em andamento. `key` ausente = todas as chaves.
 */
export async function flushWriteQueue(key?: string): Promise<void> {
  const keys = key ? [key] : [...keyStates.keys()];
  await Promise.all(keys.map((k) => drainKey(k)));
}

/**
 * Descarta a pendência de `key` (a escrita em andamento termina — transação
 * iniciada não se cancela, spec §7.1). A fila é dona da durabilidade normal;
 * cancelar é decisão explícita de quem chama.
 */
export function cancelPendingWrite(key: string): void {
  stateOf(key).pending = null;
}

/**
 * Reset/import (spec §7.2): descarta TODAS as pendências (nenhum snapshot
 * velho volta a gravar) e aguarda as escritas já em andamento terminarem.
 * Chamar ANTES de aplicar o novo snapshot.
 */
export async function invalidatePendingWrites(): Promise<void> {
  const inflights: Array<Promise<void>> = [];
  for (const s of keyStates.values()) {
    s.pending = null;
    cancelDebounce(s);
    if (s.inFlightPromise) inflights.push(s.inFlightPromise);
  }
  await Promise.all(inflights);
}

/**
 * Flush quando o app some da tela: `pagehide` e `visibilitychange→hidden`
 * drenam a fila (a ponte Capacitor faz o que der dentro da janela que o SO
 * der — "aguarda quando possível", spec §7.2; a garantia estrutural de
 * ordenação/último-valor é da fila, não do evento).
 */
let hideFlushInstalled = false;
function installHideFlush(): void {
  if (hideFlushInstalled || typeof window === 'undefined' || typeof document === 'undefined')
    return;
  hideFlushInstalled = true;
  const flush = () => {
    void flushWriteQueue();
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

// ---------------------------------------------------------------------------
// Acesso de teste
// ---------------------------------------------------------------------------

export function getWriteQueueStateForTests(): {
  keys: Array<{
    key: string;
    version: number;
    hasPending: boolean;
    inFlight: boolean;
    lastError: boolean;
  }>;
} {
  return {
    keys: [...keyStates.entries()].map(([key, s]) => ({
      key,
      version: s.version,
      hasPending: s.pending !== null,
      inFlight: s.inFlight !== null,
      lastError: s.lastError !== undefined,
    })),
  };
}

export function resetWriteQueueForTests(): void {
  for (const s of keyStates.values()) cancelDebounce(s);
  keyStates.clear();
}
