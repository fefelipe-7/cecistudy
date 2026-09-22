// Máquina de estados pura do quiz (transições de `QuizPlayState`).
// Pura: sem efeito colateral (nada de `syncHash`, navigaÃO, storage) — recebe `now` por argumento.
import type {
  QuizAnswer,
  QuizConfig,
  QuizPlayState,
  StudyQuestion,
} from '../../../../src/types/quiz';

/** Compara a letra do usuário com o gabarito da questão (fallback 'A'). */
export function isAnswerCorrect(gabarito: string | undefined, userAnswer: string): boolean {
  return userAnswer === (gabarito ?? 'A');
}

/** Monta a resposta de uma questão a partir da letra escolhida (snapshot da questão preservado). */
export function buildAnswer(question: StudyQuestion, userAnswer: string, timeMs: number): QuizAnswer {
  return {
    questionId: question.id,
    userAnswer,
    correct: isAnswerCorrect(question.gabarito, userAnswer),
    timeMs,
    question,
    explanation: question.explanation,
  };
}

/** Adiciona a resposta ao estado (append) e reinicia o relógio da questão. */
export function applyAnswer(state: QuizPlayState, answer: QuizAnswer, now: number): QuizPlayState {
  return {
    ...state,
    answers: [...state.answers, answer],
    questionStartTime: now,
  };
}

/** Avança para a próxima questão (não toca `answers`; trava no fim do pool). */
export function advanceQuestion(state: QuizPlayState, now: number): QuizPlayState {
  const nextIdx = Math.min(state.currentIdx + 1, state.pool.length);
  return {
    ...state,
    currentIdx: nextIdx,
    questionStartTime: now,
  };
}

/** Payload do resultado do quiz (fim da sessão). */
export interface QuizFinishPayload {
  answers: QuizAnswer[];
  config: QuizConfig;
  startTime: number;
  correctCount: number;
  totalCount: number;
}

/** Calcula o resultado final a partir do estado (contagem de acertos). */
export function finishQuiz(state: QuizPlayState): QuizFinishPayload {
  const correctCount = state.answers.filter((a) => a.correct).length;
  return {
    answers: state.answers,
    config: state.config,
    startTime: state.startTime,
    correctCount,
    totalCount: state.pool.length,
  };
}