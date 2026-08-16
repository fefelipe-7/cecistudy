import { describe, expect, it } from 'vitest';
import {
  applyStickerUnlocks,
  countUnlocked,
  isConditionMet,
  mergeCatalogWithProgress,
} from '../stickers';
import { STICKER_CATALOG } from '../../data/stickerCatalog';
import type { Sticker, StickerCondition } from '../../types';

const baseState = {
  profile: { name: '', semester: 1, totalSemesters: 8 },
  readings: [],
  flashcards: [],
  sessions: [],
  classes: [],
  tasks: [],
  internshipLogs: [],
  currentStreak: 0,
  tcc: { status: 'em_andamento' },
  savedBookIds: [],
  concepts: [],
};

const makeStickers = (unlocked: string[] = []): Sticker[] =>
  STICKER_CATALOG.map((def) => ({
    ...def,
    unlocked: unlocked.includes(def.id),
    unlockedAt: unlocked.includes(def.id) ? '2026-08-01' : undefined,
  }));

describe('isConditionMet', () => {
  it('reading-done: status concluido ou páginas completas', () => {
    const cond: StickerCondition = { type: 'reading-done' };
    expect(isConditionMet(cond, baseState)).toBe(false);
    expect(
      isConditionMet(cond, {
        ...baseState,
        readings: [{ status: 'concluido', readPages: 100, totalPages: 100 }],
      })
    ).toBe(true);
    expect(
      isConditionMet(cond, {
        ...baseState,
        readings: [{ status: 'lendo', readPages: 100, totalPages: 100 }],
      })
    ).toBe(true);
    expect(
      isConditionMet(cond, {
        ...baseState,
        readings: [{ status: 'lendo', readPages: 40, totalPages: 100 }],
      })
    ).toBe(false);
  });

  it('profile-set: nome preenchido', () => {
    const cond: StickerCondition = { type: 'profile-set' };
    expect(isConditionMet(cond, baseState)).toBe(false);
    expect(isConditionMet(cond, { ...baseState, profile: { ...baseState.profile, name: 'Ceci' } })).toBe(true);
    expect(isConditionMet(cond, { ...baseState, profile: { ...baseState.profile, name: '   ' } })).toBe(false);
  });

  it('flashcards-reviewed: soma as revisões', () => {
    const cond: StickerCondition = { type: 'flashcards-reviewed', min: 10 };
    expect(isConditionMet(cond, { ...baseState, flashcards: [{ timesReviewed: 4 }, { timesReviewed: 6 }] })).toBe(true);
    expect(isConditionMet(cond, { ...baseState, flashcards: [{ timesReviewed: 4 }, { timesReviewed: 5 }] })).toBe(false);
  });

  it('streak: compara com a ofensiva atual', () => {
    expect(isConditionMet({ type: 'streak', min: 5 }, { ...baseState, currentStreak: 5 })).toBe(true);
    expect(isConditionMet({ type: 'streak', min: 14 }, { ...baseState, currentStreak: 5 })).toBe(false);
  });

  it('degree-half: a partir da metade da graduação', () => {
    const cond: StickerCondition = { type: 'degree-half' };
    expect(isConditionMet(cond, { ...baseState, profile: { ...baseState.profile, semester: 3, totalSemesters: 8 } })).toBe(false);
    expect(isConditionMet(cond, { ...baseState, profile: { ...baseState.profile, semester: 4, totalSemesters: 8 } })).toBe(true);
  });

  it('concepts-with-authors: conceitos ligados a autores', () => {
    const cond: StickerCondition = { type: 'concepts-with-authors', min: 3 };
    expect(isConditionMet(cond, { ...baseState, concepts: [] })).toBe(false);
    expect(
      isConditionMet(cond, {
        ...baseState,
        concepts: [
          { authorIds: ['aut-1'] },
          { authorIds: ['aut-2'] },
          { authorIds: ['aut-3'] },
          { authorIds: [] },
        ],
      })
    ).toBe(true);
  });

  it('tcc-done: status concluido', () => {
    expect(isConditionMet({ type: 'tcc-done' }, { ...baseState, tcc: { status: 'concluido' } })).toBe(true);
    expect(isConditionMet({ type: 'tcc-done' }, { ...baseState, tcc: { status: 'revisao' } })).toBe(false);
  });

  it('limiares simples (sessions, class-notes, pages-read, tasks-done, saved-books, internship-first)', () => {
    expect(isConditionMet({ type: 'sessions', min: 5 }, { ...baseState, sessions: [1, 2, 3, 4, 5] })).toBe(true);
    expect(isConditionMet({ type: 'class-notes', min: 10 }, { ...baseState, classes: new Array(9) })).toBe(false);
    expect(
      isConditionMet({ type: 'pages-read', min: 500 }, { ...baseState, readings: [{ readPages: 300 }, { readPages: 250 }] })
    ).toBe(true);
    expect(
      isConditionMet({ type: 'tasks-done', min: 15 }, { ...baseState, tasks: new Array(14).fill({ completed: true }) })
    ).toBe(false);
    expect(isConditionMet({ type: 'saved-books', min: 5 }, { ...baseState, savedBookIds: ['a', 'b', 'c', 'd', 'e'] })).toBe(true);
    expect(isConditionMet({ type: 'internship-first' }, { ...baseState, internshipLogs: [{}] })).toBe(true);
  });
});

describe('mergeCatalogWithProgress', () => {
  it('semeia o catálogo bloqueado quando não há progresso', () => {
    const merged = mergeCatalogWithProgress([]);
    expect(merged.length).toBe(STICKER_CATALOG.length);
    expect(merged.every((s) => !s.unlocked)).toBe(true);
  });

  it('preserva desbloqueios existentes e adiciona entradas novas bloqueadas', () => {
    const partial = makeStickers(['st-1', 'st-8']);
    const merged = mergeCatalogWithProgress(partial);
    expect(merged.length).toBe(STICKER_CATALOG.length);
    expect(merged.find((s) => s.id === 'st-1')?.unlocked).toBe(true);
    expect(merged.find((s) => s.id === 'st-8')?.unlocked).toBe(true);
    expect(merged.find((s) => s.id === 'st-9')?.unlocked).toBe(false);
  });

  it('mantém entradas persistidas fora do catálogo (segurança)', () => {
    const legacy: Sticker = {
      id: 'st-antigo',
      name: 'antigo',
      emoji: '🌟',
      description: 'x',
      category: 'jornada',
      unlocked: true,
    };
    const merged = mergeCatalogWithProgress([...makeStickers(), legacy]);
    expect(merged.find((s) => s.id === 'st-antigo')?.unlocked).toBe(true);
  });
});

describe('applyStickerUnlocks', () => {
  it('desbloqueia conquistas conforme o estado e marca a data', () => {
    const stickers = makeStickers();
    const { updated, newlyUnlocked } = applyStickerUnlocks(stickers, {
      ...baseState,
      internshipLogs: [{}],
      currentStreak: 7,
      tcc: { status: 'concluido' },
    }, '2026-08-15');

    expect(updated.find((s) => s.id === 'st-4')?.unlocked).toBe(true);
    expect(updated.find((s) => s.id === 'st-4')?.unlockedAt).toBe('2026-08-15');
    expect(updated.find((s) => s.id === 'st-5')?.unlocked).toBe(true);
    expect(updated.find((s) => s.id === 'st-8')?.unlocked).toBe(true);
    expect(updated.find((s) => s.id === 'st-1')?.unlocked).toBe(false);

    const ids = newlyUnlocked.map((s) => s.id).sort();
    expect(ids).toEqual(['st-4', 'st-5', 'st-8']);
  });

  it('nunca re-bloqueia conquistas já feitas quando o estado regride', () => {
    const stickers = makeStickers(['st-1']);
    const { updated, newlyUnlocked } = applyStickerUnlocks(stickers, baseState, '2026-08-15');
    expect(updated.find((s) => s.id === 'st-1')?.unlocked).toBe(true);
    expect(updated.find((s) => s.id === 'st-1')?.unlockedAt).toBe('2026-08-01');
    expect(newlyUnlocked).toHaveLength(0);
  });

  it('mantém a data original quando já havia desbloqueio agendado', () => {
    const stickers = makeStickers();
    stickers[0].unlockedAt = '2026-08-02'; // ainda desbloqueado via seed
    const { updated, newlyUnlocked } = applyStickerUnlocks(stickers, baseState, '2026-08-15');
    expect(newlyUnlocked).toHaveLength(0);
    expect(updated[0].unlocked).toBe(false);
  });
});

describe('countUnlocked', () => {
  it('conta os desbloqueados', () => {
    expect(countUnlocked(makeStickers(['st-1', 'st-3']))).toBe(2);
    expect(countUnlocked(makeStickers())).toBe(0);
  });
});