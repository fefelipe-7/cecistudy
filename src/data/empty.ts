/**
 * Defaults de "começar vazio" (produção) + contrato do banco persistido
 * (`EmptyDatabase`): usado no boot, no reset, no import de backup e no merge
 * de sincronização. O app nasce sem dados de demonstração: o primeiro acesso
 * passa pelo onboarding e a usuária constrói tudo do zero. Catálogos estáticos
 * (abordagens/questões/templo) NÃO vivem aqui — são semeados em runtime a
 * partir do acervo (`lib/bootPreload.ts` / `templeData.ts`).
 */
import { lockedStickerCatalog } from './stickerCatalog';
import {
  Course,
  ClassNote,
  Task,
  Exam,
  PsychologyAuthor,
  PsychologyConcept,
  PsychologyApproach,
  ReadingItem,
  Flashcard,
  FlashcardDeck,
  MaterialItem,
  InternshipLog,
  TccData,
  Sticker,
  UserProfile,
  StudySession,
  StreakData,
  StudyQuestion,
  Technique,
  OnboardingState,
  QuizSession,
  SyncIndex,
} from '../types';
import { emptySyncIndex } from '../lib/sync/stamp';

export const emptyProfile: UserProfile = {
  name: '',
  semester: 1,
  totalSemesters: 8,
  university: '',
  targetCareer: '',
  dailyQuote: '',
  stickersCollected: 0,
  categoryXp: { faculdade: 0, estudo: 0, leituras: 0, jornada: 0 },
  photoUrl: '',
};

export const emptyTcc: TccData = {
  title: '',
  advisor: '',
  field: '',
  problemStatement: '',
  objectives: [],
  status: 'em_andamento',
  chapters: [],
  references: [],
};

export const emptyStreakData: StreakData = { activeDays: [] };

export const emptyReminder = { enabled: false, time: '19:00' as string };

export const emptyOnboarding: OnboardingState = { completed: false };

export interface EmptyDatabase {
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
  decks: FlashcardDeck[];
  materials: MaterialItem[];
  internshipLogs: InternshipLog[];
  tcc: TccData;
   stickers: Sticker[];
   sessions: StudySession[];
   streakData: StreakData;
   reminder: { enabled: boolean; time: string };
   looseNotes: unknown[];
   savedBookIds: string[];
   bookmarkedCourseIds: string[];
   questions: StudyQuestion[];
   techniques: Technique[];
   onboarding: OnboardingState;
   quizSessions: QuizSession[];
   readingProgress: Record<string, number>;
  /** Carimbos de alteração p/ sincronização entre dispositivos (Fase Sync). */
  syncIndex: SyncIndex;
}

export function emptyDatabase(): EmptyDatabase {
  return {
    profile: emptyProfile,
    courses: [],
    classes: [],
    tasks: [],
    exams: [],
    authors: [],
    concepts: [],
    approaches: [],
    readings: [],
    flashcards: [],
    decks: [],
    materials: [],
    internshipLogs: [],
    tcc: emptyTcc,
stickers: lockedStickerCatalog(),
   sessions: [],
    streakData: emptyStreakData,
    reminder: emptyReminder,
    looseNotes: [],
    savedBookIds: [],
    bookmarkedCourseIds: [],
    questions: [],
    techniques: [],
    onboarding: emptyOnboarding,
    quizSessions: [],
    readingProgress: {},
    syncIndex: emptySyncIndex(),
  };
}