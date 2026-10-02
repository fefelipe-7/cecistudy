/**
 * Derivação das chaves de camada (SPEC-007 Slice B) — fecha os bugs B1, B4, B5.
 *
 * Estes testes são a **razão** de a derivação ter saído do `navigationEngine`
 * para um módulo puro: o wiring do shell nunca teve teste de integração, e foi
 * exatamente aí que 3 bugs se esconderam dentro de um ternário de 20 níveis.
 */

import { describe, expect, it } from 'vitest';
import {
  isUnknownSlideKind,
  overlayKeyOf,
  slideBaseKeyOf,
  slideLayerChanged,
  slideTopOf,
  UNKNOWN_SLIDE_KINDS,
} from '../../../context/slideKeys';
import type { NavScreen } from '../../../types/navigation';

const perfil: NavScreen = { kind: 'tab', tab: 'perfil' };
const faculdade: NavScreen = { kind: 'tab', tab: 'faculdade' };
const biblioteca: NavScreen = { kind: 'tab', tab: 'biblioteca' };
const c1: NavScreen = { kind: 'course', courseId: 'c1' };
const note1: NavScreen = { kind: 'classNote', courseId: 'c1', classNoteId: 'cl-1' };
const wizardSemester: NavScreen = { kind: 'wizard', type: 'semester' };
const termHistory: NavScreen = { kind: 'termHistory' };
const compose: NavScreen = { kind: 'compose' };

describe('slideBaseKeyOf', () => {
  it('aba e curso', () => {
    expect(slideBaseKeyOf(faculdade, faculdade)).toBe('tab-faculdade');
    expect(slideBaseKeyOf(c1, faculdade)).toBe('course-c1');
  });

  it('REGRESSÃO B5: sub-telas do curso têm key PRÓPRIA (não a do curso)', () => {
    // Antes as duas devolviam `course-c1`, então abrir a anotação não trocava a
    // camada e o CourseDetailView remontava junto (perdendo a sub-tab ativa).
    expect(slideBaseKeyOf(c1, faculdade)).not.toBe(
      slideBaseKeyOf(note1, faculdade),
    );
    expect(slideBaseKeyOf(note1, faculdade)).toBe('classNote-c1-cl-1');
  });

  it('REGRESSÃO B1: termHistory tem key PRÓPRIA (antes caía no caso base)', () => {
    const base = slideBaseKeyOf(perfil, perfil);
    expect(slideBaseKeyOf(termHistory, perfil)).toBe('termHistory-all');
    expect(slideBaseKeyOf(termHistory, perfil)).not.toBe(base);
  });

  it('termHistory com termId declarado tem key distinta do "todos"', () => {
    expect(slideBaseKeyOf({ kind: 'termHistory', termId: 'trm1' }, perfil)).toBe(
      'termHistory-trm1',
    );
  });

  it('kinds de overlay mostram a BASE da pilha (não criam camada de slide)', () => {
    expect(slideBaseKeyOf(compose, c1)).toBe('course-c1');
    expect(slideBaseKeyOf(wizardSemester, perfil)).toBe('tab-perfil');
  });

  it('noteDetail/noteTransform ficam sobre a camada de notas', () => {
    expect(slideBaseKeyOf({ kind: 'noteDetail', noteId: 'n1' }, biblioteca)).toBe('notes');
  });

  it('streak tem key própria (é auxiliar de 1º nível, empurra por cima)', () => {
    expect(slideBaseKeyOf({ kind: 'streak' }, perfil)).toBe('streak');
  });

  it('kinds sem key própria caem na base da pilha', () => {
    expect(slideBaseKeyOf({ kind: 'quiz-play', state: {} as never }, biblioteca)).toBe(
      'tab-biblioteca',
    );
  });

  it('sem base, cai em tab-home (nunca em string vazia)', () => {
    expect(slideBaseKeyOf({ kind: 'quiz-play', state: {} as never }, undefined)).toBe('tab-home');
  });

  it('ids entram na key (duas disciplinas não colidem)', () => {
    expect(slideBaseKeyOf({ kind: 'family', familyId: 'f1' }, biblioteca)).toBe('family-f1');
    expect(slideBaseKeyOf({ kind: 'family', familyId: 'f2' }, biblioteca)).toBe('family-f2');
  });
});

describe('overlayKeyOf', () => {
  it('os cinco kinds de overlay', () => {
    expect(overlayKeyOf(compose)).toBe('compose');
    expect(overlayKeyOf({ kind: 'composeDetails' })).toBe('composeDetails');
    expect(overlayKeyOf(wizardSemester)).toBe('wizard-semester');
    expect(overlayKeyOf({ kind: 'noteDetail', noteId: 'n1' })).toBe('noteDetail-n1');
    expect(overlayKeyOf({ kind: 'noteTransform', noteId: 'n1' })).toBe('noteTransform-n1');
  });

  it('string vazia quando não há overlay', () => {
    expect(overlayKeyOf(faculdade)).toBe('');
    expect(overlayKeyOf(c1)).toBe('');
    expect(overlayKeyOf(termHistory)).toBe('');
  });
});

describe('slideTopOf — o que a camada de slide renderiza de fato', () => {
  it('pilha sem overlay: o topo é o topo', () => {
    expect(slideTopOf([faculdade, c1])).toEqual(c1);
  });

  it('pilha com overlay no topo: pula para a tela de baixo', () => {
    expect(slideTopOf([faculdade, c1, compose])).toEqual(c1);
    expect(slideTopOf([perfil, wizardSemester])).toEqual(perfil);
  });

  it('REGRESSÃO SPEC-002 (gap): overlay sobre o detalhe de disciplina NÃO troca a key', () => {
    // O teste de regressão existente usava `[tab] → [tab, compose]`, onde as duas
    // chaves coincidem por acaso. A partir de um curso, a key antiga virava
    // `tab-faculdade` e a tela de baixo remontava.
    expect(slideTopOf([faculdade, c1, compose])).toEqual(c1);
    expect(slideBaseKeyOf(slideTopOf([faculdade, c1, compose]), faculdade)).toBe(
      slideBaseKeyOf(slideTopOf([faculdade, c1]), faculdade),
    );
  });

  it('pilha só de overlays não quebra (cai na home, nunca em undefined)', () => {
    expect(slideTopOf([compose])).toEqual({ kind: 'tab', tab: 'home' });
  });
});

describe('slideLayerChanged — a regra REAL substitui o proxy "não é overlay"', () => {
  it('overlay NÃO remonta a base (contrato da SPEC-002 Slice B, preservado)', () => {
    expect(slideLayerChanged([faculdade, c1], [faculdade, c1, compose])).toBe(false);
    expect(slideLayerChanged([faculdade, c1, compose], [faculdade, c1])).toBe(false);
  });

  it('REGRESSÃO B1: wizard → termHistory MUDA a camada (antes: não mudava)', () => {
    // Este é o bug do histórico de períodos: como o topo era um wizard, o guard
    // antigo pulava o bump de revisão e a tela aparecia sem transição nenhuma.
    const antes = [perfil, wizardSemester];
    const depois = [perfil, wizardSemester, termHistory];
    expect(slideLayerChanged(antes, depois)).toBe(true);
  });

  it('termHistory → voltar pro wizard também muda a camada', () => {
    expect(
      slideLayerChanged([perfil, wizardSemester, termHistory], [perfil, wizardSemester]),
    ).toBe(true);
  });

  it('REGRESSÃO B5: abrir/fechar sub-tela do curso MUDA a camada', () => {
    expect(slideLayerChanged([faculdade, c1], [faculdade, c1, note1])).toBe(true);
    expect(slideLayerChanged([faculdade, c1, note1], [faculdade, c1])).toBe(true);
  });

  it('troca de aba muda a camada', () => {
    expect(slideLayerChanged([faculdade], [biblioteca])).toBe(true);
  });

  it('troca de disciplina na MESMA aba muda a camada (c1 → c2)', () => {
    expect(
      slideLayerChanged([faculdade, c1], [faculdade, { kind: 'course', courseId: 'c2' }]),
    ).toBe(true);
  });

  it('não houve mudança real: a camada não remonta', () => {
    expect(slideLayerChanged([faculdade], [faculdade])).toBe(false);
  });
});

describe('B4: kinds sem render no app são detectáveis', () => {
  it('UNKNOWN_SLIDE_KINDS cobre os três placeholders de desktop', () => {
    expect([...UNKNOWN_SLIDE_KINDS].sort()).toEqual(['inbox', 'knowledge-graph', 'projects']);
  });

  it('isUnknownSlideKind identifica cada um deles', () => {
    for (const kind of ['knowledge-graph', 'projects', 'inbox'] as const) {
      expect(isUnknownSlideKind({ kind } as NavScreen)).toBe(true);
    }
  });

  it('não acusa kinds reais de tela', () => {
    expect(isUnknownSlideKind(faculdade)).toBe(false);
    expect(isUnknownSlideKind(c1)).toBe(false);
    expect(isUnknownSlideKind(termHistory)).toBe(false);
  });
});
