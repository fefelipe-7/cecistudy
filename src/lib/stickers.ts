import type { Sticker, StickerCondition } from '../types';
import {
  STICKER_CATALOG,
  stickerConditionFor,
  stickerFromCatalog,
} from '../data/stickerCatalog';

/**
 * Lógica pura de desbloqueio de stickers (conquistas).
 *
 * O catálogo (`src/data/stickerCatalog.ts`) define as conquistas e as condições;
 * aqui as condições são avaliadas contra um snapshot do estado do app e o
 * progresso persistido é atualizado (sem nunca re-bloquear o que já foi feito).
 */

/** Snapshot mínimo do estado do app necessário para avaliar as condições. */
export interface StickerState {
  profile: { name: string; semester: number; totalSemesters: number };
  readings: { status?: string; readPages?: number; totalPages?: number }[];
  flashcards: { timesReviewed?: number }[];
  sessions: { durationMinutes?: number }[];
  classes: unknown[];
  tasks: { completed: boolean }[];
  internshipLogs: { hours?: number }[];
  currentStreak: number;
  tcc: { status: string; title: string; chapters: { completed: boolean }[] };
  savedBookIds: string[];
  concepts: { authorIds: string[] }[];
  exams: { completed: boolean }[];
  authors: unknown[];
  materials: unknown[];
  courses: unknown[];
  techniques: unknown[];
  quizSessions: { answers: { questionId: string; correct: boolean }[] }[];
  streakTotal: number;
  streakLongest: number;
  looseNotes: unknown[];
}

/** IDs de questões respondidas (únicos) em todas as sessões de quiz. */
function answeredQuestionIds(quizSessions: StickerState['quizSessions']): Set<string> {
  return new Set(quizSessions.flatMap((s) => s.answers.map((a) => a.questionId)));
}

/** IDs de questões acertadas (únicos) em todas as sessões de quiz. */
function correctlyAnsweredQuestionIds(quizSessions: StickerState['quizSessions']): Set<string> {
  const ids = new Set<string>();
  for (const s of quizSessions) {
    for (const a of s.answers) {
      if (a.correct) ids.add(a.questionId);
    }
  }
  return ids;
}

/** Verifica se uma condição está satisfeita no snapshot atual. */
export function isConditionMet(condition: StickerCondition, state: StickerState): boolean {
  switch (condition.type) {
    case 'reading-done':
      return state.readings.some(
        (r) =>
          r.status === 'concluido' ||
          ((r.readPages ?? 0) > 0 && (r.totalPages ?? 0) > 0 && (r.readPages ?? 0) >= (r.totalPages ?? 0))
      );
    case 'profile-set':
      return state.profile.name.trim().length > 0;
    case 'flashcards-reviewed':
      return state.flashcards.reduce((acc, f) => acc + (f.timesReviewed ?? 0), 0) >= condition.min;
    case 'internship-first':
      return state.internshipLogs.length >= 1;
    case 'streak':
      return state.currentStreak >= condition.min;
    case 'degree-half':
      return state.profile.semester >= Math.ceil(state.profile.totalSemesters / 2);
    case 'concepts-with-authors':
      return state.concepts.filter((c) => c.authorIds.length > 0).length >= condition.min;
    case 'tcc-done':
      return state.tcc.status === 'concluido';
    case 'sessions':
      return state.sessions.length >= condition.min;
    case 'class-notes':
      return state.classes.length >= condition.min;
    case 'pages-read':
      return state.readings.reduce((acc, r) => acc + (r.readPages ?? 0), 0) >= condition.min;
    case 'tasks-done':
      return state.tasks.filter((t) => t.completed).length >= condition.min;
    case 'saved-books':
      return state.savedBookIds.length >= condition.min;

    // ---- corrigidas (bug de precedência / hardcode) ----
    case 'streak-week':
      return state.streakTotal >= condition.min;
    case 'streak-month':
      return state.streakTotal >= condition.min;
    case 'flashcard-streak':
      return state.flashcards.filter((f) => (f.timesReviewed ?? 0) > 0).length >= 14;
    case 'techniques-explored':
      return state.techniques.length >= condition.min;

    // ---- questionário — fonte real (quizSessions, IDs únicos) ----
    case 'questions-created':
      return answeredQuestionIds(state.quizSessions).size >= condition.min;
    case 'questions-mastered':
      return correctlyAnsweredQuestionIds(state.quizSessions).size >= condition.min;

    // ---- as 21 que faltavam ----
    case 'exams-added':
      return state.exams.length >= condition.min;
    case 'exams-done':
      return state.exams.filter((e) => e.completed).length >= condition.min;
    case 'concepts-known':
      return state.concepts.length >= condition.min;
    case 'authors-known':
      return state.authors.length >= condition.min;
    case 'materials-added':
      return state.materials.length >= condition.min;
    case 'courses':
      return state.courses.length >= condition.min;
    case 'flashcards-count':
      return state.flashcards.length >= condition.min;
    case 'techniques-used':
      return state.techniques.length >= condition.min;
    case 'study-minutes':
      return state.sessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0) >= condition.min;
    case 'streak-total':
      return state.streakTotal >= condition.min;
    case 'reading-count':
      return state.readings.length >= condition.min;
    case 'reading-in-progress':
      return state.readings.filter((r) => r.status === 'lendo').length >= condition.min;
    case 'loose-notes':
      return state.looseNotes.length >= condition.min;
    case 'internship-hours':
      return state.internshipLogs.reduce((acc, l) => acc + (l.hours ?? 0), 0) >= condition.min;
    case 'internship-logs':
      return state.internshipLogs.length >= condition.min;
    case 'tcc-created':
      return state.tcc.title.trim().length > 0;
    case 'tcc-chapters-done':
      return state.tcc.chapters.filter((c) => c.completed).length >= condition.min;
    case 'penultimate-semester':
      return state.profile.semester >= state.profile.totalSemesters - 1;
    case 'streak-longest':
      return state.streakLongest >= condition.min;
    case 'graduation':
      return state.profile.semester >= state.profile.totalSemesters;

    default:
      return false;
  }
}

/**
 * Valor numérico atual de uma condição (para a barra de progresso da UI).
 * Condições booleanas (sem `min`) retornam 0 — a UI não desenha barra para elas.
 */
export function currentValueFor(condition: StickerCondition, state: StickerState): number {
  switch (condition.type) {
    case 'flashcards-reviewed':
      return state.flashcards.reduce((acc, f) => acc + (f.timesReviewed ?? 0), 0);
    case 'sessions':
      return state.sessions.length;
    case 'class-notes':
      return state.classes.length;
    case 'pages-read':
      return state.readings.reduce((acc, r) => acc + (r.readPages ?? 0), 0);
    case 'tasks-done':
      return state.tasks.filter((t) => t.completed).length;
    case 'saved-books':
      return state.savedBookIds.length;
    case 'streak':
      return state.currentStreak;
    case 'streak-week':
    case 'streak-month':
    case 'streak-total':
      return state.streakTotal;
    case 'streak-longest':
      return state.streakLongest;
    case 'concepts-with-authors':
      return state.concepts.filter((c) => c.authorIds.length > 0).length;
    case 'exams-added':
      return state.exams.length;
    case 'exams-done':
      return state.exams.filter((e) => e.completed).length;
    case 'concepts-known':
      return state.concepts.length;
    case 'authors-known':
      return state.authors.length;
    case 'materials-added':
      return state.materials.length;
    case 'courses':
      return state.courses.length;
    case 'flashcards-count':
      return state.flashcards.length;
    case 'techniques-used':
    case 'techniques-explored':
      return state.techniques.length;
    case 'study-minutes':
      return state.sessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
    case 'reading-count':
      return state.readings.length;
    case 'reading-in-progress':
      return state.readings.filter((r) => r.status === 'lendo').length;
    case 'loose-notes':
      return state.looseNotes.length;
    case 'internship-hours':
      return state.internshipLogs.reduce((acc, l) => acc + (l.hours ?? 0), 0);
    case 'internship-logs':
      return state.internshipLogs.length;
    case 'tcc-chapters-done':
      return state.tcc.chapters.filter((c) => c.completed).length;
    case 'questions-created':
      return answeredQuestionIds(state.quizSessions).size;
    case 'questions-mastered':
      return correctlyAnsweredQuestionIds(state.quizSessions).size;
    default:
      return 0;
  }
}

/**
 * Reconcilia o progresso persistido com o catálogo.
 * Entradas novas do catálogo entram bloqueadas; entradas persistidas que não
 * existem mais no catálogo são preservadas (segurança com dados de usuária).
 */
export function mergeCatalogWithProgress(progress: Sticker[]): Sticker[] {
  const byId = new Map(progress.map((s) => [s.id, s]));
  const merged: Sticker[] = STICKER_CATALOG.map((def) => stickerFromCatalog(def, byId.get(def.id)));
  for (const s of progress) {
    if (!merged.some((m) => m.id === s.id)) merged.push(s);
  }
  return merged;
}

/**
 * Aplica o desbloqueio de stickers conforme o estado atual.
 * Nunca re-bloqueia conquistas já feitas (mesmo que o estado regrida).
 * Retorna a lista atualizada e as conquistas recém-desbloqueadas (para celebrar).
 */
export function applyStickerUnlocks(
  stickers: Sticker[],
  state: StickerState,
  today: string
): { updated: Sticker[]; newlyUnlocked: Sticker[] } {
  const updated: Sticker[] = [];
  const newlyUnlocked: Sticker[] = [];

  for (const s of stickers) {
    if (s.unlocked) {
      updated.push(s);
      continue;
    }
    const condition = stickerConditionFor(s.id);
    const met = condition ? isConditionMet(condition, state) : false;
    if (met) {
      const now: Sticker = { ...s, unlocked: true, unlockedAt: s.unlockedAt ?? today };
      updated.push(now);
      newlyUnlocked.push(now);
    } else {
      updated.push(s);
    }
  }

  // Sem novos desbloqueios: devolve a mesma referência (evita loops de efeito).
  if (newlyUnlocked.length === 0) return { updated: stickers, newlyUnlocked };

  return { updated, newlyUnlocked };
}

/** Número de stickers desbloqueados em uma lista (utilidade para a UI). */
export function countUnlocked(stickers: Sticker[]): number {
  return stickers.filter((s) => s.unlocked).length;
}