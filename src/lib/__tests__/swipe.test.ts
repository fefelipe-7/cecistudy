import { describe, expect, it } from 'vitest';
import {
  isHorizontalPan,
  resolveSwipe,
  edgeOverscroll,
  shouldIgnorePanTarget,
  SWIPE_THRESHOLD,
} from '../swipe';

describe('isHorizontalPan()', () => {
  it('reconhece gesto horizontal dominante', () => {
    expect(isHorizontalPan({ x: 80, y: 10 })).toBe(true);
    expect(isHorizontalPan({ x: -60, y: 5 })).toBe(true);
  });

  it('rejeita gesto vertical dominante (scroll)', () => {
    expect(isHorizontalPan({ x: 8, y: 120 })).toBe(false);
    expect(isHorizontalPan({ x: -10, y: -90 })).toBe(false);
  });
});

describe('resolveSwipe()', () => {
  it('mantém o índice atual sem gesto', () => {
    expect(resolveSwipe(2, 5, 0, 0)).toBe(2);
    expect(resolveSwipe(2, 5, 20, 0)).toBe(2);
  });

  it('troca pela velocidade quando forte', () => {
    expect(resolveSwipe(2, 5, -5, -600)).toBe(3);
    expect(resolveSwipe(2, 5, 5, 600)).toBe(1);
  });

  it('troca pelo deslocamento acima do limiar', () => {
    expect(resolveSwipe(2, 5, -SWIPE_THRESHOLD - 10, 0)).toBe(3);
    expect(resolveSwipe(2, 5, SWIPE_THRESHOLD + 10, 0)).toBe(1);
  });

  it('limita nas bordas (clamp)', () => {
    expect(resolveSwipe(0, 5, -400, 0)).toBe(1);
    expect(resolveSwipe(4, 5, 400, 0)).toBe(3);
    expect(resolveSwipe(0, 5, SWIPE_THRESHOLD + 10, 0)).toBe(0);
    expect(resolveSwipe(4, 5, -SWIPE_THRESHOLD - 10, 0)).toBe(4);
  });

  it('não troca com count 1', () => {
    expect(resolveSwipe(0, 1, -200, 0)).toBe(0);
  });
});

describe('edgeOverscroll()', () => {
  it('propaga para trás só na primeira sub-aba', () => {
    expect(edgeOverscroll(0, 4, SWIPE_THRESHOLD + 20, 0)).toBe(-1);
    expect(edgeOverscroll(0, 4, 500, 0)).toBe(-1);
    expect(edgeOverscroll(0, 4, SWIPE_THRESHOLD + 20, 0, 0, 999)).toBe(-1);
    expect(edgeOverscroll(0, 4, 10, 600)).toBe(-1);
  });

  it('propaga para frente só na última sub-aba', () => {
    expect(edgeOverscroll(3, 4, -SWIPE_THRESHOLD - 20, 0)).toBe(1);
    expect(edgeOverscroll(3, 4, -10, -600)).toBe(1);
  });

  it('não propaga no meio ou contra a borda', () => {
    expect(edgeOverscroll(1, 4, SWIPE_THRESHOLD + 20, 0)).toBe(0);
    expect(edgeOverscroll(1, 4, -SWIPE_THRESHOLD - 20, 0)).toBe(0);
    expect(edgeOverscroll(3, 4, SWIPE_THRESHOLD + 20, 0)).toBe(0);
    expect(edgeOverscroll(0, 4, -SWIPE_THRESHOLD - 20, 0)).toBe(0);
    expect(edgeOverscroll(0, 1, SWIPE_THRESHOLD + 20, 0)).toBe(0);
  });
});

describe('shouldIgnorePanTarget()', () => {
  function makeEl(attrs: string[], tag = 'div'): HTMLElement {
    const el = document.createElement(tag);
    attrs.forEach((a) => {
      const [k, v] = a.split('=');
      el.setAttribute(k, v);
    });
    return el;
  }

  it('ignora alvos data-swipe-lock (faixas horizontais)', () => {
    const strip = makeEl(['data-swipe-lock']);
    expect(shouldIgnorePanTarget(strip)).toBe(true);
  });

  it('ignora inputs e botões', () => {
    expect(shouldIgnorePanTarget(makeEl([], 'input'))).toBe(true);
    expect(shouldIgnorePanTarget(makeEl([], 'button'))).toBe(true);
    expect(shouldIgnorePanTarget(makeEl(['role=button']))).toBe(true);
  });

  it('ignora data-subpager quando passado em extra (pager pai)', () => {
    const inner = makeEl(['data-subpager']);
    expect(shouldIgnorePanTarget(inner, ['[data-subpager]'])).toBe(true);
    expect(shouldIgnorePanTarget(inner)).toBe(false);
  });

  it('retorna false para conteúdo normal', () => {
    const plain = makeEl(['class=card']);
    expect(shouldIgnorePanTarget(plain)).toBe(false);
    expect(shouldIgnorePanTarget(null)).toBe(false);
  });

  it('verifica ancestrais, não só o alvo direto', () => {
    const strip = makeEl(['data-swipe-lock']);
    const child = makeEl(['class=x']);
    strip.appendChild(child);
    expect(shouldIgnorePanTarget(child)).toBe(true);
  });
});