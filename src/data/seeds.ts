/**
 * Dados de demonstração ("começar com dados de exemplo").
 *
 * Este conteúdo é o "banco de exemplo" — carregado apenas por escolha explícita
 * no onboarding ou em Perfil → configurações. Não é o padrão do app em produção.
 */
import type { EmptyDatabase } from './empty';
import {
  initialProfile,
  initialCourses,
  initialClasses,
  initialTasks,
  initialExams,
  initialAuthors,
  initialConcepts,
  initialReadings,
  initialFlashcards,
  initialMaterials,
  initialInternshipLogs,
  initialTcc,
  initialStickers,
  initialStudySessions,
  initialStreakData,
} from './initialData';
import { INITIAL_NOTES } from './notesSeeds';

/** Constrói o banco local completo com os dados de exemplo. */
export function demoDatabase(): EmptyDatabase {
  return {
    profile: initialProfile,
    courses: initialCourses,
    classes: initialClasses,
    tasks: initialTasks,
    exams: initialExams,
    authors: initialAuthors,
    concepts: initialConcepts,
    approaches: [],
    readings: initialReadings,
    flashcards: initialFlashcards,
    materials: initialMaterials,
    internshipLogs: initialInternshipLogs,
    tcc: initialTcc,
    stickers: initialStickers,
    sessions: initialStudySessions,
    streakData: initialStreakData,
    reminder: { enabled: false, time: '19:00' },
    looseNotes: INITIAL_NOTES,
    savedBookIds: [],
    bookmarkedCourseIds: ['c1', 'c2'],
    questions: [],
    techniques: [],
    onboarding: { completed: false },
    readingProgress: {},
  };
}