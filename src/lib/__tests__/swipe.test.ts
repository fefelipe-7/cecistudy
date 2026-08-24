import { describe, expect, it } from 'vitest';
import {
  COMMIT_THRESHOLD,
  EDGE_WIDTH,
  ENGAGE_THRESHOLD,
  MAX_DRAG_FRACTION,
  clampDrag,
  isEngaged,
  maxDragDistance,
  shouldCommit,
  shouldIgnoreTarget,
  supportsEdgeSwipe,
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