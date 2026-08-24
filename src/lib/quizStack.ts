import type { NavScreen, NavTab, QuizAnswer, QuizConfig, StudyQuestion } from '../types';

/**
 * Lógica pura de manipulação da pilha de navegação do fluxo de quiz.
 * Funções determinísticas (recebem a pilha atual e devolvem a próxima) — a
 * aplicação (scroll/hash) e os timestamps ficam no chamador (AppContext).
 */

function estudosBase(stack: NavScreen[]): NavScreen[] {
  const top = stack[stack.length - 1];
  return top.kind === 'tab' && top.tab === 'estudos'
    ? stack
    : [{ kind: 'tab', tab: 'estudos' as NavTab }];
}

/** Empilha o seletor de assuntos do quiz (sobre a aba estudos). */
export function stackAfterOpenQuizCategory(stack: NavScreen[]): NavScreen[] {
  const top = stack[stack.length - 1];
  const base = estudosBase(stack);
  return top.kind === 'quiz-category' ? stack : [...base, { kind: 'quiz-category' }];
}

/** Empilha o splash de preparação (transitório; degrada ao seletor). */
export function stackAfterOpenQuizLoading(
  stack: NavScreen[],
  config: QuizConfig
): NavScreen[] {
  const top = stack[stack.length - 1];
  const base = estudosBase(stack);
  return top.kind === 'quiz-loading' ? stack : [...base, { kind: 'quiz-loading', config }];
}

/** Empilha o jogo; base = seletor de categoria (ou estudos + categoria se ausente). */
export function stackAfterOpenQuizPlay(
  stack: NavScreen[],
  pool: StudyQuestion[],
  config: QuizConfig,
  now: number
): NavScreen[] {
  const categoryIdx = stack.findIndex((s) => s.kind === 'quiz-category');
  const base: NavScreen[] =
    categoryIdx !== -1
      ? stack.slice(0, categoryIdx + 1)
      : [{ kind: 'tab', tab: 'estudos' as NavTab }, { kind: 'quiz-category' }];
  return [
    ...base,
    {
      kind: 'quiz-play',
      state: { pool, config, answers: [], currentIdx: 0, startTime: now, questionStartTime: now },
    },
  ];
}

export interface QuizResultPayload {
  answers: QuizAnswer[];
  config: QuizConfig;
  startTime: number;
  correctCount: number;
  totalCount: number;
}

/**
 * Troca o jogo pelo resultado na pilha: remove o `quiz-play` (não pode voltar
 * para uma pergunta já respondida) e mantém a categoria embaixo.
 */
export function stackAfterOpenQuizResult(
  stack: NavScreen[],
  result: QuizResultPayload
): NavScreen[] {
  const playScreen = stack.find((s) => s.kind === 'quiz-play');
  const pool: StudyQuestion[] = playScreen?.kind === 'quiz-play' ? playScreen.state.pool : [];
  const categoryIdx = stack.findIndex((s) => s.kind === 'quiz-category');
  const base =
    categoryIdx === -1
      ? stack.filter((s) => s.kind !== 'quiz-play')
      : stack.slice(0, categoryIdx + 1);
  return [...base, { kind: 'quiz-result', ...result, pool }];
}

/** Back do resultado: volta ao seletor de categorias (política de back nativo). */
export function stackAfterCloseQuizResult(stack: NavScreen[]): NavScreen[] {
  const categoryIdx = stack.findIndex((s) => s.kind === 'quiz-category');
  if (categoryIdx === -1) return stack.slice(0, stack.length - 1);
  return stack.slice(0, categoryIdx + 1);
}

/** Sai de todo o fluxo de quiz de uma vez (volta à tela anterior ao quiz). */
export function stackAfterCloseAllQuizScreens(stack: NavScreen[]): NavScreen[] {
  const categoryIdx = stack.findIndex((s) => s.kind === 'quiz-category');
  if (categoryIdx === -1) return stack.slice(0, stack.length - 1);
  const base = stack.slice(0, categoryIdx);
  return base.length === 0 ? [{ kind: 'tab', tab: 'estudos' as NavTab }] : base;
}

/** "Novo quiz" no resultado: volta ao seletor; `null` se não houver categoria. */
export function stackAfterNewQuizFromResult(stack: NavScreen[]): NavScreen[] | null {
  const categoryIdx = stack.findIndex((s) => s.kind === 'quiz-category');
  if (categoryIdx === -1) return null;
  return stack.slice(0, categoryIdx + 1);
}