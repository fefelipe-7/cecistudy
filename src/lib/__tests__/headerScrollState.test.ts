import { describe, expect, it } from 'vitest';
import {
  HEADER_SCROLL_COLLAPSE_Y,
  HEADER_SCROLL_EXPAND_Y,
  resolveScrolledState,
} from '../headerScrollState';

describe('resolveScrolledState', () => {
  it('expande (longo) abaixo do limiar de expansão, vindo de qualquer estado', () => {
    expect(resolveScrolledState(false, 0)).toBe(false);
    expect(resolveScrolledState(true, 0)).toBe(false);
    expect(resolveScrolledState(true, HEADER_SCROLL_EXPAND_Y - 0.1)).toBe(false);
  });

  it('colapsa (curto) no limiar de colapso, vindo de qualquer estado', () => {
    expect(resolveScrolledState(false, HEADER_SCROLL_COLLAPSE_Y)).toBe(true);
    expect(resolveScrolledState(true, HEADER_SCROLL_COLLAPSE_Y)).toBe(true);
    expect(resolveScrolledState(false, 100)).toBe(true);
  });

  it('zona morta entre os limiares mantém o estado anterior', () => {
    for (let y = HEADER_SCROLL_EXPAND_Y; y < HEADER_SCROLL_COLLAPSE_Y; y += 0.5) {
      expect(resolveScrolledState(false, y)).toBe(false);
      expect(resolveScrolledState(true, y)).toBe(true);
    }
  });

  it('overscroll negativo (rubber-band do iOS) mantém o header longo', () => {
    expect(resolveScrolledState(true, -24)).toBe(false);
  });

  it('micro-ajustes fracionários perto do limiar não alternam o estado', () => {
    // A usuária parou em ~20 e o scroll fracionário oscila ±1px com a tela
    // parada — antes, cada um desses valores re-disparava a transição.
    let state = resolveScrolledState(false, HEADER_SCROLL_COLLAPSE_Y + 0.4);
    expect(state).toBe(true);
    for (const y of [19.6, 20.3, 19.8, 20.1, 19.5, 20.4]) {
      state = resolveScrolledState(state, y);
      expect(state).toBe(true);
    }
  });

  it('parar em qualquer ponto é estável: repetir a mesma rolagem nunca muda o estado', () => {
    // A invariante do bug: com limiar único, a faixa em torno de 20 flapa.
    for (const previous of [false, true]) {
      for (let y = -30; y <= 60; y += 0.5) {
        const once = resolveScrolledState(previous, y);
        expect(resolveScrolledState(once, y)).toBe(once);
      }
    }
  });

  it('voltar para dentro da zona morta não expande — só perto do topo', () => {
    // Desceu além do limiar (curto), subiu de volta até a zona morta e parou:
    // o header permanece curto, como o título grande do iOS.
    let state = false;
    for (const y of [0, 10, 30, 60]) state = resolveScrolledState(state, y);
    expect(state).toBe(true);
    for (const y of [40, 25, 15, 14, 14, 14]) state = resolveScrolledState(state, y);
    expect(state).toBe(true);
    state = resolveScrolledState(state, HEADER_SCROLL_EXPAND_Y - 0.1);
    expect(state).toBe(false);
  });

  it('os limiares formam uma zona morta (expansão sempre abaixo do colapso)', () => {
    // Inverter os limiares recriaria uma variante do bug: a "zona morta"
    // passaria a alternar o estado em vez de preservá-lo.
    expect(HEADER_SCROLL_EXPAND_Y).toBeLessThan(HEADER_SCROLL_COLLAPSE_Y);
  });
});
