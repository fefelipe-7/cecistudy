// Lógica pura de manipulação da pilha de navegação do fluxo de quiz.
// Moveu de src/lib/quizStack.ts (dono agora: packages/navigation).
// Funções determinísticas (recebem a pilha atual e devolvem a próxima) — a
// aplicação (scroll/hash) e os timestamps ficam no chamador (AppContext).
import type { NavScreen, NavTab, QuizAnswer, QuizConfig, StudyQuestion, QuestionGroup } from './types';

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

/** Empilha o detalhe do grupo selecionado (sobre quiz-category). */
export function stackAfterOpenQuizGroupDetail(
  stack: NavScreen[],
  group: QuestionGroup
): NavScreen[] {
  const top = stack[stack.length - 1];
  const base = estudosBase(stack);
  const withCategory = top.kind === 'quiz-category'
    ? stack
    : top.kind === 'quiz-group-detail'
      ? stack
      : [...base, { kind: 'quiz-category' as const }];
  return withCategory.some((s) => s.kind === 'quiz-group-detail')
    ? withCategory.map((s) => s.kind === 'quiz-group-detail' ? { kind: 'quiz-group-detail' as const, group } : s)
    : [...withCategory, { kind: 'quiz-group-detail' as const, group }];
}

/** Empilha o splash de preparação (transitório; degrada ao seletor). */
export function stackAfterOpenQuizLoading(
  stack: NavScreen[],
  config: QuizConfig
): NavScreen[] {
  const top = stack[stack.length - 1];
  const base = estudosBase(stack);
  // Aceita topo sendo quiz-category OU quiz-group-detail
  const quizSection = ['quiz-category', 'quiz-group-detail'] as const;
  if (quizSection.includes(top.kind as typeof quizSection[number])) {
    return [...stack, { kind: 'quiz-loading', config }];
  }
  if (top.kind === 'quiz-loading') return stack;
  return [...base, { kind: 'quiz-category' as const }, { kind: 'quiz-loading', config }];
}

/** Empilha o jogo; preserva tudo abaixo de quiz-loading (ou quiz-category se loading ausente). */
export function stackAfterOpenQuizPlay(
  stack: NavScreen[],
  pool: StudyQuestion[],
  config: QuizConfig,
  now: number
): NavScreen[] {
  // Encontra o topo do "fluxo de escolha" — inclui loading, category e group-detail
  const quizFlow = new Set(['quiz-category', 'quiz-group-detail', 'quiz-loading']);
  const qi = [...stack].reverse().findIndex((s) => quizFlow.has(s.kind));
  const base: NavScreen[] =
    qi !== -1
      ? stack.slice(0, stack.length - qi)
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

const QUIZ_SECTION_KINDS = new Set(['quiz-category', 'quiz-group-detail'] as const);

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
  // Encontra a última tela de seção de quiz (category OU group-detail)
  const qi = [...stack].reverse().findIndex((s) => QUIZ_SECTION_KINDS.has(s.kind as any));
  const base =
    qi === -1
      ? stack.filter((s) => s.kind !== 'quiz-play')
      : stack.slice(0, stack.length - qi);
  return [...base, { kind: 'quiz-result', ...result, pool }];
}

/** Back do resultado: volta ao seletor de assuntos (política de back nativo). */
export function stackAfterCloseQuizResult(stack: NavScreen[]): NavScreen[] {
  const qi = [...stack].reverse().findIndex((s) => QUIZ_SECTION_KINDS.has(s.kind as any));
  if (qi === -1) return stack.slice(0, stack.length - 1);
  return stack.slice(0, stack.length - qi);
}

/** Sai de todo o fluxo de quiz de uma vez (volta à tela anterior ao quiz). */
export function stackAfterCloseAllQuizScreens(stack: NavScreen[]): NavScreen[] {
  const qi = [...stack].reverse().findIndex((s) => QUIZ_SECTION_KINDS.has(s.kind as any));
  if (qi === -1) return stack.slice(0, stack.length - 1);
  const base = stack.slice(0, stack.length - qi - 1);
  return base.length === 0 ? [{ kind: 'tab', tab: 'estudos' as NavTab }] : base;
}

/** "Novo quiz" no resultado: volta ao seletor; `null` se não houver categoria. */
export function stackAfterNewQuizFromResult(stack: NavScreen[]): NavScreen[] | null {
  const qi = [...stack].reverse().findIndex((s) => QUIZ_SECTION_KINDS.has(s.kind as any));
  if (qi === -1) return null;
  return stack.slice(0, stack.length - qi);
}
