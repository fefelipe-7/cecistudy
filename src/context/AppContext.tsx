import React from 'react';
import type {
  DataClientValue,
  ReminderSettings,
} from './DataClientProvider';
import type { SharedAppValue } from './sharedAppValue';
import type { StickerState } from '../lib/stickers';
import type { ThemeId } from '../lib/themes';
import type { DataActions, DataActionGroups } from './dataActions';
import type { NavigationValue } from './navigationEngine';
import type {
  NavTab,
  NavScreen,
  SubTabFaculdade,
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
  FlashcardDeck,
  MaterialItem,
  InternshipLog,
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
  StudyScreen,
  ManagedItem,
  ManagedItemKind,
  TempleSection,
  QuestionGroup,
  AttendanceRecord,
  AttendanceStatus,
} from '../types';
import type { StreakStats, WeekDayCell } from '../lib/streak';
import type { DataClient } from '../lib/dataClient';
import type { SyncPreview } from '../lib/sync/engine';
import type { SyncManifest } from '../lib/sync/provider';
import type { AuthorDraft, ConceptDraft } from '../lib/acervoBridge';
import type {
  Workspace,
  Relation,
  Suggestion,
  AssociationPolicy,
  RelationKind,
  SuggestionType,
  Project,
  Output,
  ProjectType,
  OutputFormat,
  CitationProfile,
} from '../core/domain';

// ReminderSettings é definido em ./DataClientProvider e re-exportado para compatibilidade.
export type { ReminderSettings } from './DataClientProvider';

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
  decks: FlashcardDeck[];
  materials: MaterialItem[];
  internshipLogs: InternshipLog[];
  tcc: TccData;
  stickers: Sticker[];
  /** Snapshot do estado avaliado para as condições dos stickers (barras de progresso). */
  stickerState: StickerState | null;
  sessions: StudySession[];
  questions: StudyQuestion[];
  techniques: Technique[];
  /** Cliente de dados canônico (repositórios + backup/restore + sync adapter). */
  dataClient: DataClient;
  quizSessions: QuizSession[];
  savedBookIds: string[];
  toggleSaveBook: (bookId: string) => void;
  readingProgress: Record<string, number>;
  updateReadingProgress: (bookId: string, readPages: number) => void;
  reminderSettings: ReminderSettings;
  updateReminder: (settings: ReminderSettings) => void;
  gcalEnabled: boolean;
  setGcalEnabled: (on: boolean) => Promise<boolean>;
  /** Tema ativo (TEM-001) — preferência de app persistida (`themePref`). */
  themePref: ThemeId;
  setThemePref: React.Dispatch<React.SetStateAction<ThemeId>>;

  // onboarding / ciclo de vida dos dados
  onboarding: OnboardingState;
  completeOnboarding: (profile: Partial<UserProfile>) => void;
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
  subTabBiblioteca: SubTabBiblioteca;
  setSubTabBiblioteca: (t: SubTabBiblioteca) => void;
  focusedStudyScreen: StudyScreen | null;
  /** Sessão de foco imersiva em tela (chrome preto + orientação landscape). */
  isFocusImmersiveOpen: boolean;
  openStudy: (screen: StudyScreen) => void;
  closeStudy: () => void;
  targetId: string | undefined;
  setTargetId: (id: string | undefined) => void;
  focusedCourseId: string | null;
  setFocusedCourseId: (id: string | null) => void;
  focusedCourse: Course | undefined;
  openCourseDetail: (courseId: string) => void;
  closeCourseDetail: () => void;
  isClassNoteDetailOpen: boolean;
  focusedClassNoteId: string | null;
  focusedClassNote: ClassNote | undefined;
  openClassNoteDetail: (classNoteId: string) => void;
  closeClassNoteDetail: () => void;
  /** Ficha de um item do repertório da disciplina, empilhada sobre o curso. */
  isRepertorioItemOpen: boolean;
  focusedRepertorioItemId: string | null;
  focusedRepertorioItemCourseId: string | null;
  openRepertorioItem: (itemId: string, courseId: string) => void;
  closeRepertorioItem: () => void;
  isBottomNavVisible: boolean;
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
  focusedComparisonSlug: string | null;
  openComparison: (slug: string) => void;
  closeComparison: () => void;
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
  // Sincronização com a nuvem (GitHub provider)
  githubSyncConfig: { owner: string; repo: string; token: string } | null;
  syncStatus: 'idle' | 'checking' | 'syncing' | 'synced' | 'upToDate' | 'error' | 'preview';
  syncErrorMessage: string | null;
  pendingSyncPreview: {
    preview: SyncPreview;
    mergedJson: string;
    remoteManifest: SyncManifest;
    remoteSha: string;
  } | null;
  syncNow: () => void;
  syncInBackground: () => void;
  configureGithubSync: (cfg: { owner: string; repo: string; token: string }) => void;
  clearGithubSync: () => void;
  applySyncPreview: () => void;
  discardSyncPreview: () => void;
  /** Aplica o banco mesclado pela sincronização (sem re-carimbar). */
  applySyncedDatabase: (db: ReturnType<typeof import('../data/empty').emptyDatabase>) => void;
  isQuizCategoryOpen: boolean;
  openQuizCategory: (config?: Partial<QuizConfig>) => void;
  closeQuizCategory: () => void;
  isQuizGroupDetailOpen: boolean;
  currentQuizGroup: QuestionGroup | null;
  openQuizGroupDetail: (group: QuestionGroup) => void;
  closeQuizDetail: () => void;
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
  openQuizResult: (
    answers: QuizAnswer[],
    config: QuizConfig,
    startTime: number,
    correctCount: number,
    totalCount: number
  ) => void;
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

  // workspace (Fase 3) — registry compartilhado (mobile e desktop usam o mesmo
  // AppContext). O workspace ativo tagueia os registros de domínio; a casca
  // desktop também espelha esse ponteiro na sessão visual (session.activeWorkspaceId).
  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  currentWorkspaceId: string;
  currentWorkspace: Workspace;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string, kind: Workspace['kind']) => void;

  // conhecimento (Fase 6) — relations + inbox
  relations: Relation[];
  suggestions: Suggestion[];
  associationPolicies: AssociationPolicy[];
  addExplicitRelation: (input: {
    sourceId: string;
    targetId: string;
    kind: RelationKind;
    label?: string;
  }) => Relation;
  createSuggestion: (input: {
    type: SuggestionType;
    payload: Record<string, unknown>;
  }) => Suggestion;
  acceptSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  setAssociationPolicy: (rule: string, action: 'block' | 'reject') => void;

  // produção acadêmica (Fase 8)
  projects: Project[];
  outputs: Output[];
  createProject: (input: {
    title: string;
    type?: ProjectType;
    templateId?: string;
  }) => Project | null;
  updateProject: (updated: Project) => void;
  createOutput: (input: {
    projectId: string;
    name: string;
    type?: ProjectType;
    format?: OutputFormat;
    citationProfile?: CitationProfile;
  }) => Output;
  updateOutput: (updated: Output) => void;
  deleteOutput: (id: string) => void;

  // actions
  handleNavigate: (tab: NavTab, subTab?: string, target?: string) => void;
  handleToggleTask: (taskId: string) => void;
  handleToggleExam: (examId: string) => void;
  handleAddTask: (task: Task) => void;
  handleUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  handleAddClassNote: (note: ClassNote) => void;
  handleUpdateClassNote: (note: ClassNote) => void;
  handleAddConcept: (concept: PsychologyConcept) => void;
  /** Adota um rascunho do acervo (idempotente por nome): devolve o id real a usar. */
  adoptAcervoConcept: (draft: ConceptDraft) => string;
  handleAddMaterial: (material: MaterialItem) => void;
  handleAddReading: (reading: ReadingItem) => void;
  handleUpdateReadingPages: (readingId: string, newPages: number) => void;
  handleAddFlashcard: (card: Flashcard) => void;
  handleReviewFlashcard: (id: string, quality: 0 | 1 | 2 | 3) => void;
  handleAddInternshipLog: (log: InternshipLog) => void;
  handleAddExam: (exam: Exam) => void;
  handleAddCourse: (course: Course) => void;
  handleAddAuthor: (author: PsychologyAuthor) => void;
  /** Frequência detalhada (spec-frequencia.md): marca a aula de hoje na disciplina. */
  markAttendance: (courseId: string, status: AttendanceStatus) => void;
  updateAttendanceRecord: (courseId: string, recordId: string, patch: Partial<Pick<AttendanceRecord, 'status' | 'noteId' | 'hours'>>) => void;
  removeAttendanceRecord: (courseId: string, recordId: string) => void;
  /** Adota um autor do acervo (idempotente por nome): devolve o id real a usar. */
  adoptAcervoAuthor: (draft: AuthorDraft) => string;
  handleAddSession: (session: StudySession) => void;
  handleAddTechnique: (technique: Technique) => void;
  handleUpdateReadingChapters: (
    readingId: string,
    chapters: ReadingItem['chapters']
  ) => void;
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

/**
 * Remove os grupos por domínio de `DataActions & DataActionGroups`, devolvendo
 * apenas os handlers achatados (`DataActions`). Os grupos (PERF-001 A.3) são
 * expostos pelas cascas em contextos próprios — aqui só interessam os handlers.
 */
export function pickDomainActions(
  actions: DataActions & DataActionGroups,
): DataActions {
  const { courses: _courses, study: _study, knowledge: _knowledge, app: _app, ...handlers } = actions;
  void _courses;
  void _study;
  void _knowledge;
  void _app;
  return handlers;
}

/**
 * Monta o `AppContextValue` flat a partir das três camadas (spec 07 §6.6):
 * dados (`DataClientValue`), valor compartilhado (workspace/streak/handlers
 * comuns) e navegação por app. Usado pelos providers de cada plataforma
 * (Mobile/Desktop) — garante a mesma superfície para as views.
 */
export function buildAppContextValue(
  data: DataClientValue,
  shared: SharedAppValue,
  nav: NavigationValue,
): AppContextValue {
  return {
    ...data,
    // workspace ativo & pontes compartilhadas
    currentWorkspaceId: shared.currentWorkspaceId,
    currentWorkspace: shared.currentWorkspace,
    streakStats: shared.streakStats,
    currentWeekProgress: shared.currentWeekProgress,
    toggleBookmarkCourse: shared.toggleBookmarkCourse,
    updateReminder: shared.updateReminder,
    setGcalEnabled: shared.setGcalEnabled,
    toggleSaveBook: shared.toggleSaveBook,
    updateReadingProgress: shared.updateReadingProgress,
    stickerState: shared.stickerState,
    // ações de domínio / workspace
    // ⚠️ os grupos por domínio (PERF-001 A.3) ficam nos sub-contextos
    // (CoursesActionsContext etc. montados pelas cascas) — não vazam para o
    // value flat, onde os nomes colidiriam com os arrays de dados (courses…).
    ...pickDomainActions(shared.dataActions),
    ...shared.workspaceActions,
    // navegação (pilha por app)
    ...nav,
  };
}