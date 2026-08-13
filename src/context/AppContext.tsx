import React, { createContext, useContext, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import {
  NavTab,
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

type Route = { tab?: NavTab; focusedCourseId?: string | null; mood?: boolean };

function buildRoute(tab: NavTab, focusedCourseId: string | null, isMood: boolean): string {
  if (isMood) return '#/mood';
  if (tab === 'faculdade' && focusedCourseId) return `#/faculdade/${focusedCourseId}`;
  return `#/${tab}`;
}

function parseRoute(hash: string): Route {
  const h = hash.replace(/^#\/?/, '').split('/');
  const seg = h[0];
  if (seg === 'mood') return { mood: true };
  if (!seg || seg === 'home') return { tab: 'home' };
  if (seg === 'faculdade') return { tab: 'faculdade', focusedCourseId: h[1] || null };
  if (seg === 'estudos' || seg === 'biblioteca' || seg === 'perfil') return { tab: seg };
  return { tab: 'home' };
}


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
  openQuickAddWithType: (type: QuickType) => void;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  // actions
  handleNavigate: (tab: NavTab, subTab?: string, target?: string) => void;
  handleToggleTask: (taskId: string) => void;
  handleToggleExam: (examId: string) => void;
  handleAddTask: (task: Task) => void;
  handleAddClassNote: (note: ClassNote) => void;
  handleAddReading: (reading: ReadingItem) => void;
  handleUpdateReadingPages: (readingId: string, newPages: number) => void;
  handleAddFlashcard: (card: Flashcard) => void;
  handleAddConcept: (concept: PsychologyConcept) => void;
  handleAddInternshipLog: (log: InternshipLog) => void;
  handleAddSession: (session: StudySession) => void;
  handleUpdateProfile: (updated: Partial<UserProfile>) => void;
  handleUpdateTcc: (updated: TccData) => void;

  // header
  headerConfig: DynamicHeaderConfig | null;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // State
  const [profile, setProfile] = usePersistentState<UserProfile>('profile', initialProfile);
  const [courses] = usePersistentState<Course[]>('courses', initialCourses);
  const [classes, setClasses] = usePersistentState<ClassNote[]>('classes', initialClasses);
  const [tasks, setTasks] = usePersistentState<Task[]>('tasks', initialTasks);
  const [exams, setExams] = usePersistentState<Exam[]>('exams', initialExams);
  const [authors] = usePersistentState<PsychologyAuthor[]>('authors', initialAuthors);
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
    vibeColor: 'bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862]',
    reflection: 'Dia focado nas aulas de psicopatologia e leituras curtas.',
    intention: 'Estudo leve e produtivo',
    updatedAt: '09:00'
  });

  // Lembrete diário de estudo (só efetivo no app nativo)
  const [reminderSettings, setReminderSettings] = usePersistentState<ReminderSettings>('reminder', {
    enabled: false,
    time: '19:00'
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isMoodViewOpen, setIsMoodViewOpen] = useState(false);
  const [subTabFaculdade, setSubTabFaculdade] = useState<SubTabFaculdade>('disciplinas');
  const [subTabEstudos, setSubTabEstudos] = useState<SubTabEstudos>('sessoes');
  const [subTabBiblioteca, setSubTabBiblioteca] = useState<SubTabBiblioteca>('autores');
  const [subTabPerfil, setSubTabPerfil] = useState<SubTabPerfil>('jornada');
  const [targetId, setTargetId] = useState<string | undefined>(undefined);
  const [focusedCourseId, setFocusedCourseId] = useState<string | null>(null);
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState<string[]>(['c1', 'c2']);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickType>('task');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync targetId if passed
  useEffect(() => {
    if (targetId && activeTab === 'faculdade') {
      setFocusedCourseId(targetId);
    }
  }, [targetId, activeTab]);

  // Hash-based routing: deep-link + browser back/forward (no router dependency)
  useEffect(() => {
    const applyRoute = () => {
      const route = parseRoute(location.hash);
      if (route.mood) {
        setIsMoodViewOpen(true);
        return;
      }
      setIsMoodViewOpen(false);
      if (route.tab) setActiveTab(route.tab);
      if (route.tab === 'faculdade') {
        setFocusedCourseId(route.focusedCourseId ?? null);
        setTargetId(route.focusedCourseId ?? undefined);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    if (!location.hash) history.replaceState(null, '', '#/home');
    applyRoute();
    window.addEventListener('hashchange', applyRoute);
    return () => window.removeEventListener('hashchange', applyRoute);
  }, []);

  const toggleBookmarkCourse = (courseId: string) => {
    setBookmarkedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const focusedCourse = courses.find((c) => c.id === focusedCourseId);

  // Dynamic Header Configuration
  let headerConfig: DynamicHeaderConfig | null = null;

  if (isMoodViewOpen) {
    headerConfig = {
      type: 'detail',
      title: 'Estado de Espírito',
      subtitle: 'Como você está se sentindo hoje?',
      onBack: () => closeMoodView(),
      rightActions: (
        <span className="text-sm font-bold bg-[#FFF5F7] px-2.5 py-1 rounded-full border border-[#FFD3DD] text-[#B94862]">
          {currentMood.emoji}
        </span>
      ),
    };
  } else if (activeTab === 'faculdade' && focusedCourse) {
    const isBookmarked = bookmarkedCourseIds.includes(focusedCourse.id);
    headerConfig = {
      type: 'detail',
      title: focusedCourse.name,
      subtitle: `${focusedCourse.code || 'PSI-300'} • ${focusedCourse.professor}`,
      code: focusedCourse.code || 'PSI-300',
      icon: focusedCourse.icon,
      color: focusedCourse.color,
      onBack: () => closeCourseDetail(),
      isBookmarked,
      onToggleBookmark: () => toggleBookmarkCourse(focusedCourse.id),
      rightActions: (
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="bg-[#40383A] hover:bg-[#2D2728] text-white px-2.5 sm:px-3 py-1.5 rounded-2xl font-display font-bold text-xs shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer border border-white/20"
          title="Nova anotação ou tarefa"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anotação</span>
        </button>
      ),
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

  const handleAddConcept = (concept: PsychologyConcept) => {
    setConcepts((prev) => [concept, ...prev]);
  };

  const handleAddInternshipLog = (log: InternshipLog) => {
    setInternshipLogs((prev) => [log, ...prev]);
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

  const handleNavigate = (tab: NavTab, subTab?: string, target?: string) => {
    setActiveTab(tab);
    setTargetId(target);

    if (tab === 'faculdade' && subTab) setSubTabFaculdade(subTab as SubTabFaculdade);
    if (tab === 'estudos' && subTab) setSubTabEstudos(subTab as SubTabEstudos);
    if (tab === 'biblioteca' && subTab) setSubTabBiblioteca(subTab as SubTabBiblioteca);
    if (tab === 'perfil' && subTab) setSubTabPerfil(subTab as SubTabPerfil);

    const course = tab === 'faculdade' ? target ?? null : null;
    const h = buildRoute(tab, course, false);
    if (location.hash !== h) location.hash = h;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCourseDetail = (courseId: string) => {
    setFocusedCourseId(courseId);
    setTargetId(courseId);
    const h = `#/faculdade/${courseId}`;
    if (location.hash !== h) location.hash = h;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeCourseDetail = () => {
    setFocusedCourseId(null);
    setTargetId(undefined);
    if (location.hash !== '#/faculdade') location.hash = '#/faculdade';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openMoodView = () => {
    setIsMoodViewOpen(true);
    if (location.hash !== '#/mood') location.hash = '#/mood';
  };
  const closeMoodView = () => {
    setIsMoodViewOpen(false);
    if (location.hash !== '#/home') location.hash = '#/home';
  };
  const handleSaveMood = (mood: DailyMoodData) => {
    hapticSuccess();
    setCurrentMood(mood);
    setIsMoodViewOpen(false);
    if (location.hash !== '#/home') location.hash = '#/home';
  };
  const openQuickAdd = () => setIsQuickAddOpen(true);
  const closeQuickAdd = () => setIsQuickAddOpen(false);
  const openQuickAddWithType = (type: QuickType) => {
    setQuickAddType(type);
    setIsQuickAddOpen(true);
  };
  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

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
    isSearchOpen,
    openSearch,
    closeSearch,
    handleNavigate,
    handleToggleTask,
    handleToggleExam,
    handleAddTask,
    handleAddClassNote,
    handleAddReading,
    handleUpdateReadingPages,
    handleAddFlashcard,
    handleAddConcept,
    handleAddInternshipLog,
    handleAddSession,
    handleUpdateProfile,
    handleUpdateTcc,
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
