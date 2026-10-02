import { useCallback, useEffect, useMemo, useState } from 'react';
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
  AttendanceRecord,
  AttendanceStatus,
  AcademicTerm,
} from '../types';
import type { AuthorDraft, ConceptDraft } from '../lib/acervoBridge';
import { hapticTap, hapticSuccess } from '../lib/haptics';
import { celebrate } from '../lib/celebrate';
import { shouldCelebrateTasks } from '../lib/taskLogic';
import { schedule } from '../lib/fsrs';
import { normalizeText } from '../lib/readingMatching';
import { toDateKey } from '../lib/streak';
import {
  createAcademicTerm,
  enforceSingleActiveTerm,
  reopenTerm,
  resolveActiveTerm,
  retitleTerm,
  MAX_TERM_ORDINAL,
} from '../core/domain';
import { remainingUndoWindowMs } from '../lib/termUndoWindow';
import { undoTermRollover as undoRollover } from '../lib/termRollover';
import type { TermRolloverPlan } from '../lib/termRollover';
import {
  applyAttendanceAction,
  removeAttendanceRecord as removeRecord,
  updateAttendanceRecord as patchRecord,
  upsertPresenceForClassNote,
} from '../lib/attendance';

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
  // Períodos letivos (SPEC-005)
  academicTerms: AcademicTerm[];
  setAcademicTerms: React.Dispatch<React.SetStateAction<AcademicTerm[]>>;

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
  handleReviewFlashcard: (id: string, quality: 0 | 1 | 2 | 3) => void;
  handleAddInternshipLog: (log: InternshipLog) => void;
  handleAddExam: (exam: Exam) => void;
  handleAddCourse: (course: Course) => void;
  handleAddAuthor: (author: PsychologyAuthor) => void;
  markAttendance: (courseId: string, status: AttendanceStatus) => void;
  updateAttendanceRecord: (courseId: string, recordId: string, patch: Partial<Pick<AttendanceRecord, 'status' | 'noteId' | 'hours'>>) => void;
  removeAttendanceRecord: (courseId: string, recordId: string) => void;
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

  // ---- Período letivo (SPEC-005 / SPEC-006) ----
  /** Aplica o plano de virada calculado por `planTermRollover` (escreve por registro). */
  applyTermRollover: (plan: TermRolloverPlan) => void;
  /**
   * Reverte a virada (reabre o período anterior e devolve as disciplinas).
   * Não recebe `originalTermIds`: o próprio plano carrega o estado de origem.
   */
  undoTermRollover: (plan: TermRolloverPlan) => void;
  /**
   * Plano da **última** virada, ou `null` se não houve nenhuma (ou já foi
   * desfeito). Vive em memória (nunca persistido): desfazer é para a decisão
   * "não era isso mesmo?", não para o histórico.
   */
  lastRollover: TermRolloverPlan | null;
  /** Desfaz a última virada. No-op quando não há nenhuma. */
  undoLastRollover: () => void;
  /** Testado: a janela de desfazer está aberta? */
  canUndoRollover: boolean;
  /**
   * Corrige o número do período **ativo** (a "porta fácil" do Perfil, SPEC-006
   * D6). Rejeita período encerrado — para isso existe `reopenTermById`.
   */
  correctTermOrdinal: (termId: string, ordinal: number) => void;
  /**
   * Ajusta o total de semestres do curso, `1..MAX_TERM_ORDINAL` (SPEC-008 D2).
   * É o palpite que a `% do curso`, o `faltam N semestres` e o `array da
   * timeline` leem — e antes não tinha editor nenhum.
   */
  setTotalSemesters: (total: number) => void;
  openFirstTerm: (ordinal: number) => void;
  /** Reabre um período encerrado (o "re-roll" do histórico, SPEC-006 D7). */
  reopenTermById: (termId: string) => void;
  /** Arquiva a disciplina (sai da grade, continua pesquisável — nunca apaga). */
  archiveCourse: (courseId: string) => void;
  /** Devolve uma disciplina arquivada à grade do período ativo. */
  restoreCourse: (courseId: string) => void;
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
    | 'markAttendance' | 'updateAttendanceRecord' | 'removeAttendanceRecord'
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
  /** Período letivo isolado: mexer no semestre não invalida o resto da UI. */
  term: Pick<
    DataActions,
    | 'applyTermRollover'
    | 'undoTermRollover'
    | 'undoLastRollover'
    | 'correctTermOrdinal'
    | 'setTotalSemesters'
    | 'openFirstTerm'
    | 'reopenTermById'
    | 'archiveCourse'
    | 'restoreCourse'
  > & {
    lastRollover: TermRolloverPlan | null;
    canUndoRollover: boolean;
  };
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
    academicTerms,
    setAcademicTerms,
    registerActivity,
    showToast,
    gcalSyncTask,
    gcalSyncExam,
  } = deps;

  // SPEC-005: o período ativo é DERIVADO (nunca um ponteiro persistido), então
  // as ações do semestre resolvem o id na hora. `null` só no intervalo em que
  // um período está fechado e o próximo ainda não foi aberto.
  const activeTermId = resolveActiveTerm(academicTerms)?.id ?? null;

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
    // frequência detalhada (spec-frequencia.md): anotou a aula = esteve presente.
    if (note.date) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === note.courseId
            ? upsertPresenceForClassNote(c, { id: note.id, date: note.date })
            : c
        )
      );
    }
    registerActivity();
  }, [currentWorkspaceId, setClasses, setCourses, registerActivity]);

  const handleUpdateClassNote = useCallback((note: ClassNote) => {
    setClasses((prev) => prev.map((c) => (c.id === note.id ? note : c)));
  }, [setClasses]);

  // Frequência detalhada (spec-frequencia.md): registra a participação de hoje
  // na disciplina (menu 2×2 da Home; presente/falta contam como atividade do dia).
  const markAttendance = useCallback((courseId: string, status: AttendanceStatus) => {
    const today = toDateKey(new Date());
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? applyAttendanceAction(c, { status }, today) : c))
    );
    if (status === 'presente' || status === 'falta') registerActivity();
  }, [setCourses, registerActivity]);

  const updateAttendanceRecord = useCallback((courseId: string, recordId: string, patch: Partial<Pick<AttendanceRecord, 'status' | 'noteId' | 'hours'>>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? patchRecord(c, recordId, patch) : c))
    );
  }, [setCourses]);

  const removeAttendanceRecord = useCallback((courseId: string, recordId: string) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? removeRecord(c, recordId) : c))
    );
  }, [setCourses]);

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

  const handleReviewFlashcard = useCallback((id: string, quality: 0 | 1 | 2 | 3) => {
    hapticTap();
    registerActivity();
    setFlashcards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        // FSRS é o scheduler único: `schedule` define due/lastReviewed/state/estabilidade.
        // `timesReviewed` mantém a semântica atual (spec §Modelo de dados): +1 apenas p/ quality >= 2
        // (alimenta stickers e a métrica do Perfil sem mudança de comportamento).
        const updated = schedule(c, quality);
        return {
          ...updated,
          timesReviewed: (c.timesReviewed ?? 0) + (quality >= 2 ? 1 : 0),
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
    // SPEC-005: disciplina nova nasce no período ativo (mesmo padrão do
    // `workspaceId`) e visível. `termId` explícito no rascunho manda — é assim
    // que o wizard de semestre cria a disciplina já no período certo.
    const termId = course.termId ?? activeTermId;
    setCourses((prev) => [
      { ...course, workspaceId: currentWorkspaceId, termId, status: course.status ?? 'ativo' },
      ...prev,
    ]);
  }, [setCourses, currentWorkspaceId, activeTermId]);

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

  // ---- Período letivo (SPEC-005) ----

  /**
   * Aplica o plano de virada.
   *
   * O plano vem **pronto** de `planTermRollover` (puro, testado, no package
   * `application`) — aqui só há escrita. A disciplina é mesclada por `id` em
   * vez de substituída: `plan.courses` é a projeção estreita
   * (`TermScopedCourse`), e trocar a lista inteira perderia `schedule`,
   * `attendance`, `repertório` e afins.
   *
   * `profile.semester` é reescrito a partir do ordinal do novo ativo. O campo é
   * legado (a UI lê o período ativo), mas ele volta no backup/import e nos
   * rótulos antigos — deixá-lo no valor anterior fazia a migração 18 → 19
   * recriar um período com o semestre errado na importação seguinte.
   */
  /**
   * Plano da última virada + o instante do commit, em memória. A SPEC-006 pede um
   * "desfazer" com janela curta (o toast de 8s): é a proteção contra a decisão
   * impulsiva de fechar o semestre — e só o plano guardado sabe devolver cada
   * disciplina ao período de origem.
   *
   * `appliedAt` ancora a janela no **commit** (SPEC-006 D5) e é o que fecha a
   * janela: sem expirar, `canUndoRollover` ficava verdadeiro para sempre depois
   * que o toast sumia — um "desfazer" invisível, valendo sempre.
   */
  const [lastRollover, setLastRollover] = useState<{ plan: TermRolloverPlan; appliedAt: number } | null>(null);
  const lastRolloverPlan = lastRollover?.plan ?? null;

  // Um dono só do relógio da janela: ao passar de 8s o plano some, junto com a
  // affordance. Limpar no cleanup também cobre a troca de plano (uma virada nova
  // cancela o prazo da anterior) e o unmount (sem `setState` no zombie).
  useEffect(() => {
    if (!lastRollover) return;
    const remaining = remainingUndoWindowMs(lastRollover.appliedAt);
    if (remaining <= 0) {
      setLastRollover(null);
      return;
    }
    const timer = setTimeout(() => setLastRollover(null), remaining);
    return () => clearTimeout(timer);
  }, [lastRollover]);

  const applyTermRollover = useCallback((plan: TermRolloverPlan) => {
    const byId = new Map(plan.courses.map((c) => [c.id, c]));
    setCourses((prev) =>
      prev.map((c) => {
        const next = byId.get(c.id);
        return next ? { ...c, termId: next.termId, status: next.status } : c;
      })
    );
    // A virada é a 2ª das 3 portas de escrita (ver `core/domain/term.ts`) e
    // sempre passa pela invariante de um ativo só.
    const terms = enforceSingleActiveTerm(plan.terms);
    setAcademicTerms(terms);
    const active = resolveActiveTerm(terms);
    if (active) {
      setProfile((prev) => (prev.semester === active.ordinal ? prev : { ...prev, semester: active.ordinal }));
    }
    setLastRollover({ plan, appliedAt: Date.now() });
    hapticSuccess();
    // fecha um capítulo da jornada — o burst mais raro do app, no mesmo espírito
    // do "parabéns" das tarefas e do level up (SPEC-006 D8)
    celebrate('term-closed');
  }, [setCourses, setAcademicTerms, setProfile]);

  /** Reverte a virada. Nada foi apagado, então é só devolver cada campo. */
  const undoTermRollover = useCallback(
    (plan: TermRolloverPlan) => {
      const now = new Date().toISOString();
      const reverted = undoRollover({
        terms: academicTerms,
        courses: courses.map((c) => ({ id: c.id, termId: c.termId, status: c.status })),
        plan,
        now,
      });
      const byId = new Map(reverted.courses.map((c) => [c.id, c]));
      setCourses((prev) =>
        prev.map((c) => {
          const next = byId.get(c.id);
          if (!next) return c;
          // espelha a remoção de chave do undo: um `status` ausente precisa
          // continuar ausente, senão o diff de sync vê uma alteração que não houve
          const merged = { ...c, termId: next.termId };
          if (next.status === undefined) delete merged.status;
          else merged.status = next.status;
          return merged;
        })
      );
      const terms = enforceSingleActiveTerm(reverted.terms);
      setAcademicTerms(terms);
      const active = resolveActiveTerm(terms);
      if (active) {
        setProfile((prev) => (prev.semester === active.ordinal ? prev : { ...prev, semester: active.ordinal }));
      }
    },
    [academicTerms, courses, setCourses, setAcademicTerms, setProfile]
  );

  /**
   * Corrige o ordinal do período ativo — a "porta fácil" do Perfil (SPEC-006 D6).
   *
   * É a correção que substitui o input fantasma de `profile.semester`: antes a
   * usuária editava um campo que nada lia, e o semester exibido continuava o
   * mesmo. Aqui o número que ela digita é o número que o app usa.
   *
   * O `cap` é o **teto global** (`MAX_TERM_ORDINAL`), não o total do curso
   * (SPEC-008 D3): passar o total aqui prendia a usuária que está no 9º de um
   * curso de 8 — e, como o total não tinha editor, a correção era impossível.
   * Estar além do total é um aviso no cartão, não um clamp.
   */
  const correctTermOrdinal = useCallback(
    (termId: string, ordinal: number) => {
      const now = new Date().toISOString();
      const terms = enforceSingleActiveTerm(
        retitleTerm(academicTerms, termId, ordinal, now, MAX_TERM_ORDINAL),
      );
      if (terms === academicTerms) return; // no-op (encerrado, planejado ou mesmo ordinal)
      setAcademicTerms(terms);
      const active = resolveActiveTerm(terms);
      if (active) {
        setProfile((prev) => (prev.semester === active.ordinal ? prev : { ...prev, semester: active.ordinal }));
      }
      hapticTap();
    },
    [academicTerms, setAcademicTerms, setProfile],
  );

  /**
   * Abre o **primeiro** período quando não há nenhum ativo (SPEC-008 F4.2).
   *
   * O estado "sem período ativo" é alcançável de verdade: `ensureActiveTerm` (o
   * boot) só cria o bootstrap quando o id dele não existe ainda, então um
   * backup com o bootstrap já **encerrado** e nenhum ativo fica assim para
   * sempre. Antes, o wizard abria em cima desse estado com o passo 0 travado
   * ("seu semestre ativo ainda não foi aberto") e o `handleSave` retornando
   * sem fazer nada — beco sem saída.
   *
   * Não passa por `planTermRollover`: não há período para encerrar, e esse
   * caminho não cria resumo de nada que não aconteceu.
   */
  const openFirstTerm = useCallback(
    (ordinal: number) => {
      if (resolveActiveTerm(academicTerms)) return; // já existe um ativo: nada a fazer
      const now = new Date().toISOString();
      const created = createAcademicTerm({ ordinal, startedAt: now.slice(0, 10), now });
      const terms = enforceSingleActiveTerm([...academicTerms, created]);
      setAcademicTerms(terms);
      setProfile((prev) => (prev.semester === created.ordinal ? prev : { ...prev, semester: created.ordinal }));
      hapticTap();
    },
    [academicTerms, setAcademicTerms, setProfile],
  );

  /**
   * Ajusta o total de semestres do curso (`1..MAX_TERM_ORDINAL`) — o palpite que o
   * `JourneyTermCard` expõe em stepper (SPEC-008 D2). Sem isto o total era um
   * número que ninguém podia corrigir depois da migração do default `8` → `10`.
   */
  const setTotalSemesters = useCallback(
    (total: number) => {
      const next = Math.max(1, Math.min(MAX_TERM_ORDINAL, Math.trunc(total) || 1));
      setProfile((prev) => (prev.totalSemesters === next ? prev : { ...prev, totalSemesters: next }));
      hapticTap();
    },
    [setProfile],
  );

  /**
   * Reabre um período encerrado (SPEC-006 D7). É a correção de "era o 6º, não o
   * 5º" quando a virada já aconteceu. O transcript do encerramento é zerado
   * pelo domínio — o período volta a ser um semestre em andamento.
   */
  const reopenTermById = useCallback(
    (termId: string) => {
      const now = new Date().toISOString();
      const reopened = reopenTerm(academicTerms, termId, now);
      if (reopened === academicTerms) return;
      // reabrir torna este período o ativo, então os demais ativos precisam
      // ceder (invariante de um ativo só)
      const terms = enforceSingleActiveTerm(reopened);
      setAcademicTerms(terms);
      const active = resolveActiveTerm(terms);
      if (active) {
        setProfile((prev) => (prev.semester === active.ordinal ? prev : { ...prev, semester: active.ordinal }));
      }
      hapticSuccess();
    },
    [academicTerms, setAcademicTerms, setProfile]
  );

  /**
   * Desfaz a última virada.
   *
   * Limpa a janela num único ponto (`setLastRollover(null)`) e **não** anuncia
   * mais nada: o toast de 8s da virada já está no ar, e um segundo toast por
   * cima roubaria a tela da confirmação. A virada desfeita não oferece
   * "refazer" — ela é reversível só no instante seguinte (SPEC-006 D8).
   */
  const undoLastRollover = useCallback(() => {
    if (!lastRollover) return;
    const { plan } = lastRollover;
    // limpa **antes** de escrever: se a escrita lançar, a janela fica fechada em
    // vez de oferecer um "desfazer" que não desfaz nada
    setLastRollover(null);
    undoTermRollover(plan);
  }, [lastRollover, undoTermRollover]);

  /** Arquiva: sai da grade do período, some do plano de ação, continua pesquisável. */
  const archiveCourse = useCallback((courseId: string) => {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, status: 'arquivado' } : c)));
    hapticTap();
  }, [setCourses]);

  /**
   * Desarquiva de volta para a grade do período **ativo**.
   *
   * O `termId` também migra: uma disciplina arquivada durante a virada ficou
   * apontando para o período antigo, então só religar o `status` a devolveria
   * para um semestre que já fechou — e ela sumiria da grade mesmo "ativa".
   * Sem período ativo, mantém o `termId` (não inventa um período).
   */
  const restoreCourse = useCallback((courseId: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? { ...c, status: 'ativo', termId: activeTermId ?? c.termId }
          : c
      )
    );
    hapticTap();
  }, [setCourses, activeTermId]);

  const groupTerm = useMemo(
    () => ({
      applyTermRollover,
      undoTermRollover,
      undoLastRollover,
      // a forma pública segue sendo o plano puro (é o que `AppContext` tipa);
      // `appliedAt` é detalhe interno da janela
      lastRollover: lastRolloverPlan,
      canUndoRollover: lastRollover !== null,
      correctTermOrdinal,
      setTotalSemesters,
      openFirstTerm,
      reopenTermById,
      archiveCourse,
      restoreCourse,
    }),
    [applyTermRollover, undoTermRollover, undoLastRollover, lastRollover, lastRolloverPlan, correctTermOrdinal, setTotalSemesters, openFirstTerm, reopenTermById, archiveCourse, restoreCourse]
  );

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
      markAttendance,
      updateAttendanceRecord,
      removeAttendanceRecord,
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
      markAttendance,
      updateAttendanceRecord,
      removeAttendanceRecord,
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
    ...groupTerm,
    courses: groupCourses,
    study: groupStudy,
    knowledge: groupKnowledge,
    app: groupApp,
    term: groupTerm,
  };
}
