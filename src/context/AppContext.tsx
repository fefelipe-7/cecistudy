import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle2, Settings2, StickyNote } from 'lucide-react';
import {
  NavTab,
  NavScreen,
  HeaderAction,
  SubTabFaculdade,
  SubTabEstudos,
  SubTabBiblioteca,
  SubTabPerfil,
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
  DailyMoodData,
  QuickType
} from '../types';
import {
  initialProfile,
  initialCourses,
  initialClasses,
  initialTasks,
  initialExams,
  initialApproaches,
  initialAuthors,
  initialConcepts,
  initialReadings,
  initialFlashcards,
  initialMaterials,
  initialInternshipLogs,
  initialTcc,
  initialStickers,
  initialStudySessions
} from '../data/initialData';
import { usePersistentState } from '../lib/usePersistentState';
import { hapticTap, hapticSuccess } from '../lib/haptics';
import { scheduleDailyReminder, cancelDailyReminder } from '../lib/notifications';
import {
  Route,
  parseRoute,
  routeToStack,
  stackToHash
} from '../lib/routing';


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
  currentMood: DailyMoodData;
  reminderSettings: ReminderSettings;
  updateReminder: (settings: ReminderSettings) => void;

  // navigation state
  activeTab: NavTab;
  screenKey: string;
  navDirection: 0 | 1 | -1;
  setActiveTab: (tab: NavTab) => void;
  subTabFaculdade: SubTabFaculdade;
  setSubTabFaculdade: (t: SubTabFaculdade) => void;
  subTabEstudos: SubTabEstudos;
  setSubTabEstudos: (t: SubTabEstudos) => void;
  subTabBiblioteca: SubTabBiblioteca;
  setSubTabBiblioteca: (t: SubTabBiblioteca) => void;
  subTabPerfil: SubTabPerfil;
  setSubTabPerfil: (t: SubTabPerfil) => void;
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
  bookmarkedCourseIds: string[];
  toggleBookmarkCourse: (id: string) => void;

  // modals / mood
  isMoodViewOpen: boolean;
  openMoodView: () => void;
  closeMoodView: () => void;
  handleSaveMood: (mood: DailyMoodData) => void;
  isQuickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  quickAddType: QuickType;
  openQuickAddWithType: (type: QuickType, courseId?: string) => void;
  quickAddCourseId: string | undefined;
  openQuickAddForCourse: (type: QuickType, courseId: string) => void;
  isEditCourseOpen: boolean;
  openEditCourse: () => void;
  closeEditCourse: () => void;
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
  handleAddClassNote: (note: ClassNote) => void;
  handleAddReading: (reading: ReadingItem) => void;
  handleUpdateReadingPages: (readingId: string, newPages: number) => void;
  handleAddFlashcard: (card: Flashcard) => void;
  handleReviewFlashcard: (id: string, correct: boolean) => void;
  handleAddConcept: (concept: PsychologyConcept) => void;
  handleAddInternshipLog: (log: InternshipLog) => void;
  handleAddExam: (exam: Exam) => void;
  handleAddAuthor: (author: PsychologyAuthor) => void;
  handleAddSession: (session: StudySession) => void;
  handleUpdateProfile: (updated: Partial<UserProfile>) => void;
  handleUpdateTcc: (updated: TccData) => void;
  handleUpdateCourse: (updated: Course) => void;

  // header
  headerConfig: DynamicHeaderConfig | null;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // State
  const [profile, setProfile] = usePersistentState<UserProfile>('profile', initialProfile);
  const [courses, setCourses] = usePersistentState<Course[]>('courses', initialCourses);
  const [classes, setClasses] = usePersistentState<ClassNote[]>('classes', initialClasses);
  const [tasks, setTasks] = usePersistentState<Task[]>('tasks', initialTasks);
  const [exams, setExams] = usePersistentState<Exam[]>('exams', initialExams);
  const [authors, setAuthors] = usePersistentState<PsychologyAuthor[]>('authors', initialAuthors);
  const [concepts, setConcepts] = usePersistentState<PsychologyConcept[]>('concepts', initialConcepts);
  const [approaches] = usePersistentState<PsychologyApproach[]>('approaches', initialApproaches);
  const [readings, setReadings] = usePersistentState<ReadingItem[]>('readings', initialReadings);
  const [flashcards, setFlashcards] = usePersistentState<Flashcard[]>('flashcards', initialFlashcards);
  const [materials] = usePersistentState<MaterialItem[]>('materials', initialMaterials);
  const [internshipLogs, setInternshipLogs] = usePersistentState<InternshipLog[]>('internship', initialInternshipLogs);
  const [tcc, setTcc] = usePersistentState<TccData>('tcc', initialTcc);
  const [stickers] = usePersistentState<Sticker[]>('stickers', initialStickers);
  const [sessions, setSessions] = usePersistentState<StudySession[]>('sessions', initialStudySessions);
  const [currentMood, setCurrentMood] = usePersistentState<DailyMoodData>('currentMood', {
    emoji: '🤓',
    label: 'Focada & Acadêmica',
    energyLevel: 4,
    vibeColor: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
    reflection: 'Dia focado nas aulas de psicopatologia e leituras curtas.',
    intention: 'Estudo leve e produtivo',
    updatedAt: '09:00'
  });

  // Lembrete diário de estudo (só efetivo no app nativo)
  const [reminderSettings, setReminderSettings] = usePersistentState<ReminderSettings>('reminder', {
    enabled: false,
    time: '19:00'
  });

  // Navigation state — pilha nativa (push/pop)
  const [navigationStack, setNavigationStack] = useState<NavScreen[]>([{ kind: 'tab', tab: 'home' }]);
  const [navDirection, setNavDirection] = useState<0 | 1 | -1>(0);
  const navigationStackRef = useRef<NavScreen[]>(navigationStack);

  /** Atualiza a pilha e deriva a direção da transição (push=1, pop=-1, troca=0). */
  const setStack = (next: NavScreen[]) => {
    const prev = navigationStackRef.current;
    const dir = next.length > prev.length ? 1 : next.length < prev.length ? -1 : 0;
    setNavDirection(dir);
    setNavigationStack(next);
    navigationStackRef.current = next;
  };
  const [subTabFaculdade, setSubTabFaculdade] = useState<SubTabFaculdade>('disciplinas');
  const [subTabEstudos, setSubTabEstudos] = useState<SubTabEstudos>('sessoes');
  const [subTabBiblioteca, setSubTabBiblioteca] = useState<SubTabBiblioteca>('autores');
  const [subTabPerfil, setSubTabPerfil] = useState<SubTabPerfil>('jornada');
  const [targetId, setTargetId] = useState<string | undefined>(undefined);
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = usePersistentState<string[]>('bookmarkedCourseIds', ['c1', 'c2']);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickType>('task');
  const [quickAddCourseId, setQuickAddCourseId] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [isCreatingLooseNote, setIsCreatingLooseNote] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Telas derivadas do topo da pilha
  const currentScreen = navigationStack[navigationStack.length - 1];
  const activeTab: NavTab =
    currentScreen.kind === 'tab' ? currentScreen.tab : navigationStack[0].kind === 'tab' ? navigationStack[0].tab : 'home';
  const isMoodViewOpen = currentScreen.kind === 'mood';
  const isNotesScreenOpen = currentScreen.kind === 'notes';
  const isTempleScreenOpen = currentScreen.kind === 'temple';
  const isBottomNavVisible = currentScreen.kind === 'tab';
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
            : 'mood';

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
        else if (t === 'perfil') setSubTabPerfil(route.subTab as SubTabPerfil);
      }
      setTargetId(route.tab === 'faculdade' ? route.focusedCourseId ?? undefined : undefined);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const toggleBookmarkCourse = (courseId: string) => {
    setBookmarkedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  // Dynamic Header Configuration
  let headerConfig: DynamicHeaderConfig | null = null;

  if (isMoodViewOpen) {
    headerConfig = {
      type: 'detail',
      title: 'Estado de Espírito',
      subtitle: 'Como você está se sentindo hoje?',
      onBack: () => goBack(),
      rightActions: (
        <span className="text-sm font-bold bg-surface-rose px-2.5 py-1 rounded-full border border-ceci-border-brand text-ceci-brand-strong">
          {currentMood.emoji}
        </span>
      ),
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
  } else if (currentScreen.kind === 'course' && focusedCourse) {
    const isBookmarked = bookmarkedCourseIds.includes(focusedCourse.id);
    const courseActions: HeaderAction[] = [
      { label: 'nova anotação de aula', Icon: FileText, onClick: () => openQuickAddForCourse('class', focusedCourse.id) },
      { label: 'nova prova / avaliação', Icon: CheckCircle2, onClick: () => openQuickAddForCourse('exam', focusedCourse.id) },
      { label: 'editar detalhes da matéria', Icon: Settings2, onClick: () => openEditCourse() },
    ];
    headerConfig = {
      type: 'detail',
      title: focusedCourse.name,
      subtitle: `${focusedCourse.code || 'PSI-300'} • ${focusedCourse.professor}`,
      code: focusedCourse.code || 'PSI-300',
      icon: focusedCourse.icon,
      color: focusedCourse.color,
      onBack: () => goBack(),
      isBookmarked,
      onToggleBookmark: () => toggleBookmarkCourse(focusedCourse.id),
      actions: courseActions,
    };
  }

  // Handlers
  const handleToggleTask = (taskId: string) => {
    hapticTap();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
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

  const handleAddClassNote = (note: ClassNote) => {
    setClasses((prev) => [note, ...prev]);
  };

  const handleAddReading = (reading: ReadingItem) => {
    setReadings((prev) => [reading, ...prev]);
  };

  const handleUpdateReadingPages = (readingId: string, newPages: number) => {
    setReadings((prev) =>
      prev.map((r) => {
        if (r.id === readingId) {
          const updatedPages = Math.min(newPages, r.totalPages || 999);
          const isDone = updatedPages >= (r.totalPages || 100);
          return {
            ...r,
            readPages: updatedPages,
            status: isDone ? 'concluido' : 'lendo'
          };
        }
        return r;
      })
    );
  };

  const handleAddFlashcard = (card: Flashcard) => {
    setFlashcards((prev) => [card, ...prev]);
  };

  const handleReviewFlashcard = (id: string, correct: boolean) => {
    hapticTap();
    const today = new Date().toISOString().split('T')[0];
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

  const handleAddConcept = (concept: PsychologyConcept) => {
    setConcepts((prev) => [concept, ...prev]);
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
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateTcc = (updated: TccData) => {
    setTcc(updated);
  };

  const updateReminder = (settings: ReminderSettings) => {
    setReminderSettings(settings);
    hapticTap();
    if (settings.enabled) {
      void scheduleDailyReminder(settings.time).then((scheduled) => {
        if (scheduled) hapticSuccess();
      });
    } else {
      void cancelDailyReminder();
    }
  };

  const handleUpdateCourse = (updated: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  /** Sub-tab atual da aba base (para codificar no hash quando não for a padrão). */
  const currentSubTabFor = (tab: NavTab): string | undefined => {
    switch (tab) {
      case 'faculdade':
        return subTabFaculdade;
      case 'estudos':
        return subTabEstudos;
      case 'biblioteca':
        return subTabBiblioteca;
      case 'perfil':
        return subTabPerfil;
      default:
        return undefined;
    }
  };

  /** Sincroniza o `location.hash` (espelho) com a pilha, incluindo a sub-tab da aba base. */
  const syncHash = (next: NavScreen[]) => {
    const top = next[next.length - 1];
    const baseTab = top.kind === 'tab' ? top.tab : next[0]?.kind === 'tab' ? next[0].tab : undefined;
    const h = stackToHash(next, baseTab ? currentSubTabFor(baseTab) : undefined);
    if (location.hash !== h) location.hash = h;
  };

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

  const goBack = () => {
    if (navigationStack.length <= 1) return;
    const next = navigationStack.slice(0, -1);
    setStack(next);
    setTargetId(undefined);
    syncHash(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (tab: NavTab, subTab?: string, target?: string) => {
    if (tab === 'faculdade' && subTab) setSubTabFaculdade(subTab as SubTabFaculdade);
    if (tab === 'estudos' && subTab) setSubTabEstudos(subTab as SubTabEstudos);
    if (tab === 'biblioteca' && subTab) setSubTabBiblioteca(subTab as SubTabBiblioteca);
    if (tab === 'perfil' && subTab) setSubTabPerfil(subTab as SubTabPerfil);
    targetSectionRef.current = subTab;

    const base: NavScreen = { kind: 'tab', tab };
    const next: NavScreen[] =
      tab === 'faculdade' && target ? [base, { kind: 'course', courseId: target }] : [base];
    setStack(next);
    setTargetId(target);
    syncHash(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCourseDetail = (courseId: string) => {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeCourseDetail = () => goBack();

  const openNotesScreen = () => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'notes' ? navigationStack : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'notes' }];
    setStack(next);
    syncHash(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeNotesScreen = () => goBack();

  const openTemple = () => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'temple' ? navigationStack : [{ kind: 'tab', tab: 'biblioteca' }, { kind: 'temple' }];
    setStack(next);
    syncHash(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeTemple = () => goBack();

  const openMoodView = () => {
    const top = navigationStack[navigationStack.length - 1];
    const next: NavScreen[] =
      top.kind === 'mood' ? navigationStack : [{ kind: 'tab', tab: 'home' }, { kind: 'mood' }];
    setStack(next);
    if (location.hash !== '#/mood') location.hash = '#/mood';
  };

  const closeMoodView = () => goBack();

  const handleSaveMood = (mood: DailyMoodData) => {
    hapticSuccess();
    setCurrentMood(mood);
    goBack();
  };

  const openEditCourse = () => setIsEditCourseOpen(true);
  const closeEditCourse = () => setIsEditCourseOpen(false);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const openQuickAdd = () => {
    setQuickAddCourseId(undefined);
    setIsQuickAddOpen(true);
  };
  const closeQuickAdd = () => {
    setQuickAddCourseId(undefined);
    setIsQuickAddOpen(false);
  };
  const openQuickAddWithType = (type: QuickType, courseId?: string) => {
    setQuickAddType(type);
    setQuickAddCourseId(courseId);
    setIsQuickAddOpen(true);
  };
  const openQuickAddForCourse = (type: QuickType, courseId: string) => {
    setQuickAddType(type);
    setQuickAddCourseId(courseId);
    setIsQuickAddOpen(true);
  };
  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const setActiveTab = (tab: NavTab) => handleNavigate(tab);
  const setFocusedCourseId = (id: string | null) => {
    if (id) openCourseDetail(id);
    else if (currentScreen.kind === 'course') goBack();
  };

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
currentMood,
    reminderSettings,
    updateReminder,
    activeTab,
    screenKey,
    navDirection,
    setActiveTab,
    subTabFaculdade,
    setSubTabFaculdade,
    subTabEstudos,
    setSubTabEstudos,
    subTabBiblioteca,
    setSubTabBiblioteca,
    subTabPerfil,
    setSubTabPerfil,
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
    bookmarkedCourseIds,
    toggleBookmarkCourse,
    isMoodViewOpen,
    openMoodView,
    closeMoodView,
    handleSaveMood,
    isQuickAddOpen,
    openQuickAdd,
    closeQuickAdd,
    quickAddType,
    openQuickAddWithType,
    quickAddCourseId,
    openQuickAddForCourse,
    isEditCourseOpen,
    openEditCourse,
    closeEditCourse,
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
    handleAddClassNote,
    handleAddReading,
    handleUpdateReadingPages,
    handleAddFlashcard,
    handleReviewFlashcard,
    handleAddConcept,
    handleAddInternshipLog,
    handleAddExam,
    handleAddAuthor,
    handleAddSession,
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
