/**
 * Marcações de performance — spec-performance.md, Fase 1 (instrumentação).
 *
 * Contrato (spec §"Fase 1"):
 * - Em **desenvolvimento** (`import.meta.env.DEV`): registra marcas com
 *   `performance.mark/measure` do User Timing API + um registro próprio que
 *   funciona mesmo sem a API (jsdom antigo), e imprime tudo agrupado no
 *   `flushDevMetrics()`.
 * - Em **produção**: TODA função é no-op — zero alocação, zero trabalho no
 *   caminho quente (RNF-02/RNF-03). A única exceção futura seria uma métrica
 *   explicitamente habilitada (fora do escopo desta fase).
 *
 * Marcas obrigatórias da spec (§"Marcas obrigatórias"): `app-entry-start`,
 * `theme-ready`, `boot-critical-start/end`, `boot-deferred-start/end`,
 * `boot-opportunistic-start/end`, `first-screen-mounted`, `interactive-ready`,
 * `first-route-chunk-start/end`, `sqlite-hydration-start/end`,
 * `catalog-request-start/end`, `persist-write-start/end`,
 * `sync-cycle-start/end`. As de deferred/opportunistic nascem na F2 (boot
 * progressivo); as demais já são emitidas pelos pontos de integração.
 *
 * Módulo puro: sem imports de `react`, `@capacitor/*` ou `packages/*`
 * (respeita o gate de fronteiras — pode ser importado de qualquer camada).
 */

export interface PerfEvent {
  name: string;
  detail?: Record<string, unknown>;
  at: number;
}

export interface PerfMeasure {
  name: string;
  startMark: string;
  endMark?: string;
  durationMs: number;
}

const marks = new Map<string, number>();
const measures: PerfMeasure[] = [];
const events: PerfEvent[] = [];

/** Instrumentação ativa só em dev (lido por chamada — testável com stub). */
function perfEnabled(): boolean {
  return Boolean(import.meta.env?.DEV);
}

/** API User Timing existe neste ambiente? (jsdom/browser antigo) */
function nativePerf(): Performance | undefined {
  return typeof performance !== 'undefined' &&
    typeof performance.mark === 'function' &&
    typeof performance.measure === 'function'
    ? performance
    : undefined;
}

/** Marca um instante. No-op em produção. */
export function mark(name: string): void {
  if (!perfEnabled()) return;
  marks.set(name, Date.now());
  try {
    nativePerf()?.mark(name);
  } catch {
    /* User Timing é best-effort; o registro interno é a fonte. */
  }
}

/**
 * Mede entre duas marcas (`end` omitido = agora). Se a marca de início não
 * existe, não mede nada — instrumentação não inventa número.
 */
export function measure(name: string, start: string, end?: string): void {
  if (!perfEnabled()) return;
  const startAt = marks.get(start);
  if (startAt == null) return;
  const endAt = end != null ? marks.get(end) : Date.now();
  if (endAt == null) return;
  measures.push({ name, startMark: start, endMark: end, durationMs: endAt - startAt });
  try {
    nativePerf()?.measure(name, start, end);
  } catch {
    /* idem mark() */
  }
}

/** Evento pontual (contagem, não duração). No-op em produção. */
export function recordEvent(name: string, detail?: Record<string, unknown>): void {
  if (!perfEnabled()) return;
  events.push({ name, detail, at: Date.now() });
}

/**
 * Envolve uma operação assíncrona com `<name>-start` / `<name>-end` e a
 * medição `<name>` — cobre sucesso, erro e early-return (finally).
 * Em produção devolve a própria promise, sem envolver nada.
 */
export async function traceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!perfEnabled()) return fn();
  mark(`${name}-start`);
  try {
    return await fn();
  } finally {
    mark(`${name}-end`);
    measure(name, `${name}-start`, `${name}-end`);
  }
}

/**
 * Imprime o resumo agrupado das medições/eventos e limpa o registro.
 * Chamar no fim da sessão de medição (ex.: `interactive-ready` + alguns segundos).
 * No-op em produção e quando não há nada registrado.
 */
export function flushDevMetrics(): void {
  if (!perfEnabled()) return;
  if (measures.length === 0 && events.length === 0) return;
  const flushed = readPerfForTests();
  console.groupCollapsed(
    `[perf] ${flushed.measures.length} medições · ${flushed.events.length} eventos`,
  );
  for (const m of flushed.measures) {
    console.log(
      `${m.name}: ${m.durationMs}ms (${m.startMark}${m.endMark ? ` → ${m.endMark}` : ''})`,
    );
  }
  for (const e of flushed.events) {
    console.log(`${e.name}${e.detail ? ` ${JSON.stringify(e.detail)}` : ''}`);
  }
  console.groupEnd();
  measures.length = 0;
  events.length = 0;
}

// ---------------------------------------------------------------------------
// FrameStats — contador de frames por gráfico dithered (spec §"Instrumentação
// de frames"). Só existe em dev; em produção `createFrameStats()` retorna
// `null` e os `record*` aceitam `null` sem custo no loop de animação.
// ---------------------------------------------------------------------------

export interface FrameStats {
  frames: number;
  skipped: number;
  lastFrameAt: number;
}

/** `null` em produção — o gráfico nem aloca o contador. */
export function createFrameStats(): FrameStats | null {
  return perfEnabled() ? { frames: 0, skipped: 0, lastFrameAt: 0 } : null;
}

/** Registra um frame desenhado (ou pulado — `skipped: true`). */
export function recordFrame(stats: FrameStats | null, skipped = false): void {
  if (!stats) return;
  if (skipped) stats.skipped += 1;
  else stats.frames += 1;
  stats.lastFrameAt = Date.now();
}

// ---------------------------------------------------------------------------
// Acesso de teste — mesmas funções, exportadas para o Vitest (o módulo é
// dev-only; em produção os arrays permanecem vazios para sempre).
// ---------------------------------------------------------------------------

/** Uso interno de testes: cópia do registro atual. */
export function readPerfForTests(): { measures: PerfMeasure[]; events: PerfEvent[] } {
  return { measures: [...measures], events: [...events] };
}

/** Uso interno de testes: limpa marcas, medições e eventos. */
export function resetPerfForTests(): void {
  marks.clear();
  measures.length = 0;
  events.length = 0;
}
