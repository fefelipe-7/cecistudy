import { useCallback, useMemo } from 'react';
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

/**
 * Grupos por domínio (PERF-001 A.3): subconjuntos de `DataActions` memoizados
 * por domínio — identidade estável enquanto aquele domínio não muda. As cascas
 * fornecem estes grupos em contextos próprios p/ re-render seletivo das views.
 */
export interface DataActionGroups {
  courses: Pick<
    DataActions,
    | 'handleToggleTask' | 'handleToggleExam' | 'handleAddTask' | 'handleUpdateTask'
    | 'handleAddClassNote' | 'handleUpdateClassNote'
    | 'handleAddExam' | 'handleUpdateExam' | 'handleAddCourse' | 'handleUpdateCourse'
    | 'handleAddMaterial' | 'handleUpdateMaterial'
  >;
  study: Pick<
    DataActions,
    | 'handleAddReading' | 'handleUpdateReadingPages' | 'handleUpdateReadingChapters'
    | 'handleUpdateReading' | 'handleAddFlashcard' | 'handleReviewFlashcard'
    | 'handleUpdateFlashcard' | 'handleAddSession' | 'handleUpdateSession'
    | 'handleSaveQuizSession' | 'handleAddTechnique'
  >;
  knowledge: Pick<
    DataActions,
    | 'addLooseNote' | 'deleteLooseNote' | 'updateLooseNote'
    | 'handleAddConcept' | 'handleUpdateConcept' | 'handleAddAuthor' | 'handleUpdateAuthor'
    | 'adoptAcervoConcept' | 'adoptAcervoAuthor'
  >;
  app: Pick<
    DataActions,
    'handleAddInternshipLog' | 'handleUpdateInternshipLog' | 'handleUpdateProfile' | 'handleUpdateTcc'
  >;
}

export function useDataActions(deps: DataActionsDeps): DataActions & DataActionGroups {
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

  const handleToggleTask = useCallback((taskId: string) => {
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
  }, [tasks, setTasks, registerActivity, showToast, profile]);

  const handleToggleExam = useCallback((examId: string) => {
    hapticTap();
    setExams((prev) =>
      prev.map((e) => (e.id === examId ? { ...e, completed: !e.completed } : e))
    );
  }, [setExams]);

  const handleAddTask = useCallback((task: Task) => {
    const withWs = { ...task, workspaceId: currentWorkspaceId };
    setTasks((prev) => [withWs, ...prev]);
    void gcalSyncTask(withWs, 'upsert');
  }, [currentWorkspaceId, setTasks, gcalSyncTask]);

  const handleUpdateTask = useCallback((taskId: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    if (patch.title || patch.dueDate || patch.disciplineId) {
      const updated = tasks.find((t) => t.id === taskId);
      if (updated) void gcalSyncTask({ ...updated, ...patch }, 'upsert');
    }
  }, [tasks, setTasks, gcalSyncTask]);

  const handleAddClassNote = useCallback((note: ClassNote) => {
    setClasses((prev) => [{ ...note, workspaceId: currentWorkspaceId }, ...prev]);
    registerActivity();
  }, [currentWorkspaceId, setClasses, registerActivity]);

  const handleUpdateClassNote = useCallback((note: ClassNote) => {
    setClasses((prev) => prev.map((c) => (c.id === note.id ? note : c)));
  }, [setClasses]);

  const addLooseNote = useCallback((note: LooseNote) => {
    setLooseNotes((prev) => [{ ...note, workspaceId: currentWorkspaceId }, ...prev]);
  }, [currentWorkspaceId, setLooseNotes]);

  const deleteLooseNote = useCallback((id: string) => {
    setLooseNotes((prev) => prev.filter((n) => n.id !== id));
  }, [setLooseNotes]);

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

  const handleAddReading = useCallback((reading: ReadingItem) => {
    setReadings((prev) => [{ ...reading, workspaceId: currentWorkspaceId }, ...prev]);
  }, [currentWorkspaceId, setReadings]);

  const handleUpdateReadingPages = useCallback((readingId: string, newPages: number) => {
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
  }, [readings, setReadings, registerActivity, showToast]);

  const handleAddFlashcard = useCallback((card: Flashcard) => {
    setFlashcards((prev) => [{ ...card, workspaceId: currentWorkspaceId }, ...prev]);
  }, [currentWorkspaceId, setFlashcards]);

  const handleReviewFlashcard = useCallback((id: string, correct: boolean) => {
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
  }, [setFlashcards, registerActivity]);

  const handleAddInternshipLog = useCallback((log: InternshipLog) => {
    setInternshipLogs((prev) => [{ ...log, workspaceId: currentWorkspaceId }, ...prev]);
  }, [currentWorkspaceId, setInternshipLogs]);

  const handleAddExam = useCallback((exam: Exam) => {
    const withWs = { ...exam, workspaceId: currentWorkspaceId };
    setExams((prev) => [withWs, ...prev]);
    void gcalSyncExam(withWs, 'upsert');
  }, [currentWorkspaceId, setExams, gcalSyncExam]);

  const handleAddCourse = useCallback((course: Course) => {
    setCourses((prev) => [{ ...course, workspaceId: currentWorkspaceId }, ...prev]);
  }, [setCourses, currentWorkspaceId]);

  const handleAddAuthor = useCallback((author: PsychologyAuthor) => {
    setAuthors((prev) => [{ ...author, workspaceId: currentWorkspaceId }, ...prev]);
  }, [currentWorkspaceId, setAuthors]);

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

  const handleAddSession = useCallback((session: StudySession) => {
    setSessions((prev) => [{ ...session, workspaceId: currentWorkspaceId }, ...prev]);
    registerActivity();
  }, [currentWorkspaceId, setSessions, registerActivity]);

  const adoptAcervoAuthor = useCallback((draft: AuthorDraft): string => {
    const name = normalizeText(draft.name);
    const existing = authors.find((a) => normalizeText(a.name) === name);
    if (existing) return existing.id;
    const id = 'aut-' + Date.now();
    setAuthors((prev) => [{ ...draft, id }, ...prev]);
    return id;
  }, [authors, setAuthors]);

  const handleSaveQuizSession = useCallback((session: QuizSession) => {
    setQuizSessions((prev) => [{ ...session, workspaceId: currentWorkspaceId }, ...prev]);
    registerActivity();
  }, [currentWorkspaceId, setQuizSessions, registerActivity]);

  const handleAddTechnique = useCallback((technique: Technique) => {
    setTechniques((prev) => [{ ...technique, workspaceId: currentWorkspaceId }, ...prev]);
  }, [currentWorkspaceId, setTechniques]);

  const handleUpdateReadingChapters = useCallback((readingId: string, chapters: ReadingItem['chapters']) => {
    setReadings((prev) => prev.map((r) => (r.id === readingId ? { ...r, chapters } : r)));
  }, [setReadings]);

  const handleUpdateProfile = useCallback((updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  }, [setProfile]);

  const handleUpdateTcc = useCallback((updated: TccData) => {
    setTcc(updated);
  }, [setTcc]);

  const handleUpdateCourse = useCallback((updated: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, [setCourses]);

  const handleUpdateExam = useCallback((exam: Exam) => {
    setExams((prev) => prev.map((e) => (e.id === exam.id ? exam : e)));
    void gcalSyncExam(exam, 'upsert');
  }, [setExams, gcalSyncExam]);

  const handleUpdateReading = useCallback((reading: ReadingItem) => {
    setReadings((prev) => prev.map((r) => (r.id === reading.id ? reading : r)));
  }, [setReadings]);

  const handleUpdateFlashcard = useCallback((card: Flashcard) => {
    setFlashcards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
  }, [setFlashcards]);

  const handleUpdateSession = useCallback((session: StudySession) => {
    setSessions((prev) => prev.map((s) => (s.id === session.id ? session : s)));
  }, [setSessions]);

  const handleUpdateInternshipLog = useCallback((log: InternshipLog) => {
    setInternshipLogs((prev) => prev.map((l) => (l.id === log.id ? log : l)));
  }, [setInternshipLogs]);

  const handleUpdateAuthor = useCallback((author: PsychologyAuthor) => {
    setAuthors((prev) => prev.map((a) => (a.id === author.id ? author : a)));
  }, [setAuthors]);

  const handleUpdateConcept = useCallback((concept: PsychologyConcept) => {
    setConcepts((prev) => prev.map((c) => (c.id === concept.id ? concept : c)));
  }, [setConcepts]);

  const handleUpdateMaterial = useCallback((material: MaterialItem) => {
    setMaterials((prev) => prev.map((m) => (m.id === material.id ? material : m)));
  }, [setMaterials]);

  // Grupos por domínio (PERF-001 A.3): cada grupo memoizado nas próprias
  // dependências — a identidade só muda quando aquele domínio muda, permitindo
  // re-render seletivo nos consumidores pesados. O objeto agregado mantém a
  // mesma forma pública de sempre (`DataActions`).
  const groupCourses = useMemo(
    () => ({
      handleToggleTask,
      handleToggleExam,
      handleAddTask,
      handleUpdateTask,
      handleAddClassNote,
      handleUpdateClassNote,
      handleAddExam,
      handleUpdateExam,
      handleAddCourse,
      handleUpdateCourse,
      handleAddMaterial,
      handleUpdateMaterial,
    }),
    [
      handleToggleTask,
      handleToggleExam,
      handleAddTask,
      handleUpdateTask,
      handleAddClassNote,
      handleUpdateClassNote,
      handleAddExam,
      handleUpdateExam,
      handleAddCourse,
      handleUpdateCourse,
      handleAddMaterial,
      handleUpdateMaterial,
    ]
  );

  const groupStudy = useMemo(
    () => ({
      handleAddReading,
      handleUpdateReadingPages,
      handleUpdateReadingChapters,
      handleUpdateReading,
      handleAddFlashcard,
      handleReviewFlashcard,
      handleUpdateFlashcard,
      handleAddSession,
      handleUpdateSession,
      handleSaveQuizSession,
      handleAddTechnique,
    }),
    [
      handleAddReading,
      handleUpdateReadingPages,
      handleUpdateReadingChapters,
      handleUpdateReading,
      handleAddFlashcard,
      handleReviewFlashcard,
      handleUpdateFlashcard,
      handleAddSession,
      handleUpdateSession,
      handleSaveQuizSession,
      handleAddTechnique,
    ]
  );

  const groupKnowledge = useMemo(
    () => ({
      addLooseNote,
      deleteLooseNote,
      updateLooseNote,
      handleAddConcept,
      handleUpdateConcept,
      handleAddAuthor,
      handleUpdateAuthor,
      adoptAcervoConcept,
      adoptAcervoAuthor,
    }),
    [
      addLooseNote,
      deleteLooseNote,
      updateLooseNote,
      handleAddConcept,
      handleUpdateConcept,
      handleAddAuthor,
      handleUpdateAuthor,
      adoptAcervoConcept,
      adoptAcervoAuthor,
    ]
  );

  const groupApp = useMemo(
    () => ({
      handleAddInternshipLog,
      handleUpdateInternshipLog,
      handleUpdateProfile,
      handleUpdateTcc,
    }),
    [handleAddInternshipLog, handleUpdateInternshipLog, handleUpdateProfile, handleUpdateTcc]
  );

  return {
    ...groupCourses,
    ...groupStudy,
    ...groupKnowledge,
    ...groupApp,
    courses: groupCourses,
    study: groupStudy,
    knowledge: groupKnowledge,
    app: groupApp,
  };
}
