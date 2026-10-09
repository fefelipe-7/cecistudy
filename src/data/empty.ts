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
  ThesisProject,
  ThesisChapter,
  ThesisReference,
  ThesisMeeting,
  ThesisTask,
  ThesisWritingLog,
  Sticker,
  UserProfile,
  StudySession,
  StreakData,
  StudyQuestion,
  Technique,
  OnboardingState,
  QuizSession,
  SyncIndex,
  AcademicTerm,
  ReadingSession,
  ReadingHighlight,
  ReadingBookmark,
} from '../types';
import { emptySyncIndex } from '../lib/sync/stamp';
import { DEFAULT_TOTAL_SEMESTERS } from '../data/schema';
import { emptyThesis } from '@cecistudy/domain';

export const emptyProfile: UserProfile = {
  name: '',
  semester: 1,
  // 10 semestres é o padrão de Psi no Brasil (SPEC-006 D9). Editável no Perfil
  // com clamp `1..12`, então este é o default certo, não um valor fixo.
  totalSemesters: DEFAULT_TOTAL_SEMESTERS,
  university: '',
  targetCareer: '',
  dailyQuote: '',
  stickersCollected: 0,
  categoryXp: { faculdade: 0, estudo: 0, leituras: 0, jornada: 0 },
  photoUrl: '',
};

// SPEC-012: o singleton emagrecece — sem `chapters`/`references` (viraram
// coleções), **sem metas** (INV-T7: ela define; `wordGoalTotal`/`weeklyWordGoal`
// ausentes, não zero) e **sem nada semeado** (INV-T6: registro livre, Q7).
// A factory do domínio é a fonte única (`emptyThesis`, `thesis.ts`).
export const emptyTcc: ThesisProject = emptyThesis();

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
  tcc: ThesisProject;
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
   /** Períodos letivos (SPEC-005). O seed é `[]`: o período ativo é garantido
    *  no boot (`ensureActiveTerm`), não no seed — assim o golden `empty` segue
    *  determinístico e não carrega um período fictício para o app de 1ª vez. */
   academicTerms: AcademicTerm[];
    /** Leitura (SPEC-M-014): sessões, destaques e marcadores. */
    readingSessions: ReadingSession[];
    readingHighlights: ReadingHighlight[];
    readingBookmarks: ReadingBookmark[];
    readingProgress: Record<string, number>;
    /** TCC (SPEC-012): capítulos, referências, reuniões, pendências, escrita.
     *  Seeds `[]` — nada semeado (INV-T6), metas ausentes (INV-T7). */
    thesisChapters: ThesisChapter[];
    thesisReferences: ThesisReference[];
    thesisMeetings: ThesisMeeting[];
    thesisTasks: ThesisTask[];
    thesisWritingLogs: ThesisWritingLog[];
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
    academicTerms: [],
    readingSessions: [],
    readingHighlights: [],
    readingBookmarks: [],
    readingProgress: {},
    thesisChapters: [],
    thesisReferences: [],
    thesisMeetings: [],
    thesisTasks: [],
    thesisWritingLogs: [],
    syncIndex: emptySyncIndex(),
  };
}