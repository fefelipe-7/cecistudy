import React, { useState, useEffect } from 'react';
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
  StudySession
} from './types';

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
} from './data/initialData';

import { HeaderNav } from './components/HeaderNav';
import { BottomNav } from './components/BottomNav';
import { QuickAddModal } from './components/QuickAddModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

import { HomeView } from './components/views/HomeView';
import { FaculdadeView } from './components/views/FaculdadeView';
import { EstudosView } from './components/views/EstudosView';
import { BibliotecaView } from './components/views/BibliotecaView';
import { PerfilView } from './components/views/PerfilView';
import { EstadoDeEspiritoView, DailyMoodData } from './components/views/EstadoDeEspiritoView';

export default function App() {
  // Persistence Helper
  const usePersistentState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
      try {
        const item = localStorage.getItem('cecistudy_' + key);
        return item ? JSON.parse(item) : initialValue;
      } catch {
        return initialValue;
      }
    });

    useEffect(() => {
      try {
        localStorage.setItem('cecistudy_' + key, JSON.stringify(state));
      } catch (e) {
        console.error('Storage error', e);
      }
    }, [key, state]);

    return [state, setState];
  };

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
    vibeColor: 'bg-[#FFEAF0] border-[#FFD4E0] text-[#CE5373]',
    reflection: 'Dia focado nas aulas de psicopatologia e leituras curtas.',
    intention: 'Estudo leve e produtivo',
    updatedAt: '09:00'
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isMoodViewOpen, setIsMoodViewOpen] = useState(false);
  const [subTabFaculdade, setSubTabFaculdade] = useState<SubTabFaculdade>('disciplinas');
  const [subTabEstudos, setSubTabEstudos] = useState<SubTabEstudos>('sessoes');
  const [subTabBiblioteca, setSubTabBiblioteca] = useState<SubTabBiblioteca>('autores');
  const [subTabPerfil, setSubTabPerfil] = useState<SubTabPerfil>('jornada');
  const [targetId, setTargetId] = useState<string | undefined>(undefined);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut (Cmd+K) for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleToggleExam = (examId: string) => {
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

  const handleNavigate = (tab: NavTab, subTab?: string, target?: string) => {
    setActiveTab(tab);
    setTargetId(target);

    if (tab === 'faculdade' && subTab) setSubTabFaculdade(subTab as SubTabFaculdade);
    if (tab === 'estudos' && subTab) setSubTabEstudos(subTab as SubTabEstudos);
    if (tab === 'biblioteca' && subTab) setSubTabBiblioteca(subTab as SubTabBiblioteca);
    if (tab === 'perfil' && subTab) setSubTabPerfil(subTab as SubTabPerfil);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] text-[#3F3940] flex flex-col font-sans antialiased selection:bg-[#F4D7DF]">
      
      {/* Top Header */}
      <HeaderNav
        profile={profile}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onNavigateToPerfil={() => handleNavigate('perfil', 'jornada')}
      />

      {/* Main Screen Content (Mobile First App Frame Container) */}
      <main className="flex-1 max-w-md sm:max-w-xl w-full mx-auto px-3.5 py-4 sm:px-5 mb-24 sm:mb-28">
        {isMoodViewOpen ? (
          <EstadoDeEspiritoView
            currentMood={currentMood}
            onSaveMood={(newMood) => {
              setCurrentMood(newMood);
              setIsMoodViewOpen(false);
            }}
            onBackToHome={() => setIsMoodViewOpen(false)}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                profile={profile}
                courses={courses}
                tasks={tasks}
                classes={classes}
                readings={readings}
                stickers={stickers}
                currentMood={currentMood}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onNavigate={handleNavigate}
                onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                onOpenMoodView={() => setIsMoodViewOpen(true)}
              />
            )}

            {activeTab === 'faculdade' && (
              <FaculdadeView
                courses={courses}
                classes={classes}
                exams={exams}
                initialSubTab={subTabFaculdade}
                selectedCourseId={targetId}
                onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                onToggleExam={handleToggleExam}
              />
            )}

            {activeTab === 'estudos' && (
              <EstudosView
                readings={readings}
                flashcards={flashcards}
                sessions={sessions}
                courses={courses}
                initialSubTab={subTabEstudos}
                onAddSession={handleAddSession}
                onUpdateReadingPages={handleUpdateReadingPages}
                onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              />
            )}

            {activeTab === 'biblioteca' && (
              <BibliotecaView
                authors={authors}
                concepts={concepts}
                approaches={approaches}
                materials={materials}
                courses={courses}
                initialSubTab={subTabBiblioteca}
                initialSelectedId={targetId}
                onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              />
            )}

            {activeTab === 'perfil' && (
              <PerfilView
                profile={profile}
                stickers={stickers}
                internshipLogs={internshipLogs}
                tcc={tcc}
                initialSubTab={subTabPerfil}
                onUpdateProfile={handleUpdateProfile}
                onUpdateTcc={handleUpdateTcc}
                onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => handleNavigate(tab)}
      />

      {/* Quick Add Modal (+ Novo) */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        courses={courses}
        onAddTask={handleAddTask}
        onAddClassNote={handleAddClassNote}
        onAddReading={handleAddReading}
        onAddFlashcard={handleAddFlashcard}
        onAddConcept={handleAddConcept}
        onAddInternshipLog={handleAddInternshipLog}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        courses={courses}
        classes={classes}
        authors={authors}
        concepts={concepts}
        approaches={approaches}
        readings={readings}
        onNavigate={handleNavigate}
      />

    </div>
  );
}
