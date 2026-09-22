import { describe, expect, it } from 'vitest';
import type { QuizAnswer, QuizConfig, QuizPlayState, StudyQuestion } from '../../types';
import {
  advanceQuestion,
  applyAnswer,
  buildAnswer,
  finishQuiz,
  isAnswerCorrect,
} from '../quizPlayState';

const QUESTION: StudyQuestion = {
  id: 'q1',
  area: 'clínica',
  tema: 'ansiedade',
  escolaOuAbordagem: 'tcc',
  dificuldade: 'basica',
  question: 'pergunta?',
  options: ['a', 'b', 'c'],
  answer: 'a',
  gabarito: 'B',
  explanation: 'explicação',
};

const CONFIG: QuizConfig = {
  areas: [],
  temas: [],
  escolas: [],
  dificuldades: ['basica'],
  count: 1,
};

function state(partial: Partial<QuizPlayState> = {}): QuizPlayState {
  return {
    pool: [QUESTION],
    config: CONFIG,
    answers: [],
    currentIdx: 0,
    startTime: 1000,
    questionStartTime: 1000,
    ...partial,
  };
}

describe('quizPlayState (máquina pura)', () => {
  it('isAnswerCorrect compara a letra com o gabarito (fallback A)', () => {
    expect(isAnswerCorrect('B', 'B')).toBe(true);
    expect(isAnswerCorrect('B', 'A')).toBe(false);
    expect(isAnswerCorrect(undefined, 'A')).toBe(true);
  });

  it('buildAnswer monta resposta com correct calculado e snapshot da questão', () => {
    const answer = buildAnswer(QUESTION, 'B', 500);
    expect(answer).toMatchObject({
      questionId: 'q1',
      userAnswer: 'B',
      correct: true,
      timeMs: 500,
      explanation: 'explicação',
    });
    expect(answer.question).toBe(QUESTION);
  });

  it('applyAnswer faz append em answers e reinicia o relógio da questão', () => {
    const s = state();
    const answer: QuizAnswer = buildAnswer(QUESTION, 'B', 400);
    const next = applyAnswer(s, answer, 2000);
    expect(next.answers).toEqual([answer]);
    expect(next.questionStartTime).toBe(2000);
    expect(next.pool).toBe(s.pool);
    expect(next.config).toBe(CONFIG);
    expect(next.currentIdx).toBe(0);
    expect(next.startTime).toBe(1000);
  });

  it('applyAnswer não estoura quando responde a questão final', () => {
    const answer: QuizAnswer = buildAnswer(QUESTION, 'B', 400);
    const next = applyAnswer(state({ answers: [answer] }), answer, 2000);
    expect(next.answers).toHaveLength(2);
  });

  it('advanceQuestion incrementa currentIdx e mexe só no relógio', () => {
    const s = state({ answers: [buildAnswer(QUESTION, 'B', 400)] });
    const next = advanceQuestion(s, 5000);
    expect(next.currentIdx).toBe(1);
    expect(next.questionStartTime).toBe(5000);
    expect(next.answers).toEqual(s.answers);
  });

  it('advanceQuestion não passa do fim do pool', () => {
    const s = state({ currentIdx: 1, pool: [QUESTION, QUESTION] });
    const next = advanceQuestion(s, 5000);
    expect(next.currentIdx).toBe(2);
    const last = advanceQuestion(next, 6000);
    expect(last.currentIdx).toBe(2);
  });

  it('finishQuiz devolve payload com contagem correta de acertos', () => {
    const answers = [buildAnswer(QUESTION, 'B', 300), buildAnswer(QUESTION, 'A', 400)];
    const s = state({ answers, currentIdx: 1 });
    const payload = finishQuiz(s);
    expect(payload).toEqual({
      answers,
      config: CONFIG,
      startTime: 1000,
      correctCount: 1,
      totalCount: 1,
    });
  });

  it('finishQuiz com zero respostas conta zero', () => {
    const payload = finishQuiz(state());
    expect(payload.correctCount).toBe(0);
    expect(payload.totalCount).toBe(1);
  });
});