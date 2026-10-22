/**
 * Boot progressivo — spec-performance.md §6.1 (camadas de prontidão) e §7 Fase 2.
 *
 * Três grupos com dependências reais entre si:
 *
 * - `critical`   → tema, abertura do banco da usuária, estado mínimo da rota.
 *                  Único que a splash espera (criticalReady).
 * - `deferred`   → catálogo core (nativo) + chunk da primeira rota. Corre após
 *                  o shell estar interativo; falha não bloqueia nada.
 * - `opportunistic` → abordagens e questões (payloads grandes). Só corre no
 *                  boot frio (fora da janela quente de 30 min) e nada na UI
 *                  depende disso: as telas pedem o próprio recurso
 *                  (`ensureApproaches`/`ensureQuestions` reaproveitam as MESMAS
 *                  promises memoizadas — sem carga dupla).
 *
 * O contrato devolve um `BootState` com status por etapa — não uma Promise
 * cega (spec §2.1): a UI sai da barreira por `criticalReady`, nunca por
 * `allReady`. A execução é deduplicada: chamadas concorrentes (StrictMode)
 * reutilizam a mesma pipeline (spec §2.4 — "não existem duas execuções
 * concorrentes de boot").
 *
 * Cache quente: se a última carga completa foi há menos de `WARM_TTL_MS`, os
 * passos pesados ficam `skipped` e a splash sai rápido.
 */
import { isNativePlatform, storage } from './storage';
import { getUserDb } from './db/userDb';
import {
  getCatalogApproaches,
  getCatalogQuestions,
  getCatalogDb,
} from './db/catalogDb';
import { mark, measure, traceAsync } from './performance/perfMarks';
import { requestPrefetch } from './performance/screenPrefetch';

/** Janela do cache quente: dentro dela o boot é "morno" (sem passos pesados). */
export const WARM_TTL_MS = 30 * 60 * 1000;

/** Chave (prefixada pelo storage) com o timestamp da última carga completa. */
export const LAST_FULL_PRELOAD_KEY = 'lastFullPreloadAt';

// ---------------------------------------------------------------------------
// Contrato (spec §6.1) — o BootStepId é o da spec, sem renomear por plataforma
// ---------------------------------------------------------------------------

export type BootStepId =
  | 'theme'
  | 'user-db'
  | 'user-state'
  | 'catalog-core'
  | 'catalog-approaches'
  | 'catalog-questions'
  | 'route-prefetch';

export type BootStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error';

export type BootStepGroup = 'critical' | 'deferred' | 'opportunistic';

export interface BootStepResult {
  id: BootStepId;
  status: BootStepStatus;
  startedAt?: number;
  endedAt?: number;
  error?: unknown;
}

export interface BootState {
  criticalReady: boolean;
  deferredReady: boolean;
  opportunisticReady: boolean;
  steps: Record<BootStepId, BootStepResult>;
  errors: Array<{ step: BootStepId; error: unknown }>;
}

export type OnBootProgress = (state: BootState) => void;

export interface BootOptions {
  signal?: AbortSignal;
}

const ALL_STEP_IDS: readonly BootStepId[] = [
  'theme',
  'user-db',
  'user-state',
  'catalog-core',
  'route-prefetch',
  'catalog-approaches',
  'catalog-questions',
];

const STEP_GROUP: Record<BootStepId, BootStepGroup> = {
  theme: 'critical',
  'user-db': 'critical',
  'user-state': 'critical',
  'catalog-core': 'deferred',
  'catalog-approaches': 'opportunistic',
  'catalog-questions': 'opportunistic',
  'route-prefetch': 'deferred',
};

// ---------------------------------------------------------------------------
// Passos — cada um resolve uma única vez (memoização por sessão)
// ---------------------------------------------------------------------------

function defaultApproachesImpl(): Promise<unknown> {
  return isNativePlatform
    ? getCatalogApproaches()
    : import('../data/psicoterapiaApproaches').then((m) => m.PSICOTERAPIA_APPROACHES);
}

function defaultQuestionsImpl(): Promise<unknown> {
  return isNativePlatform
    ? getCatalogQuestions()
    : import('../data/bancoQuestoes').then((m) => m.BANCO_QUESTOES);
}

interface StepImpls {
  approachesImpl(): Promise<unknown>;
  questionsImpl(): Promise<unknown>;
}

const stepImpls: StepImpls = {
  approachesImpl: defaultApproachesImpl,
  questionsImpl: defaultQuestionsImpl,
};

let approachesPromise: Promise<unknown> | undefined;
let questionsPromise: Promise<unknown> | undefined;

function memoize(kind: 'approaches' | 'questions'): Promise<unknown> {
  if (kind === 'approaches') {
    if (!approachesPromise) {
      approachesPromise = stepImpls.approachesImpl().catch((e) => {
        approachesPromise = undefined;
        throw e;
      });
    }
    return approachesPromise;
  }
  if (!questionsPromise) {
    questionsPromise = stepImpls.questionsImpl().catch((e) => {
      questionsPromise = undefined;
      throw e;
    });
  }
  return questionsPromise;
}

/** Abordagens do catálogo — mesma promise usada pela splash e pelo provider. */
export function ensureApproaches<T = unknown>(): Promise<T[]> {
  return memoize('approaches') as Promise<T[]>;
}

/** Questões do banco — mesma promise usada pela splash e pelo provider. */
export function ensureQuestions<T = unknown>(): Promise<T[]> {
  return memoize('questions') as Promise<T[]>;
}

// ---------------------------------------------------------------------------
// Cache quente (TTL)
// ---------------------------------------------------------------------------

export async function getLastFullPreloadAt(): Promise<number> {
  try {
    const raw = await storage.get(LAST_FULL_PRELOAD_KEY);
    const value = raw == null ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Puro: true quando `lastAt` está dentro da janela quente. */
export function isWithinWarmTtl(lastAt: number, now: number, ttl = WARM_TTL_MS): boolean {
  return lastAt > 0 && now - lastAt < ttl;
}

// ---------------------------------------------------------------------------
// Planejamento — puro, testável
// ---------------------------------------------------------------------------

export interface PlannedBootStep {
  id: BootStepId;
  group: BootStepGroup;
  /** Presente quando o passo não se aplica (plataforma ou cache quente). */
  skipReason?: string;
}

/**
 * Monta o plano do arranque conforme plataforma e cache quente. O passo
 * `user-state` é sempre `skipped`: a hidratação das coleções é pós-mount por
 * design (persistência tri-modal, um hook por coleção) — a splash não espera
 * estado hidratado, e o provider já reage à chegada tardia com efeitos de
 * reparo. No cliente mobile o `theme` também é `skipped`: o tema aplicado no
 * boot vem do efeito de hidratação do provider, não de um initTheme pré-React.
 */
export function planBootSteps(warm: boolean, native: boolean): PlannedBootStep[] {
  return ALL_STEP_IDS.map((id) => {
    switch (id) {
      case 'theme':
        return {
          id,
          group: STEP_GROUP[id],
          ...(native ? { skipReason: 'tema aplica via efeito do provider (mobile)' } : {}),
        };
      case 'user-db':
        return {
          id,
          group: STEP_GROUP[id],
          ...(native ? {} : { skipReason: 'web usa localStorage síncrono' }),
        };
      case 'user-state':
        return {
          id,
          group: STEP_GROUP[id],
          skipReason: 'hidratação por coleção é pós-mount por design (tri-modal)',
        };
      case 'catalog-core':
        return {
          id,
          group: STEP_GROUP[id],
          ...(native ? {} : { skipReason: 'catálogo na web vem dos facades JS' }),
        };
      case 'route-prefetch':
        return { id, group: STEP_GROUP[id] };
      case 'catalog-approaches':
      case 'catalog-questions':
        return {
          id,
          group: STEP_GROUP[id],
          ...(warm ? { skipReason: 'cache quente (<30 min)' } : {}),
        };
    }
  });
}

// ---------------------------------------------------------------------------
// Pipeline do boot — grupos paralelos com allSettled por etapa
// ---------------------------------------------------------------------------

function buildInitialSteps(): Record<BootStepId, BootStepResult> {
  const steps = {} as Record<BootStepId, BootStepResult>;
  for (const id of ALL_STEP_IDS) steps[id] = { id, status: 'pending' };
  return steps;
}

const TERMINAL: readonly BootStepStatus[] = ['done', 'skipped', 'error'];

function buildState(steps: Record<BootStepId, BootStepResult>): BootState {
  const groupReady = (group: BootStepGroup) =>
    ALL_STEP_IDS.filter((id) => STEP_GROUP[id] === group).every((id) =>
      TERMINAL.includes(steps[id].status),
    );
  const errors = ALL_STEP_IDS.filter((id) => steps[id].status === 'error').map(
    (id): { step: BootStepId; error: unknown } => ({
      step: id,
      error: steps[id].error,
    }),
  );
  return {
    criticalReady: groupReady('critical'),
    deferredReady: groupReady('deferred'),
    opportunisticReady: groupReady('opportunistic'),
    steps: { ...steps },
    errors,
  };
}

/** Runner padrão de cada passo, conforme plano (`skipReason` = null). */
function defaultRunner(
  id: BootStepId,
): (() => Promise<unknown>) | null {
  switch (id) {
    case 'theme':
      // initTheme() já rodou em main.tsx antes do React montar — o passo só
      // registra esse fato no estado do boot.
      return async () => undefined;
    case 'user-db':
      return () => getUserDb();
    case 'user-state':
      return null;
    case 'catalog-core':
      return () => getCatalogDb();
    case 'route-prefetch':
      return () =>
        traceAsync('first-route-chunk', () => import('../components/views/HomeView'));
    case 'catalog-approaches':
      return () => memoize('approaches');
    case 'catalog-questions':
      return () => memoize('questions');
  }
}

let progressListener: OnBootProgress | undefined;
const runnerOverrides = new Map<BootStepId, () => Promise<unknown>>();

async function executeBoot(options?: BootOptions): Promise<BootState> {
  const lastAt = await getLastFullPreloadAt();
  const warm = isWithinWarmTtl(lastAt, Date.now());
  const plan = planBootSteps(warm, isNativePlatform);
  const steps = buildInitialSteps();
  const emit = () => progressListener?.(buildState(steps));
  emit();

  const runStep = async (step: PlannedBootStep): Promise<void> => {
    const override = runnerOverrides.get(step.id);
    const run = override ?? (step.skipReason ? null : defaultRunner(step.id));
    if (!run) {
      steps[step.id] = { id: step.id, status: 'skipped', endedAt: Date.now() };
      emit();
      return;
    }
    steps[step.id] = { id: step.id, status: 'running', startedAt: Date.now() };
    emit();
    try {
      await run();
      steps[step.id] = {
        id: step.id,
        status: 'done',
        startedAt: steps[step.id].startedAt,
        endedAt: Date.now(),
      };
    } catch (e) {
      // Falha de etapa não derruba o grupo (spec §2.2): registra, segue, e o
      // erro fica visível no `errors` do BootState — nada de console mudo.
      console.warn(`[bootPreload] passo "${step.id}" falhou — seguindo`, e);
      steps[step.id] = {
        id: step.id,
        status: 'error',
        startedAt: steps[step.id].startedAt,
        endedAt: Date.now(),
        error: e,
      };
    }
    emit();
  };

  const runGroup = async (group: BootStepGroup, spanName: string): Promise<void> => {
    const groupSteps = plan.filter((s) => s.group === group);
    if (groupSteps.length === 0) return;
    mark(`${spanName}-start`);
    try {
      // allSettled: `runStep` nunca rejeita, mas a intenção (spec §2.2) é que
      // UMA falha opcional não derrube o conjunto.
      await Promise.allSettled(groupSteps.map(runStep));
    } finally {
      mark(`${spanName}-end`);
      measure(
        group === 'critical' ? 'critical-boot-duration' : `${spanName}-duration`,
        `${spanName}-start`,
        `${spanName}-end`,
      );
    }
  };

  const abortPending = (): void => {
    for (const id of ALL_STEP_IDS) {
      if (steps[id].status === 'pending') {
        steps[id] = { id, status: 'skipped', endedAt: Date.now() };
      }
    }
    emit();
  };

  await runGroup('critical', 'boot-critical');
  if (options?.signal?.aborted) {
    abortPending();
    return buildState(steps);
  }
  await runGroup('deferred', 'boot-deferred');
  if (options?.signal?.aborted) {
    abortPending();
    return buildState(steps);
  }
  await runGroup('opportunistic', 'boot-opportunistic');

  // A janela quente só é renovada quando a carga completa de fato aconteceu.
  if (!warm) {
    await storage.set(LAST_FULL_PRELOAD_KEY, String(Date.now()));
  }

  return buildState(steps);
}

let bootRun: Promise<BootState> | undefined;

/**
 * Executa (ou reaproveita) o boot progressivo. A Promise resolve com o estado
 * final — mas a UI **não pode** depender dela para montar a primeira tela
 * (spec §2.1): quem libera a splash é `criticalReady` via `onProgress`.
 * Chamadas concorrentes (StrictMode) deduplicam na mesma pipeline.
 */
export function runBootPreload(
  onProgress?: OnBootProgress,
  options?: BootOptions,
): Promise<BootState> {
  if (onProgress) progressListener = onProgress;
  if (!bootRun) bootRun = executeBoot(options);
  return bootRun;
}

// ---------------------------------------------------------------------------
// Pós-boot: prefetch em idle das abas prováveis — SOB a política do
// screenPrefetch (saveData/visibilidade/limite/dedup, spec §7 Fase 3).
// As chaves casam com as de `SharedScreenLayers` (`screen:<key>`).
// ---------------------------------------------------------------------------

let idlePrefetchScheduled = false;

export function scheduleIdlePrefetch(timeoutMs = 4000): void {
  if (idlePrefetchScheduled || typeof window === 'undefined') return;
  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
    }
  ).requestIdleCallback;
  if (!ric) return;
  idlePrefetchScheduled = true;
  ric(() => {
    requestPrefetch('screen:biblioteca', () =>
      import('../components/views/BibliotecaView'),
    );
    requestPrefetch('screen:estudos', () =>
      import('../components/views/EstudosView'),
    );
  }, { timeout: timeoutMs });
}

/** Uso interno de testes: substitui a fonte de qualquer passo. */
export function setStepImplForTests(
  id: BootStepId,
  impl: () => Promise<unknown>,
): void {
  if (id === 'catalog-approaches') {
    stepImpls.approachesImpl = impl;
    return;
  }
  if (id === 'catalog-questions') {
    stepImpls.questionsImpl = impl;
    return;
  }
  runnerOverrides.set(id, impl);
}

/** Uso interno de testes: descarta memos, overrides e flags da sessão. */
export function resetBootPreloadForTests(): void {
  approachesPromise = undefined;
  questionsPromise = undefined;
  idlePrefetchScheduled = false;
  bootRun = undefined;
  progressListener = undefined;
  runnerOverrides.clear();
  stepImpls.approachesImpl = defaultApproachesImpl;
  stepImpls.questionsImpl = defaultQuestionsImpl;
}
