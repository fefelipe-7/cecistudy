/**
 * Pré-carga do boot — alimenta a splash com progresso REAL.
 *
 * Cada passo pesado do arranque (SQLite da usuária, catálogo, abordagens,
 * questões, facade da biblioteca, chunks das telas) vira um passo nomeado com
 * promise memoizada: a splash acompanha o progresso e o resto do app (ex.:
 * seed effects do AppContext) reaproveita as MESMAS promises — sem carga dupla.
 *
 * Cache quente: se a última carga completa foi há menos de WARM_TTL_MS, os
 * passos pesados são pulados (fontes já em cache local/browser) e a splash
 * sai rápido. Depois do TTL, a otimização completa roda de novo.
 */
import { isNativePlatform, storage } from './storage';
import { getUserDb } from './db/userDb';
import {
  getCatalogApproaches,
  getCatalogQuestions,
  getCatalogDb,
} from './db/catalogDb';

/** Janela do cache quente: dentro dela o boot é "morno" (sem passos pesados). */
export const WARM_TTL_MS = 30 * 60 * 1000;

/** Chave (prefixada pelo storage) com o timestamp da última carga completa. */
export const LAST_FULL_PRELOAD_KEY = 'lastFullPreloadAt';

export type BootStepId =
  | 'userDb'
  | 'catalog'
  | 'approaches'
  | 'questions'
  | 'books'
  | 'views';

export interface BootStep {
  id: BootStepId;
  /** Frase curta (lowercase) mostrada junto ao progresso. */
  label: string;
}

export interface BootProgress {
  done: number;
  total: number;
  /** 0..1 — fração real concluída. */
  fraction: number;
  label: string;
}

export type OnBootProgress = (progress: BootProgress) => void;

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
let booksPromise: Promise<unknown> | undefined;

const stepRunners: Record<BootStepId, () => Promise<unknown>> = {
  /** Nativo: abre/migra o SQLite da usuária (singleton; no-op na web). */
  userDb: () => getUserDb(),
  /** Nativo: copia/abre o catálogo somente-leitura (no-op na web). */
  catalog: () => getCatalogDb(),
  /** Abordagens (~97): SQLite no nativo, módulo embutido na web. */
  approaches: () => memoize('approaches'),
  /** Questões (745): mesmo tratamento das abordagens. */
  questions: () => memoize('questions'),
  /** Facade da biblioteca (chunk pesado de dados estáticos). */
  books: () => {
    if (!booksPromise) {
      booksPromise = import('../data/books').catch((e) => {
        booksPromise = undefined;
        throw e;
      });
    }
    return booksPromise;
  },
  /** Chunk da tela inicial — primeira aba instantânea ao sair da splash. */
  views: () => import('../components/views/HomeView'),
};

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

/** Abordagens do catálogo — mesma promise usada pela splash e pelo AppContext. */
export function ensureApproaches<T = unknown>(): Promise<T[]> {
  return stepRunners.approaches() as Promise<T[]>;
}

/** Questões do banco — mesma promise usada pela splash e pelo AppContext. */
export function ensureQuestions<T = unknown>(): Promise<T[]> {
  return stepRunners.questions() as Promise<T[]>;
}

/** Módulo facade da biblioteca (`src/data/books`) já resolvido. */
export function ensureBooksFacade(): Promise<typeof import('../data/books')> {
  return stepRunners.books() as Promise<typeof import('../data/books')>;
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
// Pipeline do boot
// ---------------------------------------------------------------------------

/** Monta a lista de passos do arranque conforme plataforma e cache quente. */
export function planBootSteps(warm: boolean, native: boolean): BootStep[] {
  const steps: BootStep[] = [];
  if (native) steps.push({ id: 'userDb', label: 'abrindo o cantinho' });
  if (!warm) {
    if (native) steps.push({ id: 'catalog', label: 'folheando o acervo' });
    steps.push(
      { id: 'approaches', label: 'organizando as abordagens' },
      { id: 'questions', label: 'contando as questõezinhas' },
      { id: 'books', label: 'colocando os livros nas prateleiras' }
    );
  }
  steps.push({ id: 'views', label: 'arrumando a mesinha' });
  return steps;
}

/**
 * Executa o arranque com progresso real. Passos que falham são registrados e
 * o pipeline segue (o app degrada graciosamente como já fazia).
 */
export async function runBootPreload(onProgress?: OnBootProgress): Promise<void> {
  const lastAt = await getLastFullPreloadAt();
  const warm = isWithinWarmTtl(lastAt, Date.now());
  const steps = planBootSteps(warm, isNativePlatform);

  let done = 0;
  const emit = (label: string) => {
    onProgress?.({
      done,
      total: steps.length,
      fraction: steps.length === 0 ? 1 : done / steps.length,
      label,
    });
  };
  emit('');

  for (const step of steps) {
    try {
      await stepRunners[step.id]();
    } catch (e) {
      console.warn(`[bootPreload] passo "${step.id}" falhou — seguindo`, e);
    }
    done += 1;
    emit(step.label);
  }

  // A janela quente só é renovada quando a carga completa de fato aconteceu.
  if (!warm && steps.length > 0) {
    await storage.set(LAST_FULL_PRELOAD_KEY, String(Date.now()));
  }
}

// ---------------------------------------------------------------------------
// Pós-boot: prefetch em idle das demais abas (navegação instantânea depois)
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
    void import('../components/views/BibliotecaView').catch(() => {});
    void import('../components/views/EstudosView').catch(() => {});
  }, { timeout: timeoutMs });
}

/** Uso interno de testes: substitui a fonte de qualquer passo. */
export function setStepImplForTests(
  id: BootStepId,
  impl: () => Promise<unknown>
): void {
  if (id === 'approaches') {
    stepImpls.approachesImpl = impl;
    return;
  }
  if (id === 'questions') {
    stepImpls.questionsImpl = impl;
    return;
  }
  stepRunners[id] = impl;
}

const defaultRunners: Record<BootStepId, () => Promise<unknown>> = { ...stepRunners };

/** Uso interno de testes: descarta memos e flags da sessão. */
export function resetBootPreloadForTests(): void {
  approachesPromise = undefined;
  questionsPromise = undefined;
  booksPromise = undefined;
  idlePrefetchScheduled = false;
  stepImpls.approachesImpl = defaultApproachesImpl;
  stepImpls.questionsImpl = defaultQuestionsImpl;
  Object.assign(stepRunners, defaultRunners);
}
