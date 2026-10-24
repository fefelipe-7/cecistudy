import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../storage.ts', () => ({ isNativePlatform: true }));
vi.mock('../db/userDb.ts', () => ({ getUserDb: vi.fn(async () => ({})) }));
vi.mock('../db/writeQueue.ts', () => ({ enqueueWrite: vi.fn() }));
vi.mock('../db/normalize.ts', () => ({
  isUserCollectionKey: () => true,
  loadCollection: vi.fn(),
  saveCollection: vi.fn(),
}));

import { useSqliteState } from '../useSqliteState.ts';
import { getStorageHealth } from '../storageLayers.ts';
import { loadCollection } from '../db/normalize.ts';
import { enqueueWrite } from '../db/writeQueue.ts';

/**
 * SPEC-M-026 D3 / I2 — leitura que falha não autoriza escrita.
 *
 * O `finally` antigo marcava a hidratação como concluída mesmo com a leitura
 * estourada; o write-through então gravava o `initialValue` por cima da
 * coleção. É o único caminho do app que apagava dado da usuária sem ninguém
 * pedir, e nenhum outro gate o cobria.
 */
describe('useSqliteState com leitura que falha (SPEC-M-026 I2)', () => {
  beforeEach(() => {
    vi.mocked(enqueueWrite).mockClear();
  });

  it('não enfileira escrita e registra a falha', async () => {
    vi.mocked(loadCollection).mockRejectedValueOnce(new Error('disco ilegível'));

    renderHook(() => useSqliteState('tasks', []));

    await waitFor(() => expect(getStorageHealth().map((h) => h.key)).toContain('tasks'));
    expect(enqueueWrite).not.toHaveBeenCalled();
  });

  it('controle: leitura boa libera a escrita', async () => {
    vi.mocked(loadCollection).mockResolvedValueOnce([]);

    renderHook(() => useSqliteState('tasks', []));

    await waitFor(() => expect(enqueueWrite).toHaveBeenCalled());
  });
});
