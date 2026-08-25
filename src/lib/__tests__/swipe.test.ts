import { describe, expect, it } from 'vitest';
import {
  COMMIT_THRESHOLD,
  EDGE_WIDTH,
  ENGAGE_THRESHOLD,
  MAX_DRAG_FRACTION,
  SWIPE_TAB_THRESHOLD,
  SWIPE_TAB_VELOCITY,
  TAB_SWIPE_EDGE_MARGIN,
  canStartTabSwipe,
  clampDrag,
  isEngaged,
  isHorizontalPan,
  maxDragDistance,
  shouldCommit,
  shouldIgnorePanTarget,
  shouldIgnoreTarget,
  supportsEdgeSwipe,
  swipeTabDelta,
} from '../swipe';

describe('swipe — constantes', () => {
  it('expõe os limiares esperados', () => {
    expect(EDGE_WIDTH).toBe(24);
    expect(ENGAGE_THRESHOLD).toBe(12);
    expect(COMMIT_THRESHOLD).toBe(72);
    expect(MAX_DRAG_FRACTION).toBe(0.42);
  });
});

describe('swipe — shouldIgnoreTarget', () => {
  it('ignora botões', () => {
    const btn = document.createElement('button');
    expect(shouldIgnoreTarget(btn)).toBe(true);
  });

  it('ignora links, inputs e áreas editáveis', () => {
    expect(shouldIgnoreTarget(document.createElement('a'))).toBe(true);
    expect(shouldIgnoreTarget(document.createElement('input'))).toBe(true);
    expect(shouldIgnoreTarget(document.createElement('textarea'))).toBe(true);
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    expect(shouldIgnoreTarget(editable)).toBe(true);
  });

  it('ignora marcas data-no-swipe (nav, header)', () => {
    const el = document.createElement('div');
    el.setAttribute('data-no-swipe', '');
    expect(shouldIgnoreTarget(el)).toBe(true);
  });

  it('não ignora cards clicáveis (role=button): o gesto vence o tap após movimento', () => {
    const card = document.createElement('div');
    card.setAttribute('role', 'button');
    expect(shouldIgnoreTarget(card)).toBe(false);
  });

  it('ignora um alvo dentro de um container ignorado (até 6 níveis)', () => {
    const nav = document.createElement('nav');
    nav.setAttribute('data-no-swipe', '');
    const card = document.createElement('div');
    const text = document.createElement('p');
    nav.appendChild(card);
    card.appendChild(text);
    expect(shouldIgnoreTarget(text)).toBe(true);
  });

  it('ignora containers com overflow-x scroll/auto', () => {
    const scroller = document.createElement('div');
    scroller.style.overflowX = 'auto';
    const inner = document.createElement('span');
    scroller.appendChild(inner);
    expect(shouldIgnoreTarget(inner)).toBe(true);
  });

  it('não ignora conteúdo comum', () => {
    const p = document.createElement('p');
    expect(shouldIgnoreTarget(p)).toBe(false);
    expect(shouldIgnoreTarget(null)).toBe(false);
  });

  it('para de subir depois de 6 níveis (conteúdo profundo dentro de um botão distante)', () => {
    const root = document.createElement('button');
    const layer1 = document.createElement('div');
    const layer2 = document.createElement('div');
    const layer3 = document.createElement('div');
    const layer4 = document.createElement('div');
    const layer5 = document.createElement('div');
    const layer6 = document.createElement('div');
    const deep = document.createElement('span');
    root.appendChild(layer1);
    layer1.appendChild(layer2);
    layer2.appendChild(layer3);
    layer3.appendChild(layer4);
    layer4.appendChild(layer5);
    layer5.appendChild(layer6);
    layer6.appendChild(deep);
    expect(shouldIgnoreTarget(deep)).toBe(false);
  });
});

describe('swipe — isEngaged', () => {
  it('engaja com movimento horizontal suficiente', () => {
    expect(isEngaged(10, 100, 10 + ENGAGE_THRESHOLD + 5, 100)).toBe(true);
  });

  it('não engaja com pouco movimento', () => {
    expect(isEngaged(10, 100, 10 + 5, 100)).toBe(false);
  });

  it('não engaja em drag vertical (scroll)', () => {
    expect(isEngaged(10, 100, 10 + 30, 100 + 90)).toBe(false);
  });

  it('não engaja em movimento para a esquerda', () => {
    expect(isEngaged(10, 100, 10 - 30, 100)).toBe(false);
  });
});

describe('swipe — shouldCommit / clampDrag', () => {
  it('commita acima do limiar', () => {
    expect(shouldCommit(COMMIT_THRESHOLD)).toBe(true);
    expect(shouldCommit(COMMIT_THRESHOLD + 30)).toBe(true);
  });

  it('não commita abaixo do limiar', () => {
    expect(shouldCommit(COMMIT_THRESHOLD - 1)).toBe(false);
  });

  it('clampa o drag a [0, fração da viewport]', () => {
    const max = maxDragDistance(375);
    expect(max).toBe(Math.round(375 * MAX_DRAG_FRACTION));
    expect(clampDrag(-20, 375)).toBe(0);
    expect(clampDrag(50, 375)).toBe(50);
    expect(clampDrag(9999, 375)).toBe(max);
  });

  it('suporta telas de pelo menos 320px', () => {
    expect(supportsEdgeSwipe(375)).toBe(true);
    expect(supportsEdgeSwipe(300)).toBe(false);
  });
});

describe('swipe — pager de tabs (constantes)', () => {
  it('expõe os limiares esperados', () => {
    expect(SWIPE_TAB_THRESHOLD).toBe(64);
    expect(SWIPE_TAB_VELOCITY).toBe(500);
    expect(TAB_SWIPE_EDGE_MARGIN).toBe(8);
  });
});

describe('swipe — isHorizontalPan', () => {
  it('engaja com movimento horizontal dominante', () => {
    expect(isHorizontalPan(ENGAGE_THRESHOLD + 5, 3)).toBe(true);
  });

  it('não engaja com pouco movimento', () => {
    expect(isHorizontalPan(5, 2)).toBe(false);
  });

  it('não engaja quando o movimento é vertical', () => {
    expect(isHorizontalPan(30, 60)).toBe(false);
  });
});

describe('swipe — shouldIgnorePanTarget', () => {
  it('ignora campos de texto', () => {
    expect(shouldIgnorePanTarget(document.createElement('input'))).toBe(true);
    expect(shouldIgnorePanTarget(document.createElement('textarea'))).toBe(true);
  });

  it('não ignora botões/cards clicáveis: o gesto vence o tap após movimento', () => {
    const card = document.createElement('div');
    card.setAttribute('role', 'button');
    expect(shouldIgnorePanTarget(card)).toBe(false);
    expect(shouldIgnorePanTarget(document.createElement('button'))).toBe(false);
  });

  it('ignora faixas com scroll horizontal próprio (barra de pills)', () => {
    const scroller = document.createElement('div');
    scroller.style.overflowX = 'auto';
    const pill = document.createElement('span');
    scroller.appendChild(pill);
    expect(shouldIgnorePanTarget(pill)).toBe(true);
  });

  it('ignora marcas data-no-swipe', () => {
    const el = document.createElement('div');
    el.setAttribute('data-no-swipe', '');
    expect(shouldIgnorePanTarget(el)).toBe(true);
  });

  it('não ignora conteúdo comum e alvo nulo', () => {
    expect(shouldIgnorePanTarget(document.createElement('p'))).toBe(false);
    expect(shouldIgnorePanTarget(null)).toBe(false);
  });
});

describe('swipe — canStartTabSwipe (precedência do edge swipe-back)', () => {
  it('não engaja dentro da faixa da borda esquerda', () => {
    expect(canStartTabSwipe(0)).toBe(false);
    expect(canStartTabSwipe(EDGE_WIDTH)).toBe(false);
    expect(canStartTabSwipe(EDGE_WIDTH + TAB_SWIPE_EDGE_MARGIN)).toBe(false);
  });

  it('engaja além da faixa da borda', () => {
    expect(canStartTabSwipe(EDGE_WIDTH + TAB_SWIPE_EDGE_MARGIN + 1)).toBe(true);
  });
});

describe('swipe — swipeTabDelta', () => {
  it('avança (+1) ao arrastar para a esquerda acima do limiar', () => {
    expect(swipeTabDelta(-SWIPE_TAB_THRESHOLD - 10)).toBe(1);
  });

  it('volta (−1) ao arrastar para a direita acima do limiar', () => {
    expect(swipeTabDelta(SWIPE_TAB_THRESHOLD + 10)).toBe(-1);
  });

  it('commita por flick rápido mesmo com pouco deslocamento', () => {
    expect(swipeTabDelta(-(ENGAGE_THRESHOLD + 5), SWIPE_TAB_VELOCITY)).toBe(1);
    expect(swipeTabDelta(ENGAGE_THRESHOLD + 5, SWIPE_TAB_VELOCITY)).toBe(-1);
  });

  it('não commita abaixo dos limiares', () => {
    expect(swipeTabDelta(-SWIPE_TAB_THRESHOLD + 1)).toBe(0);
    expect(swipeTabDelta(SWIPE_TAB_THRESHOLD + 1, SWIPE_TAB_VELOCITY - 1)).toBe(-1);
    expect(swipeTabDelta(-(ENGAGE_THRESHOLD - 1), SWIPE_TAB_VELOCITY)).toBe(0);
  });
});