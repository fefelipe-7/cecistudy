/**
 * Contrato do módulo de instrumentação (spec-performance.md, Fase 1).
 *
 * O que este teste garante:
 * - em dev, marcas/medições/eventos são registrados com nomes exatos da spec;
 * - `measure` sem marca de início NÃO inventa número;
 * - em produção (DEV=false), tudo é no-op e `createFrameStats` devolve null
 *   (zero custo no caminho quente — RNF-03);
 * - `flushDevMetrics` imprime e limpa o registro.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mark,
  measure,
  recordEvent,
  traceAsync,
  flushDevMetrics,
  createFrameStats,
  recordFrame,
  readPerfForTests,
  resetPerfForTests,
} from '../perfMarks';

beforeEach(() => {
  resetPerfForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetPerfForTests();
});

describe('perfMarks — caminho dev (registro ativo)', () => {
  it('traceAsync gera marcas <name>-start/end e a medição <name>', async () => {
    await traceAsync('sqlite-hydration', async () => 42);
    const { measures } = readPerfForTests();
    expect(measures).toHaveLength(1);
    expect(measures[0].name).toBe('sqlite-hydration');
    expect(measures[0].startMark).toBe('sqlite-hydration-start');
    expect(measures[0].endMark).toBe('sqlite-hydration-end');
    expect(measures[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('traceAsync mede também quando a operação rejeita', async () => {
    await expect(
      traceAsync('sync-cycle', async () => {
        throw new Error('falhou');
      }),
    ).rejects.toThrow('falhou');
    const { measures } = readPerfForTests();
    expect(measures).toHaveLength(1);
    expect(measures[0].name).toBe('sync-cycle');
  });

  it('measure sem marca de início não mede nada (não inventa número)', () => {
    measure('critical-boot-duration', 'marca-que-nao-existe');
    expect(readPerfForTests().measures).toHaveLength(0);
  });

  it('recordEvent guarda nome e detalhe', () => {
    recordEvent('boot-max-display-escape', { elapsed: 7000 });
    const { events } = readPerfForTests();
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('boot-max-display-escape');
    expect(events[0].detail).toEqual({ elapsed: 7000 });
  });

  it('flushDevMetrics imprime agrupado e limpa o registro', () => {
    const group = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    mark('boot-critical-start');
    mark('boot-critical-end');
    measure('critical-boot-duration', 'boot-critical-start', 'boot-critical-end');
    flushDevMetrics();
    expect(group).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalled();
    expect(readPerfForTests().measures).toHaveLength(0);
    group.mockRestore();
    log.mockRestore();
    // Sem nada registrado, o segundo flush não imprime.
    const group2 = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    flushDevMetrics();
    expect(group2).not.toHaveBeenCalled();
    group2.mockRestore();
  });

  it('FrameStats conta frames e skips (contador de dev)', () => {
    const stats = createFrameStats();
    expect(stats).not.toBeNull();
    recordFrame(stats);
    recordFrame(stats);
    recordFrame(stats, true);
    expect(stats!.frames).toBe(2);
    expect(stats!.skipped).toBe(1);
    expect(stats!.lastFrameAt).toBeGreaterThan(0);
  });

  it('recordFrame aceita null (produção) sem lançar', () => {
    expect(() => recordFrame(null)).not.toThrow();
  });
});

describe('perfMarks — caminho produção (no-op)', () => {
  beforeEach(() => {
    vi.stubEnv('DEV', false);
  });

  it('mark/measure/recordEvent são no-op em produção', () => {
    mark('app-entry-start');
    mark('theme-ready');
    measure('critical-boot-duration', 'app-entry-start', 'theme-ready');
    recordEvent('qualquer');
    expect(readPerfForTests().measures).toHaveLength(0);
    expect(readPerfForTests().events).toHaveLength(0);
  });

  it('traceAsync em produção devolve o resultado sem registrar', async () => {
    const value = await traceAsync('persist-write', async () => 'ok');
    expect(value).toBe('ok');
    expect(readPerfForTests().measures).toHaveLength(0);
  });

  it('createFrameStats retorna null em produção (zero custo no loop)', () => {
    expect(createFrameStats()).toBeNull();
  });

  it('flushDevMetrics é no-op em produção', () => {
    const group = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    flushDevMetrics();
    expect(group).not.toHaveBeenCalled();
    group.mockRestore();
  });
});
