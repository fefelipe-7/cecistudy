import type {
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
  StudySession,
  QuizSession,
  LooseNote,
  ManagedItemKind,
} from '../types';

/** Todos os bancos que o menu de editar/excluir pode tocar. */
export interface ManagedDB {
  courses: Course[];
  classes: ClassNote[];
  tasks: Task[];
  exams: Exam[];
  authors: PsychologyAuthor[];
  concepts: PsychologyConcept[];
  readings: ReadingItem[];
  flashcards: Flashcard[];
  materials: MaterialItem[];
  internshipLogs: InternshipLog[];
  sessions: StudySession[];
  quizSessions: QuizSession[];
  looseNotes: LooseNote[];
  bookmarkedCourseIds: string[];
}

/** Rótulo curto de cada entidade (menu editar/excluir). */
export const MANAGED_KIND_LABEL: Record<ManagedItemKind, string> = {
  course: 'matéria',
  class: 'aula',
  task: 'tarefa',
  exam: 'prova',
  reading: 'leitura',
  flashcard: 'flashcard',
  session: 'sessão',
  internship: 'registro de estágio',
  concept: 'conceito',
  author: 'autor',
  material: 'material',
  looseNote: 'nota avulsa',
  quizSession: 'quiz',
};

/** Toast de confirmação após excluir cada entidade. */
export const MANAGED_KIND_REMOVED: Record<ManagedItemKind, string> = {
  course: 'matéria excluída do cantinho ♡',
  class: 'aula excluída do diário ♡',
  task: 'tarefa removida do plano ♡',
  exam: 'prova excluída do cantinho ♡',
  reading: 'leitura removida da estante ♡',
  flashcard: 'flashcard excluído do cantinho ♡',
  session: 'sessão excluída do histórico ♡',
  internship: 'registro de estágio excluído ♡',
  concept: 'conceito excluído do cantinho ♡',
  author: 'autor excluído do cantinho ♡',
  material: 'material excluído ♡',
  looseNote: 'nota avulsa excluída ♡',
  quizSession: 'quiz excluído do histórico ♡',
};

const removeId = <T extends { id: string }>(list: T[], id: string): T[] =>
  list.filter((x) => x.id !== id);

const without = (arr: string[] | undefined, id: string): string[] | undefined => {
  if (!arr) return undefined;
  const next = arr.filter((x) => x !== id);
  return next.length === 0 ? undefined : next;
};

/**
 * Exclui uma entidade com cascata + limpeza de referências em todos os bancos.
 * Puro e imutável — retorna um banco novo (testável via vitest).
 */
export function deleteManagedItem(
  db: ManagedDB,
  kind: ManagedItemKind,
  id: string
): ManagedDB {
  switch (kind) {
    case 'course': {
      const courses = removeId(db.courses, id);
      const classes = db.classes.filter((c) => c.courseId !== id);
      const tasks = db.tasks.filter((t) => t.disciplineId !== id);
      const exams = db.exams.filter((e) => e.courseId !== id);
      const readings = db.readings.filter((r) => r.courseId !== id);
      const materials = db.materials.filter((m) => m.courseId !== id);
      const flashcards = db.flashcards.map((f) =>
        f.courseId === id ? { ...f, courseId: undefined } : f
      );
      const concepts = db.concepts.map((c) =>
        c.courseIds.includes(id) ? { ...c, courseIds: without(c.courseIds, id) ?? [] } : c
      );
      const bookmarkedCourseIds = db.bookmarkedCourseIds.filter((x) => x !== id);
      return { ...db, courses, classes, tasks, exams, readings, materials, flashcards, concepts, bookmarkedCourseIds };
    }
    case 'class': {
      const classes = removeId(db.classes, id);
      const tasks = db.tasks.map((t) =>
        t.classId === id ? { ...t, classId: undefined } : t
      );
      return { ...db, classes, tasks };
    }
    case 'task':
      return { ...db, tasks: removeId(db.tasks, id) };
    case 'exam':
      return { ...db, exams: removeId(db.exams, id) };
    case 'reading':
      return { ...db, readings: removeId(db.readings, id) };
    case 'flashcard':
      return { ...db, flashcards: removeId(db.flashcards, id) };
    case 'session':
      return { ...db, sessions: removeId(db.sessions, id) };
    case 'quizSession':
      return { ...db, quizSessions: removeId(db.quizSessions, id) };
    case 'internship':
      return { ...db, internshipLogs: removeId(db.internshipLogs, id) };
    case 'looseNote':
      return { ...db, looseNotes: removeId(db.looseNotes, id) };
    case 'concept': {
      const concepts = removeId(db.concepts, id);
      const classes = db.classes.map((cl) =>
        cl.conceptIds?.includes(id) ? { ...cl, conceptIds: without(cl.conceptIds, id) } : cl
      );
      const flashcards = db.flashcards.map((f) =>
        f.conceptId === id ? { ...f, conceptId: undefined } : f
      );
      const internshipLogs = db.internshipLogs.map((l) =>
        l.conceptIds?.includes(id) ? { ...l, conceptIds: without(l.conceptIds, id) } : l
      );
      const looseNotes = db.looseNotes.map((n) =>
        n.conceptIds?.includes(id) ? { ...n, conceptIds: without(n.conceptIds, id) } : n
      );
      return { ...db, concepts, classes, flashcards, internshipLogs, looseNotes };
    }
    case 'author': {
      const authors = removeId(db.authors, id);
      const classes = db.classes.map((cl) =>
        cl.authorIds?.includes(id) ? { ...cl, authorIds: without(cl.authorIds, id) } : cl
      );
      const concepts = db.concepts.map((c) =>
        c.authorIds.includes(id) ? { ...c, authorIds: without(c.authorIds, id) ?? [] } : c
      );
      const looseNotes = db.looseNotes.map((n) =>
        n.authorIds?.includes(id) ? { ...n, authorIds: without(n.authorIds, id) } : n
      );
      return { ...db, authors, classes, concepts, looseNotes };
    }
    case 'material': {
      const materials = removeId(db.materials, id);
      const classes = db.classes.map((cl) =>
        cl.materials?.includes(id) ? { ...cl, materials: without(cl.materials, id) } : cl
      );
      const looseNotes = db.looseNotes.map((n) =>
        n.materialIds?.includes(id) ? { ...n, materialIds: without(n.materialIds, id) } : n
      );
      return { ...db, materials, classes, looseNotes };
    }
  }
}