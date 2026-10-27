import { describe, expect, it } from 'vitest';
import { frozenTop } from '../scroll';

/**
 * `frozenTop` é pura: não toca DOM, não lê `window`. Só combina o topo medido
 * do elemento no documento com o scroll capturado no handler de troca de tela.
 * Isso é o que permite testar o congelamento de saída sem jsdom medir geometria.
 */
describe('frozenTop', () => {
  it('elemento no topo do documento, sem scroll rolado, congela em zero', () => {
    expect(frozenTop(0, 0)).toBe(0);
  });

  it('página rolada: topo congelado fica negativo para subir o conteúdo nos pixels vistos', () => {
    expect(frozenTop(560, 300)).toBe(260);
    expect(frozenTop(120, 200)).toBe(-80);
  });

  it('não depende de estado nem de janela: mesma entrada, mesma saída', () => {
    const a = frozenTop(400, 100);
    const b = frozenTop(400, 100);
    expect(a).toBe(b);
    expect(a).toBe(300);
  });
});
