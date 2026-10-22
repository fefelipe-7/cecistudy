/**
 * Prefetch de chunks com política — spec-performance.md §6.3 e §7 Fase 3.
 *
 * Regras impostas aqui (todas testáveis):
 * - **Política antes de fila**: `saveData`, `effectiveType` 2g/slow-2g e
 *   documento oculto bloqueiam prefetch oportunístico (spec §6.3).
 * - **Fila de baixa prioridade**: máximo 1 simultâneo por padrão; 2 somente
 *   em 4g sem `saveData` (spec §3.3).
 * - **Intenção observável fura a fila** (pointerdown/click): a navegação é
 *   iminente e o chunk viraria carga real em instantes.
 * - **Dedup por chave**: mesma chave não entra duas vezes; falha/timeout
 *   liberam a chave para retry.
 * - **Timeout de 10 s** tratado como silêncio — nunca erro visível (spec §3.3).
 * - **Mudança de rota cancela o que está na fila** (o que já corre, corre).
 *
 * O "quando" é do chamador (o boot usa `requestIdleCallback`); este módulo
 * decide "se pode", "quantos" e "com que dedup".
 */

export interface PrefetchOptions {
  /** Teto por item (default 10 s). Estourar não é erro visível. */
  timeoutMs?: number;
}

/** Network Information API — ausente no Safari/iOS; tudo aqui é opcional. */
interface MaybeConnection {
  saveData?: boolean;
  effectiveType?: string;
}

function connection(): MaybeConnection | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { connection?: MaybeConnection }).connection;
}

/** Política (spec §6.3): documento visível, sem saveData, rede >= 3g. */
export function canPrefetch(): boolean {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    return false;
  }
  const conn = connection();
  if (conn?.saveData) return false;
  const type = conn?.effectiveType;
  if (type === 'slow-2g' || type === '2g') return false;
  return true;
}

/** Limite da fila: 1 por padrão; 2 somente em 4g comprovada e sem saveData. */
function maxConcurrent(): number {
  return connection()?.effectiveType === '4g' && !connection()?.saveData ? 2 : 1;
}

interface QueueItem {
  key: string;
  load: () => Promise<unknown>;
  timeoutMs: number;
}

const queue: QueueItem[] = [];
const loaded = new Set<string>();
const inFlight = new Set<string>();
let activeCount = 0;

const DEFAULT_TIMEOUT_MS = 10_000;

function start(item: QueueItem): void {
  inFlight.add(item.key);
  activeCount += 1;
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('prefetch-timeout')), item.timeoutMs);
  });
  void Promise.race([item.load(), timeout])
    .then(() => {
      loaded.add(item.key);
    })
    .catch(() => {
      /* timeout/falha: silêncio (spec §3.3) — a chave fica livre p/ retry. */
    })
    .finally(() => {
      inFlight.delete(item.key);
      activeCount -= 1;
      pump();
    });
}

function pump(): void {
  while (activeCount < maxConcurrent() && queue.length > 0) {
    const item = queue.shift()!;
    if (loaded.has(item.key) || inFlight.has(item.key)) continue;
    start(item);
  }
}

/** Já carregado ou em voo? (dedup por chave — spec §6.2) */
function isSettledOrRunning(key: string): boolean {
  return loaded.has(key) || inFlight.has(key);
}

/**
 * Enfileira prefetch de baixa prioridade. Quando chamar é decisão do chamador
 * (idle, pós-boot, pós-tela); SE pode e QUANTOS por vez é decisão daqui.
 */
export function requestPrefetch(
  key: string,
  load: () => Promise<unknown>,
  options?: PrefetchOptions,
): void {
  if (isSettledOrRunning(key)) return;
  if (queue.some((i) => i.key === key)) return;
  if (!canPrefetch()) return;
  queue.push({ key, load, timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS });
  // Microtask: a fila começa no próximo tick, sem esperar idle do chamador.
  void Promise.resolve().then(pump);
}

/**
 * Prefetch após intenção observável (pointerdown, foco, navegação iniciada).
 * Fura o limite de concorrência: a navegação é iminente — o chunk vira carga
 * real em instantes de qualquer forma. A política (saveData/visível) continua
 * valendo.
 */
export function prefetchOnIntent(
  key: string,
  load: () => Promise<unknown>,
  options?: PrefetchOptions,
): void {
  if (isSettledOrRunning(key)) return;
  if (!canPrefetch()) return;
  start({ key, load, timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS });
}

/** Mudança de rota: descarta a fila pendente (spec §3.3). */
export function cancelQueuedPrefetches(): void {
  queue.length = 0;
}

/** Uso interno de testes: estado corrente da fila. */
export function getPrefetchStateForTests(): {
  queued: string[];
  active: number;
  loaded: string[];
} {
  return {
    queued: queue.map((i) => i.key),
    active: activeCount,
    loaded: [...loaded],
  };
}

/** Uso interno de testes: zera tudo. */
export function resetScreenPrefetchForTests(): void {
  queue.length = 0;
  loaded.clear();
  inFlight.clear();
  activeCount = 0;
}
