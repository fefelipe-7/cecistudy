import type { QuizConfig, StudyQuestion } from '../types';

/** Filtra o pool de questões de acordo com a config (áreas/temas/escolas/dificuldade). */
export function filterQuestionPool(
  questions: StudyQuestion[],
  config: QuizConfig
): StudyQuestion[] {
  return questions.filter((q) => {
    const areaMatch = config.areas.length === 0 || (q.area && config.areas.includes(q.area));
    const temaMatch = config.temas.length === 0 || (q.tema && config.temas.includes(q.tema));
    const escolaMatch =
      config.escolas.length === 0 || (q.escolaOuAbordagem && config.escolas.includes(q.escolaOuAbordagem));
    const difMatch =
      config.dificuldades.length === 0 || (q.dificuldade && config.dificuldades.includes(q.dificuldade));
    return areaMatch && temaMatch && escolaMatch && difMatch;
  });
}

/** Monta o pool final: filtra, embaralha e corta até o count da config. */
export function buildQuizPool(
  questions: StudyQuestion[],
  config: QuizConfig
): StudyQuestion[] {
  const filtered = filterQuestionPool(questions, config);
  return [...filtered].sort(() => Math.random() - 0.5).slice(0, config.count);
}
