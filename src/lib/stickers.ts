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
  sessions: unknown[];
  classes: unknown[];
  tasks: { completed: boolean }[];
  internshipLogs: unknown[];
  currentStreak: number;
  tcc: { status: string };
  savedBookIds: string[];
  concepts: { authorIds: string[] }[];
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
    default:
      return false;
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