import { describe, expect, it } from 'vitest';
import type { NavScreen, QuizConfig, StudyQuestion } from '../../types';
import {
  stackAfterCloseAllQuizScreens,
  stackAfterCloseQuizResult,
  stackAfterNewQuizFromResult,
  stackAfterOpenQuizCategory,
  stackAfterOpenQuizLoading,
  stackAfterOpenQuizPlay,
  stackAfterOpenQuizResult,
} from '../quizStack';

const QUESTION: StudyQuestion = {
  id: 'q1',
  area: 'clínica',
  tema: 'ansiedade',
  escolaOuAbordagem: 'tcc',
  dificuldade: 'basica',
  question: 'p',
  options: ['a', 'b'],
  answer: 'a',
  explanation: 'e',
};

const CONFIG: QuizConfig = {
  areas: [],
  temas: [],
  escolas: [],
  dificuldades: ['basica'],
  count: 1,
};

const estudosTab: NavScreen = { kind: 'tab', tab: 'estudos' };
const homeTab: NavScreen = { kind: 'tab', tab: 'home' };

describe('quizStack', () => {
  it('abre a categoria a partir de outra aba (base = estudos)', () => {
    const next = stackAfterOpenQuizCategory([homeTab]);
    expect(next).toEqual([estudosTab, { kind: 'quiz-category' }]);
  });

  it('abre a categoria sobre a aba estudos sem duplicar a tab', () => {
    const next = stackAfterOpenQuizCategory([estudosTab]);
    expect(next).toEqual([estudosTab, { kind: 'quiz-category' }]);
  });

  it('abre loading empilhando sobre a categoria (base = estudos)', () => {
    const next = stackAfterOpenQuizLoading([estudosTab, { kind: 'quiz-category' }], CONFIG);
    expect(next).toEqual([estudosTab, { kind: 'quiz-category' }, { kind: 'quiz-loading', config: CONFIG }]);
  });

  it('abre o jogo com base na categoria existente', () => {
    const next = stackAfterOpenQuizPlay([estudosTab, { kind: 'quiz-category' }], [QUESTION], CONFIG, 1000);
    expect(next).toEqual([
      estudosTab,
      { kind: 'quiz-category' },
      { kind: 'quiz-play', state: expect.objectContaining({ pool: [QUESTION], config: CONFIG, currentIdx: 0, startTime: 1000 }) },
    ]);
  });

  it('abre o jogo criando a categoria quando ausente', () => {
    const next = stackAfterOpenQuizPlay([estudosTab], [QUESTION], CONFIG, 1);
    expect(next.map((s) => s.kind)).toEqual(['tab', 'quiz-category', 'quiz-play']);
  });

  it('resultado substitui o jogo na pilha e mantém a categoria (P2-5)', () => {
    const play = stackAfterOpenQuizPlay([estudosTab, { kind: 'quiz-category' }], [QUESTION], CONFIG, 1000);
    const next = stackAfterOpenQuizResult(play, {
      answers: [],
      config: CONFIG,
      startTime: 1000,
      correctCount: 1,
      totalCount: 1,
    });
    expect(next.map((s) => s.kind)).toEqual(['tab', 'quiz-category', 'quiz-result']);
    expect(next[2].kind === 'quiz-result' && next[2].pool).toEqual([QUESTION]);
  });

  it('back do resultado volta à categoria, não ao jogo (P1-2)', () => {
    const result = stackAfterOpenQuizResult(
      stackAfterOpenQuizPlay([estudosTab, { kind: 'quiz-category' }], [QUESTION], CONFIG, 1000),
      { answers: [], config: CONFIG, startTime: 1000, correctCount: 1, totalCount: 1 }
    );
    const next = stackAfterCloseQuizResult(result);
    expect(next.map((s) => s.kind)).toEqual(['tab', 'quiz-category']);
  });

  it('back do resultado sem categoria apenas desempilha', () => {
    const next = stackAfterCloseQuizResult([estudosTab, { kind: 'quiz-result' } as NavScreen]);
    expect(next).toEqual([estudosTab]);
  });

  it('novo quiz mantém a categoria', () => {
    const next = stackAfterNewQuizFromResult([estudosTab, { kind: 'quiz-category' }, { kind: 'quiz-result' } as NavScreen]);
    expect(next && next.map((s) => s.kind)).toEqual(['tab', 'quiz-category']);
  });

  it('novo quiz sem categoria retorna null (chamador abre o seletor)', () => {
    expect(stackAfterNewQuizFromResult([estudosTab])).toBeNull();
  });

  it('fecha todo o fluxo de quiz voltando à tela anterior ao quiz', () => {
    const next = stackAfterCloseAllQuizScreens([homeTab, { kind: 'quiz-category' }, { kind: 'quiz-result' } as NavScreen]);
    expect(next).toEqual([homeTab]);
  });

  it('fecha todo o fluxo para a aba estudos quando não há base', () => {
    const next = stackAfterCloseAllQuizScreens([{ kind: 'quiz-category' }]);
    expect(next).toEqual([estudosTab]);
  });
});