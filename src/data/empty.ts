/**
 * Defaults de "começar vazio" (produção).
 *
 * O app nasce sem dados de demonstração: o primeiro acesso passa pelo onboarding,
 * e a usuária constrói tudo do zero (ou carrega os exemplos — ver `seeds.ts`).
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
} from '../types';

export const emptyProfile: UserProfile = {
  name: '',
  semester: 1,
  totalSemesters: 8,
  university: '',
  targetCareer: '',
  dailyQuote: '',
  stickersCollected: 0,
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
  readingProgress: Record<string, number>;
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
    readingProgress: {},
  };
}