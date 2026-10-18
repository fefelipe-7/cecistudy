/**
 * Boot progressivo (spec-performance.md §6.1 e §7 Fase 2).
 *
 * O que este arquivo garante:
 * - plano por grupo (critical/deferred/opportunistic) conforme plataforma e
 *   cache quente — puro, sem rede;
 * - `runBootPreload` resolve um `BootState` com status por etapa; falha de
 *   etapa vira `errors`, não derruba o grupo;
 * - chamadas concorrentes deduplicam na MESMA pipeline (StrictMode);
 * - memoização das promises compartilhadas segue igual (provider + splash).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LAST_FULL_PRELOAD_KEY,
  WARM_TTL_MS,
  ensureApproaches,
  isWithinWarmTtl,
  planBootSteps,
  resetBootPreloadForTests,
  runBootPreload,
  setStepImplForTests,
  type BootState,
  type BootStepId,
} from '../bootPreload';

const PREFIXED_KEY = `cecistudy_${LAST_FULL_PRELOAD_KEY}`;

const ok = () => Promise.resolve();

beforeEach(() => {
  resetBootPreloadForTests();
  localStorage.removeItem(PREFIXED_KEY);
  // Passos que fariam imports reais de views viram promises instantâneas.
  setStepImplForTests('route-prefetch', ok);
  setStepImplForTests('catalog-approaches', ok);
  setStepImplForTests('catalog-questions', ok);
});

const statusOf = (state: BootState, id: BootStepId) => state.steps[id].status;

describe('isWithinWarmTtl', () => {
  const now = 10_000_000;

  it('retorna false sem timestamp anterior', () => {
    expect(isWithinWarmTtl(0, now)).toBe(false);
  });

  it('retorna true dentro da janela de 30 min', () => {
    expect(isWithinWarmTtl(now - WARM_TTL_MS + 1, now)).toBe(true);
    expect(isWithinWarmTtl(now - 1000, now)).toBe(true);
  });

  it('retorna false no limite e depois da janela', () => {
    expect(isWithinWarmTtl(now - WARM_TTL_MS, now)).toBe(false);
    expect(isWithinWarmTtl(now - WARM_TTL_MS - 1, now)).toBe(false);
  });
});

describe('planBootSteps (plano por grupo)', () => {
  it('boot frio na web: theme roda; user-db/user-state/catalog-core ficam skipped', () => {
    const plan = planBootSteps(false, false);
    expect(plan.map((s) => s.id)).toEqual([
      'theme',
      'user-db',
      'user-state',
      'catalog-core',
      'route-prefetch',
      'catalog-approaches',
      'catalog-questions',
    ]);
    const byId = Object.fromEntries(plan.map((s) => [s.id, s]));
    expect(byId['theme'].skipReason).toBeUndefined();
    expect(byId['user-db'].skipReason).toBe('web usa localStorage síncrono');
    expect(byId['user-state'].skipReason).toContain('pós-mount');
    expect(byId['catalog-core'].skipReason).toContain('facades JS');
    expect(byId['route-prefetch'].skipReason).toBeUndefined();
    expect(byId['catalog-approaches'].skipReason).toBeUndefined();
    expect(byId['catalog-questions'].skipReason).toBeUndefined();
  });

  it('boot frio nativo: user-db e catalog-core rodam; theme vem do provider', () => {
    const byId = Object.fromEntries(planBootSteps(false, true).map((s) => [s.id, s]));
    expect(byId['theme'].skipReason).toContain('provider');
    expect(byId['user-db'].skipReason).toBeUndefined();
    expect(byId['catalog-core'].skipReason).toBeUndefined();
  });

  it('boot morno: abordagens e questões ficam skipped (cache quente)', () => {
    const byId = Object.fromEntries(planBootSteps(true, false).map((s) => [s.id, s]));
    expect(byId['catalog-approaches'].skipReason).toContain('cache quente');
    expect(byId['catalog-questions'].skipReason).toContain('cache quente');
  });

  it('grupos: critical = theme/user-db/user-state; deferred = catalog-core/route-prefetch', () => {
    const plan = planBootSteps(false, true);
    const idsOf = (g: string) => plan.filter((s) => s.group === g).map((s) => s.id);
    expect(idsOf('critical')).toEqual(['theme', 'user-db', 'user-state']);
    expect(idsOf('deferred')).toEqual(['catalog-core', 'route-prefetch']);
    expect(idsOf('opportunistic')).toEqual(['catalog-approaches', 'catalog-questions']);
  });
});

describe('runBootPreload (contrato BootState)', () => {
  it('resolve BootState com os três grupos prontos e grava o timestamp de carga completa', async () => {
    const events: BootState[] = [];
    const state = await runBootPreload((s) => events.push(s));

    expect(state.criticalReady).toBe(true);
    expect(state.deferredReady).toBe(true);
    expect(state.opportunisticReady).toBe(true);
    expect(state.errors).toEqual([]);

    // Web: user-db/user-state/catalog-core não se aplicam — skipped, não erro.
    expect(statusOf(state, 'theme')).toBe('done');
    expect(statusOf(state, 'user-db')).toBe('skipped');
    expect(statusOf(state, 'user-state')).toBe('skipped');
    expect(statusOf(state, 'catalog-core')).toBe('skipped');
    expect(statusOf(state, 'route-prefetch')).toBe('done');
    expect(statusOf(state, 'catalog-approaches')).toBe('done');
    expect(statusOf(state, 'catalog-questions')).toBe('done');

    // Progresso emite do estado inicial (nada pronto) ao final (tudo pronto).
    expect(events[0].criticalReady).toBe(false);
    expect(events[events.length - 1]).toMatchObject(state);

    const saved = Number(localStorage.getItem(PREFIXED_KEY));
    expect(Number.isFinite(saved) && saved > 0).toBe(true);
  });

  it('boot morno pula os passos pesados e preserva o timestamp', async () => {
    localStorage.setItem(PREFIXED_KEY, String(Date.now() - 60_000));
    const before = localStorage.getItem(PREFIXED_KEY);

    const state = await runBootPreload();

    expect(statusOf(state, 'catalog-approaches')).toBe('skipped');
    expect(statusOf(state, 'catalog-questions')).toBe('skipped');
    expect(statusOf(state, 'route-prefetch')).toBe('done');
    expect(localStorage.getItem(PREFIXED_KEY)).toBe(before);
  });

  it('falha de etapa oportunística não bloqueia o grupo e vira erro visível', async () => {
    setStepImplForTests(
      'catalog-questions',
      vi.fn().mockRejectedValue(new Error('catálogo indisponível')),
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const state = await runBootPreload();

    expect(statusOf(state, 'catalog-questions')).toBe('error');
    expect(state.errors).toEqual([
      { step: 'catalog-questions', error: new Error('catálogo indisponível') },
    ]);
    // O grupo terminou (erro é terminal) e o crítico nunca foi tocado.
    expect(state.opportunisticReady).toBe(true);
    expect(state.criticalReady).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('chamadas concorrentes deduplicam na mesma pipeline (StrictMode)', async () => {
    const spy = vi.fn(ok);
    setStepImplForTests('route-prefetch', spy);

    const p1 = runBootPreload();
    const p2 = runBootPreload();
    expect(p2).toBe(p1);

    const [s1, s2] = await Promise.all([p1, p2]);
    expect(s1).toBe(s2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('signal abortado antes do deferred marca o resto como skipped', async () => {
    const controller = new AbortController();
    controller.abort();
    const state = await runBootPreload(undefined, { signal: controller.signal });

    expect(state.criticalReady).toBe(true);
    expect(statusOf(state, 'route-prefetch')).toBe('skipped');
    expect(statusOf(state, 'catalog-approaches')).toBe('skipped');
    expect(state.deferredReady).toBe(true);
    expect(state.opportunisticReady).toBe(true);
  });
});

describe('memoização das promises compartilhadas', () => {
  it('ensureApproaches resolve a fonte uma única vez entre chamadas', async () => {
    const impl = vi.fn().mockResolvedValue([{ id: 'app-1' }]);
    setStepImplForTests('catalog-approaches', impl);

    const [a, b] = await Promise.all([ensureApproaches(), ensureApproaches()]);
    expect(a).toEqual([{ id: 'app-1' }]);
    expect(b).toBe(a);
    expect(impl).toHaveBeenCalledTimes(1);
  });

  it('falha descarta o memo — a próxima chamada tenta de novo', async () => {
    let calls = 0;
    setStepImplForTests(
      'catalog-approaches',
      vi.fn(() =>
        ++calls === 1 ? Promise.reject(new Error('boom')) : Promise.resolve([])
      ),
    );

    await expect(ensureApproaches()).rejects.toThrow('boom');
    await expect(ensureApproaches()).resolves.toEqual([]);
    expect(calls).toBe(2);
  });
});
