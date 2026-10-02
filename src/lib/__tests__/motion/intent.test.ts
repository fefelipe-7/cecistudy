/**
 * Contrato `NavIntent` (SPEC-007 §D1) — a classificação de uma navegação.
 *
 * O teste mais importante aqui é o **regressivo**: `c1 → c2` tem o MESMO
 * comprimento de pilha, então a direção-por-`stack.length` (o código anterior)
 * classificava como `tab` — um crossfade curto. O contrato novo classifica
 * `replace`, que é a troca lateral correta.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  IDLE_INTENT,
  consumeMotionIntent,
  deriveIntent,
  peekMotionIntent,
  screenIdentity,
  setMotionIntent,
} from '../../motion/intent';
import type { NavScreen, NavTab } from '../../../types/navigation';

const tab = (t: NavTab): NavScreen => ({ kind: 'tab', tab: t });

const HOME = tab('home');
const FAC = tab('faculdade');
const BIB = tab('biblioteca');
const c1: NavScreen = { kind: 'course', courseId: 'c1' };
const c2: NavScreen = { kind: 'course', courseId: 'c2' };
const note1: NavScreen = { kind: 'classNote', courseId: 'c1', classNoteId: 'cl-1' };
const note2: NavScreen = { kind: 'classNote', courseId: 'c1', classNoteId: 'cl-2' };
const wizardSemester: NavScreen = { kind: 'wizard', type: 'semester' };
const termHistory: NavScreen = { kind: 'termHistory' };

describe('screenIdentity', () => {
  it('inclui os campos que identificam o destino da rota', () => {
    expect(screenIdentity(c1)).toBe('course:c1');
    expect(screenIdentity(c2)).toBe('course:c2');
    expect(screenIdentity(note1)).toBe('classNote:c1:cl-1');
    expect(screenIdentity(tab('home'))).toBe('tab:home');
  });

  it('ignora payload volátil: mesma tela com estado diferente é a mesma identidade', () => {
    // Bug que motivou o requisito: deep-equal daria `replace` onde houve só
    // troca de payload dentro da mesma tela.
    const playA: NavScreen = { kind: 'quiz-play', state: { current: 0 } as never };
    const playB: NavScreen = { kind: 'quiz-play', state: { current: 7 } as never };
    expect(screenIdentity(playA)).toBe(screenIdentity(playB));
    expect(deriveIntent([FAC, playA], [FAC, playB]).kind).toBe('none');
  });

  it('usa o próprio kind quando não há id', () => {
    expect(screenIdentity({ kind: 'temple' })).toBe('temple');
    expect(screenIdentity({ kind: 'streak' })).toBe('streak');
  });
});

describe('deriveIntent — classificação', () => {
  it('none: pilhas com o mesmo conteúdo', () => {
    const i = deriveIntent([HOME], [HOME]);
    expect(i.kind).toBe('none');
    expect(i.dir).toBe(0);
  });

  it('push: prev é prefixo de next → +1', () => {
    const i = deriveIntent([FAC], [FAC, c1]);
    expect(i.kind).toBe('push');
    expect(i.dir).toBe(1);
    expect(i.fromDepth).toBe(0);
    expect(i.toDepth).toBe(1);
  });

  it('pop: next é prefixo de prev → -1', () => {
    const i = deriveIntent([FAC, c1], [FAC]);
    expect(i.kind).toBe('pop');
    expect(i.dir).toBe(-1);
    expect(i.fromDepth).toBe(1);
    expect(i.toDepth).toBe(0);
  });

  it('REGRESSÃO: trocar de disciplina (c1 → c2) é `replace`, não `tab` nem `push`', () => {
    const i = deriveIntent([FAC, c1], [FAC, c2]);
    expect(i.kind).toBe('replace');
    expect(i.dir).toBe(0);
    // comprimento igual: a direção-por-`stack.length` errava aqui.
    expect(i.fromDepth).toBe(i.toDepth);
  });

  it('tab: raiz de aba diferente reseta a pilha', () => {
    const i = deriveIntent([FAC, c1], [BIB]);
    expect(i.kind).toBe('tab');
    expect(i.dir).toBe(0);
  });

  it('tab: trocar entre abas irmãs com sub-pilha', () => {
    expect(deriveIntent([HOME], [FAC]).kind).toBe('tab');
    expect(deriveIntent([HOME, { kind: 'temple' }], [FAC]).kind).toBe('tab');
  });

  it('replace: sub-tela → outra sub-tela do mesmo curso (mesma raiz)', () => {
    expect(deriveIntent([FAC, c1, note1], [FAC, c1, note2]).kind).toBe('replace');
  });

  it('push de sub-tela dentro do mesmo curso', () => {
    const i = deriveIntent([FAC, c1], [FAC, c1, note1]);
    expect(i.kind).toBe('push');
    expect(i.dir).toBe(1);
  });

  it('wizard semester → termHistory é push (o bug B1 dependia disto ser `none`)', () => {
    const i = deriveIntent([tab('perfil'), wizardSemester], [
      tab('perfil'),
      wizardSemester,
      termHistory,
    ]);
    expect(i.kind).toBe('push');
    expect(i.dir).toBe(1);
  });
});

describe('deriveIntent — opcoes', () => {
  it('carrega gestureX/fromGesture/reduced', () => {
    const i = deriveIntent([FAC, c1], [FAC], { gestureX: 120, fromGesture: true, reduced: true });
    expect(i.gestureX).toBe(120);
    expect(i.fromGesture).toBe(true);
    expect(i.reduced).toBe(true);
  });

  it('defaults: sem gesto, sem reduz-motion', () => {
    const i = deriveIntent([FAC], [FAC, c1]);
    expect(i.gestureX).toBe(0);
    expect(i.fromGesture).toBe(false);
    expect(i.reduced).toBe(false);
  });

  it('tolera pilha vazia', () => {
    expect(deriveIntent([], [HOME]).kind).toBe('push');
    expect(deriveIntent([HOME], []).kind).toBe('pop');
  });
});

describe('transporte do intent (corrige o bug B2)', () => {
  beforeEach(() => {
    // Zera o canal entre testes (consome o que sobrou).
    consumeMotionIntent();
  });

  it('set + consume entrega o intent inteiro, gestureX incluído', () => {
    const intent = deriveIntent([FAC, c1], [FAC], { gestureX: 137, fromGesture: true });
    setMotionIntent(intent);
    expect(peekMotionIntent().gestureX).toBe(137);
    const read = consumeMotionIntent();
    expect(read).toEqual(intent);
    expect(read.gestureX).toBe(137);
    expect(read.fromGesture).toBe(true);
  });

  it('consome UMA vez: o segundo consume volta ao ocioso (sem valor velho)', () => {
    setMotionIntent(deriveIntent([FAC, c1], [FAC], { gestureX: 90, fromGesture: true }));
    expect(consumeMotionIntent().gestureX).toBe(90);
    expect(consumeMotionIntent()).toEqual(IDLE_INTENT);
  });

  it('peek não consome', () => {
    setMotionIntent(deriveIntent([FAC], [FAC, c1]));
    expect(peekMotionIntent().kind).toBe('push');
    expect(peekMotionIntent().kind).toBe('push');
    expect(consumeMotionIntent().kind).toBe('push');
  });
});
