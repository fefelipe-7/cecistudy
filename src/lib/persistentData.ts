/**
 * Contrato único do banco persistido do cecistudy.
 *
 * Fonte de verdade para o que é gravado, exportado, importado e resetado.
 * - `PersistedDatabase` = todas as coleções realmente persistidas (via
 *   `usePersistentState`), espelhando `EmptyDatabase` (agora com `quizSessions`).
 * - `readDatabaseFromState()` = conversão do estado do contexto → banco completo.
 * - `buildBackupData()` = payload de exportação (decisão explícita por campo:
 *   bancos estáticos `approaches`/`questions` NÃO são exportados — são catálogos
 *   embutidos no app e re-semeados sob demanda; incluí-los inflaria o backup em ~2MB).
 */
import {
  EmptyDatabase,
  emptyDatabase,
} from '../data/empty';
import type {
  UserProfile,
  Course,
  ClassNote,
  Task,
  Exam,
  PsychologyAuthor,
  PsychologyConcept,
  PsychologyApproach,
  ReadingItem,
  Flashcard,
  MaterialItem,
  InternshipLog,
  SupervisionNotebook,
  TccData,
  Sticker,
  StudySession,
  StreakData,
  StudyQuestion,
  Technique,
  OnboardingState,
  QuizSession,
  LooseNote,
} from '../types';

/** Tipo do banco persistido completo (fonte única de verdade). */
export type PersistedDatabase = EmptyDatabase;

/** Coleções estáticas re-semeadas a partir de catálogos embutidos (não exportadas). */
export const STATIC_BANKS = ['approaches', 'questions'] as const;

/**
 * Instantâneo dos estados persistidos do `AppContext` (entrada de
 * `readDatabaseFromState`/`buildBackupData`).
 */
export interface PersistedStateSnapshot {
  profile: UserProfile;
  courses: Course[];
  classes: ClassNote[];
  tasks: Task[];
  exams: Exam[];
  authors: PsychologyAuthor[];
  concepts: PsychologyConcept[];
  approaches: PsychologyApproach[];
  readings: ReadingItem[];
  flashcards: Flashcard[];
  materials: MaterialItem[];
  internshipLogs: InternshipLog[];
  supervision: SupervisionNotebook[];
  tcc: TccData;
  stickers: Sticker[];
  sessions: StudySession[];
  streakData: StreakData;
  reminder: { enabled: boolean; time: string };
  looseNotes: LooseNote[];
  savedBookIds: string[];
  bookmarkedCourseIds: string[];
  readingProgress: Record<string, number>;
  questions: StudyQuestion[];
  techniques: Technique[];
  quizSessions: QuizSession[];
  onboarding: OnboardingState;
}

/** Converte o estado do contexto no banco persistido completo. */
export function readDatabaseFromState(state: PersistedStateSnapshot): PersistedDatabase {
  return {
    profile: state.profile,
    courses: state.courses,
    classes: state.classes,
    tasks: state.tasks,
    exams: state.exams,
    authors: state.authors,
    concepts: state.concepts,
    approaches: state.approaches,
    readings: state.readings,
    flashcards: state.flashcards,
    materials: state.materials,
    internshipLogs: state.internshipLogs,
    supervision: state.supervision,
    tcc: state.tcc,
    stickers: state.stickers,
    sessions: state.sessions,
    streakData: state.streakData,
    reminder: state.reminder,
    looseNotes: state.looseNotes,
    savedBookIds: state.savedBookIds,
    bookmarkedCourseIds: state.bookmarkedCourseIds,
    readingProgress: state.readingProgress ?? {},
    questions: state.questions,
    techniques: state.techniques,
    quizSessions: state.quizSessions,
    onboarding: state.onboarding,
  };
}

/** Payload de dados do backup (exclui os bancos estáticos — decisão documentada). */
export function buildBackupData(state: PersistedStateSnapshot): Record<string, unknown> {
  const db = readDatabaseFromState(state);
  const { approaches: _approaches, questions: _questions, ...userData } = db;
  return userData;
}

/**
 * Banco "zerado" de referência para comparação em testes/round-trip.
 * Atalho para `emptyDatabase()` (inclui onboarding `{completed:false}` e
 * `quizSessions: []`).
 */
export function resetDatabase(): PersistedDatabase {
  return emptyDatabase();
}