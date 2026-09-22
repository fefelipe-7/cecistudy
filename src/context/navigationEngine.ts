import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  NavTab,
  NavScreen,
  SubTabFaculdade,
  SubTabBiblioteca,
  Course,
  ClassNote,
  PsychologyApproach,
  PsicoterapiaFamily,
  StudyScreen,
  TempleSection,
  QuestionGroup,
  QuizConfig,
  QuizAnswer,
  QuizPlayState,
  WizardFlow,
  LooseNote,
  ManagedItem,
  ManagedItemKind,
  DynamicHeaderConfig,
  StudyQuestion,
} from '../types';
import { PSICOTERAPIA_FAMILIES } from '../data/psicoterapiaFamilies';
import { getCatalogQuestions } from '../lib/db/catalogDb';
import { isNativePlatform } from '../lib/storage';
import { hapticSuccess } from '../lib/haptics';
import { scrollToTop } from '../lib/scroll';
import { setNavMotionContext } from '../lib/motion';
import { parseRoute, routeToStack, stackToHash } from '../lib/routing';
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
import { deleteManagedItem as applyDelete, MANAGED_KIND_REMOVED, ManagedDB } from '../lib/entityOps';
import type { DataClientValue } from './DataClientProvider';
import type { SharedAppValue } from './sharedAppValue';

/**
 * Fluxo de wizard correspondente a cada entidade editável (identidade, exceto
 * os casos especiais tratados direto no `editManagedItem`: course, class,
 * looseNote, quizSession).
 */
const MANAGED_KIND_TO_FLOW: Partial<Record<ManagedItemKind, WizardFlow>> = {
  task: 'task',
  exam: 'exam',
  concept: 'concept',
  material: 'material',
  reading: 'reading',
  flashcard: 'flashcard',
  session: 'session',
  internship: 'internship',
  author: 'author',
};

/** Kinds que vivem na camada overlay (fade+scale) — push/pop deles não muda a camada de slide. */
const OVERLAY_KINDS = new Set<NavScreen['kind']>([
  'compose',
  'composeDetails',
  'wizard',
  'noteDetail',
  'noteTransform',
]);

/**
 * Motor de navegação compartilhado (spec 07 §6.6): a pilha push/pop + telas
 * derivadas + modais + header dinâmico. Não depende da plataforma — a casca
 * mobile instancia o SEU motor via `useMobileNavigation`, mantendo pilha própria.
 */
export interface NavigationValue {
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
  /** Detalhe full-screen de uma aula, empilhado sobre o curso (`#/faculdade/:courseId/aula/:classNoteId`). */
  isClassNoteDetailOpen: boolean;
  focusedClassNoteId: string | null;
  focusedClassNote: ClassNote | undefined;
  openClassNoteDetail: (classNoteId: string) => void;
  closeClassNoteDetail: () => void;
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

  // detalhe / transformação de nota avulsa
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

  // composição de nota (captura rápida)
  isComposeScreenOpen: boolean;
  composeCourseId: string | undefined;
  openCompose: (courseId?: string) => void;
  closeCompose: () => void;

  // wizard de detalhes da aula
  isComposeDetailsOpen: boolean;
  wizardNoteId: string | null;
  openComposeDetails: (noteId: string) => void;
  closeComposeDetails: () => void;

  // prompt "quer dar mais detalhes?" após salvar uma aula
  isDetailPromptOpen: boolean;
  detailNoteId: string | null;
  openDetailPrompt: (noteId: string) => void;
  closeDetailPrompt: () => void;

  // telas auxiliares
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
  isSyncScreenOpen: boolean;
  openSyncScreen: () => void;
  closeSyncScreen: () => void;

  // quiz
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

  // Quiz helpers (extraídos da pilha de navegação)
  currentQuizPlayState: QuizPlayState | null;
  currentQuizResultAnswers: QuizAnswer[] | null;
  currentQuizResultConfig: QuizConfig | null;
  currentQuizResultStartTime: number | null;
  currentQuizResultCorrectCount: number | null;
  currentQuizResultTotalCount: number | null;
  currentQuizResultPool: StudyQuestion[] | null;

  // quick capture / wizards
  isQuickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
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
  wizardEdit: ManagedItem | null;

  // modais de edição
  isEditCourseOpen: boolean;
  editCourseId: string | null;
  openEditCourse: (courseId?: string) => void;
  closeEditCourse: () => void;
  isEditTccOpen: boolean;
  openEditTcc: () => void;
  closeEditTcc: () => void;
  isCreatingLooseNote: boolean;
  setIsCreatingLooseNote: (v: boolean) => void;

  // busca global
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  handleNavigate: (tab: NavTab, subTab?: string, target?: string) => void;

  // header dinâmico
  headerConfig: DynamicHeaderConfig | null;
}

export function useNavigationEngine(
  data: DataClientValue,
  shared: SharedAppValue,
): NavigationValue {
  const {
    courses,
    setCourses,
    classes,
    setClasses,
    tasks,
    setTasks,
    exams,
    setExams,
    authors,
    setAuthors,
    concepts,
    setConcepts,
    readings,
    setReadings,
    flashcards,
    setFlashcards,
    materials,
    setMaterials,
    internshipLogs,
    setInternshipLogs,
    sessions,
    setSessions,
    quizSessions,
    setQuizSessions,
    looseNotes,
    setLooseNotes,
    bookmarkedCourseIds,
    setBookmarkedCourseIds,
    approaches,
    questions,
    setQuestions,
    tcc,
    showToast,
  } = data;
  const { toggleBookmarkCourse } = shared;

  // Navigation state — pilha nativa (push/pop)
  const [navigationStack, setNavigationStack] = useState<NavScreen[]>([
    { kind: 'tab', tab: 'home' },
  ]);
  const [navDirection, setNavDirection] = useState<0 | 1 | -1>(0);
  const navigationStackRef = useRef<NavScreen[]>(navigationStack);
  // Cada atualização da pilha gera uma identidade nova para a camada de slide.
  // Isso evita colisão quando a usuária volta rapidamente a uma tela já visitada
  // (ex.: Home → Biblioteca → Home enquanto a camada anterior ainda sai).
  const navigationRevisionRef = useRef(0);
  const [navigationRevision, setNavigationRevision] = useState(0);

  /**
   * Atualiza a pilha e deriva a direção da transição (push=1 · pop=-1 · troca=0).
   * A `navigationRevision` (que alimenta o `slideKey`) só bumpa quando a camada de
   * slide muda de verdade — push/pop de OVERLAY_KINDS (compose/wizard/nota) não
   * remonta a tela de baixo, preservando o estado local (ex.: sub-tab ativa).
   */
  const setStack = useCallback((next: NavScreen[]) => {
    const prev = navigationStackRef.current;
    const dir = next.length > prev.length ? 1 : next.length < prev.length ? -1 : 0;
    const prevTop = prev[prev.length - 1];
    const nextTop = next[next.length - 1];
    const isOverlayChange =
      OVERLAY_KINDS.has(prevTop.kind) || OVERLAY_KINDS.has(nextTop.kind);
    // Direção fresca para as variantes de exit (lida no frame em que a tela sai).
    setNavMotionContext(dir);
    setNavDirection(dir);
    setNavigationStack(next);
    navigationStackRef.current = next;
    if (!isOverlayChange) {
      const revision = navigationRevisionRef.current + 1;
      navigationRevisionRef.current = revision;
      setNavigationRevision(revision);
    }
  }, []);

  /**
   * Atualização de payload da pilha que NÃO é navegação: não bumpa
   * `navigationRevision`/`navDirection`, não toca hash nem scroll. Usado para
   * estado interno de telas persistidas na pilha (ex.: QuizPlayState) sem
   * causar remount do SlideScreen (`slideKey` inclui a revisão).
   */
  const setStackSilent = useCallback((next: NavScreen[]) => {
    setNavigationStack(next);
    navigationStackRef.current = next;
  }, []);

  const [subTabFaculdade, setSubTabFaculdade] = useState<SubTabFaculdade>('calendario');
  const [subTabBiblioteca, setSubTabBiblioteca] = useState<SubTabBiblioteca>('autores');
  const [targetId, setTargetId] = useState<string | undefined>(undefined);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isEditTccOpen, setIsEditTccOpen] = useState(false);
  const [isCreatingLooseNote, setIsCreatingLooseNote] = useState(false);

  // Menu universal de editar/excluir (aberto por long-press no card)
  const [managedItem, setManagedItem] = useState<ManagedItem | null>(null);
  // Matéria em edição no EditCourseModal (payload fora da URL)
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  // Entidade em edição nos wizards (payload fora da URL, igual wizardNoteId)
  const [wizardEdit, setWizardEdit] = useState<ManagedItem | null>(null);

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
    currentScreen.kind === 'tab'
      ? currentScreen.tab
      : navigationStack[0].kind === 'tab'
        ? navigationStack[0].tab
        : 'home';
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
  const focusedTempleSection =
    currentScreen.kind === 'templeSection' ? currentScreen.section : null;
  const isFamiliesScreenOpen = currentScreen.kind === 'families';
  const focusedFamilyId = currentScreen.kind === 'family' ? currentScreen.familyId : null;
  const focusedApproachId = currentScreen.kind === 'approach' ? currentScreen.approachId : null;
  const focusedApproach = focusedApproachId
    ? approaches.find((a) => a.id === focusedApproachId)
    : undefined;
  const focusedFamily = focusedFamilyId
    ? PSICOTERAPIA_FAMILIES.find((f) => f.id === focusedFamilyId)
    : undefined;
  const focusedComparisonSlug = currentScreen.kind === 'comparison' ? currentScreen.slug : null;
  const isBottomNavVisible = currentScreen.kind === 'tab';
  const isComposeScreenOpen = currentScreen.kind === 'compose';
  const isComposeDetailsOpen = currentScreen.kind === 'composeDetails';
  const isWizardOpen = currentScreen.kind === 'wizard';
  const currentWizardType: WizardFlow | null =
    currentScreen.kind === 'wizard' ? currentScreen.type : null;
  const isQuizCategoryOpen = currentScreen.kind === 'quiz-category';
  const isQuizGroupDetailOpen = currentScreen.kind === 'quiz-group-detail';
  const currentQuizGroup = currentScreen.kind === 'quiz-group-detail' ? currentScreen.group : null;
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
      : (navigationStack.find(
          (s) => s.kind === 'quiz-play'
        ) as Extract<NavScreen, { kind: 'quiz-play' }> | undefined)?.state.pool ?? null) ?? null;
  const focusedCourseId =
    currentScreen.kind === 'course'
      ? currentScreen.courseId
      : currentScreen.kind === 'classNote'
        ? currentScreen.courseId
        : null;
  const focusedCourse = focusedCourseId ? courses.find((c) => c.id === focusedCourseId) : undefined;
  const isClassNoteDetailOpen = currentScreen.kind === 'classNote';
  const focusedClassNoteId = currentScreen.kind === 'classNote' ? currentScreen.classNoteId : null;
  const focusedClassNote = focusedClassNoteId
    ? classes.find((n) => n.id === focusedClassNoteId)
    : undefined;
  const focusedStudyScreen: StudyScreen | null =
    currentScreen.kind === 'study' ? currentScreen.screen : null;
  /** Sessão de foco imersiva em tela (chrome preto + orientação landscape). */
  const isFocusImmersiveOpen =
    focusedStudyScreen !== null && focusedStudyScreen === 'focus';

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
        : currentScreen.kind === 'classNote'
          ? `classNote-${currentScreen.classNoteId}`
          : currentScreen.kind === 'notes'
            ? 'notes'
            : currentScreen.kind === 'temple'
            ? 'temple'
            : currentScreen.kind === 'comparison'
              ? `comparison-${currentScreen.slug}`
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
  const slideBaseKey =
    currentScreen.kind === 'tab'
      ? `tab-${currentScreen.tab}`
      : currentScreen.kind === 'course'
        ? `course-${currentScreen.courseId}`
        : currentScreen.kind === 'classNote'
          ? `course-${currentScreen.courseId}`
          : currentScreen.kind === 'notes'
            ? 'notes'
            : currentScreen.kind === 'noteDetail' || currentScreen.kind === 'noteTransform'
            ? 'notes'
            : currentScreen.kind === 'temple'
              ? 'temple'
              : currentScreen.kind === 'templeSection'
                ? `temple-${currentScreen.section}`
                : currentScreen.kind === 'comparison'
                  ? `comparison-${currentScreen.slug}`
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
  const slideKey = `${slideBaseKey}-${navigationRevision}`;

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

  /** Sub-tab atual da aba base (para codificar no hash quando não for a padrão). */
  const currentSubTabFor = useCallback(
    (tab: NavTab): string | undefined => {
      switch (tab) {
        case 'faculdade':
          return subTabFaculdade;
        case 'biblioteca':
          return subTabBiblioteca;
        default:
          return undefined;
      }
    },
    [subTabFaculdade, subTabBiblioteca]
  );

  /** Sincroniza o `location.hash` (espelho) com a pilha, incluindo a sub-tab da aba base. */
  const syncHash = useCallback(
    (next: NavScreen[]) => {
      const top = next[next.length - 1];
      const baseTab =
        top.kind === 'tab' ? top.tab : next[0]?.kind === 'tab' ? next[0].tab : undefined;
      const h = stackToHash(next, baseTab ? currentSubTabFor(baseTab) : undefined);
      // O guard precisa estar atualizado ANTES de tocar no location.hash — o navegador
      // dispara `hashchange` (applyRoute) quando o hash muda, e sem isso o eco seria
      // reaplicado e clampearia pilhas com estado transitório (ex.: quiz-play/quiz-result).
      lastSyncedHashRef.current = h;
      if (location.hash !== h) location.hash = h;
    },
    [currentSubTabFor]
  );

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
    if (isQuickAddOpen) {
      setIsQuickAddOpen(false);
      return true;
    }
    if (isSearchOpen) {
      setIsSearchOpen(false);
      return true;
    }
    if (isEditCourseOpen) {
      setIsEditCourseOpen(false);
      return true;
    }
    if (isEditTccOpen) {
      setIsEditTccOpen(false);
      return true;
    }
    if (isDetailPromptOpen) {
      setIsDetailPromptOpen(false);
      return true;
    }
    if (navigationStack.length > 1) {
      goBack();
      return true;
    }
    return false;
  }, [
    isQuickAddOpen,
    isSearchOpen,
    isEditCourseOpen,
    isEditTccOpen,
    isDetailPromptOpen,
    navigationStack,
    goBack,
  ]);

  const handleNavigate = useCallback(
    (tab: NavTab, subTab?: string, target?: string) => {
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
        next =
          subTab === 'questoes'
            ? [base, { kind: 'quiz-category' }]
            : subTab === 'sessoes'
              ? [base]
              : [base, { kind: 'study', screen: screenMap[subTab] }];
      } else {
        next =
          tab === 'faculdade' && target ? [base, { kind: 'course', courseId: target }] : [base];
      }
      setStack(next);
      setTargetId(target);
      syncHash(next);
      scrollToTop();
    },
    [setStack, setTargetId, syncHash, setSubTabFaculdade, setSubTabBiblioteca]
  );

  const openCourseDetail = useCallback(
    (courseId: string) => {
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
    },
    [navigationStack, setStack, setTargetId, syncHash]
  );

  const closeCourseDetail = useCallback(() => goBack(), [goBack]);

  /** Abre o detalhe full-screen de uma aula, empilhado sobre o curso da matéria. */
  const openClassNoteDetail = useCallback(
    (classNoteId: string) => {
      const note = classes.find((c) => c.id === classNoteId);
      if (!note) return;
      const top = navigationStack[navigationStack.length - 1];
      if (top.kind === 'classNote' && top.classNoteId === classNoteId) return;
      const courseBelow = navigationStack.find(
        (s): s is Extract<NavScreen, { kind: 'course' }> => s.kind === 'course'
      );
      const courseIdx = courseBelow ? navigationStack.indexOf(courseBelow) : -1;
      // Base sobre o curso da aula (substitui qualquer detalhe acima dele) — nunca empilha
      // um detalhe sobre outro.
      const base: NavScreen[] =
        courseBelow && courseBelow.courseId === note.courseId
          ? navigationStack.slice(0, courseIdx + 1)
          : [{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: note.courseId }];
      const next: NavScreen[] = [
        ...base,
        { kind: 'classNote', classNoteId, courseId: note.courseId },
      ];
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [classes, navigationStack, setStack, syncHash]
  );

  const closeClassNoteDetail = useCallback(() => goBack(), [goBack]);

  const openNotesScreen = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'notes'
        ? navigationStack
        : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeNotesScreen = useCallback(() => goBack(), [goBack]);

  const openNoteDetail = useCallback(
    (noteId: string) => {
      const top = navigationStack[navigationStack.length - 1];
      if (top.kind === 'noteDetail' && top.noteId === noteId) return;
      const next: NavScreen[] =
        top.kind === 'notes'
          ? [...navigationStack, { kind: 'noteDetail', noteId }]
          : [
              { kind: 'tab', tab: 'biblioteca' },
              { kind: 'notes' },
              { kind: 'noteDetail', noteId },
            ];
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash]
  );

  const closeNoteDetail = useCallback(() => goBack(), [goBack]);

  const openNoteTransform = useCallback(
    (noteId: string) => {
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
    },
    [navigationStack, setStack, syncHash]
  );

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
      top.kind === 'temple'
        ? navigationStack
        : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'temple' }];
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
            : [
                { kind: 'tab', tab: 'biblioteca' },
                { kind: 'temple' },
                { kind: 'templeSection', section },
              ];
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
      top.kind === 'families'
        ? navigationStack
        : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'families' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeFamilies = useCallback(() => goBack(), [goBack]);

  const openFamily = useCallback(
    (familyId: string) => {
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
    },
    [navigationStack, setStack, syncHash]
  );

  const closeFamily = useCallback(() => goBack(), [goBack]);

  const openApproach = useCallback(
    (approachId: string) => {
      const top = navigationStack[navigationStack.length - 1];
      const next: NavScreen[] =
        top.kind === 'approach' && top.approachId === approachId
          ? navigationStack
          : [...navigationStack, { kind: 'approach', approachId }];
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash]
  );

  const closeApproach = useCallback(() => goBack(), [goBack]);

  const openComparison = useCallback(
    (slug: string) => {
      const top = navigationStack[navigationStack.length - 1];
      const next: NavScreen[] =
        top.kind === 'comparison' && top.slug === slug
          ? navigationStack
          : [...navigationStack, { kind: 'comparison', slug }];
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash, scrollToTop]
  );

  const closeComparison = useCallback(() => goBack(), [goBack]);

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
      top.kind === 'tcc'
        ? navigationStack
        : [{ kind: 'tab', tab: 'estudos' as NavTab }, { kind: 'tcc' } as const];
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

  const openQuizCategory = useCallback(
    (_config?: Partial<QuizConfig>) => {
      const next = stackAfterOpenQuizCategory(navigationStack);
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash]
  );

  const closeQuizCategory = useCallback(() => goBack(), [goBack]);

  function isQuizSection(
    s: NavScreen
  ): s is Extract<NavScreen, { kind: 'quiz-category' | 'quiz-group-detail' }> {
    return s.kind === 'quiz-category' || s.kind === 'quiz-group-detail';
  }

  const openQuizGroupDetail = useCallback(
    (group: QuestionGroup) => {
      const top = navigationStack[navigationStack.length - 1];
      // Encontra a última seção de quiz ou usa a base estudos
      const qi = [...navigationStack].reverse().findIndex(isQuizSection);
      const base: NavScreen[] =
        qi !== -1
          ? navigationStack.slice(0, navigationStack.length - qi)
          : [{ kind: 'tab', tab: 'estudos' }, { kind: 'quiz-category' }];
      // Troca ou empilha o detalhe do grupo
      const isDetailOnTop = base.length > 0 && base[base.length - 1].kind === 'quiz-group-detail';
      const next: NavScreen[] = isDetailOnTop
        ? base.map((s): NavScreen =>
            s.kind === 'quiz-group-detail' ? { kind: 'quiz-group-detail', group } : s
          )
        : [...base, { kind: 'quiz-group-detail', group }];
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash]
  );

  const closeQuizDetail = useCallback(() => goBack(), [goBack]);

  /** Splash de preparação do quiz: empilha a tela que garante o acervo em memória. */
  const openQuizLoading = useCallback(
    (config: QuizConfig) => {
      const next = stackAfterOpenQuizLoading(navigationStack, config);
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash]
  );

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

  const openStudy = useCallback(
    (screen: StudyScreen) => {
      const top = navigationStack[navigationStack.length - 1];
      const base: readonly NavScreen[] =
        top.kind === 'tab' && top.tab === 'estudos'
          ? navigationStack
          : [{ kind: 'tab' as const, tab: 'estudos' as NavTab }];
      const next: NavScreen[] =
        top.kind === 'study' && top.screen === screen
          ? navigationStack
          : [...base, { kind: 'study' as const, screen }];
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash]
  );

  const closeStudy = useCallback(() => goBack(), [goBack]);

  const openQuizPlay = useCallback(
    (pool: StudyQuestion[], config: QuizConfig) => {
      const next = stackAfterOpenQuizPlay(navigationStack, pool, config, Date.now());
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash]
  );

  const closeQuizPlay = useCallback(() => goBack(), [goBack]);

  const openQuizResult = useCallback(
    (
      answers: QuizAnswer[],
      config: QuizConfig,
      startTime: number,
      correctCount: number,
      totalCount: number
    ) => {
      const next = stackAfterOpenQuizResult(navigationStack, {
        answers,
        config,
        startTime,
        correctCount,
        totalCount,
      });
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash]
  );

  /** Volta do resultado para o seletor de assuntos (mantém quiz-category; política de back nativo). */
  const closeQuizResult = useCallback(() => {
    const next = stackAfterCloseQuizResult(navigationStack);
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  /** Atualiza o estado do quiz em jogo (adiciona resposta ou avança questão). */
  const updateQuizPlayState = useCallback(
    (updates: Partial<QuizPlayState>) => {
      const playScreen = navigationStack.find((s) => s.kind === 'quiz-play') as any;
      if (!playScreen) return;

      const current = playScreen.state as QuizPlayState;
      const updatedState: QuizPlayState = { ...current, ...updates };

      const stack = navigationStack.map((screen) =>
        screen.kind === 'quiz-play' ? { ...screen, state: updatedState } : screen
      );
      setStackSilent(stack);
    },
    [navigationStack, setStackSilent]
  );

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

  const openCompose = useCallback(
    (courseId?: string) => {
      setComposeCourseId(courseId);
      const top = navigationStack[navigationStack.length - 1];
      const next: NavScreen[] =
        top.kind === 'compose' ? navigationStack : [...navigationStack, { kind: 'compose' }];
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash, setComposeCourseId]
  );

  const closeCompose = useCallback(() => {
    setComposeCourseId(undefined);
    goBack();
  }, [goBack, setComposeCourseId]);

  const openComposeDetails = useCallback(
    (noteId: string) => {
      setWizardNoteId(noteId);
      const top = navigationStack[navigationStack.length - 1];
      const next: NavScreen[] =
        top.kind === 'composeDetails'
          ? navigationStack
          : [...navigationStack, { kind: 'composeDetails' }];
      setStack(next);
      syncHash(next);
      scrollToTop();
    },
    [navigationStack, setStack, syncHash, setWizardNoteId]
  );

  const closeComposeDetails = useCallback(() => {
    setWizardNoteId(null);
    goBack();
  }, [goBack, setWizardNoteId]);

  const openDetailPrompt = useCallback(
    (noteId: string) => {
      setDetailNoteId(noteId);
      setIsDetailPromptOpen(true);
    },
    []
  );

  const closeDetailPrompt = useCallback(() => {
    setDetailNoteId(null);
    setIsDetailPromptOpen(false);
  }, []);

  const openEditCourse = useCallback(
    (courseId?: string) => {
      setEditCourseId(courseId ?? null);
      setIsEditCourseOpen(true);
    },
    []
  );
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

  const openQuickAdd = useCallback(() => {
    setIsQuickAddOpen(true);
  }, []);
  const closeQuickAdd = useCallback(() => {
    setIsQuickAddOpen(false);
  }, []);

  const openWizard = useCallback(
    (type: WizardFlow, courseId?: string) => {
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
    },
    [navigationStack, setStack, syncHash, setWizardCourseId]
  );

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

  const deleteManagedItem = useCallback(
    (kind: ManagedItemKind, id: string) => {
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
    },
    [
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
      setManagedItem,
      showToast,
    ]
  );

  /** Curso pré-selecionado ao abrir a edição de um item (quando aplicável). */
  const resolveManageCourseId = useCallback(
    (kind: ManagedItemKind, id: string): string | undefined => {
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
    },
    [tasks, exams, readings, flashcards, sessions, concepts, materials]
  );

  /** Abre a edição correta para uma entidade (wizard, modal ou tela própria). */
  const editManagedItem = useCallback(
    (kind: ManagedItemKind, id: string) => {
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
      const type = MANAGED_KIND_TO_FLOW[kind];
      if (!type) return;
      openWizard(type, courseId);
      setWizardEdit({ kind, id });
    },
    [openEditCourse, openComposeDetails, openNoteDetail, openWizard, resolveManageCourseId]
  );

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const setActiveTab = useCallback((tab: NavTab) => handleNavigate(tab), [handleNavigate]);
  const setFocusedCourseId = useCallback(
    (id: string | null) => {
      if (id) openCourseDetail(id);
      else if (currentScreen.kind === 'course') goBack();
    },
    [openCourseDetail, goBack, currentScreen.kind]
  );

  // Header dinâmico (memoizado: não recria entre renders de dados)
  const headerConfig = useMemo<DynamicHeaderConfig | null>(() => {
    return buildHeaderConfig({
      currentScreen,
      focusedFamily,
      focusedApproach,
      focusedCourse,
      focusedClassNote,
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
      editManagedItem,
    });
  }, [
    currentScreen,
    focusedFamily,
    focusedApproach,
    focusedCourse,
    focusedClassNote,
    bookmarkedCourseIds,
    setIsCreatingLooseNote,
    goBack,
    openCompose,
    openWizard,
    openEditCourse,
    toggleBookmarkCourse,
    openEditTcc,
    tcc.title,
    questions.length,
    currentQuizPlayState,
    editManagedItem,
    currentQuizResultCorrectCount,
    currentQuizResultTotalCount,
    dueCardsCount,
  ]);

  return useMemo(
    () => ({
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
    subTabBiblioteca,
    setSubTabBiblioteca,
    focusedStudyScreen,
    isFocusImmersiveOpen,
    openStudy,
    closeStudy,
    targetId,
    setTargetId,
    focusedCourseId,
    setFocusedCourseId,
    focusedCourse,
    openCourseDetail,
    closeCourseDetail,
    isClassNoteDetailOpen,
    focusedClassNoteId,
    focusedClassNote,
    openClassNoteDetail,
    closeClassNoteDetail,
    isBottomNavVisible,
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
    focusedComparisonSlug,
    openComparison,
    closeComparison,
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
    isQuizCategoryOpen,
    openQuizCategory,
    closeQuizCategory,
    isQuizGroupDetailOpen,
    currentQuizGroup,
    openQuizGroupDetail,
    closeQuizDetail,
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
    handleNavigate,
    currentQuizPlayState,
    currentQuizResultAnswers,
    currentQuizResultConfig,
    currentQuizResultStartTime,
    currentQuizResultCorrectCount,
    currentQuizResultTotalCount,
    currentQuizResultPool,
    headerConfig,
    }),
    [
      activeTab, canGoBack, closeAllNoteScreens, closeAllQuizScreens, closeApproach,
      closeComparison, closeCompose, closeComposeDetails, closeCourseDetail, closeDetailPrompt,
      closeClassNoteDetail, closeEditCourse, closeEditTcc, closeFamilies, closeFamily, closeInternshipDiary,
      closeManageItem, closeNoteDetail, closeNoteTransform, closeNotesScreen, closeQuickAdd,
      closeQuizCategory, closeQuizDetail, closeQuizLoading, closeQuizPlay, closeQuizResult,
      closeSearch, closeStickersScreen, closeStreak, closeStudy, closeSyncScreen, closeTccScreen,
      closeTemple, closeTempleSection, closeWizard, composeCourseId, currentQuizGroup,
      currentQuizLoadingConfig, currentQuizPlayState, currentQuizResultAnswers,
      currentQuizResultConfig, currentQuizResultCorrectCount, currentQuizResultPool,
      currentQuizResultStartTime, currentQuizResultTotalCount, currentWizardType,
      deleteManagedItem, detailNoteId, editCourseId, editManagedItem, ensureQuestionsLoaded,
      focusedApproach, focusedApproachId, focusedClassNote, focusedClassNoteId,
      focusedComparisonSlug, focusedCourse, focusedCourseId,
      focusedFamily, focusedFamilyId, focusedNote, focusedNoteId, focusedStudyScreen,
      focusedTempleSection, handleNavigate, handleSystemBack, headerConfig,
      isBottomNavVisible, isClassNoteDetailOpen, isComposeDetailsOpen, isComposeScreenOpen, isCreatingLooseNote,
      isDetailPromptOpen, isEditCourseOpen, isEditTccOpen, isFamiliesScreenOpen,
      isInternshipDiaryOpen, isNoteDetailOpen, isNoteTransformOpen, isNotesScreenOpen,
      isQuickAddOpen, isQuizCategoryOpen, isQuizGroupDetailOpen, isQuizLoadingOpen,
      isQuizPlayOpen, isQuizResultOpen, isSearchOpen, isStickersScreenOpen, isStreakScreenOpen,
      isSyncScreenOpen, isTccScreenOpen, isTempleScreenOpen, isWizardOpen, managedItem,
      navDirection, navigationStack, newQuizFromResult, openApproach, openComparison, openCompose,
      openComposeDetails, openCourseDetail, openDetailPrompt, openEditCourse, openEditTcc,
      openClassNoteDetail, openFamilies, openFamily, openInternshipDiary, openManageItem, openNoteDetail,
      openNoteTransform, openNotesScreen, openQuickAdd, openQuizCategory, openQuizGroupDetail,
      openQuizLoading, openQuizPlay, openQuizResult, openSearch, openStickersScreen, openStreak,
      openStudy, openSyncScreen, openTaskExamWizard, openTccScreen, openTemple, openTempleSection,
      openWizard, overlayKey, screenKey, setActiveTab, setFocusedCourseId, setIsCreatingLooseNote,
      setStack, setSubTabBiblioteca, setSubTabFaculdade, setTargetId, slideKey,
      subTabBiblioteca, subTabFaculdade, syncHash, targetId, updateQuizPlayState,
      wizardCourseId, wizardEdit, wizardNoteId,
    ]
  );
}