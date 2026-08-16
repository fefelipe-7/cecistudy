import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FileText, CheckCircle2, Settings2, StickyNote, HeartHandshake, GraduationCap, Sparkles } from 'lucide-react';
import {
  NavTab,
  NavScreen,
  HeaderAction,
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
  TccData,
  Sticker,
  StudySession,
  DynamicHeaderConfig,
  StreakData,
  WizardFlow,
  StudyQuestion,
  Technique,
  PsicoterapiaFamily,
  OnboardingState
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
import { SCHEMA_VERSION } from '../data/schema';
import { exportAppDatabase, importAppDatabase } from '../lib/exportImport';
import { usePersistentState } from '../lib/usePersistentState';
import { storage } from '../lib/storage';
import { hapticTap, hapticSuccess } from '../lib/haptics';
import { scrollToTop } from '../lib/scroll';
import { celebrate } from '../lib/celebrate';
import { shouldCelebrateTasks } from '../lib/taskLogic';
import { scheduleDailyReminder, cancelDailyReminder } from '../lib/notifications';
import {
  Route,
  parseRoute,
  routeToStack,
  stackToHash
} from '../lib/routing';
import { computeStreak, getWeekProgress, isStudyDay, toDateKey, StreakStats, WeekDayCell } from '../lib/streak';
import { LooseNote } from '../components/library/notes';
import { applyStickerUnlocks, mergeCatalogWithProgress } from '../lib/stickers';
import { lockedStickerCatalog } from '../data/stickerCatalog';


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
  tcc: TccData;
  stickers: Sticker[];
  sessions: StudySession[];
  questions: StudyQuestion[];
  techniques: Technique[];
  savedBookIds: string[];
  toggleSaveBook: (bookId: string) => void;
  readingProgress: Record<string, number>;
  updateReadingProgress: (bookId: string, readPages: number) => void;
  reminderSettings: ReminderSettings;
  updateReminder: (settings: ReminderSettings) => void;

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
  setActiveTab: (tab: NavTab) => void;
  subTabFaculdade: SubTabFaculdade;
  setSubTabFaculdade: (t: SubTabFaculdade) => void;
  subTabEstudos: SubTabEstudos;
  setSubTabEstudos: (t: SubTabEstudos) => void;
  subTabBiblioteca: SubTabBiblioteca;
  setSubTabBiblioteca: (t: SubTabBiblioteca) => void;
  targetId: string | undefined;
  setTargetId: (id: string | undefined) => void;
  focusedCourseId: string | null;
  setFocusedCourseId: (id: string | null) => void;
  focusedCourse: Course | undefined;
  openCourseDetail: (courseId: string) => void;
  closeCourseDetail: () => void;
  isBottomNavVisible: boolean;
  isNotesScreenOpen: boolean;
  openNotesScreen: () => void;
  closeNotesScreen: () => void;
  isTempleScreenOpen: boolean;
  openTemple: () => void;
  closeTemple: () => void;
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
  isQuickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  isEditCourseOpen: boolean;
  openEditCourse: () => void;
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
  handleAddReading: (reading: ReadingItem) => void;
  handleUpdateReadingPages: (readingId: string, newPages: number) => void;
  handleAddFlashcard: (card: Flashcard) => void;
  handleReviewFlashcard: (id: string, correct: boolean) => void;
  handleAddInternshipLog: (log: InternshipLog) => void;
  handleAddExam: (exam: Exam) => void;
  handleAddAuthor: (author: PsychologyAuthor) => void;
  handleAddSession: (session: StudySession) => void;
  handleAddTechnique: (technique: Technique) => void;
  handleUpdateReadingChapters: (readingId: string, chapters: ReadingItem['chapters']) => void;
  handleUpdateProfile: (updated: Partial<UserProfile>) => void;
  handleUpdateTcc: (updated: TccData) => void;
  handleUpdateCourse: (updated: Course) => void;

  // header
  headerConfig: DynamicHeaderConfig | null;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // State — defaults vazios (produção); dados de exemplo entram via onboarding/demo
  const [profile, setProfile] = usePersistentState<UserProfile>('profile', emptyProfile);
  const [courses, setCourses] = usePersistentState<Course[]>('courses', []);
  const [classes, setClasses] = usePersistentState<ClassNote[]>('classes', []);
  const [tasks, setTasks] = usePersistentState<Task[]>('tasks', []);
  const [exams, setExams] = usePersistentState<Exam[]>('exams', []);
  const [authors, setAuthors] = usePersistentState<PsychologyAuthor[]>('authors', []);
  const [concepts, setConcepts] = usePersistentState<PsychologyConcept[]>('concepts', []);
  // Abordagens (97, ~1MB) vêm de um módulo lazy — fora do bundle inicial.
  const [approaches, setApproaches] = usePersistentState<PsychologyApproach[]>('approaches', []);
  const approachesSeededRef = useRef(false);
  useEffect(() => {
    if (approachesSeededRef.current || approaches.length > 0) return;
    let cancelled = false;
    import('../data/psicoterapiaApproaches')
      .then((m) => {
        if (cancelled) return;
        approachesSeededRef.current = true;
        setApproaches(m.PSICOTERAPIA_APPROACHES);
      })
      .catch(() => {
        approachesSeededRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [approaches.length]);

  const [readings, setReadings] = usePersistentState<ReadingItem[]>('readings', []);
  const [flashcards, setFlashcards] = usePersistentState<Flashcard[]>('flashcards', []);
  const [materials, setMaterials] = usePersistentState<MaterialItem[]>('materials', []);
  const [internshipLogs, setInternshipLogs] = usePersistentState<InternshipLog[]>('internship', []);
  const [tcc, setTcc] = usePersistentState<TccData>('tcc', emptyTcc);
  const [stickers, setStickers] = usePersistentState<Sticker[]>('stickers', lockedStickerCatalog());
  const [sessions, setSessions] = usePersistentState<StudySession[]>('sessions', []);
  const [questions, setQuestions] = usePersistentState<StudyQuestion[]>('questions', []);
  const [techniques, setTechniques] = usePersistentState<Technique[]>('techniques', []);

  // Questões (745) — banco estático, seed lazy igual abordagens.
  const questionsSeededRef = useRef(false);
  useEffect(() => {
    if (questionsSeededRef.current || questions.length > 0) return;
    let cancelled = false;
    import('../data/bancoQuestoes')
      .then((m) => {
        if (cancelled) return;
        questionsSeededRef.current = true;
        setQuestions(m.BANCO_QUESTOES);
      })
      .catch(() => {
        questionsSeededRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [questions.length]);

  // Streak de estudos (dias ativos; derivados calculados abaixo)
  const [streakData, setStreakData] = usePersistentState<StreakData>('streakData', emptyStreakData);

  // Lembrete diário de estudo (só efetivo no app nativo)
  const [reminderSettings, setReminderSettings] = usePersistentState<ReminderSettings>('reminder', emptyReminder);

  // Onboarding (primeiro acesso)
  const [onboarding, setOnboarding] = usePersistentState<OnboardingState>('onboarding', emptyOnboarding);

  // Livros salvos da biblioteca (no contexto → entram no export/import)
  const [savedBookIds, setSavedBookIds] = usePersistentState<string[]>('savedBookIds', []);

  // Progresso de leitura por obra (id → páginas lidas), registrado no modal do livro
  const [readingProgress, setReadingProgress] = usePersistentState<Record<string, number>>(
    'readingProgress',
    {}
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
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = usePersistentState<string[]>('bookmarkedCourseIds', []);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isEditTccOpen, setIsEditTccOpen] = useState(false);
  const [isCreatingLooseNote, setIsCreatingLooseNote] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Notas avulsas (global — a tela de composição salva fora da biblioteca)
  const [looseNotes, setLooseNotes] = usePersistentState<LooseNote[]>('looseNotes', []);

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
  const isNotesScreenOpen = currentScreen.kind === 'notes';
  const isTempleScreenOpen = currentScreen.kind === 'temple';
  const isFamiliesScreenOpen = currentScreen.kind === 'families';
  const focusedFamilyId = currentScreen.kind === 'family' ? currentScreen.familyId : null;
  const focusedApproachId = currentScreen.kind === 'approach' ? currentScreen.approachId : null;
  const focusedApproach = focusedApproachId ? approaches.find((a) => a.id === focusedApproachId) : undefined;
  const focusedFamily = focusedFamilyId ? PSICOTERAPIA_FAMILIES.find((f) => f.id === focusedFamilyId) : undefined;
  const isBottomNavVisible = currentScreen.kind === 'tab';
  const isComposeScreenOpen = currentScreen.kind === 'compose';
  const isComposeDetailsOpen = currentScreen.kind === 'composeDetails';
  const isWizardOpen = currentScreen.kind === 'wizard';
  const currentWizardType: WizardFlow | null = currentScreen.kind === 'wizard' ? currentScreen.type : null;
  const focusedCourseId = currentScreen.kind === 'course' ? currentScreen.courseId : null;
  const focusedCourse = focusedCourseId ? courses.find((c) => c.id === focusedCourseId) : undefined;
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
          : currentScreen.kind === 'temple'
            ? 'temple'
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
    if (newlyUnlocked.length > 0) {
      setStickers(updated);
      setProfile((p) => ({
        ...p,
        stickersCollected: p.stickersCollected + newlyUnlocked.length,
      }));
      celebrate('sticker-unlocked');
      hapticSuccess();
      showToast(
        `conquista desbloqueada: ${newlyUnlocked[0].emoji} ${newlyUnlocked[0].name} ♡`
      );
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
    internshipLogs,
    streakStats.current,
    tcc,
    savedBookIds,
    concepts,
    todayKey,
  ]);

  // Limpeza pontual: remove as chaves órfãs do recurso de humor removido (uma vez, ao iniciar)
  useEffect(() => {
    void storage.remove('currentMood');
    void storage.remove('moodHistory');
  }, []);

  // Roteamento hash como espelho (deep-link + voltar/avançar no browser; histórico do webview p/ swipe iOS)
  useEffect(() => {
    const applyRoute = () => {
      const route = parseRoute(location.hash);
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
      showToast('plano do dia completo! parabéns, Ceci 🎉');
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
  };

  const handleUpdateTask = (taskId: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
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

  const handleAddExam = (exam: Exam) => {
    setExams((prev) => [exam, ...prev]);
  };

  const handleAddAuthor = (author: PsychologyAuthor) => {
    setAuthors((prev) => [author, ...prev]);
  };

  const handleAddSession = (session: StudySession) => {
    setSessions((prev) => [session, ...prev]);
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
    } else {
      void cancelDailyReminder();
    }
  };

  const handleUpdateCourse = useCallback((updated: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  /** Aplica um banco completo (empty ou demo) a todos os estados persistidos. */
  const applyDatabase = (db: ReturnType<typeof emptyDatabase>) => {
    setProfile(db.profile);
    setCourses(db.courses);
    setClasses(db.classes);
    setTasks(db.tasks);
    setExams(db.exams);
    setAuthors(db.authors);
    setConcepts(db.concepts);
    setReadings(db.readings);
    setFlashcards(db.flashcards);
    setMaterials(db.materials);
    setInternshipLogs(db.internshipLogs);
    setTcc(db.tcc);
    setStickers(mergeCatalogWithProgress(db.stickers));
    setSessions(db.sessions);
    setQuestions(db.questions);
    setTechniques(db.techniques);
    setStreakData(db.streakData);
    setReminderSettings(db.reminder);
    setLooseNotes(db.looseNotes as LooseNote[]);
    setSavedBookIds(db.savedBookIds);
    setReadingProgress(db.readingProgress ?? {});
    setBookmarkedCourseIds(db.bookmarkedCourseIds);
  };

  /** Carrega os dados de exemplo (onboarding "começar com exemplo" / Perfil → configurações). */
  const loadDemoData = () => {
    applyDatabase(demoDatabase());
    showToast('prontinho, carreguei os exemplos ♡');
  };

  /** Limpa tudo e volta ao estado inicial (zerado). */
  const resetApp = () => {
    applyDatabase(emptyDatabase());
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
  const exportData = () => {
    const payload = {
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        profile, courses, classes, tasks, exams, authors, concepts, approaches,
        readings, flashcards, materials, internshipLogs, tcc, stickers, sessions,
        questions, techniques, streakData,
        reminder: reminderSettings, looseNotes, savedBookIds, bookmarkedCourseIds, onboarding,
        readingProgress,
      },
    };
    exportAppDatabase(payload);
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

  /** Sub-tab atual da aba base (para codificar no hash quando não for a padrão). */
  const currentSubTabFor = useCallback((tab: NavTab): string | undefined => {
    switch (tab) {
      case 'faculdade':
        return subTabFaculdade;
      case 'estudos':
        return subTabEstudos;
      case 'biblioteca':
        return subTabBiblioteca;
      default:
        return undefined;
    }
  }, [subTabFaculdade, subTabEstudos, subTabBiblioteca]);

  /** Sincroniza o `location.hash` (espelho) com a pilha, incluindo a sub-tab da aba base. */
  const syncHash = useCallback((next: NavScreen[]) => {
    const top = next[next.length - 1];
    const baseTab = top.kind === 'tab' ? top.tab : next[0]?.kind === 'tab' ? next[0].tab : undefined;
    const h = stackToHash(next, baseTab ? currentSubTabFor(baseTab) : undefined);
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

  const handleNavigate = useCallback((tab: NavTab, subTab?: string, target?: string) => {
    if (tab === 'faculdade' && subTab) setSubTabFaculdade(subTab as SubTabFaculdade);
    if (tab === 'estudos' && subTab) setSubTabEstudos(subTab as SubTabEstudos);
    if (tab === 'biblioteca' && subTab) setSubTabBiblioteca(subTab as SubTabBiblioteca);
    targetSectionRef.current = subTab;

    const base: NavScreen = { kind: 'tab', tab };
    const next: NavScreen[] =
      tab === 'faculdade' && target ? [base, { kind: 'course', courseId: target }] : [base];
    setStack(next);
    setTargetId(target);
    syncHash(next);
    scrollToTop();
  }, [setStack, setTargetId, syncHash, setSubTabFaculdade, setSubTabEstudos, setSubTabBiblioteca]);

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

  const openTemple = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'temple' ? navigationStack : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'temple' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeTemple = useCallback(() => goBack(), [goBack]);

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
      top.kind === 'approach'
        ? top.approachId === approachId
          ? navigationStack
          : [...navigationStack.slice(0, -1), { kind: 'approach', approachId }]
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
        : [{ kind: 'tab', tab: 'perfil' }, { kind: 'internshipDiary' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeInternshipDiary = useCallback(() => goBack(), [goBack]);

  const openTccScreen = useCallback(() => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'tcc' ? navigationStack : [{ kind: 'tab', tab: 'perfil' }, { kind: 'tcc' }];
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
        : [{ kind: 'tab', tab: 'perfil' }, { kind: 'stickers' }];
    setStack(next);
    syncHash(next);
    scrollToTop();
  }, [navigationStack, setStack, syncHash]);

  const closeStickersScreen = useCallback(() => goBack(), [goBack]);

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

  const openEditCourse = useCallback(() => {
    setIsEditCourseOpen(true);
  }, []);
  const closeEditCourse = useCallback(() => {
    setIsEditCourseOpen(false);
  }, []);

  const openEditTcc = useCallback(() => {
    setIsEditTccOpen(true);
  }, []);
  const closeEditTcc = useCallback(() => {
    setIsEditTccOpen(false);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const openQuickAdd = useCallback(() => {
    setIsQuickAddOpen(true);
  }, []);
  const closeQuickAdd = useCallback(() => {
    setIsQuickAddOpen(false);
  }, []);

  const openWizard = useCallback((type: WizardFlow, courseId?: string) => {
    setWizardCourseId(courseId);
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
    goBack();
  }, [goBack, setWizardCourseId]);
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
  // Dynamic Header Configuration
  let headerConfig: DynamicHeaderConfig | null = null;

  if (currentScreen.kind === 'streak') {
    headerConfig = {
      type: 'detail',
      title: 'sua ofensiva de estudos',
      subtitle: 'a chama dos seus estudos ♡',
      icon: 'Flame',
      color: '#D85F79',
      onBack: () => goBack(),
    };
  } else if (currentScreen.kind === 'internshipDiary') {
    headerConfig = {
      type: 'detail',
      title: 'diário de estágio',
      subtitle: 'todos os registros por extenso',
      icon: 'HeartHandshake',
      color: '#D85F79',
      onBack: () => goBack(),
      actions: [
        { label: 'nova anotação', Icon: HeartHandshake, onClick: () => openWizard('internship') },
      ],
    };
  } else if (currentScreen.kind === 'tcc') {
    headerConfig = {
      type: 'detail',
      title: 'meu tcc',
      subtitle: tcc.title ? 'criando e mantendo seu trabalho' : 'ainda sem título',
      icon: 'GraduationCap',
      color: '#D85F79',
      onBack: () => goBack(),
      actions: [
        { label: 'editar tcc', Icon: FileText, onClick: () => openEditTcc() },
      ],
    };
  } else if (currentScreen.kind === 'stickers') {
    headerConfig = {
      type: 'detail',
      title: 'stickers & conquistas',
      subtitle: 'celebrando cada passo do cantinho ♡',
      icon: 'Sparkles',
      color: '#D85F79',
      onBack: () => goBack(),
    };
  } else if (currentScreen.kind === 'notes') {
    headerConfig = {
      type: 'detail',
      title: 'suas notas avulsas',
      subtitle: 'anotações rápidas e pensamentos soltos',
      icon: 'FileText',
      color: '#D85F79',
      onBack: () => goBack(),
      actions: [
        { label: 'nova nota avulsa', Icon: StickyNote, onClick: () => setIsCreatingLooseNote(true) },
      ],
    };
  } else if (currentScreen.kind === 'temple') {
    headerConfig = {
      type: 'detail',
      title: 'templo de conhecimento',
      subtitle: 'mapa de famílias, conceitos, autores e técnicas',
      icon: 'Landmark',
      color: '#B94862',
      onBack: () => goBack(),
    };
  } else if (currentScreen.kind === 'families') {
    headerConfig = {
      type: 'detail',
      title: 'famílias de psicoterapias',
      subtitle: '10 grupos de teorias e correntes clínicas',
      icon: 'Landmark',
      color: '#B94862',
      onBack: () => goBack(),
    };
  } else if (currentScreen.kind === 'family' && focusedFamily) {
    headerConfig = {
      type: 'detail',
      title: focusedFamily.name,
      subtitle: `${focusedFamily.approachCount} abordagens nesta família`,
      code: String(focusedFamily.order).padStart(2, '0'),
      icon: 'Landmark',
      color: focusedFamily.color,
      onBack: () => goBack(),
    };
  } else if (currentScreen.kind === 'approach' && focusedApproach) {
    headerConfig = {
      type: 'detail',
      title: focusedApproach.name,
      subtitle: focusedApproach.family ?? 'abordagem de psicoterapia',
      icon: 'Brain',
      color: focusedApproach.color,
      onBack: () => goBack(),
    };
  } else if (currentScreen.kind === 'course' && focusedCourse) {
    const isBookmarked = bookmarkedCourseIds.includes(focusedCourse.id);
    const courseActions: HeaderAction[] = [
      { label: 'nova anotação de aula', Icon: FileText, onClick: () => openCompose(focusedCourse.id) },
      { label: 'nova prova / avaliação', Icon: CheckCircle2, onClick: () => openWizard('exam', focusedCourse.id) },
      { label: 'editar detalhes da matéria', Icon: Settings2, onClick: () => openEditCourse() },
    ];
    headerConfig = {
      type: 'detail',
      title: focusedCourse.name,
      subtitle: `${focusedCourse.code || 'sem código'} • ${focusedCourse.professor}`,
      code: focusedCourse.code || 'sem código',
      icon: focusedCourse.icon,
      color: focusedCourse.color,
      onBack: () => goBack(),
      isBookmarked,
      onToggleBookmark: () => toggleBookmarkCourse(focusedCourse.id),
      actions: courseActions,
    };
  }
  return headerConfig;
  }, [currentScreen, focusedFamily, focusedApproach, focusedCourse, bookmarkedCourseIds, setIsCreatingLooseNote, goBack, openCompose, openWizard, openEditCourse, toggleBookmarkCourse, openEditTcc, tcc.title]);

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
    tcc,
    stickers,
    sessions,
    questions,
    techniques,
    savedBookIds,
    toggleSaveBook,
    readingProgress,
    updateReadingProgress,
    reminderSettings,
    updateReminder,
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
    setActiveTab,
    subTabFaculdade,
    setSubTabFaculdade,
    subTabEstudos,
    setSubTabEstudos,
    subTabBiblioteca,
    setSubTabBiblioteca,
    targetId,
    setTargetId,
    focusedCourseId,
    setFocusedCourseId,
    focusedCourse,
    openCourseDetail,
    closeCourseDetail,
    isBottomNavVisible,
    isNotesScreenOpen,
    openNotesScreen,
    closeNotesScreen,
    isTempleScreenOpen,
    openTemple,
    closeTemple,
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
    isQuickAddOpen,
    openQuickAdd,
    closeQuickAdd,
    isWizardOpen,
    currentWizardType,
    wizardCourseId,
    openWizard,
    openTaskExamWizard,
    closeWizard,
    isEditCourseOpen,
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
    handleAddReading,
    handleUpdateReadingPages,
    handleAddFlashcard,
    handleReviewFlashcard,
    handleAddInternshipLog,
    handleAddExam,
    handleAddAuthor,
    handleAddSession,
    handleAddTechnique,
    handleUpdateReadingChapters,
    handleUpdateProfile,
    handleUpdateTcc,
    handleUpdateCourse,
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
