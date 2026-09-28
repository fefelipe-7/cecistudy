/**
 * Recorte por período letivo (`termScope`) — SPEC-005.
 *
 * O `status` do período é o **único driver de visibilidade**. Estas funções são
 * aplicadas nos pontos de **presentation** (views), não em coluna: o
 * `DataClientProvider` expõe as coleções cruas, e o recorte acontece aqui — o
 * mesmo padrão que o `workspaceId` deveria ter seguido.
 *
 * Escopo por **herança** (§D3): só `Course` tem `termId` direto. Tudo o mais
 * (aulas, tarefas, provas, leituras, sessões, flashcards) é filtrado pelo
 * `courseId` de uma disciplina que está no período.
 *
 * Sem `Date.now()` aqui: quem chama passa `today` (o app já tem o "hoje" do dia
 * corrente), o que mantém os testes determinísticos.
 */
import { useMemo } from 'react';
import type { Course } from '@/types/entity';
import type { AcademicTerm } from '@/types';
import {
  clampTermOrdinal,
  resolveActiveTerm,
  resolveAllActiveTerms,
  termsByRecency,
  MAX_TERM_ORDINAL,
} from '@/core/domain';

export { clampTermOrdinal, MAX_TERM_ORDINAL };

/* -------------------------------------------------------------------------- */
/* Período                                                                     */
/* -------------------------------------------------------------------------- */

/** Período ativo derivado (sem estado persistido, §D4). */
export function activeTermOf(terms: AcademicTerm[]): AcademicTerm | null {
  return resolveActiveTerm(terms);
}

/**
 * Todos os períodos ativos, do mais novo ao mais velho (SPEC-006 D9).
 *
 * `activeTermOf` dá **um** período — o que a UI mostra. Este dá **todos**: com
 * dois ativos no banco (merge de dois dispositivos, import, ou uma virada que
 * já rodou com o bug do `find`), a usuária precisa enxergar o conflito para
 * corrigir. `length > 1` é o sinal; `[0]` é o mesmo período que `activeTermOf`
 * devolve.
 */
export function allActiveTerms(terms: AcademicTerm[]): AcademicTerm[] {
  return resolveAllActiveTerms(terms);
}

/** Todos os períodos, do mais recente ao mais antigo (para a timeline). */
export function sortedTerms(terms: AcademicTerm[]): AcademicTerm[] {
  return termsByRecency(terms);
}

/* -------------------------------------------------------------------------- */
/* Disciplinas                                                                 */
/* -------------------------------------------------------------------------- */

/** Disciplinas de um período (qualquer status). */
export function coursesOfTerm(courses: Course[], termId: string | null | undefined): Course[] {
  if (!termId) return [];
  return courses.filter((c) => c.termId === termId);
}

/**
 * A grade do "agora": disciplina ativa **e** do período ativo.
 *
 * `termId == null` (disciplina avulsa, template, import sem período) fica de fora
 * da grade do período — ela é o escape hatch anti-órfão, não uma disciplina do
 * semestre. Quem quiser incluir usa `gradeCourses`.
 */
export function activeCourses(
  courses: Course[],
  terms: AcademicTerm[],
): { courses: Course[]; term: AcademicTerm | null } {
  const term = resolveActiveTerm(terms);
  if (!term) return { courses: [], term: null };
  return {
    courses: courses.filter((c) => c.termId === term.id && (c.status ?? 'ativo') === 'ativo'),
    term,
  };
}

/** Só o que está ativo (independente do período) — a grade visível. */
export function gradeCourses(courses: Course[]): Course[] {
  return courses.filter((c) => (c.status ?? 'ativo') === 'ativo');
}

/** Disciplinas arquivadas (saiam da grade, continuam pesquisáveis). */
export function archivedCourses(courses: Course[]): Course[] {
  return courses.filter((c) => (c.status ?? 'ativo') === 'arquivado');
}

/**
 * `true` quando a disciplina não pertence ao período ativo — seja por `status`,
 * seja por `termId` apontando para um período que não é o atual.
 */
export function isArchived(course: Course, terms: AcademicTerm[]): boolean {
  if ((course.status ?? 'ativo') === 'arquivado') return true;
  const term = resolveActiveTerm(terms);
  if (!term) return false;
  return course.termId != null && course.termId !== term.id;
}

/** Set com os ids das disciplinas visíveis no período ativo (lookup em lista). */
export function activeCourseIds(courses: Course[], terms: AcademicTerm[]): Set<string> {
  return new Set(activeCourses(courses, terms).courses.map((c) => c.id));
}

/* -------------------------------------------------------------------------- */
/* Progresso da graduação                                                      */
/* -------------------------------------------------------------------------- */

/** `%` da graduação, clampado em 0..100 (nunca 108% nem negativo). */
export function degreeProgress(ordinal: number, total: number): number {
  const safeTotal = Math.trunc(total);
  if (!Number.isFinite(safeTotal) || safeTotal <= 0) return 0;
  const safeOrdinal = Math.max(0, Math.trunc(ordinal) || 0);
  return Math.max(0, Math.min(100, Math.round((safeOrdinal / safeTotal) * 100)));
}

/** Semestres que faltam, nunca negativo (8º de 8 = 0, não -1). */
export function semestersLeft(ordinal: number, total: number): number {
  const safeTotal = Math.trunc(total);
  if (!Number.isFinite(safeTotal) || safeTotal <= 0) return 0;
  return Math.max(0, safeTotal - Math.max(0, Math.trunc(ordinal) || 0));
}

/** `ordinal` clampado em `1..min(MAX_TERM_ORDINAL, total)`. */
export function clampOrdinal(ordinal: unknown, total: number): number {
  return clampTermOrdinal(ordinal, Math.min(MAX_TERM_ORDINAL, Math.max(1, Math.trunc(total) || 1)));
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Período ativo memoizado. É a **fonte única** do "qual semestre eu estou" na
 * UI — substitui toda leitura de `profile.semester` (que fazia ping-pong de
 * sync por ser singleton com LWW do objeto inteiro).
 */
export function useActiveTerm(terms: AcademicTerm[]): AcademicTerm | null {
  return useMemo(() => resolveActiveTerm(terms), [terms]);
}

/**
 * Todos os ativos memoizados (SPEC-006 D9) — o par de `useActiveTerm` para o
 * card de integridade: `all.length > 1` avisa, `all[0]` é o período exibido.
 */
export function useAllActiveTerms(terms: AcademicTerm[]): AcademicTerm[] {
  return useMemo(() => resolveAllActiveTerms(terms), [terms]);
}

/**
 * Recorte de período para as views: uma vez, memoizado, com o mesmo objeto de
 * período para usar em filtro e no rótulo.
 */
export function useTermScope(courses: Course[], terms: AcademicTerm[]): {
  term: AcademicTerm | null;
  allActive: AcademicTerm[];
  active: Course[];
  grade: Course[];
  archived: Course[];
  activeIds: Set<string>;
} {
  return useMemo(() => {
    const { courses: active, term } = activeCourses(courses, terms);
    return {
      term,
      allActive: resolveAllActiveTerms(terms),
      active,
      grade: gradeCourses(courses),
      archived: archivedCourses(courses),
      activeIds: new Set(active.map((c) => c.id)),
    };
  }, [courses, terms]);
}
