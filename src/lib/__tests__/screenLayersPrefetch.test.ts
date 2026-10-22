/**
 * Lazy + prefetch de telas — spec-performance.md §7 Fase 9, item F9.1
 * (lacuna real da auditoria: "sem teste de lazy/preload").
 *
 * Nível do teste: a LIGAÇÃO de `SharedScreenLayers` com a política
 * (`screenPrefetch`) — quais chaves são pedidas e por qual caminho. O
 * comportamento da política em si (saveData, limites, dedup, timeout) é
 * contrato de `screenPrefetch.test.ts`.
 *
 * O que este teste garante:
 * - `preloadScreenChunks(keys)` só pede as chaves EXPLÍCITAS via
 *   `requestPrefetch` — não existe caminho que varra os 27 loaders (spec §3.1);
 * - `prefetchScreensOnIntent` (pointerdown na aba) passa pela intenção
 *   (bypass da fila, spec §3.2);
 * - chaves inválidas são silêncio (botões do FAB também disparam pointerdown
 *   no BottomNav).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  preloadScreenChunks,
  prefetchScreensOnIntent,
  type ScreenKey,
} from '@/shells/SharedScreenLayers';
import {
  requestPrefetch,
  prefetchOnIntent,
} from '@/lib/performance/screenPrefetch';

vi.mock('@/lib/performance/screenPrefetch', () => ({
  requestPrefetch: vi.fn(),
  prefetchOnIntent: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('preloadScreenChunks (lista explícita, spec §3.1)', () => {
  it('só pede as chaves pedidas — nunca a varredura global', () => {
    preloadScreenChunks(['home', 'estudos']);
    expect(requestPrefetch).toHaveBeenCalledTimes(2);
    expect(requestPrefetch).toHaveBeenCalledWith('screen:home', expect.any(Function));
    expect(requestPrefetch).toHaveBeenCalledWith('screen:estudos', expect.any(Function));
  });

  it('uma chave pedida = um pedido (2 de 27 loaders, não todos)', () => {
    preloadScreenChunks(['perfil']);
    expect(requestPrefetch).toHaveBeenCalledTimes(1);
    expect(requestPrefetch).toHaveBeenCalledWith('screen:perfil', expect.any(Function));
  });

  it('chave inválida é ignorada em silêncio', () => {
    preloadScreenChunks(['Não-existe' as ScreenKey]);
    expect(requestPrefetch).not.toHaveBeenCalled();
  });
});

describe('prefetchScreensOnIntent (intenção observável, spec §3.2)', () => {
  it('passa pela intenção — bypass da fila de baixa prioridade', () => {
    prefetchScreensOnIntent(['faculdade']);
    expect(prefetchOnIntent).toHaveBeenCalledTimes(1);
    expect(prefetchOnIntent).toHaveBeenCalledWith('screen:faculdade', expect.any(Function));
  });

  it('chave inválida (FAB dispara pointerdown no mesmo wrapper) é silêncio', () => {
    prefetchScreensOnIntent(['Novo estágio' as ScreenKey]);
    expect(prefetchOnIntent).not.toHaveBeenCalled();
  });
});
