/**
 * Defaults de "começar vazio" (produção).
 *
 * O app nasce sem dados de demonstração: o primeiro acesso passa pelo onboarding,
 * e a usuária constrói tudo do zero (ou carrega os exemplos — ver `seeds.ts`).
 */
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
  DailyMoodData,
  MoodEntry,
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
  avatarMood: '',
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

export const emptyCurrentMood: DailyMoodData = {
  emoji: '',
  label: '',
  energyLevel: 3,
  vibeColor: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
  reflection: '',
  intention: '',
  updatedAt: '',
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
  currentMood: DailyMoodData;
  streakData: StreakData;
  reminder: { enabled: boolean; time: string };
  looseNotes: unknown[];
  savedBookIds: string[];
  bookmarkedCourseIds: string[];
  moodHistory: MoodEntry[];
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
    stickers: [],
    sessions: [],
    currentMood: emptyCurrentMood,
    streakData: emptyStreakData,
    reminder: emptyReminder,
    looseNotes: [],
    savedBookIds: [],
    bookmarkedCourseIds: [],
    moodHistory: [],
    questions: [],
    techniques: [],
    onboarding: emptyOnboarding,
    readingProgress: {},
  };
}