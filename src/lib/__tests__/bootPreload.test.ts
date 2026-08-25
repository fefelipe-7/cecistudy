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
  type BootProgress,
} from '../bootPreload';

const PREFIXED_KEY = `cecistudy_${LAST_FULL_PRELOAD_KEY}`;

const ok = () => Promise.resolve();

beforeEach(() => {
  resetBootPreloadForTests();
  localStorage.removeItem(PREFIXED_KEY);
  // Todos os passos viram promises instantâneas — nada de imports reais.
  (['userDb', 'catalog', 'approaches', 'questions', 'books', 'views'] as const).forEach(
    (id) => setStepImplForTests(id, ok)
  );
});

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

describe('planBootSteps', () => {
  it('boot frio na web: abordagens, questões, livros e telas', () => {
    const ids = planBootSteps(false, false).map((s) => s.id);
    expect(ids).toEqual(['approaches', 'questions', 'books', 'views']);
  });

  it('boot morno pula os passos pesados', () => {
    const warm = planBootSteps(true, false);
    const warmNative = planBootSteps(true, true);
    expect(warm.map((s) => s.id)).toEqual(['views']);
    expect(warmNative.map((s) => s.id)).toEqual(['userDb', 'views']);
  });

  it('boot frio nativo inclui banco da usuária e catálogo antes dos dados', () => {
    const ids = planBootSteps(false, true).map((s) => s.id);
    expect(ids).toEqual([
      'userDb',
      'catalog',
      'approaches',
      'questions',
      'books',
      'views',
    ]);
  });
});

describe('runBootPreload', () => {
  it('emite progresso real do zero ao cem e grava o timestamp da carga completa', async () => {
    const events: BootProgress[] = [];
    await runBootPreload((p) => events.push(p));

    expect(events[0]).toMatchObject({ done: 0, total: 4, fraction: 0 });
    expect(events[events.length - 1]).toMatchObject({ done: 4, total: 4, fraction: 1 });
    expect(events.map((e) => e.done)).toEqual([0, 1, 2, 3, 4]);

    const saved = Number(localStorage.getItem(PREFIXED_KEY));
    expect(Number.isFinite(saved) && saved > 0).toBe(true);
  });

  it('boot morno (<30 min) roda só o passo leve e preserva o timestamp', async () => {
    localStorage.setItem(PREFIXED_KEY, String(Date.now() - 60_000));
    const before = localStorage.getItem(PREFIXED_KEY);

    const events: BootProgress[] = [];
    await runBootPreload((p) => events.push(p));

    expect(events[0].total).toBe(1);
    expect(events[events.length - 1]).toMatchObject({ done: 1, total: 1, fraction: 1 });
    expect(localStorage.getItem(PREFIXED_KEY)).toBe(before);
  });

  it('passo que falha não derruba o pipeline', async () => {
    setStepImplForTests(
      'questions',
      vi.fn().mockRejectedValue(new Error('catálogo indisponível'))
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const events: BootProgress[] = [];
    await expect(runBootPreload((p) => events.push(p))).resolves.toBeUndefined();

    expect(events[events.length - 1]).toMatchObject({ done: 4, total: 4, fraction: 1 });
    warnSpy.mockRestore();
  });
});

describe('memoização das promises compartilhadas', () => {
  it('ensureApproaches resolve a fonte uma única vez entre chamadas', async () => {
    const impl = vi.fn().mockResolvedValue([{ id: 'app-1' }]);
    setStepImplForTests('approaches', impl);

    const [a, b] = await Promise.all([ensureApproaches(), ensureApproaches()]);
    expect(a).toEqual([{ id: 'app-1' }]);
    expect(b).toBe(a);
    expect(impl).toHaveBeenCalledTimes(1);
  });

  it('falha descarta o memo — a próxima chamada tenta de novo', async () => {
    let calls = 0;
    setStepImplForTests(
      'approaches',
      vi.fn(() =>
        ++calls === 1 ? Promise.reject(new Error('boom')) : Promise.resolve([])
      )
    );

    await expect(ensureApproaches()).rejects.toThrow('boom');
    await expect(ensureApproaches()).resolves.toEqual([]);
    expect(calls).toBe(2);
  });
});
