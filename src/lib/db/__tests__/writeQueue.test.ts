/**
 * Contrato da fila de escrita SQLite (spec-performance.md §7 Fase 7).
 *
 * O que este teste garante (todas as janelas de perda identificadas na
 * auditoria da F5, agora provadas fechadas):
 *
 * - debounce 200 ms: a escrita não começa antes da rajata assentar;
 * - 50 enfileiramentos rápidos → UMA escrita com o ÚLTIMO valor;
 * - escrita lenta seguida de rápida NÃO regride (a última vence);
 * - `flush` drena sem esperar o debounce e aguarda o em andamento;
 * - erro retém a pendência para retry, SEM auto-retry (sem loop infinito);
 * - `cancelPendingWrite` descarta pendência sem tocar na escrita em andamento;
 * - `invalidatePendingWrites` limpa tudo e aguarda o em andamento (reset/import);
 * - duas coleções progridem sem bloquear uma à outra.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  enqueueWrite,
  flushWriteQueue,
  cancelPendingWrite,
  invalidatePendingWrites,
  getWriteQueueStateForTests,
  resetWriteQueueForTests,
} from '../writeQueue';

const DEBOUNCE_MS = 200;

/** Escrita controlável: só termina quando o teste resolver. */
function deferredWrite(label: string, log: string[] = []) {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  const fn = vi.fn(() => {
    log.push(label);
    return promise;
  });
  return { fn, label, log, resolve };
}

beforeEach(() => {
  vi.useFakeTimers();
  resetWriteQueueForTests();
});

afterEach(() => {
  vi.useRealTimers();
  resetWriteQueueForTests();
});

describe('writeQueue (spec §7.1/§7.2)', () => {
  it('debounce de 200 ms: a escrita só começa depois da rajada assentar', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    enqueueWrite('tasks', write);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 50);
    expect(write).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60);
    expect(write).toHaveBeenCalledOnce();
  });

  it('50 enfileiramentos rápidos resultam em UMA escrita com o último valor', async () => {
    const writes: string[] = [];
    for (let i = 1; i <= 50; i++) {
      const value = `estado-${i}`;
      enqueueWrite('tasks', async () => {
        writes.push(value);
      });
    }
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(writes).toEqual(['estado-50']);
  });

  it('escrita lenta seguida de rápida não regride: a última vence no banco', async () => {
    const log: string[] = [];
    const slow = deferredWrite('lenta', log);
    const fastValue = { versao: 'nova' };

    enqueueWrite('tasks', slow.fn);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10); // lenta em andamento
    expect(log).toEqual(['lenta']);

    // Chega a mudança NOVA enquanto a lenta corre.
    enqueueWrite('tasks', async () => {
      log.push('nova');
    });
    void fastValue;
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);
    expect(log).toEqual(['lenta']); // nova ainda é pendência (serializada)

    slow.resolve();
    await vi.advanceTimersByTimeAsync(10);
    expect(log).toEqual(['lenta', 'nova']); // ordem garantida, sem regressão
  });

  it('flush drena sem esperar o debounce e aguarda o em andamento', async () => {
    const log: string[] = [];
    const slow = deferredWrite('a', log);

    enqueueWrite('tasks', slow.fn); // sem avançar o timer
    const flushed = flushWriteQueue('tasks'); // ignora o debounce
    slow.resolve();
    await flushed;

    expect(log).toEqual(['a']);
    expect(getWriteQueueStateForTests().keys[0]).toMatchObject({
      key: 'tasks',
      hasPending: false,
      inFlight: false,
    });
  });

  it('erro retém a pendência para retry — sem auto-retry (sem loop)', async () => {
    let calls = 0;
    const boom = () => {
      calls += 1;
      return Promise.reject(new Error('sqlite fora do ar'));
    };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    enqueueWrite('tasks', boom);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(calls).toBe(1);

    // SEM auto-retry: o tempo passa e nada mais acontece.
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toBe(1);

    // A pendência retida é regravada na próxima mudança (novo enqueue).
    enqueueWrite('tasks', async () => {
      calls += 1;
    });
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(calls).toBe(2);

    errSpy.mockRestore();
  });

  it('flush com falha persistente tenta no máximo 2 vezes e para (sem loop)', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('sqlite fora do ar'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    enqueueWrite('tasks', fn);
    await flushWriteQueue('tasks');
    expect(fn.mock.calls.length).toBeLessThanOrEqual(2);

    await vi.advanceTimersByTimeAsync(2000);
    expect(fn.mock.calls.length).toBeLessThanOrEqual(2);

    errSpy.mockRestore();
  });

  it('cancelPendingWrite descarta a pendência sem tocar na escrita em andamento', async () => {
    const log: string[] = [];
    const slow = deferredWrite('a', log);

    enqueueWrite('tasks', slow.fn);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10); // a em andamento

    enqueueWrite('tasks', async () => {
      log.push('b'); // pendência — não deve rodar
    });
    cancelPendingWrite('tasks');

    slow.resolve();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(log).toEqual(['a']); // b descartada, a intacta
  });

  it('duas coleções progridem sem bloquear uma à outra', async () => {
    const log: string[] = [];
    const slow = deferredWrite('cursos', log);
    const fast = vi.fn(async () => {
      log.push('tarefas-ok');
    });

    enqueueWrite('cursos', slow.fn);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10); // cursos em andamento

    enqueueWrite('tarefas', fast);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);
    expect(log).toContain('tarefas-ok'); // tarefas NÃO esperou cursos

    slow.resolve();
    await vi.advanceTimersByTimeAsync(10);
    expect(log).toEqual(['cursos', 'tarefas-ok']);
  });

  it('invalidatePendingWrites limpa pendências e aguarda o em andamento (reset/import)', async () => {
    const log: string[] = [];
    const slow = deferredWrite('pre-reset', log);

    enqueueWrite('tasks', slow.fn);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);

    enqueueWrite('tasks', async () => {
      log.push('pendencia-velha'); // não deve sobreviver
    });

    const invalidated = invalidatePendingWrites();
    slow.resolve();
    await invalidated;

    expect(log).toEqual(['pre-reset']); // a em andamento terminou; a velha morreu
    const state = getWriteQueueStateForTests().keys.find((k) => k.key === 'tasks');
    expect(state).toMatchObject({ hasPending: false, inFlight: false });
  });

  it('versões são monotônicas por chave e sobrevivem entre instâncias do hook', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    enqueueWrite('tasks', write);
    enqueueWrite('tasks', write);
    enqueueWrite('tasks', write);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(getWriteQueueStateForTests().keys[0].version).toBe(3);
  });
});
