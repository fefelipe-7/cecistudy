import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  NavTab,
  NavScreen,
  SubTabFaculdade,
  SubTabEstudos,
  SubTabBiblioteca,
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
  DynamicHeaderConfig,
  StreakData,
  WizardFlow,
  StudyQuestion,
  Technique,
  PsicoterapiaFamily,
  OnboardingState,
  QuizConfig,
  QuizAnswer,
  QuizSession,
  QuizPlayState,
  LooseNote,
  NoteTargetType,
  StudyScreen,
  ManagedItem,
  ManagedItemKind,
  SyncIndex,
  TempleSection
} from '../types';
import {
  emptyProfile,
  emptyTcc,
  emptyStreakData,
  emptyReminder,
  emptyOnboarding,
  emptyDatabase
} from '../data/empty';
import { PSICOTERAPIA_FAMILIES } from '../data/psicoterapiaFamilies';
import { demoDatabase } from '../data/seeds';
import { exportAppDatabase, importAppDatabase, buildBackupPayload } from '../lib/exportImport';
import { usePersistentState } from '../lib/usePersistentState';
import { useSqliteState } from '../lib/useSqliteState';
import { useStampedState } from '../lib/useStampedState';
import { emptySyncIndex } from '../lib/sync/stamp';
import { storage, isNativePlatform } from '../lib/storage';
import { getUserDb, clearUserData } from '../lib/db/userDb';
import { getCatalogQuestions } from '../lib/db/catalogDb';
import { ensureApproaches, ensureQuestions } from '../lib/bootPreload';
import { hapticTap, hapticSuccess } from '../lib/haptics';
import { scrollToTop } from '../lib/scroll';
import { celebrate } from '../lib/celebrate';
import { shouldCelebrateTasks } from '../lib/taskLogic';
import { parseLegacySchedule } from '../lib/schedule';
import { scheduleDailyReminder, cancelDailyReminder, syncClassReminders, cancelClassReminders } from '../lib/notifications';
import { connectGcal, disconnectGcal, syncExam, syncTask, unsyncEvent, isGcalConfigured } from '../lib/gcal';
import {
  Route,
  parseRoute,
  routeToStack,
  stackToHash
} from '../lib/routing';
import {
  stackAfterOpenQuizCategory,
  stackAfterOpenQuizLoading,
  stackAfterOpenQuizPlay,
  stackAfterOpenQuizResult,
  stackAfterCloseQuizResult,
  stackAfterCloseAllQuizScreens,
  stackAfterNewQuizFromResult,
} from '../lib/quizStack';
import { buildHeaderConfig } from '../lib/headerConfig';
import { computeStreak, getWeekProgress, isStudyDay, toDateKey, StreakStats, WeekDayCell } from '../lib/streak';
import { applyStickerUnlocks, mergeCatalogWithProgress, countUnlocked } from '../lib/stickers';
import { lockedStickerCatalog } from '../data/stickerCatalog';
import { deleteManagedItem as applyDelete, MANAGED_KIND_REMOVED, ManagedDB } from '../lib/entityOps';


export interface ReminderSettings {
  enabled: boolean;
  time: string; // "HH:MM"
}

export interface AppContextValue {
  // data
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
  questions: StudyQuestion[];
  techniques: Technique[];
  quizSessions: QuizSession[];
  savedBookIds: string[];
  toggleSaveBook: (bookId: string) => void;
  readingProgress: Record<string, number>;
  updateReadingProgress: (bookId: string, readPages: number) => void;
  reminderSettings: ReminderSettings;
  updateReminder: (settings: ReminderSettings) => void;
  gcalEnabled: boolean;
  setGcalEnabled: (on: boolean) => Promise<boolean>;

  // onboarding / ciclo de vida dos dados
  onboarding: OnboardingState;
  completeOnboarding: (profile: Partial<UserProfile>, loadDemo: boolean) => void;
  loadDemoData: () => void;
  resetApp: () => void;
  exportData: () => void;
  importData: (json: string) => void;

  // streak de estudos
  streakData: StreakData;
  streakStats: StreakStats;
  currentWeekProgress: WeekDayCell[];

  // navigation state
  activeTab: NavTab;
  screenKey: string;
  /** Chave da camada de slide horizontal (base + auxiliares de 1º nível). */
  slideKey: string;
  /** Chave da camada overlay (fade+scale) — vazia quando não há overlay. */
  overlayKey: string;
  navDirection: 0 | 1 | -1;
  navigationStack: NavScreen[];
  setStack: (next: NavScreen[]) => void;
  syncHash: (stack: NavScreen[]) => void;
  /** Volta um nível (modais → telas auxiliares → pop da pilha). Retorna true se algo fechou. */
  handleSystemBack: () => boolean;
  setActiveTab: (tab: NavTab) => void;
  subTabFaculdade: SubTabFaculdade;
  setSubTabFaculdade: (t: SubTabFaculdade) => void;
  subTabEstudos: SubTabEstudos;
  setSubTabEstudos: (t: SubTabEstudos) => void;
  subTabBiblioteca: SubTabBiblioteca;
  setSubTabBiblioteca: (t: SubTabBiblioteca) => void;
  focusedStudyScreen: StudyScreen | null;
  openStudy: (screen: StudyScreen) => void;
  closeStudy: () => void;
  targetId: string | undefined;
  setTargetId: (id: string | undefined) => void;
  focusedCourseId: string | null;
  setFocusedCourseId: (id: string | null) => void;
  focusedCourse: Course | undefined;
  openCourseDetail: (courseId: string) => void;
  closeCourseDetail: () => void;
  isBottomNavVisible: boolean;
  /** Base da pilha é uma tab — mantém o padding inferior do main estável durante push/pop. */
  hasTabBase: boolean;
  /** Se existe algo para voltar (cadeia do back do Android / gesto de borda). */
  canGoBack: boolean;
  isNotesScreenOpen: boolean;
  openNotesScreen: () => void;
  closeNotesScreen: () => void;
  isTempleScreenOpen: boolean;
  openTemple: () => void;
  closeTemple: () => void;
  /** Seção interna do templo aberta (conceitos/autores/técnicas) ou null. */
  focusedTempleSection: TempleSection | null;
  openTempleSection: (section: TempleSection) => void;
  closeTempleSection: () => void;
  isFamiliesScreenOpen: boolean;
  openFamilies: () => void;
  closeFamilies: () => void;
  focusedFamilyId: string | null;
  focusedFamily: PsicoterapiaFamily | undefined;
  openFamily: (familyId: string) => void;
  closeFamily: () => void;
  focusedApproachId: string | null;
  focusedApproach: PsychologyApproach | undefined;
  openApproach: (approachId: string) => void;
  closeApproach: () => void;
  bookmarkedCourseIds: string[];
  toggleBookmarkCourse: (id: string) => void;

  // notas avulsas (persistidas globalmente)
  looseNotes: LooseNote[];
  addLooseNote: (note: LooseNote) => void;
  deleteLooseNote: (id: string) => void;
  updateLooseNote: (id: string, patch: Partial<LooseNote>) => void;

  // detalhe / transformação de nota avulsa (tela estilo wizard)
  isNoteDetailOpen: boolean;
  isNoteTransformOpen: boolean;
  focusedNoteId: string | null;
  focusedNote: LooseNote | undefined;
  openNoteDetail: (noteId: string) => void;
  closeNoteDetail: () => void;
  openNoteTransform: (noteId: string) => void;
  closeNoteTransform: () => void;
  /** Volta direto para a lista de notas (após uma transformação concluída). */
  closeAllNoteScreens: () => void;

  // composição de nota (tela de captura rápida)
  isComposeScreenOpen: boolean;
  composeCourseId: string | undefined;
  openCompose: (courseId?: string) => void;
  closeCompose: () => void;

  // wizard de detalhes da aula
  isComposeDetailsOpen: boolean;
  wizardNoteId: string | null;
  openComposeDetails: (noteId: string) => void;
  closeComposeDetails: () => void;

  // wizards de criação em tela cheia (conceito, flashcard, prova, atividade…)
  isWizardOpen: boolean;
  currentWizardType: WizardFlow | null;
  wizardCourseId: string | undefined;
  openWizard: (type: WizardFlow, courseId?: string) => void;
  openTaskExamWizard: () => void;
  closeWizard: () => void;

  // menu universal de editar/excluir (long-press / clique direito)
  managedItem: ManagedItem | null;
  openManageItem: (kind: ManagedItemKind, id: string) => void;
  closeManageItem: () => void;
  deleteManagedItem: (kind: ManagedItemKind, id: string) => void;
  editManagedItem: (kind: ManagedItemKind, id: string) => void;

  // item em edição nos wizards (payload fora da URL, igual `wizardNoteId`)
  wizardEdit: ManagedItem | null;

  // prompt "quer dar mais detalhes?" após salvar uma aula
  isDetailPromptOpen: boolean;
  detailNoteId: string | null;
  openDetailPrompt: (noteId: string) => void;
  closeDetailPrompt: () => void;

  // modais / telas auxiliares
  isStreakScreenOpen: boolean;
  openStreak: () => void;
  closeStreak: () => void;
  isInternshipDiaryOpen: boolean;
  openInternshipDiary: () => void;
  closeInternshipDiary: () => void;
  isTccScreenOpen: boolean;
  openTccScreen: () => void;
  closeTccScreen: () => void;
  isStickersScreenOpen: boolean;
  openStickersScreen: () => void;
  closeStickersScreen: () => void;
  /** Sincronização entre dispositivos (pareamento P2P). */
  isSyncScreenOpen: boolean;
  openSyncScreen: () => void;
  closeSyncScreen: () => void;
  /** Snapshot local (JSON do payload de backup v2) para o transporte de sync. */
  getSyncPayloadJson: () => Promise<string>;
  /** Aplica o banco mesclado pela sincronização (sem re-carimbar). */
  applySyncedDatabase: (db: ReturnType<typeof emptyDatabase>) => void;
  isQuizCategoryOpen: boolean;
  openQuizCategory: (config?: Partial<QuizConfig>) => void;
  closeQuizCategory: () => void;
  isQuizLoadingOpen: boolean;
  currentQuizLoadingConfig: QuizConfig | null;
  openQuizLoading: (config: QuizConfig) => void;
  closeQuizLoading: () => void;
  /** Garante que o banco de questões esteja carregado em memória (retorna o banco). */
  ensureQuestionsLoaded: () => Promise<StudyQuestion[]>;
  isQuizPlayOpen: boolean;
  openQuizPlay: (pool: StudyQuestion[], config: QuizConfig) => void;
  closeQuizPlay: () => void;
  isQuizResultOpen: boolean;
  openQuizResult: (answers: QuizAnswer[], config: QuizConfig, startTime: number, correctCount: number, totalCount: number) => void;
  closeQuizResult: () => void;
  updateQuizPlayState: (updates: Partial<QuizPlayState>) => void;
  closeAllQuizScreens: () => void;
  newQuizFromResult: () => void;
  isQuickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  isEditCourseOpen: boolean;
  editCourseId: string | null;
  openEditCourse: (courseId?: string) => void;
  closeEditCourse: () => void;
  isEditTccOpen: boolean;
  openEditTcc: () => void;
  closeEditTcc: () => void;
  isCreatingLooseNote: boolean;
  setIsCreatingLooseNote: (v: boolean) => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toast: string | null;
  showToast: (message: string) => void;

  // actions
  handleNavigate: (tab: NavTab, subTab?: string, target?: string) => void;
  handleToggleTask: (taskId: string) => void;
  handleToggleExam: (examId: string) => void;
  handleAddTask: (task: Task) => void;
  handleUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  handleAddClassNote: (note: ClassNote) => void;
  handleUpdateClassNote: (note: ClassNote) => void;
  handleAddConcept: (concept: PsychologyConcept) => void;
  handleAddMaterial: (material: MaterialItem) => void;
  handleAddReading: (reading: ReadingItem) => void;
  handleUpdateReadingPages: (readingId: string, newPages: number) => void;
  handleAddFlashcard: (card: Flashcard) => void;
  handleReviewFlashcard: (id: string, correct: boolean) => void;
  handleAddInternshipLog: (log: InternshipLog) => void;
  addSupervision: (entry: SupervisionNotebook) => void;
  updateSupervision: (entry: SupervisionNotebook) => void;
  deleteSupervision: (id: string) => void;
  handleAddExam: (exam: Exam) => void;
  handleAddCourse: (course: Course) => void;
  handleAddAuthor: (author: PsychologyAuthor) => void;
  handleAddSession: (session: StudySession) => void;
  handleAddTechnique: (technique: Technique) => void;
  handleUpdateReadingChapters: (readingId: string, chapters: ReadingItem['chapters']) => void;
  handleUpdateProfile: (updated: Partial<UserProfile>) => void;
  handleUpdateTcc: (updated: TccData) => void;
  handleUpdateCourse: (updated: Course) => void;
  handleUpdateExam: (exam: Exam) => void;
  handleUpdateReading: (reading: ReadingItem) => void;
  handleUpdateFlashcard: (card: Flashcard) => void;
  handleUpdateSession: (session: StudySession) => void;
  handleUpdateInternshipLog: (log: InternshipLog) => void;
  handleUpdateAuthor: (author: PsychologyAuthor) => void;
  handleUpdateConcept: (concept: PsychologyConcept) => void;
  handleUpdateMaterial: (material: MaterialItem) => void;
  handleSaveQuizSession: (session: QuizSession) => void;

  // Quiz helpers (extraídos da pilha de navegação)
  currentQuizPlayState: QuizPlayState | null;
  currentQuizResultAnswers: QuizAnswer[] | null;
  currentQuizResultConfig: QuizConfig | null;
  currentQuizResultStartTime: number | null;
  currentQuizResultCorrectCount: number | null;
  currentQuizResultTotalCount: number | null;
  currentQuizResultPool: StudyQuestion[] | null;

  // header
  headerConfig: DynamicHeaderConfig | null;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // State — defaults vazios (produção); dados de exemplo entram via onboarding/demo
  // Domínio persiste via useSqliteState: web = localStorage (intacto), nativo = SQLite.
  // Coleções de domínio usam `useStampedState`: além do valor, mantém o SyncIndex
  // (carimbos por coleção/registro + tombstones) p/ sincronização entre dispositivos.
  const [syncIndex, setSyncIndex] = useSqliteState<SyncIndex>('syncIndex', emptySyncIndex());
  const { value: profile, set: setProfile, setRaw: setProfileRaw } = useStampedState<UserProfile>('profile', emptyProfile, syncIndex, setSyncIndex);
  const { value: courses, set: setCourses, setRaw: setCoursesRaw } = useStampedState<Course[]>('courses', [], syncIndex, setSyncIndex);

  // normaliza schedule legado (string) persistido por versões anteriores à v9
  useEffect(() => {
    setCourses((prev) =>
      prev.every((c) => Array.isArray(c.schedule))
        ? prev
        : prev.map((c) => (Array.isArray(c.schedule) ? c : { ...c, schedule: parseLegacySchedule(c.schedule) }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { value: classes, set: setClasses, setRaw: setClassesRaw } = useStampedState<ClassNote[]>('classes', [], syncIndex, setSyncIndex);
  const { value: tasks, set: setTasks, setRaw: setTasksRaw } = useStampedState<Task[]>('tasks', [], syncIndex, setSyncIndex);
  const { value: exams, set: setExams, setRaw: setExamsRaw } = useStampedState<Exam[]>('exams', [], syncIndex, setSyncIndex);
  const { value: authors, set: setAuthors, setRaw: setAuthorsRaw } = useStampedState<PsychologyAuthor[]>('authors', [], syncIndex, setSyncIndex);
  const { value: concepts, set: setConcepts, setRaw: setConceptsRaw } = useStampedState<PsychologyConcept[]>('concepts', [], syncIndex, setSyncIndex);
  // Abordagens (97, ~1MB): banco estático do catálogo — NÃO é dado da usuária.
  // Web: seed lazy do módulo embutido. Nativo: lido do catálogo SQLite.
  // Fonte única via bootPreload: se a splash já carregou, reaproveita a promise.
  const [approaches, setApproaches] = useState<PsychologyApproach[]>([]);
  const approachesSeededRef = useRef(false);
  useEffect(() => {
    if (approachesSeededRef.current || approaches.length > 0) return;
    let cancelled = false;
    ensureApproaches<PsychologyApproach>()
      .then((data) => {
        if (cancelled || data.length === 0) return;
        approachesSeededRef.current = true;
        setApproaches(data);
      })
      .catch(() => {
        approachesSeededRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [approaches.length]);

  const { value: readings, set: setReadings, setRaw: setReadingsRaw } = useStampedState<ReadingItem[]>('readings', [], syncIndex, setSyncIndex);
  const { value: flashcards, set: setFlashcards, setRaw: setFlashcardsRaw } = useStampedState<Flashcard[]>('flashcards', [], syncIndex, setSyncIndex);
  const { value: materials, set: setMaterials, setRaw: setMaterialsRaw } = useStampedState<MaterialItem[]>('materials', [], syncIndex, setSyncIndex);
  const { value: internshipLogs, set: setInternshipLogs, setRaw: setInternshipLogsRaw } = useStampedState<InternshipLog[]>('internship', [], syncIndex, setSyncIndex);
  const { value: supervision, set: setSupervision, setRaw: setSupervisionRaw } = useStampedState<SupervisionNotebook[]>('supervision', [], syncIndex, setSyncIndex);
  const { value: tcc, set: setTcc, setRaw: setTccRaw } = useStampedState<TccData>('tcc', emptyTcc, syncIndex, setSyncIndex);
  const { value: stickers, set: setStickers, setRaw: setStickersRaw } = useStampedState<Sticker[]>('stickers', lockedStickerCatalog(), syncIndex, setSyncIndex);
  const { value: sessions, set: setSessions, setRaw: setSessionsRaw } = useStampedState<StudySession[]>('sessions', [], syncIndex, setSyncIndex);
  const { value: techniques, set: setTechniques, setRaw: setTechniquesRaw } = useStampedState<Technique[]>('techniques', [], syncIndex, setSyncIndex);
  const { value: quizSessions, set: setQuizSessions, setRaw: setQuizSessionsRaw } = useStampedState<QuizSession[]>('quizSessions', [], syncIndex, setSyncIndex);

  // Questões (745): banco estático do catálogo — mesmo tratamento de abordagens.
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const questionsSeededRef = useRef(false);
  useEffect(() => {
    if (questionsSeededRef.current || questions.length > 0) return;
    let cancelled = false;
    ensureQuestions<StudyQuestion>()
      .then((data) => {
        if (cancelled || data.length === 0) return;
        questionsSeededRef.current = true;
        setQuestions(data);
      })
      .catch(() => {
        questionsSeededRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [questions.length]);

  // Streak de estudos (dias ativos; derivados calculados abaixo)
  const { value: streakData, set: setStreakData, setRaw: setStreakDataRaw } = useStampedState<StreakData>('streakData', emptyStreakData, syncIndex, setSyncIndex);

  // Lembrete diário de estudo (só efetivo no app nativo)
  const [reminderSettings, setReminderSettings] = usePersistentState<ReminderSettings>('reminder', emptyReminder);

  // Integração com Google Calendar (apenas provas e tarefas; toggle próprio)
  const [gcalEnabled, setGcalEnabledState] = usePersistentState<boolean>('gcalEnabled', false);
  const [gcalMap, setGcalMap] = usePersistentState<Record<string, string>>('gcalMap', {});

  // Onboarding (primeiro acesso)
  const [onboarding, setOnboarding] = usePersistentState<OnboardingState>('onboarding', emptyOnboarding);

  // Livros salvos da biblioteca (no contexto → entram no export/import)
  const { value: savedBookIds, set: setSavedBookIds, setRaw: setSavedBookIdsRaw } = useStampedState<string[]>('savedBookIds', [], syncIndex, setSyncIndex);

  // Progresso de leitura por obra (id → páginas lidas), registrado no modal do livro
  const { value: readingProgress, set: setReadingProgress, setRaw: setReadingProgressRaw } = useStampedState<Record<string, number>>(
    'readingProgress',
    {},
    syncIndex,
    setSyncIndex
  );

  // Navigation state — pilha nativa (push/pop)
  const [navigationStack, setNavigationStack] = useState<NavScreen[]>([{ kind: 'tab', tab: 'home' }]);
  const [navDirection, setNavDirection] = useState<0 | 1 | -1>(0);
  const navigationStackRef = useRef<NavScreen[]>(navigationStack);

  /** Atualiza a pilha e deriva a direção da transição (push=1, pop=-1, troca=0). */
  const setStack = useCallback((next: NavScreen[]) => {
    const prev = navigationStackRef.current;
    const dir = next.length > prev.length ? 1 : next.length < prev.length ? -1 : 0;
    setNavDirection(dir);
    setNavigationStack(next);
    navigationStackRef.current = next;
  }, []);
  const [subTabFaculdade, setSubTabFaculdade] = useState<SubTabFaculdade>('disciplinas');
  const [subTabEstudos, setSubTabEstudos] = useState<SubTabEstudos>('sessoes');
  const [subTabBiblioteca, setSubTabBiblioteca] = useState<SubTabBiblioteca>('autores');
  const [targetId, setTargetId] = useState<string | undefined>(undefined);
  const { value: bookmarkedCourseIds, set: setBookmarkedCourseIds, setRaw: setBookmarkedCourseIdsRaw } = useStampedState<string[]>('bookmarkedCourseIds', [], syncIndex, setSyncIndex);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isEditTccOpen, setIsEditTccOpen] = useState(false);
  const [isCreatingLooseNote, setIsCreatingLooseNote] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Menu universal de editar/excluir (aberto por long-press no card)
  const [managedItem, setManagedItem] = useState<ManagedItem | null>(null);
  // Matéria em edição no EditCourseModal (payload fora da URL)
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  // Entidade em edição nos wizards (payload fora da URL, igual wizardNoteId)
  const [wizardEdit, setWizardEdit] = useState<ManagedItem | null>(null);

  // Notas avulsas (global — a tela de composição salva fora da biblioteca)
  const { value: looseNotes, set: setLooseNotes, setRaw: setLooseNotesRaw } = useStampedState<LooseNote[]>('looseNotes', [], syncIndex, setSyncIndex);

  // Composição de nota (tela de captura rápida)
  const [composeCourseId, setComposeCourseId] = useState<string | undefined>(undefined);

  // Curso pré-selecionado nos wizards (ex.: aberto a partir de uma disciplina)
  const [wizardCourseId, setWizardCourseId] = useState<string | undefined>(undefined);

  // Wizard de detalhes da aula
  const [wizardNoteId, setWizardNoteId] = useState<string | null>(null);

  // Prompt "quer dar mais detalhes?" após salvar uma aula
  const [isDetailPromptOpen, setIsDetailPromptOpen] = useState(false);
  const [detailNoteId, setDetailNoteId] = useState<string | null>(null);

  // Telas derivadas do topo da pilha
  const currentScreen = navigationStack[navigationStack.length - 1];
  const activeTab: NavTab =
    currentScreen.kind === 'tab' ? currentScreen.tab : navigationStack[0].kind === 'tab' ? navigationStack[0].tab : 'home';
  const isStreakScreenOpen = currentScreen.kind === 'streak';
  const isInternshipDiaryOpen = currentScreen.kind === 'internshipDiary';
  const isTccScreenOpen = currentScreen.kind === 'tcc';
  const isStickersScreenOpen = currentScreen.kind === 'stickers';
  const isSyncScreenOpen = currentScreen.kind === 'sync';
  const isNotesScreenOpen = currentScreen.kind === 'notes';
  const isNoteDetailOpen = currentScreen.kind === 'noteDetail';
  const isNoteTransformOpen = currentScreen.kind === 'noteTransform';
  const focusedNoteId =
    currentScreen.kind === 'noteDetail' || currentScreen.kind === 'noteTransform'
      ? currentScreen.noteId
      : null;
  const focusedNote = focusedNoteId ? looseNotes.find((n) => n.id === focusedNoteId) : undefined;
  const isTempleScreenOpen = currentScreen.kind === 'temple';
  const focusedTempleSection = currentScreen.kind === 'templeSection' ? currentScreen.section : null;
  const isFamiliesScreenOpen = currentScreen.kind === 'families';
  const focusedFamilyId = currentScreen.kind === 'family' ? currentScreen.familyId : null;
  const focusedApproachId = currentScreen.kind === 'approach' ? currentScreen.approachId : null;
  const focusedApproach = focusedApproachId ? approaches.find((a) => a.id === focusedApproachId) : undefined;
  const focusedFamily = focusedFamilyId ? PSICOTERAPIA_FAMILIES.find((f) => f.id === focusedFamilyId) : undefined;
  const isBottomNavVisible = currentScreen.kind === 'tab';
  /** Base da pilha é uma tab: o padding da shell não muda ao empilhar/desempilhar telas
      auxiliares dentro da mesma aba (evita drift vertical no meio da transição). */
  const hasTabBase = navigationStack[0]?.kind === 'tab';
  const isComposeScreenOpen = currentScreen.kind === 'compose';
  const isComposeDetailsOpen = currentScreen.kind === 'composeDetails';
  const isWizardOpen = currentScreen.kind === 'wizard';
  const currentWizardType: WizardFlow | null = currentScreen.kind === 'wizard' ? currentScreen.type : null;
  const isQuizCategoryOpen = currentScreen.kind === 'quiz-category';
  const isQuizLoadingOpen = currentScreen.kind === 'quiz-loading';
  const currentQuizLoadingConfig = currentScreen.kind === 'quiz-loading' ? currentScreen.config : null;
  const isQuizPlayOpen = currentScreen.kind === 'quiz-play';
  const isQuizResultOpen = currentScreen.kind === 'quiz-result';
  const currentQuizPlayState = (currentScreen.kind === 'quiz-play' ? currentScreen.state : null) ?? null;
  const currentQuizResultAnswers = (currentScreen.kind === 'quiz-result' ? currentScreen.answers : null) ?? null;
  const currentQuizResultConfig = (currentScreen.kind === 'quiz-result' ? currentScreen.config : null) ?? null;
  const currentQuizResultStartTime = (currentScreen.kind === 'quiz-result' ? currentScreen.startTime : null) ?? null;
  const currentQuizResultCorrectCount = (currentScreen.kind === 'quiz-result' ? currentScreen.correctCount : null) ?? null;
  const currentQuizResultTotalCount = (currentScreen.kind === 'quiz-result' ? currentScreen.totalCount : null) ?? null;
  const currentQuizResultPool =
    (currentScreen.kind === 'quiz-result'
      ? currentScreen.pool
      : (navigationStack.find((s) => s.kind === 'quiz-play') as Extract<NavScreen, { kind: 'quiz-play' }> | undefined)?.state.pool ?? null) ?? null;
  const focusedCourseId = currentScreen.kind === 'course' ? currentScreen.courseId : null;
  const focusedCourse = focusedCourseId ? courses.find((c) => c.id === focusedCourseId) : undefined;
  const focusedStudyScreen: StudyScreen | null =
    currentScreen.kind === 'study' ? currentScreen.screen : null;

  // Flashcards vencidos (dias desde a última revisão >= intervalo da repetição espaçada)
  const dueCardsCount = useMemo(() => {
    const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
    const intervalFor = (timesReviewed = 0) =>
      REVIEW_INTERVALS[Math.min(timesReviewed, REVIEW_INTERVALS.length - 1)];
    const toISODate = (d: Date) => d.toISOString().split('T')[0];
    const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return flashcards.filter(
      (c) => !c.lastReviewed || daysSince(c.lastReviewed) >= intervalFor(c.timesReviewed)
    ).length;
  }, [flashcards]);
  const screenKey =
    currentScreen.kind === 'tab'
      ? `tab-${currentScreen.tab}`
      : currentScreen.kind === 'course'
        ? `course-${currentScreen.courseId}`
        : currentScreen.kind === 'notes'
          ? 'notes'
          : currentScreen.kind === 'temple'
            ? 'temple'
            : currentScreen.kind === 'families'
              ? 'families'
              : currentScreen.kind === 'family'
                ? `family-${currentScreen.familyId}`
                : currentScreen.kind === 'approach'
                  ? `approach-${currentScreen.approachId}`
                  : currentScreen.kind === 'compose'
                    ? 'compose'
                    : currentScreen.kind === 'composeDetails'
                      ? 'composeDetails'
                      : currentScreen.kind === 'wizard'
                        ? `wizard-${currentScreen.type}`
                        : currentScreen.kind === 'streak'
                          ? 'streak'
                          : currentScreen.kind === 'internshipDiary'
                            ? 'internshipDiary'
                            : currentScreen.kind === 'tcc'
                              ? 'tcc'
: currentScreen.kind === 'stickers'
                          ? 'stickers'
                          : currentScreen.kind === 'sync'
                            ? 'sync'
                            : currentScreen.kind === 'study'
                              ? `study-${currentScreen.screen}`
                              : currentScreen.kind === 'quiz-loading'
                                ? 'quiz-loading'
                                : 'tab-home';

  /**
   * Chave da camada de slide horizontal (pilha).
   * Inclui a base (tab/curso) e os auxiliares de primeiro nível
   * (notes, temple, streak) que aparecem com slide.
   * Telas em camadas mais profundas (compose, composeDetails, wizard)
   * usam uma camada separada de fade+scale — ficam fora desta key.
   */
  const slideKey =
    currentScreen.kind === 'tab'
      ? `tab-${currentScreen.tab}`
      : currentScreen.kind === 'course'
        ? `course-${currentScreen.courseId}`
        : currentScreen.kind === 'notes'
          ? 'notes'
          : currentScreen.kind === 'noteDetail' || currentScreen.kind === 'noteTransform'
            ? 'notes'
          : currentScreen.kind === 'temple'
            ? 'temple'
            : currentScreen.kind === 'templeSection'
              ? `temple-${currentScreen.section}`
              : currentScreen.kind === 'families'
              ? 'families'
              : currentScreen.kind === 'family'
                ? `family-${currentScreen.familyId}`
                : currentScreen.kind === 'approach'
                  ? `approach-${currentScreen.approachId}`
                  : currentScreen.kind === 'streak'
                    ? 'streak'
                    : currentScreen.kind === 'internshipDiary'
                      ? 'internshipDiary'
                      : currentScreen.kind === 'tcc'
                        ? 'tcc'
                        : currentScreen.kind === 'stickers'
                          ? 'stickers'
                          : currentScreen.kind === 'sync'
                            ? 'sync'
                            : currentScreen.kind === 'study'
                              ? `study-${currentScreen.screen}`
                              : currentScreen.kind === 'quiz-loading'
                                ? 'quiz-loading'
                                : navigationStack[0]?.kind === 'tab'
                                  ? `tab-${navigationStack[0].tab}`
                                  : navigationStack[0]?.kind === 'course'
                                    ? `course-${navigationStack[0].courseId}`
                                    : 'tab-home';

  /**
   * Chave da camada overlay (fade+scale).
   * Só as telas em camadas profundas da pilha entram aqui
   * (compose, composeDetails, wizard). Quando vazio, a camada
   * overlay fica oculta.
   */
  const overlayKey =
    currentScreen.kind === 'compose'
      ? 'compose'
      : currentScreen.kind === 'composeDetails'
        ? 'composeDetails'
        : currentScreen.kind === 'wizard'
          ? `wizard-${currentScreen.type}`
          : currentScreen.kind === 'noteDetail'
            ? `noteDetail-${currentScreen.noteId}`
            : currentScreen.kind === 'noteTransform'
              ? `noteTransform-${currentScreen.noteId}`
              : '';

  // Streak — derivados (a data é calculada a cada render; o app entende "qual dia é" por aqui)
  const todayKey = toDateKey(new Date());
  const streakStats = computeStreak(streakData.activeDays, todayKey);
  const currentWeekProgress = getWeekProgress(streakData.activeDays, todayKey);

  // Stickers: reconcilia o catálogo com o progresso persistido (uma vez, ao iniciar)
  useEffect(() => {
    setStickers((prev) => mergeCatalogWithProgress(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Janela de boot: enquanto o app "acorda" (hidratação assíncrona no nativo), conquistas
  // desbloqueadas por reconhecimento do estado persistido são aplicadas em silêncio —
  // só celebramos (confete/vibração/toast) desbloqueios que acontecem em sessão.
  const bootWindowRef = useRef(true);
  useEffect(() => {
    const t = window.setTimeout(() => {
      bootWindowRef.current = false;
    }, 2500);
    return () => window.clearTimeout(t);
  }, []);

  // Stickers: avalia desbloqueios (conquistas) quando o estado de estudo muda.
  // `applyStickerUnlocks` devolve a mesma referência quando nada muda — sem loop.
  useEffect(() => {
    const state = {
      profile,
      readings,
      flashcards,
      sessions,
      classes,
      tasks,
      exams,
      authors,
      materials,
      courses,
      questions,
      techniques,
      internshipLogs,
      currentStreak: streakStats.current,
      streakTotal: streakStats.total,
      streakLongest: streakStats.longest,
      tcc,
      savedBookIds,
      concepts,
      looseNotes,
    };
    const { updated, newlyUnlocked } = applyStickerUnlocks(stickers, state, todayKey);
    const hasRealNewUnlock = newlyUnlocked.some((item) => !stickers.some((existing) => existing.id === item.id && existing.unlocked));
    if (newlyUnlocked.length > 0 && hasRealNewUnlock) {
      setStickers(updated);
      setProfile((p) => ({
        ...p,
        stickersCollected: countUnlocked(updated),
      }));
      if (!bootWindowRef.current) {
        celebrate('sticker-unlocked');
        hapticSuccess();
        showToast(
          `conquista desbloqueada: ${newlyUnlocked[0].emoji} ${newlyUnlocked[0].name} ♡`
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stickers,
    profile,
    readings,
    flashcards,
    sessions,
    classes,
    tasks,
    exams,
    authors,
    materials,
    courses,
    questions,
    techniques,
    internshipLogs,
    streakStats.current,
    streakStats.total,
    streakStats.longest,
    tcc,
    savedBookIds,
    concepts,
    looseNotes,
    todayKey,
  ]);

  // Limpeza pontual: remove as chaves órfãs do recurso de humor removido (uma vez, ao iniciar)
  useEffect(() => {
    void storage.remove('currentMood');
    void storage.remove('moodHistory');
  }, []);

  /** Último hash gravado pelo próprio espelho (syncHash) — usado para ignorar o eco no applyRoute. */
  const lastSyncedHashRef = useRef<string | null>(null);

  // Roteamento hash como espelho (deep-link + voltar/avançar no browser; histórico do webview p/ swipe iOS)
  useEffect(() => {
    const applyRoute = () => {
      const hash = location.hash;
      // Eco do próprio espelho: o hash acabou de ser gravado por syncHash para uma
      // pilha com tela transitória (quiz, abordagem empilhada) — reaplicar clampearia
      // a pilha (round-trip perde estado). A pilha já é a fonte da verdade.
      if (lastSyncedHashRef.current === hash) return;
      lastSyncedHashRef.current = hash;
      const route = parseRoute(hash);
      setStack(routeToStack(route));
      // Sub-tabs codificadas na URL são aplicadas à aba base (deep-link granular)
      if (route.subTab) {
        const t = route.tab;
        if (t === 'faculdade') setSubTabFaculdade(route.subTab as SubTabFaculdade);
        else if (t === 'estudos') setSubTabEstudos(route.subTab as SubTabEstudos);
        else if (t === 'biblioteca') setSubTabBiblioteca(route.subTab as SubTabBiblioteca);
      }
      setTargetId(route.tab === 'faculdade' ? route.focusedCourseId ?? undefined : undefined);
      scrollToTop();
    };
    if (!location.hash) history.replaceState(null, '', '#/home');
    applyRoute();
    window.addEventListener('hashchange', applyRoute);
    window.addEventListener('popstate', applyRoute);
    return () => {
      window.removeEventListener('hashchange', applyRoute);
      window.removeEventListener('popstate', applyRoute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleBookmarkCourse = useCallback((courseId: string) => {
    setBookmarkedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }, []);

  // Handlers
  /** Registra "hoje" como dia ativo na streak (só em dia útil; idempotente). */
  const registerActivity = useCallback(() => {
    const key = toDateKey(new Date());
    if (!isStudyDay(key)) return;
    setStreakData((prev) =>
      prev.activeDays.includes(key) ? prev : { activeDays: [...prev.activeDays, key] }
    );
  }, []);

  const handleToggleTask = (taskId: string) => {
    hapticTap();
    const nextTasks = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    setTasks(nextTasks);
    const toggled = nextTasks.find((t) => t.id === taskId);
    if (toggled?.completed) registerActivity();
    if (shouldCelebrateTasks(nextTasks, taskId)) {
      hapticSuccess();
      celebrate('tasks-done');
      showToast(`plano do dia completo! parabéns${profile.name.trim() ? `, ${profile.name.trim()}` : ''} 🎉`);
    }
  };

  const handleToggleExam = (examId: string) => {
    hapticTap();
    setExams((prev) =>
      prev.map((e) => (e.id === examId ? { ...e, completed: !e.completed } : e))
    );
  };

  const handleAddTask = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    void gcalSyncTask(task, 'upsert');
  };

  const handleUpdateTask = (taskId: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    if (patch.title || patch.dueDate || patch.disciplineId) {
      const updated = tasks.find((t) => t.id === taskId);
      if (updated) void gcalSyncTask({ ...updated, ...patch }, 'upsert');
    }
  };

  const handleAddClassNote = (note: ClassNote) => {
    setClasses((prev) => [note, ...prev]);
    registerActivity();
  };

  const handleUpdateClassNote = (note: ClassNote) => {
    setClasses((prev) => prev.map((c) => (c.id === note.id ? note : c)));
  };

  const addLooseNote = (note: LooseNote) => {
    setLooseNotes((prev) => [note, ...prev]);
  };

  const deleteLooseNote = (id: string) => {
    setLooseNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const updateLooseNote = useCallback((id: string, patch: Partial<LooseNote>) => {
    setLooseNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      )
    );
  }, []);

  const handleAddConcept = useCallback((concept: PsychologyConcept) => {
    setConcepts((prev) => [concept, ...prev]);
  }, []);

  const handleAddMaterial = useCallback((material: MaterialItem) => {
    setMaterials((prev) => [material, ...prev]);
  }, []);

  const handleAddReading = (reading: ReadingItem) => {
    setReadings((prev) => [reading, ...prev]);
  };

  const handleUpdateReadingPages = (readingId: string, newPages: number) => {
    const prev = readings.find((r) => r.id === readingId);
    const nextReadings = readings.map((r) => {
      if (r.id === readingId) {
        const updatedPages = Math.min(newPages, r.totalPages || 999);
        const isDone = updatedPages >= (r.totalPages || 100);
        const status: ReadingItem['status'] = isDone ? 'concluido' : 'lendo';
        return { ...r, readPages: updatedPages, status };
      }
      return r;
    });
    setReadings(nextReadings);
    if (newPages > (prev?.readPages || 0)) registerActivity();
    const doneNow = nextReadings.find((r) => r.id === readingId);
    if (doneNow?.status === 'concluido' && prev?.status !== 'concluido') {
      hapticSuccess();
      celebrate('reading-done');
      showToast('leitura concluída! que orgulho de você ♡');
    }
  };

  const handleAddFlashcard = (card: Flashcard) => {
    setFlashcards((prev) => [card, ...prev]);
  };

  const handleReviewFlashcard = (id: string, correct: boolean) => {
    hapticTap();
    const today = new Date().toISOString().split('T')[0];
    registerActivity();
    setFlashcards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const reviewed = (c.timesReviewed || 0) + 1;
        const easeFactor = correct
          ? Math.min(3, (c.easeFactor || 1.5) + 0.2)
          : Math.max(1, (c.easeFactor || 1.5) - 0.15);
        return {
          ...c,
          timesReviewed: reviewed,
          lastReviewed: today,
          easeFactor: Math.round(easeFactor * 100) / 100
        };
      })
    );
  };

  const handleAddInternshipLog = (log: InternshipLog) => {
    setInternshipLogs((prev) => [log, ...prev]);
  };

  const addSupervision = (entry: SupervisionNotebook) => {
    setSupervision((prev) => [entry, ...prev]);
  };

  const updateSupervision = (entry: SupervisionNotebook) => {
    setSupervision((prev) => prev.map((s) => (s.id === entry.id ? entry : s)));
  };

  const deleteSupervision = (id: string) => {
    setSupervision((prev) => prev.filter((s) => s.id !== id));
  };


  const handleAddExam = (exam: Exam) => {
    setExams((prev) => [exam, ...prev]);
    void gcalSyncExam(exam, 'upsert');
  };

  const handleAddCourse = useCallback((course: Course) => {
    setCourses((prev) => [course, ...prev]);
  }, []);

  const handleAddAuthor = (author: PsychologyAuthor) => {
    setAuthors((prev) => [author, ...prev]);
  };

  const handleAddSession = (session: StudySession) => {
    setSessions((prev) => [session, ...prev]);
    registerActivity();
  };

  const handleSaveQuizSession = (session: QuizSession) => {
    setQuizSessions((prev) => [session, ...prev]);
    registerActivity();
  };

  const handleAddTechnique = (technique: Technique) => {
    setTechniques((prev) => [technique, ...prev]);
  };

  const handleUpdateReadingChapters = (readingId: string, chapters: ReadingItem['chapters']) => {
    setReadings((prev) => prev.map((r) => (r.id === readingId ? { ...r, chapters } : r)));
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateTcc = (updated: TccData) => {
    setTcc(updated);
  };

  const updateReminder = (settings: ReminderSettings) => {
    setReminderSettings(settings);
    if (settings.enabled) {
      void scheduleDailyReminder(settings.time).then((scheduled) => {
        if (scheduled) hapticSuccess();
      });
      void syncClassReminders(courses);
    } else {
      void cancelDailyReminder();
      void cancelClassReminders();
    }
  };

  // mantém os lembretes de aula em dia quando o horário das matérias muda
  useEffect(() => {
    if (reminderSettings.enabled) void syncClassReminders(courses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses]);

  const setGcalEnabled = async (on: boolean) => {
    if (on) {
      const ok = await connectGcal();
      setGcalEnabledState(ok);
      if (!ok) {
        showToast('configura o client id do google para usar a agenda ♡');
      }
      return ok;
    }
    disconnectGcal();
    setGcalEnabledState(false);
    return false;
  };

  const gcalSyncExam = async (exam: Exam, op: 'upsert' | 'delete') => {
    if (!gcalEnabled) return;
    try {
      if (op === 'upsert') {
        const gid = await syncExam(exam, courses);
        if (gid) setGcalMap((m) => ({ ...m, [`exam-${exam.id}`]: gid }));
      } else {
        const gid = gcalMap[`exam-${exam.id}`];
        if (gid) {
          await unsyncEvent(gid);
          setGcalMap((m) => {
            const next = { ...m };
            delete next[`exam-${exam.id}`];
            return next;
          });
        }
      }
    } catch {
      /* falha silenciosa: a agenda é um espelho opcional */
    }
  };

  const gcalSyncTask = async (task: Task, op: 'upsert' | 'delete') => {
    if (!gcalEnabled) return;
    try {
      if (op === 'upsert') {
        const gid = await syncTask(task, courses);
        if (gid) setGcalMap((m) => ({ ...m, [`task-${task.id}`]: gid }));
      } else {
        const gid = gcalMap[`task-${task.id}`];
        if (gid) {
          await unsyncEvent(gid);
          setGcalMap((m) => {
            const next = { ...m };
            delete next[`task-${task.id}`];
            return next;
          });
        }
      }
    } catch {
      /* falha silenciosa */
    }
  };


  const handleUpdateCourse = useCallback((updated: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleUpdateExam = (exam: Exam) => {
    setExams((prev) => prev.map((e) => (e.id === exam.id ? exam : e)));
    void gcalSyncExam(exam, 'upsert');
  };

  const handleUpdateReading = (reading: ReadingItem) => {
    setReadings((prev) => prev.map((r) => (r.id === reading.id ? reading : r)));
  };

  const handleUpdateFlashcard = (card: Flashcard) => {
    setFlashcards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
  };

  const handleUpdateSession = (session: StudySession) => {
    setSessions((prev) => prev.map((s) => (s.id === session.id ? session : s)));
  };

  const handleUpdateInternshipLog = (log: InternshipLog) => {
    setInternshipLogs((prev) => prev.map((l) => (l.id === log.id ? log : l)));
  };

  const handleUpdateAuthor = (author: PsychologyAuthor) => {
    setAuthors((prev) => prev.map((a) => (a.id === author.id ? author : a)));
  };

  const handleUpdateConcept = (concept: PsychologyConcept) => {
    setConcepts((prev) => prev.map((c) => (c.id === concept.id ? concept : c)));
  };

  const handleUpdateMaterial = (material: MaterialItem) => {
    setMaterials((prev) => prev.map((m) => (m.id === material.id ? material : m)));
  };

  /** Aplica um banco completo (empty/demo/import/sincronizado) sem carimbar o SyncIndex. */
  const applyDatabase = (db: ReturnType<typeof emptyDatabase>) => {
    setProfileRaw(db.profile);
    setCoursesRaw(db.courses);
    setClassesRaw(db.classes);
    setTasksRaw(db.tasks);
    setExamsRaw(db.exams);
    setAuthorsRaw(db.authors);
    setConceptsRaw(db.concepts);
    setReadingsRaw(db.readings);
    setFlashcardsRaw(db.flashcards);
    setMaterialsRaw(db.materials);
    setInternshipLogsRaw(db.internshipLogs);
    setSupervisionRaw(db.supervision);
    setTccRaw(db.tcc);
    setStickersRaw(mergeCatalogWithProgress(db.stickers));
    setSessionsRaw(db.sessions);
    setTechniquesRaw(db.techniques);
    setQuizSessionsRaw(db.quizSessions);
    // approaches/questions são bancos estáticos (seed lazy): não são aplicados
    // aqui — backups não os trazem e o catálogo é re-semeado sob demanda.
    setStreakDataRaw(db.streakData);
    setReminderSettings(db.reminder);
    setLooseNotesRaw(db.looseNotes as LooseNote[]);
    setSavedBookIdsRaw(db.savedBookIds);
    setReadingProgressRaw(db.readingProgress ?? {});
    setBookmarkedCourseIdsRaw(db.bookmarkedCourseIds);
    setOnboarding(db.onboarding);
    // Índice de sync viaja junto (carimbos/tombstones do banco aplicado).
    setSyncIndex(db.syncIndex ?? emptySyncIndex());
  };

  /** Carrega os dados de exemplo (onboarding "começar com exemplo" / Perfil → configurações). */
  const loadDemoData = () => {
    const currentOnboarding = onboarding;
    applyDatabase(demoDatabase());
    // `demoDatabase()` parte do onboarding não-concluído; aqui preservamos o
    // estado atual (Perfil → carregar exemplos não deve voltar ao primeiro acesso).
    setOnboarding(currentOnboarding);
    showToast('prontinho, carreguei os exemplos ♡');
  };

  /** Limpa tudo e volta ao estado inicial (zerado) — onboarding é reaberto. */
  const resetApp = () => {
    applyDatabase(emptyDatabase());
    // Bancos estáticos (aproaches/questions) também são zerados para refletir o
    // "primeiro acesso"; os refs de seed são resetados para re-semear sob demanda.
    approachesSeededRef.current = false;
    questionsSeededRef.current = false;
    setApproaches([]);
    setQuestions([]);
    // Nativo: apaga também a base SQLite (conteúdo + mapa de import legado —
    // assim uma futura reinstalação reimporta do Preferences, se houver).
    void (async () => {
      try {
        const db = await getUserDb();
        if (db) await clearUserData(db);
      } catch (e) {
        console.error('[resetApp] falha ao limpar SQLite', e);
      }
    })();
    showToast('cantinho resetado — vamos começar de novo? ♡');
  };

  /** Conclui o onboarding: grava o perfil e opcionalmente carrega os exemplos. */
  const completeOnboarding = (profileUpdate: Partial<UserProfile>, loadDemo: boolean) => {
    if (loadDemo) {
      applyDatabase(demoDatabase());
      setProfile((prev) => ({ ...prev, ...profileUpdate }));
    } else {
      applyDatabase(emptyDatabase());
      setProfile((prev) => ({ ...prev, ...profileUpdate }));
    }
    setOnboarding({ completed: true, completedAt: new Date().toISOString(), loadedDemo: loadDemo });
    showToast(loadDemo ? 'cantinho pronto com exemplos ♡' : 'cantinho pronto — bora começar? ♡');
  };

  /** Coleta todos os estados persistidos num payload versionado (backup). */
  const exportData = async () => {
    const payload = await buildBackupPayload({
      profile, courses, classes, tasks, exams, authors, concepts, approaches,
      readings, flashcards, materials, internshipLogs, supervision, tcc, stickers, sessions,
      streakData, reminder: reminderSettings, looseNotes, savedBookIds,
      bookmarkedCourseIds, readingProgress, questions, techniques, quizSessions,
      onboarding, syncIndex,
    });
    await exportAppDatabase(payload);
  };

  /** Restaura um payload exportado (backup/migração), validando a versão do schema. */
  const importData = (json: string) => {
    const db = importAppDatabase(json);
    if (!db) {
      showToast('ops, esse arquivo de backup não é compatível ♡');
      return;
    }
    applyDatabase(db);
    showToast('backup restaurado com carinho ♡');
  };

  /** Snapshot local (JSON do backup v2) para enviar na sincronização entre dispositivos. */
  const getSyncPayloadJson = useCallback(async () => {
    const payload = await buildBackupPayload({
      profile, courses, classes, tasks, exams, authors, concepts, approaches,
      readings, flashcards, materials, internshipLogs, supervision, tcc, stickers, sessions,
      streakData, reminder: reminderSettings, looseNotes, savedBookIds,
      bookmarkedCourseIds, readingProgress, questions, techniques, quizSessions,
      onboarding, syncIndex,
    });
    return JSON.stringify(payload);
  }, [profile, courses, classes, tasks, exams, authors, concepts, approaches, readings,
    flashcards, materials, internshipLogs, supervision, tcc, stickers, sessions, streakData,
    reminderSettings, looseNotes, savedBookIds, bookmarkedCourseIds, readingProgress, questions,
    techniques, quizSessions, onboarding, syncIndex]);

  /** Aplica o banco mesclado pela sincronização (mesmo caminho do import). */
  const applySyncedDatabase = useCallback((db: ReturnType<typeof emptyDatabase>) => {
    applyDatabase(db);
  }, []);

  /** Sub-tab atual da aba base (para codificar no hash quando não for a padrão). */
  const currentSubTabFor = useCallback((tab: NavTab): string | undefined => {
    switch (tab) {
      case 'faculdade':
        return subTabFaculdade;
      case 'biblioteca':
        return subTabBiblioteca;
      default:
        return undefined;
    }
  }, [subTabFaculdade, subTabBiblioteca]);

  /** Sincroniza o `location.hash` (espelho) com a pilha, incluindo a sub-tab da aba base. */
  const syncHash = useCallback((next: NavScreen[]) => {
    const top = next[next.length - 1];
    const baseTab = top.kind === 'tab' ? top.tab : next[0]?.kind === 'tab' ? next[0].tab : undefined;
    const h = stackToHash(next, baseTab ? currentSubTabFor(baseTab) : undefined);
    // O guard precisa estar atualizado ANTES de tocar no location.hash — o navegador
    // dispara `hashchange` (applyRoute) quando o hash muda, e sem isso o eco seria
    // reaplicado e clampearia pilhas com estado transitório (ex.: quiz-play/quiz-result).
    lastSyncedHashRef.current = h;
    if (location.hash !== h) location.hash = h;
  }, [currentSubTabFor]);

  // Deep-link focado: ao navegar com targetId (busca global), rola e destaca o item
  const lastTargetRef = useRef<string | undefined>(undefined);
  const targetSectionRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!targetId || targetId === lastTargetRef.current) return;
    lastTargetRef.current = targetId;
    const t = setTimeout(() => {
      const el =
        document.querySelector<HTMLElement>(`[data-target="${targetId}"]`) ??
        (targetSectionRef.current
          ? document.querySelector<HTMLElement>(`[data-section="${targetSectionRef.current}"]`)
          : null);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const original = el.style.boxShadow;
      el.style.boxShadow = '0 0 0 3px rgba(255,184,199,0.9)';
      el.style.transition = 'box-shadow 0.3s ease';
      setTimeout(() => {
        el.style.boxShadow = original;
        el.style.transition = '';
      }, 2400);
    }, 250);
    return () => clearTimeout(t);
  }, [targetId]);

  const goBack = useCallback(() => {
    if (navigationStack.length <= 1) return;
    const next = navigationStack.slice(0, -1);
    setStack(next);
    setTargetId(undefined);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, setTargetId, syncHash]);

  const canGoBack = navigationStack.length > 1;

  const handleSystemBack = useCallback((): boolean => {
    if (isQuickAddOpen) { setIsQuickAddOpen(false); return true; }
    if (isSearchOpen) { setIsSearchOpen(false); return true; }
    if (isEditCourseOpen) { setIsEditCourseOpen(false); return true; }
    if (isEditTccOpen) { setIsEditTccOpen(false); return true; }
    if (isDetailPromptOpen) { setIsDetailPromptOpen(false); return true; }
    if (navigationStack.length > 1) { goBack(); return true; }
    return false;
  }, [isQuickAddOpen, isSearchOpen, isEditCourseOpen, isEditTccOpen, isDetailPromptOpen, navigationStack, goBack]);

  const handleNavigate = useCallback((tab: NavTab, subTab?: string, target?: string) => {
    if (tab === 'faculdade' && subTab) setSubTabFaculdade(subTab as SubTabFaculdade);
    if (tab === 'biblioteca' && subTab) setSubTabBiblioteca(subTab as SubTabBiblioteca);
    targetSectionRef.current = subTab;

    const base: NavScreen = { kind: 'tab', tab };
    let next: NavScreen[];
    if (tab === 'estudos' && subTab) {
      // Antigas sub-tabs de estudos → telas dedicadas (feed é a base)
      const screenMap: Record<string, StudyScreen> = {
        flashcards: 'revisar',
        leituras: 'leituras',
        historico: 'historico',
      };
      next = subTab === 'questoes'
        ? [base, { kind: 'quiz-category' }]
        : subTab === 'sessoes'
          ? [base]
          : [base, { kind: 'study', screen: screenMap[subTab] }];
    } else {
      next = tab === 'faculdade' && target ? [base, { kind: 'course', courseId: target }] : [base];
    }
    setStack(next);
    setTargetId(target);
    syncHash(next);
    scrollToTop();
  }, [setStack, setTargetId, syncHash, setSubTabFaculdade, setSubTabBiblioteca]);

  const openCourseDetail = useCallback((courseId: string) => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'course'
        ? top.courseId === courseId
          ? navigationStack
          : [...navigationStack.slice(0, -1), { kind: 'course', courseId }]
        : [{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId }];
    setStack(next);
    setTargetId(courseId);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, setTargetId, syncHash]);

  const closeCourseDetail = useCallback(() => goBack(), [goBack]);

  const openNotesScreen = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'notes' ? navigationStack : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeNotesScreen = useCallback(() => goBack(), [goBack]);

  const openNoteDetail = useCallback((noteId: string) => {
    const top = navigationStack[navigationStack.length - 1];
    if (top.kind === 'noteDetail' && top.noteId === noteId) return;
    const next: NavScreen[] =
      top.kind === 'notes'
        ? [...navigationStack, { kind: 'noteDetail', noteId }]
        : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }, { kind: 'noteDetail', noteId }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeNoteDetail = useCallback(() => goBack(), [goBack]);

  const openNoteTransform = useCallback((noteId: string) => {
    const top = navigationStack[navigationStack.length - 1];
    if (top.kind === 'noteTransform' && top.noteId === noteId) return;
    const base: NavScreen[] = navigationStack.some((s) => s.kind === 'notes')
      ? navigationStack
      : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }];
    const next: NavScreen[] =
      top.kind === 'noteTransform'
        ? [...navigationStack.slice(0, -1), { kind: 'noteTransform', noteId }]
        : [...base, { kind: 'noteTransform', noteId }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeNoteTransform = useCallback(() => goBack(), [goBack]);

  /** Volta direto para a lista de notas (usado após uma transformação concluída). */
  const closeAllNoteScreens = useCallback(() => {
    const reversedIdx = [...navigationStack].reverse().findIndex((s) => s.kind === 'notes');
    const notesIdx = reversedIdx === -1 ? -1 : navigationStack.length - 1 - reversedIdx;
    const next: NavScreen[] =
      notesIdx === -1
        ? [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }]
        : navigationStack.slice(0, notesIdx + 1);
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const openTemple = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'temple' ? navigationStack : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'temple' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeTemple = useCallback(() => goBack(), [goBack]);

  const openTempleSection = useCallback(
    (section: TempleSection) => {
      const top = navigationStack[navigationStack.length - 1];
      const next: NavScreen[] =
        top.kind === 'templeSection' && top.section === section
          ? navigationStack
          : top.kind === 'temple'
            ? [...navigationStack, { kind: 'templeSection', section }]
            : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'temple' }, { kind: 'templeSection', section }];
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash, scrollToTop]
  );

  const closeTempleSection = useCallback(() => goBack(), [goBack]);

  const openFamilies = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'families' ? navigationStack : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'families' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeFamilies = useCallback(() => goBack(), [goBack]);

  const openFamily = useCallback((familyId: string) => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'family'
        ? top.familyId === familyId
          ? navigationStack
          : [...navigationStack.slice(0, -1), { kind: 'family', familyId }]
        : [...navigationStack, { kind: 'family', familyId }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeFamily = useCallback(() => goBack(), [goBack]);

  const openApproach = useCallback((approachId: string) => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'approach' && top.approachId === approachId
        ? navigationStack
        : [...navigationStack, { kind: 'approach', approachId }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeApproach = useCallback(() => goBack(), [goBack]);

  const openStreak = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'streak' ? navigationStack : [...navigationStack, { kind: 'streak' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeStreak = useCallback(() => goBack(), [goBack]);

  const openInternshipDiary = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'internshipDiary'
        ? navigationStack
        : [{ kind: 'tab', tab: 'faculdade' as NavTab }, { kind: 'internshipDiary' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeInternshipDiary = useCallback(() => goBack(), [goBack]);

  const openTccScreen = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'tcc' ? navigationStack : [{ kind: 'tab', tab: 'estudos' as NavTab }, { kind: 'tcc' } as const];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeTccScreen = useCallback(() => goBack(), [goBack]);

  const openStickersScreen = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'stickers'
        ? navigationStack
        : [{ kind: 'tab', tab: 'perfil' as NavTab }, { kind: 'stickers' } as const];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeStickersScreen = useCallback(() => goBack(), [goBack]);

  const openSyncScreen = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'sync'
        ? navigationStack
        : [{ kind: 'tab', tab: 'perfil' as NavTab }, { kind: 'sync' } as const];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeSyncScreen = useCallback(() => goBack(), [goBack]);

  const openQuizCategory = useCallback((_config?: Partial<QuizConfig>) => {
    const next = stackAfterOpenQuizCategory(navigationStack);
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeQuizCategory = useCallback(() => goBack(), [goBack]);

  /** Splash de preparação do quiz: empilha a tela que garante o acervo em memória. */
  const openQuizLoading = useCallback((config: QuizConfig) => {
    const next = stackAfterOpenQuizLoading(navigationStack, config);
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeQuizLoading = useCallback(() => goBack(), [goBack]);

  /**
   * Garante que o banco de questões está em memória — no web recarrega do
   * módulo estático; no nativo lê do catálogo SQLite (fallback: módulo).
   * Retorna o banco completo.
   */
  const ensureQuestionsLoaded = useCallback(async (): Promise<StudyQuestion[]> => {
    if (isNativePlatform) {
      const fromCatalog = await getCatalogQuestions<StudyQuestion>();
      if (fromCatalog.length > 0) {
        if (questions.length === 0) setQuestions(fromCatalog);
        return fromCatalog;
      }
    }
    const m = await import('../data/bancoQuestoes');
    const bank = m.BANCO_QUESTOES;
    if (questions.length === 0) setQuestions(bank);
    return bank;
  }, [questions.length]);

  const openStudy = useCallback((screen: StudyScreen) => {
    const top = navigationStack[navigationStack.length - 1];
    const base: readonly NavScreen[] = top.kind === 'tab' && top.tab === 'estudos'
      ? navigationStack
      : [{ kind: 'tab' as const, tab: 'estudos' as NavTab }];
    const next: NavScreen[] =
      top.kind === 'study' && top.screen === screen
        ? navigationStack
        : [...base, { kind: 'study' as const, screen }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeStudy = useCallback(() => goBack(), [goBack]);

  const openQuizPlay = useCallback((pool: StudyQuestion[], config: QuizConfig) => {
    const next = stackAfterOpenQuizPlay(navigationStack, pool, config, Date.now());
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeQuizPlay = useCallback(() => goBack(), [goBack]);

  const openQuizResult = useCallback((
    answers: QuizAnswer[],
    config: QuizConfig,
    startTime: number,
    correctCount: number,
    totalCount: number
  ) => {
    const next = stackAfterOpenQuizResult(navigationStack, {
      answers, config, startTime, correctCount, totalCount,
    });
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  /** Volta do resultado para o seletor de assuntos (mantém quiz-category; política de back nativo). */
  const closeQuizResult = useCallback(() => {
    const next = stackAfterCloseQuizResult(navigationStack);
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  /** Atualiza o estado do quiz em jogo (adiciona resposta ou avança questão). */
  const updateQuizPlayState = useCallback((updates: Partial<QuizPlayState>) => {
    const playScreen = navigationStack.find((s) => s.kind === 'quiz-play') as any;
    if (!playScreen) return;

    const current = playScreen.state as QuizPlayState;
    const updatedState: QuizPlayState = { ...current, ...updates };

    const stack = navigationStack.map((screen) =>
      screen.kind === 'quiz-play' ? { ...screen, state: updatedState } : screen
    );
    setStack(stack);
  }, [navigationStack, setStack]);

  /** Volta de todas as telas de quiz para tab de estudos em um só goBack. */
  const closeAllQuizScreens = useCallback(() => {
    const next = stackAfterCloseAllQuizScreens(navigationStack);
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  /** Volta do resultado para o seletor de assuntos (mantém quiz-category). */
  const newQuizFromResult = useCallback(() => {
    const next = stackAfterNewQuizFromResult(navigationStack);
    if (!next) {
      openQuizCategory();
      return;
    }
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash, openQuizCategory]);

  const openCompose = useCallback((courseId?: string) => {
    setComposeCourseId(courseId);
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'compose' ? navigationStack : [...navigationStack, { kind: 'compose' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash, setComposeCourseId]);

  const closeCompose = useCallback(() => {
    setComposeCourseId(undefined);
    goBack();
  }, [goBack, setComposeCourseId]);

  const openComposeDetails = useCallback((noteId: string) => {
    setWizardNoteId(noteId);
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'composeDetails'
        ? navigationStack
        : [...navigationStack, { kind: 'composeDetails' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash, setWizardNoteId]);

  const closeComposeDetails = useCallback(() => {
    setWizardNoteId(null);
    goBack();
  }, [goBack, setWizardNoteId]);

  const openDetailPrompt = useCallback((noteId: string) => {
    setDetailNoteId(noteId);
    setIsDetailPromptOpen(true);
  }, []);

  const closeDetailPrompt = useCallback(() => {
    setDetailNoteId(null);
    setIsDetailPromptOpen(false);
  }, []);

  const toggleSaveBook = useCallback((bookId: string) => {
    setSavedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  }, []);

  const updateReadingProgress = useCallback((bookId: string, readPages: number) => {
    setReadingProgress((prev) => ({ ...prev, [bookId]: Math.max(0, Math.floor(readPages)) }));
  }, []);

  const openEditCourse = useCallback((courseId?: string) => {
    setEditCourseId(courseId ?? null);
    setIsEditCourseOpen(true);
  }, []);
  const closeEditCourse = useCallback(() => {
    setIsEditCourseOpen(false);
    setEditCourseId(null);
  }, []);

  const openEditTcc = useCallback(() => {
    setIsEditTccOpen(true);
  }, []);
  const closeEditTcc = useCallback(() => {
    setIsEditTccOpen(false);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      toastTimerRef.current = null;
      setToast(null);
    }, 2600);
  }, []);

  // Limpa o timer do toast ao desmontar o provider.
  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const openQuickAdd = useCallback(() => {
    setIsQuickAddOpen(true);
  }, []);
  const closeQuickAdd = useCallback(() => {
    setIsQuickAddOpen(false);
  }, []);

  const openWizard = useCallback((type: WizardFlow, courseId?: string) => {
    setWizardCourseId(courseId);
    setWizardEdit(null);
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'wizard' && top.type === type
        ? navigationStack
        : [...navigationStack, { kind: 'wizard', type }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash, setWizardCourseId]);

  const openTaskExamWizard = useCallback(() => openWizard('task-exam'), [openWizard]);

  const closeWizard = useCallback(() => {
    setWizardCourseId(undefined);
    setWizardEdit(null);
    goBack();
  }, [goBack, setWizardCourseId]);

  // ---- menu universal de editar/excluir (long-press / clique direito) ----
  const openManageItem = useCallback((kind: ManagedItemKind, id: string) => {
    setManagedItem({ kind, id });
  }, []);

  const closeManageItem = useCallback(() => {
    setManagedItem(null);
  }, []);

  const deleteManagedItem = useCallback((kind: ManagedItemKind, id: string) => {
    const db: ManagedDB = {
      courses,
      classes,
      tasks,
      exams,
      authors,
      concepts,
      readings,
      flashcards,
      materials,
      internshipLogs,
      sessions,
      quizSessions,
      looseNotes,
      bookmarkedCourseIds,
    };
    const next = applyDelete(db, kind, id);
    setCourses(next.courses);
    setClasses(next.classes);
    setTasks(next.tasks);
    setExams(next.exams);
    setAuthors(next.authors);
    setConcepts(next.concepts);
    setReadings(next.readings);
    setFlashcards(next.flashcards);
    setMaterials(next.materials);
    setInternshipLogs(next.internshipLogs);
    setSessions(next.sessions);
    setQuizSessions(next.quizSessions);
    setLooseNotes(next.looseNotes);
    setBookmarkedCourseIds(next.bookmarkedCourseIds);
    setManagedItem(null);
    hapticSuccess();
    showToast(MANAGED_KIND_REMOVED[kind]);
  }, [
    courses, classes, tasks, exams, authors, concepts, readings, flashcards,
    materials, internshipLogs, sessions, quizSessions, looseNotes,
    bookmarkedCourseIds, setManagedItem, showToast,
  ]);

  /** Curso pré-selecionado ao abrir a edição de um item (quando aplicável). */
  const resolveManageCourseId = useCallback((kind: ManagedItemKind, id: string): string | undefined => {
    switch (kind) {
      case 'task':
        return tasks.find((t) => t.id === id)?.disciplineId;
      case 'exam':
        return exams.find((e) => e.id === id)?.courseId;
      case 'reading':
        return readings.find((r) => r.id === id)?.courseId;
      case 'flashcard':
        return flashcards.find((f) => f.id === id)?.courseId;
      case 'session':
        return sessions.find((s) => s.id === id)?.courseId;
      case 'concept':
        return concepts.find((c) => c.id === id)?.courseIds[0];
      case 'material':
        return materials.find((m) => m.id === id)?.courseId;
      default:
        return undefined;
    }
  }, [tasks, exams, readings, flashcards, sessions, concepts, materials]);

  /** Abre a edição correta para uma entidade (wizard, modal ou tela própria). */
  const editManagedItem = useCallback((kind: ManagedItemKind, id: string) => {
    setManagedItem(null);
    switch (kind) {
      case 'course':
        openEditCourse(id);
        return;
      case 'class':
        openComposeDetails(id);
        return;
      case 'looseNote':
        openNoteDetail(id);
        return;
      case 'quizSession':
        // quiz não tem edição — somente exclusão
        return;
      default:
        break;
    }
    const courseId = resolveManageCourseId(kind, id);
    let type: WizardFlow;
    switch (kind) {
      case 'task': type = 'task'; break;
      case 'exam': type = 'exam'; break;
      case 'concept': type = 'concept'; break;
      case 'material': type = 'material'; break;
      case 'reading': type = 'reading'; break;
      case 'flashcard': type = 'flashcard'; break;
      case 'session': type = 'session'; break;
      case 'internship': type = 'internship'; break;
      case 'author': type = 'author'; break;
      default: return;
    }
    openWizard(type, courseId);
    setWizardEdit({ kind, id });
  }, [openEditCourse, openComposeDetails, openNoteDetail, openWizard, resolveManageCourseId]);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const setActiveTab = useCallback((tab: NavTab) => handleNavigate(tab), [handleNavigate]);
  const setFocusedCourseId = useCallback((id: string | null) => {
    if (id) openCourseDetail(id);
    else if (currentScreen.kind === 'course') goBack();
  }, [openCourseDetail, goBack, currentScreen.kind]);

  // Header dinâmico (memoizado: não recria entre renders de dados)
  const headerConfig = useMemo<DynamicHeaderConfig | null>(() => {
    return buildHeaderConfig({
      currentScreen,
      focusedFamily,
      focusedApproach,
      focusedCourse,
      bookmarkedCourseIds,
      tccTitle: tcc.title,
      questionsCount: questions.length,
      currentQuizPlayState,
      quizResultCorrectCount: currentQuizResultCorrectCount,
      quizResultTotalCount: currentQuizResultTotalCount,
      dueCardsCount,
      onBack: goBack,
      openWizard,
      openCompose,
      openEditCourse,
      openEditTcc,
      toggleBookmarkCourse,
      setIsCreatingLooseNote,
    });
  }, [currentScreen, focusedFamily, focusedApproach, focusedCourse, bookmarkedCourseIds, setIsCreatingLooseNote, goBack, openCompose, openWizard, openEditCourse, toggleBookmarkCourse, openEditTcc, tcc.title, questions.length, currentQuizPlayState, currentQuizResultCorrectCount, currentQuizResultTotalCount, dueCardsCount]);

  const value: AppContextValue = {
    profile,
    courses,
    classes,
    tasks,
    exams,
    authors,
    concepts,
    approaches,
    readings,
    flashcards,
    materials,
    internshipLogs,
    supervision,
    tcc,
    stickers,
    sessions,
    questions,
    techniques,
    quizSessions,
    savedBookIds,
    toggleSaveBook,
    readingProgress,
    updateReadingProgress,
    reminderSettings,
    updateReminder,
    gcalEnabled,
    setGcalEnabled,
    onboarding,
    completeOnboarding,
    loadDemoData,
    resetApp,
    exportData,
    importData,
    streakData,
    streakStats,
    currentWeekProgress,
    activeTab,
    screenKey,
    slideKey,
    overlayKey,
    navDirection,
    navigationStack,
    setStack,
    syncHash,
    handleSystemBack,
    setActiveTab,
    subTabFaculdade,
    setSubTabFaculdade,
    subTabEstudos,
    setSubTabEstudos,
    subTabBiblioteca,
    setSubTabBiblioteca,
    focusedStudyScreen,
    openStudy,
    closeStudy,
    targetId,
    setTargetId,
    focusedCourseId,
    setFocusedCourseId,
    focusedCourse,
    openCourseDetail,
    closeCourseDetail,
    isBottomNavVisible,
    hasTabBase,
    canGoBack,
    isNotesScreenOpen,
    openNotesScreen,
    closeNotesScreen,
    isTempleScreenOpen,
    openTemple,
    closeTemple,
    focusedTempleSection,
    openTempleSection,
    closeTempleSection,
    isFamiliesScreenOpen,
    openFamilies,
    closeFamilies,
    focusedFamilyId,
    focusedFamily,
    openFamily,
    closeFamily,
    focusedApproachId,
    focusedApproach,
    openApproach,
    closeApproach,
    bookmarkedCourseIds,
    toggleBookmarkCourse,
    looseNotes,
    addLooseNote,
    deleteLooseNote,
    updateLooseNote,
    isNoteDetailOpen,
    isNoteTransformOpen,
    focusedNoteId,
    focusedNote,
    openNoteDetail,
    closeNoteDetail,
    openNoteTransform,
    closeNoteTransform,
    closeAllNoteScreens,
    isComposeScreenOpen,
    composeCourseId,
    openCompose,
    closeCompose,
    isComposeDetailsOpen,
    wizardNoteId,
    openComposeDetails,
    closeComposeDetails,
    isDetailPromptOpen,
    detailNoteId,
    openDetailPrompt,
    closeDetailPrompt,
    isStreakScreenOpen,
    openStreak,
    closeStreak,
    isInternshipDiaryOpen,
    openInternshipDiary,
    closeInternshipDiary,
    isTccScreenOpen,
    openTccScreen,
    closeTccScreen,
  isStickersScreenOpen,
  openStickersScreen,
  closeStickersScreen,
  isSyncScreenOpen,
  openSyncScreen,
  closeSyncScreen,
  getSyncPayloadJson,
  applySyncedDatabase,
    isQuizCategoryOpen,
    openQuizCategory,
    closeQuizCategory,
    isQuizLoadingOpen,
    currentQuizLoadingConfig,
    openQuizLoading,
    closeQuizLoading,
    ensureQuestionsLoaded,
    isQuizPlayOpen,
    openQuizPlay,
    closeQuizPlay,
    isQuizResultOpen,
    openQuizResult,
    closeQuizResult,
    updateQuizPlayState,
    closeAllQuizScreens,
    newQuizFromResult,
    isQuickAddOpen,
    openQuickAdd,
    closeQuickAdd,
    isWizardOpen,
    currentWizardType,
    wizardCourseId,
    openWizard,
    openTaskExamWizard,
    closeWizard,
    managedItem,
    openManageItem,
    closeManageItem,
    deleteManagedItem,
    editManagedItem,
    wizardEdit,
    isEditCourseOpen,
    editCourseId,
    openEditCourse,
    closeEditCourse,
    isEditTccOpen,
    openEditTcc,
    closeEditTcc,
    isCreatingLooseNote,
    setIsCreatingLooseNote,
    isSearchOpen,
    openSearch,
    closeSearch,
    toast,
    showToast,
    handleNavigate,
    handleToggleTask,
    handleToggleExam,
    handleAddTask,
    handleUpdateTask,
    handleAddClassNote,
    handleUpdateClassNote,
    handleAddConcept,
    handleAddMaterial,
    handleAddReading,
    handleUpdateReadingPages,
    handleAddFlashcard,
    handleReviewFlashcard,
    handleAddInternshipLog,
    addSupervision,
    updateSupervision,
    deleteSupervision,
    handleAddExam,
    handleAddCourse,
    handleAddAuthor,
    handleAddSession,
    handleAddTechnique,
    handleSaveQuizSession,
    handleUpdateReadingChapters,
    handleUpdateProfile,
    handleUpdateTcc,
    handleUpdateCourse,
    handleUpdateExam,
    handleUpdateReading,
    handleUpdateFlashcard,
    handleUpdateSession,
    handleUpdateInternshipLog,
    handleUpdateAuthor,
    handleUpdateConcept,
    handleUpdateMaterial,

    // Quiz helpers (extraídos da pilha de navegação)
    currentQuizPlayState,
    currentQuizResultAnswers,
    currentQuizResultConfig,
    currentQuizResultStartTime,
    currentQuizResultCorrectCount,
    currentQuizResultTotalCount,
    currentQuizResultPool,

    headerConfig
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
