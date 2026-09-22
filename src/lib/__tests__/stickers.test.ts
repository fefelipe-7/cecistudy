import { describe, expect, it } from 'vitest';
import {
  applyStickerUnlocks,
  countUnlocked,
  currentValueFor,
  isConditionMet,
  mergeCatalogWithProgress,
  type StickerState,
} from '../stickers';
import { STICKER_CATALOG, stickerConditionFor, stickerDefinitionFor } from '../../data/stickerCatalog';
import type { Sticker, StickerCondition } from '../../types';

const baseState: StickerState = {
  profile: { name: '', semester: 1, totalSemesters: 8 },
  readings: [],
  flashcards: [],
  sessions: [],
  classes: [],
  tasks: [],
  internshipLogs: [],
  currentStreak: 0,
  streakTotal: 0,
  streakLongest: 0,
  tcc: { status: 'em_andamento', title: '', chapters: [] },
  savedBookIds: [],
  concepts: [],
  exams: [],
  authors: [],
  materials: [],
  courses: [],
  techniques: [],
  quizSessions: [],
  looseNotes: [],
};

const makeStickers = (unlocked: string[] = []): Sticker[] =>
  STICKER_CATALOG.map((def) => ({
    ...def,
    unlocked: unlocked.includes(def.id),
    unlockedAt: unlocked.includes(def.id) ? '2026-08-01' : undefined,
  }));

const quizSession = (answers: { questionId: string; correct: boolean }[]) => ({ answers });

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
    expect(isConditionMet({ type: 'tcc-done' }, { ...baseState, tcc: { status: 'concluido', title: '', chapters: [] } })).toBe(true);
    expect(isConditionMet({ type: 'tcc-done' }, { ...baseState, tcc: { status: 'revisao', title: '', chapters: [] } })).toBe(false);
  });

  it('limiares simples (sessions, class-notes, pages-read, tasks-done, saved-books, internship-first)', () => {
    expect(isConditionMet({ type: 'sessions', min: 5 }, { ...baseState, sessions: [{ durationMinutes: 1 }, { durationMinutes: 2 }, { durationMinutes: 3 }, { durationMinutes: 4 }, { durationMinutes: 5 }] })).toBe(true);
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

  it('streak-week e streak-month usam condition.min (sem hardcode)', () => {
    expect(isConditionMet({ type: 'streak-week', min: 5 }, { ...baseState, streakTotal: 5 })).toBe(true);
    expect(isConditionMet({ type: 'streak-week', min: 5 }, { ...baseState, streakTotal: 4 })).toBe(false);
    expect(isConditionMet({ type: 'streak-month', min: 15 }, { ...baseState, streakTotal: 15 })).toBe(true);
    expect(isConditionMet({ type: 'streak-month', min: 15 }, { ...baseState, streakTotal: 10 })).toBe(false);
  });

  it('flashcard-streak: 14 cartões distintos revisados', () => {
    expect(isConditionMet({ type: 'flashcard-streak' }, { ...baseState, flashcards: Array(14).fill({ timesReviewed: 1 }) })).toBe(true);
    expect(isConditionMet({ type: 'flashcard-streak' }, { ...baseState, flashcards: Array(13).fill({ timesReviewed: 1 }) })).toBe(false);
  });

  it('questions-created: IDs únicos respondidos via quizSessions', () => {
    const cond: StickerCondition = { type: 'questions-created', min: 5 };
    expect(isConditionMet(cond, { ...baseState, quizSessions: [quizSession([{ questionId: 'q1', correct: true }])] })).toBe(false);
    expect(
      isConditionMet(cond, {
        ...baseState,
        quizSessions: [
          quizSession([{ questionId: 'q1', correct: true }, { questionId: 'q2', correct: false }]),
          quizSession([{ questionId: 'q3', correct: true }, { questionId: 'q4', correct: false }]),
          quizSession([{ questionId: 'q5', correct: true }]),
        ],
      })
    ).toBe(true);
    // repetições da mesma questão não contam duas vezes
    expect(
      isConditionMet(cond, {
        ...baseState,
        quizSessions: [
          quizSession([{ questionId: 'q1', correct: true }, { questionId: 'q1', correct: false }]),
          quizSession([{ questionId: 'q2', correct: true }, { questionId: 'q3', correct: true }]),
          quizSession([{ questionId: 'q4', correct: true }, { questionId: 'q5', correct: true }]),
        ],
      })
    ).toBe(true);
  });

  it('questions-mastered: IDs únicos acertados via quizSessions', () => {
    const cond: StickerCondition = { type: 'questions-mastered', min: 50 };
    expect(isConditionMet(cond, baseState)).toBe(false);
    const answers50 = Array.from({ length: 50 }, (_, i) => ({ questionId: `q${i + 1}`, correct: true }));
    expect(isConditionMet(cond, { ...baseState, quizSessions: [quizSession(answers50)] })).toBe(true);
    const answers49 = Array.from({ length: 49 }, (_, i) => ({ questionId: `q${i + 1}`, correct: true }));
    expect(isConditionMet(cond, { ...baseState, quizSessions: [quizSession(answers49)] })).toBe(false);
  });

  it('techniques-explored usa condition.min', () => {
    expect(isConditionMet({ type: 'techniques-explored', min: 5 }, { ...baseState, techniques: Array(5).fill({}) })).toBe(true);
    expect(isConditionMet({ type: 'techniques-explored', min: 5 }, { ...baseState, techniques: Array(4).fill({}) })).toBe(false);
  });

  it('condições de faculdade (exams/courses/concepts/authors/materials/tasks)', () => {
    expect(isConditionMet({ type: 'exams-added', min: 1 }, { ...baseState, exams: [{ completed: false }] })).toBe(true);
    expect(isConditionMet({ type: 'exams-done', min: 3 }, { ...baseState, exams: [{ completed: true }, { completed: true }, { completed: false }] })).toBe(false);
    expect(isConditionMet({ type: 'exams-done', min: 3 }, { ...baseState, exams: [{ completed: true }, { completed: true }, { completed: true }] })).toBe(true);
    expect(isConditionMet({ type: 'concepts-known', min: 10 }, { ...baseState, concepts: new Array(9) })).toBe(false);
    expect(isConditionMet({ type: 'concepts-known', min: 10 }, { ...baseState, concepts: new Array(10) })).toBe(true);
    expect(isConditionMet({ type: 'authors-known', min: 5 }, { ...baseState, authors: new Array(5) })).toBe(true);
    expect(isConditionMet({ type: 'materials-added', min: 5 }, { ...baseState, materials: new Array(4) })).toBe(false);
    expect(isConditionMet({ type: 'courses', min: 3 }, { ...baseState, courses: new Array(3) })).toBe(true);
  });

  it('condições de estudo (flashcards-count/techniques-used/study-minutes/streak-total)', () => {
    expect(isConditionMet({ type: 'flashcards-count', min: 10 }, { ...baseState, flashcards: new Array(10) })).toBe(true);
    expect(isConditionMet({ type: 'techniques-used', min: 3 }, { ...baseState, techniques: new Array(3) })).toBe(true);
    expect(isConditionMet({ type: 'study-minutes', min: 120 }, { ...baseState, sessions: [{ durationMinutes: 60 }, { durationMinutes: 60 }] })).toBe(true);
    expect(isConditionMet({ type: 'study-minutes', min: 120 }, { ...baseState, sessions: [{ durationMinutes: 60 }, { durationMinutes: 30 }] })).toBe(false);
    expect(isConditionMet({ type: 'streak-total', min: 15 }, { ...baseState, streakTotal: 15 })).toBe(true);
    expect(isConditionMet({ type: 'streak-total', min: 15 }, { ...baseState, streakTotal: 14 })).toBe(false);
  });

  it('condições de leitura (reading-count/reading-in-progress/loose-notes)', () => {
    expect(isConditionMet({ type: 'reading-count', min: 5 }, { ...baseState, readings: new Array(4) })).toBe(false);
    expect(isConditionMet({ type: 'reading-count', min: 5 }, { ...baseState, readings: new Array(5) })).toBe(true);
    expect(isConditionMet({ type: 'reading-in-progress', min: 1 }, { ...baseState, readings: [{ status: 'nao_iniciado' }] })).toBe(false);
    expect(isConditionMet({ type: 'reading-in-progress', min: 1 }, { ...baseState, readings: [{ status: 'lendo' }] })).toBe(true);
    expect(isConditionMet({ type: 'loose-notes', min: 5 }, { ...baseState, looseNotes: new Array(5) })).toBe(true);
  });

  it('condições de jornada (internship-hours/logs, tcc, semestre, streak-longest, graduation)', () => {
    expect(isConditionMet({ type: 'internship-hours', min: 1 }, { ...baseState, internshipLogs: [{ hours: 1 }] })).toBe(true);
    expect(isConditionMet({ type: 'internship-hours', min: 10 }, { ...baseState, internshipLogs: [{ hours: 6 }, { hours: 4 }] })).toBe(true);
    expect(isConditionMet({ type: 'internship-logs', min: 3 }, { ...baseState, internshipLogs: new Array(3) })).toBe(true);
    expect(isConditionMet({ type: 'tcc-created' }, { ...baseState, tcc: { status: 'em_andamento', title: '', chapters: [] } })).toBe(false);
    expect(isConditionMet({ type: 'tcc-created' }, { ...baseState, tcc: { status: 'em_andamento', title: 'meu tcc', chapters: [] } })).toBe(true);
    expect(isConditionMet({ type: 'tcc-chapters-done', min: 1 }, { ...baseState, tcc: { status: 'em_andamento', title: 'x', chapters: [{ completed: false }] } })).toBe(false);
    expect(isConditionMet({ type: 'tcc-chapters-done', min: 1 }, { ...baseState, tcc: { status: 'em_andamento', title: 'x', chapters: [{ completed: true }] } })).toBe(true);
    expect(isConditionMet({ type: 'penultimate-semester' }, { ...baseState, profile: { ...baseState.profile, semester: 7, totalSemesters: 8 } })).toBe(true);
    expect(isConditionMet({ type: 'penultimate-semester' }, { ...baseState, profile: { ...baseState.profile, semester: 6, totalSemesters: 8 } })).toBe(false);
    expect(isConditionMet({ type: 'streak-longest', min: 21 }, { ...baseState, streakLongest: 21 })).toBe(true);
    expect(isConditionMet({ type: 'graduation' }, { ...baseState, profile: { ...baseState.profile, semester: 8, totalSemesters: 8 } })).toBe(true);
    expect(isConditionMet({ type: 'graduation' }, { ...baseState, profile: { ...baseState.profile, semester: 7, totalSemesters: 8 } })).toBe(false);
  });

  it('todo catálogo tem condição avaliável (nenhuma cai só em default)', () => {
    // Para cada condição do catálogo, pelo menos um estado verdadeiro devolvido pela
    // função é alcançável — aqui garantimos que a condição existe e não é undefined.
    for (const def of STICKER_CATALOG) {
      expect(stickerConditionFor(def.id)).toBeDefined();
    }
  });
});

describe('currentValueFor', () => {
  it('retorna o valor numérico das condições com min', () => {
    const state: StickerState = {
      ...baseState,
      flashcards: [{ timesReviewed: 4 }, { timesReviewed: 6 }],
      sessions: [{ durationMinutes: 60 }, { durationMinutes: 30 }],
      classes: new Array(7),
      readings: [{ readPages: 120 }, { readPages: 30 }],
      tasks: [{ completed: true }, { completed: false }, { completed: true }],
      savedBookIds: ['a', 'b'],
      currentStreak: 3,
      streakTotal: 9,
      streakLongest: 5,
      concepts: [{ authorIds: ['x'] }, { authorIds: [] }],
      exams: [{ completed: true }, { completed: false }],
      authors: new Array(4),
      materials: new Array(2),
      courses: new Array(3),
      techniques: new Array(2),
      internshipLogs: [{ hours: 5 }, { hours: 3 }],
      looseNotes: new Array(2),
      quizSessions: [
        quizSession([{ questionId: 'q1', correct: true }, { questionId: 'q2', correct: false }]),
        quizSession([{ questionId: 'q1', correct: false }, { questionId: 'q3', correct: true }]),
      ],
    };

    expect(currentValueFor({ type: 'flashcards-reviewed', min: 10 }, state)).toBe(10);
    expect(currentValueFor({ type: 'sessions', min: 5 }, state)).toBe(2);
    expect(currentValueFor({ type: 'class-notes', min: 10 }, state)).toBe(7);
    expect(currentValueFor({ type: 'pages-read', min: 100 }, state)).toBe(150);
    expect(currentValueFor({ type: 'tasks-done', min: 15 }, state)).toBe(2);
    expect(currentValueFor({ type: 'saved-books', min: 5 }, state)).toBe(2);
    expect(currentValueFor({ type: 'streak', min: 5 }, state)).toBe(3);
    expect(currentValueFor({ type: 'streak-week', min: 5 }, state)).toBe(9);
    expect(currentValueFor({ type: 'streak-month', min: 15 }, state)).toBe(9);
    expect(currentValueFor({ type: 'streak-total', min: 15 }, state)).toBe(9);
    expect(currentValueFor({ type: 'streak-longest', min: 21 }, state)).toBe(5);
    expect(currentValueFor({ type: 'concepts-with-authors', min: 3 }, state)).toBe(1);
    expect(currentValueFor({ type: 'exams-added', min: 1 }, state)).toBe(2);
    expect(currentValueFor({ type: 'exams-done', min: 3 }, state)).toBe(1);
    expect(currentValueFor({ type: 'concepts-known', min: 10 }, state)).toBe(2);
    expect(currentValueFor({ type: 'authors-known', min: 5 }, state)).toBe(4);
    expect(currentValueFor({ type: 'materials-added', min: 5 }, state)).toBe(2);
    expect(currentValueFor({ type: 'courses', min: 3 }, state)).toBe(3);
    expect(currentValueFor({ type: 'flashcards-count', min: 10 }, state)).toBe(2);
    expect(currentValueFor({ type: 'techniques-used', min: 3 }, state)).toBe(2);
    expect(currentValueFor({ type: 'techniques-explored', min: 5 }, state)).toBe(2);
    expect(currentValueFor({ type: 'study-minutes', min: 120 }, state)).toBe(90);
    expect(currentValueFor({ type: 'reading-count', min: 5 }, state)).toBe(2);
    expect(currentValueFor({ type: 'reading-in-progress', min: 1 }, state)).toBe(0);
    expect(currentValueFor({ type: 'loose-notes', min: 5 }, state)).toBe(2);
    expect(currentValueFor({ type: 'internship-hours', min: 1 }, state)).toBe(8);
    expect(currentValueFor({ type: 'internship-logs', min: 3 }, state)).toBe(2);
    expect(currentValueFor({ type: 'tcc-chapters-done', min: 1 }, state)).toBe(0);
    expect(currentValueFor({ type: 'questions-created', min: 5 }, state)).toBe(3);
    expect(currentValueFor({ type: 'questions-mastered', min: 50 }, state)).toBe(2);
  });

  it('condições booleanas retornam 0', () => {
    expect(currentValueFor({ type: 'reading-done' }, baseState)).toBe(0);
    expect(currentValueFor({ type: 'profile-set' }, baseState)).toBe(0);
    expect(currentValueFor({ type: 'tcc-done' }, baseState)).toBe(0);
    expect(currentValueFor({ type: 'flashcard-streak' }, baseState)).toBe(0);
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
      tcc: { status: 'concluido', title: '', chapters: [] },
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

describe('catálogo (T2.1)', () => {
  it('tem 80 stickers, 20 por categoria', () => {
    expect(STICKER_CATALOG).toHaveLength(80);
    const byCategory = { faculdade: 0, estudo: 0, leituras: 0, jornada: 0 };
    for (const def of STICKER_CATALOG) byCategory[def.category] += 1;
    expect(byCategory).toEqual({ faculdade: 20, estudo: 20, leituras: 20, jornada: 20 });
  });

  it('ids únicos e com raridade válida', () => {
    const rarities = new Set(STICKER_CATALOG.map((d) => d.rarity));
    expect(rarities.size).toBeGreaterThan(0);
    const ids = STICKER_CATALOG.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of STICKER_CATALOG) {
      expect(['semente', 'broto', 'raiz', 'copa', 'floresta']).toContain(def.rarity);
      expect(stickerDefinitionFor(def.id)).toBe(def);
    }
  });

  it('mantém os 45 ids legados (progresso persistido preservado)', () => {
    const ids = new Set(STICKER_CATALOG.map((d) => d.id));
    for (let i = 1; i <= 45; i++) {
      expect(ids.has(`st-${i}`)).toBe(true);
    }
  });
});