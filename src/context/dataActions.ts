import { useCallback } from 'react';
import type {
  UserProfile,
  Course,
  ClassNote,
  Task,
  Exam,
  PsychologyAuthor,
  PsychologyConcept,
  ReadingItem,
  Flashcard,
  MaterialItem,
   InternshipLog,
   TccData,
  StudySession,
  Technique,
  QuizSession,
  LooseNote,
} from '../types';
import type { AuthorDraft, ConceptDraft } from '../lib/acervoBridge';
import { hapticTap, hapticSuccess } from '../lib/haptics';
import { celebrate } from '../lib/celebrate';
import { shouldCelebrateTasks } from '../lib/taskLogic';
import { normalizeText } from '../lib/readingMatching';

/**
 * Ações de dados (CRUD + toggles) extraídas do AppContext — Fase B.2 (MOD-001).
 *
 * Consome os setters do `useDataClient` e helpers de orquestração passados
 * explicitamente. Retorna handlers puros de entidade (nada de navegação).
 */

export interface DataActionsDeps {
  // snapshots (para decisões/derivações dentro dos handlers)
  tasks: Task[];
  readings: ReadingItem[];
  exams: Exam[];
  courses: Course[];
  concepts: PsychologyConcept[];
  authors: PsychologyAuthor[];
  profile: UserProfile;
  currentWorkspaceId: string;

  // setters do useDataClient
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setClasses: React.Dispatch<React.SetStateAction<ClassNote[]>>;
  setLooseNotes: React.Dispatch<React.SetStateAction<LooseNote[]>>;
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  setConcepts: React.Dispatch<React.SetStateAction<PsychologyConcept[]>>;
  setMaterials: React.Dispatch<React.SetStateAction<MaterialItem[]>>;
  setReadings: React.Dispatch<React.SetStateAction<ReadingItem[]>>;
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  setInternshipLogs: React.Dispatch<React.SetStateAction<InternshipLog[]>>;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setAuthors: React.Dispatch<React.SetStateAction<PsychologyAuthor[]>>;
  setSessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  setQuizSessions: React.Dispatch<React.SetStateAction<QuizSession[]>>;
  setTechniques: React.Dispatch<React.SetStateAction<Technique[]>>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setTcc: React.Dispatch<React.SetStateAction<TccData>>;

  // helpers de orquestração
  registerActivity: () => void;
  showToast: (msg: string) => void;
  gcalSyncTask: (task: Task, op: 'upsert' | 'delete') => void;
  gcalSyncExam: (exam: Exam, op: 'upsert' | 'delete') => void;
}

export interface DataActions {
  handleToggleTask: (taskId: string) => void;
  handleToggleExam: (examId: string) => void;
  handleAddTask: (task: Task) => void;
  handleUpdateTask: (taskId: string, patch: Partial<Task>) => void;
  handleAddClassNote: (note: ClassNote) => void;
  handleUpdateClassNote: (note: ClassNote) => void;
  addLooseNote: (note: LooseNote) => void;
  deleteLooseNote: (id: string) => void;
  updateLooseNote: (id: string, patch: Partial<LooseNote>) => void;
  handleAddConcept: (concept: PsychologyConcept) => void;
  handleAddMaterial: (material: MaterialItem) => void;
  handleAddReading: (reading: ReadingItem) => void;
  handleUpdateReadingPages: (readingId: string, newPages: number) => void;
  handleAddFlashcard: (card: Flashcard) => void;
  handleReviewFlashcard: (id: string, correct: boolean) => void;
  handleAddInternshipLog: (log: InternshipLog) => void;
  handleAddExam: (exam: Exam) => void;
  handleAddCourse: (course: Course) => void;
  handleAddAuthor: (author: PsychologyAuthor) => void;
  adoptAcervoConcept: (draft: ConceptDraft) => string;
  handleAddSession: (session: StudySession) => void;
  adoptAcervoAuthor: (draft: AuthorDraft) => string;
  handleSaveQuizSession: (session: QuizSession) => void;
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
}

export function useDataActions(deps: DataActionsDeps): DataActions {
  const {
    tasks,
    readings,
    exams,
    courses,
    concepts,
    authors,
    profile,
    currentWorkspaceId,
    setTasks,
    setClasses,
    setLooseNotes,
    setExams,
    setConcepts,
    setMaterials,
    setReadings,
    setFlashcards,
    setInternshipLogs,
    setCourses,
    setAuthors,
    setSessions,
    setQuizSessions,
    setTechniques,
    setProfile,
    setTcc,
    registerActivity,
    showToast,
    gcalSyncTask,
    gcalSyncExam,
  } = deps;

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
    const withWs = { ...task, workspaceId: currentWorkspaceId };
    setTasks((prev) => [withWs, ...prev]);
    void gcalSyncTask(withWs, 'upsert');
  };

  const handleUpdateTask = (taskId: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    if (patch.title || patch.dueDate || patch.disciplineId) {
      const updated = tasks.find((t) => t.id === taskId);
      if (updated) void gcalSyncTask({ ...updated, ...patch }, 'upsert');
    }
  };

  const handleAddClassNote = (note: ClassNote) => {
    setClasses((prev) => [{ ...note, workspaceId: currentWorkspaceId }, ...prev]);
    registerActivity();
  };

  const handleUpdateClassNote = (note: ClassNote) => {
    setClasses((prev) => prev.map((c) => (c.id === note.id ? note : c)));
  };

  const addLooseNote = (note: LooseNote) => {
    setLooseNotes((prev) => [{ ...note, workspaceId: currentWorkspaceId }, ...prev]);
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
  }, [setLooseNotes]);

  const handleAddConcept = useCallback((concept: PsychologyConcept) => {
    setConcepts((prev) => [{ ...concept, workspaceId: currentWorkspaceId }, ...prev]);
  }, [setConcepts, currentWorkspaceId]);

  const handleAddMaterial = useCallback((material: MaterialItem) => {
    setMaterials((prev) => [{ ...material, workspaceId: currentWorkspaceId }, ...prev]);
  }, [setMaterials, currentWorkspaceId]);

  const handleAddReading = (reading: ReadingItem) => {
    setReadings((prev) => [{ ...reading, workspaceId: currentWorkspaceId }, ...prev]);
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
    setFlashcards((prev) => [{ ...card, workspaceId: currentWorkspaceId }, ...prev]);
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
    setInternshipLogs((prev) => [{ ...log, workspaceId: currentWorkspaceId }, ...prev]);
  };

  const handleAddExam = (exam: Exam) => {
    const withWs = { ...exam, workspaceId: currentWorkspaceId };
    setExams((prev) => [withWs, ...prev]);
    void gcalSyncExam(withWs, 'upsert');
  };

  const handleAddCourse = useCallback((course: Course) => {
    setCourses((prev) => [{ ...course, workspaceId: currentWorkspaceId }, ...prev]);
  }, [setCourses, currentWorkspaceId]);

  const handleAddAuthor = (author: PsychologyAuthor) => {
    setAuthors((prev) => [{ ...author, workspaceId: currentWorkspaceId }, ...prev]);
  };

  // Acervo do templo → banco pessoal ("copiar ao selecionar"): idempotente por
  // nome normalizado — se já existe, devolve o id existente em vez de duplicar.
  const adoptAcervoConcept = useCallback((draft: ConceptDraft): string => {
    const name = normalizeText(draft.name);
    const existing = concepts.find((c) => normalizeText(c.name) === name);
    if (existing) return existing.id;
    const id = 'con-' + Date.now();
    setConcepts((prev) => [{ ...draft, id, workspaceId: currentWorkspaceId }, ...prev]);
    return id;
  }, [concepts, setConcepts, currentWorkspaceId]);

  const handleAddSession = (session: StudySession) => {
    setSessions((prev) => [{ ...session, workspaceId: currentWorkspaceId }, ...prev]);
    registerActivity();
  };

  const adoptAcervoAuthor = useCallback((draft: AuthorDraft): string => {
    const name = normalizeText(draft.name);
    const existing = authors.find((a) => normalizeText(a.name) === name);
    if (existing) return existing.id;
    const id = 'aut-' + Date.now();
    setAuthors((prev) => [{ ...draft, id }, ...prev]);
    return id;
  }, [authors, setAuthors]);

  const handleSaveQuizSession = (session: QuizSession) => {
    setQuizSessions((prev) => [{ ...session, workspaceId: currentWorkspaceId }, ...prev]);
    registerActivity();
  };

  const handleAddTechnique = (technique: Technique) => {
    setTechniques((prev) => [{ ...technique, workspaceId: currentWorkspaceId }, ...prev]);
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

  const handleUpdateCourse = useCallback((updated: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, [setCourses]);

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

  return {
    handleToggleTask,
    handleToggleExam,
    handleAddTask,
    handleUpdateTask,
    handleAddClassNote,
    handleUpdateClassNote,
    addLooseNote,
    deleteLooseNote,
    updateLooseNote,
    handleAddConcept,
    handleAddMaterial,
    handleAddReading,
    handleUpdateReadingPages,
    handleAddFlashcard,
    handleReviewFlashcard,
    handleAddInternshipLog,
    handleAddExam,
    handleAddCourse,
    handleAddAuthor,
    adoptAcervoConcept,
    handleAddSession,
    adoptAcervoAuthor,
    handleSaveQuizSession,
    handleAddTechnique,
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
  };
}
