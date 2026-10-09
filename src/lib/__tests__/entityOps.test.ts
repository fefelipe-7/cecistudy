import { describe, it, expect } from 'vitest';
import { deleteManagedItem, MANAGED_KIND_LABEL, MANAGED_KIND_REMOVED, ManagedDB } from '../entityOps';
import { statusOf, buildLinkIndex } from '../internshipCases';
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
} from '../../types';

const course: Course = {
  id: 'c1',
  name: 'Psicopatologia',
  professor: 'Prof',
  semester: '6º',
  schedule: [{ day: 1, start: '09:00' }],
  color: '#E97891',
  icon: 'Brain',
};

const classNote: ClassNote = {
  id: 'cl-1',
  courseId: 'c1',
  title: 'aula 1',
  number: 1,
  date: '2026-08-01',
  summary: 'resumo',
  conceptIds: ['con-1'],
  authorIds: ['aut-1'],
  materials: ['m1'],
};

const task: Task = {
  id: 't1',
  title: 'ler capítulo',
  disciplineId: 'c1',
  classId: 'cl-1',
  dueDate: '2026-08-10',
  completed: false,
  priority: 'media',
  category: 'leitura',
};

const exam: Exam = {
  id: 'e1',
  courseId: 'c1',
  title: 'prova 1',
  date: '2026-08-15',
  weight: '40%',
  topics: [],
  completed: false,
};

const author: PsychologyAuthor = {
  id: 'aut-1',
  name: 'Aaron Beck',
  bio: 'pai da TCC',
  keyConcepts: ['tríade cognitiva'],
  majorWorks: ['terapia cognitiva'],
};

const concept: PsychologyConcept = {
  id: 'con-1',
  name: 'tríade cognitiva',
  definition: 'visões negativas de si, mundo e futuro',
  authorIds: ['aut-1'],
  courseIds: ['c1'],
  tags: ['tcc'],
};

const reading: ReadingItem = {
  id: 'r1',
  title: 'a interpretação dos sonhos',
  author: 'freud',
  courseId: 'c1',
  type: 'livro',
  status: 'lendo',
};

const flashcard: Flashcard = {
  id: 'f1',
  conceptId: 'con-1',
  courseId: 'c1',
  question: 'o que é a tríade?',
  answer: '...',
};

const material: MaterialItem = {
  id: 'm1',
  title: 'manual diagnóstico',
  type: 'livro',
  author: 'american psychiatric association',
  courseId: 'c1',
  tags: ['dsm'],
  addedAt: '2026-08-01',
};

const internshipLog: InternshipLog = {
  id: 'ilog-1',
  type: 'estagio',
  date: '2026-08-01',
  hours: 4,
  activity: 'triagem',
  reflections: 'aprendi muito',
  conceptIds: ['con-1'],
};

const session: StudySession = {
  id: 'ss-1',
  courseId: 'c1',
  topic: 'revisão',
  date: '2026-08-01',
  durationMinutes: 25,
};

const quizSession: QuizSession = {
  id: 'qs-1',
  config: { areas: [], temas: [], escolas: [], dificuldades: ['basica'], count: 5 },
  answers: [],
  startedAt: 1,
  finishedAt: 2,
  totalTimeMs: 1000,
  correctCount: 3,
  totalCount: 5,
  scorePct: 60,
  createdAt: '2026-08-01',
};

const looseNote: LooseNote = {
  id: 'ln-1',
  title: 'nota',
  content: 'conteúdo',
  category: 'estudo',
  date: '2026-08-01',
  conceptIds: ['con-1'],
  authorIds: ['aut-1'],
  materialIds: ['m1'],
};

function makeDb(): ManagedDB {
   return {
     courses: [course],
     classes: [classNote],
     tasks: [task],
     exams: [exam],
     authors: [author],
     concepts: [concept],
     readings: [reading],
     flashcards: [flashcard],
     materials: [material],
     internshipLogs: [internshipLog],
     sessions: [session],
     quizSessions: [quizSession],
     looseNotes: [looseNote],
     bookmarkedCourseIds: ['c1'],
   };
 }

describe('deleteManagedItem', () => {
  it('exclui uma tarefa simples sem tocar nos outros bancos', () => {
    const db = makeDb();
    const next = deleteManagedItem(db, 'task', 't1');
    expect(next.tasks).toHaveLength(0);
    expect(next.classes).toEqual(db.classes);
    expect(next.courses).toEqual(db.courses);
  });

  it('remove curso em cascata (aulas/provas/tarefas/leituras/materiais + referências)', () => {
    const db = makeDb();
    const next = deleteManagedItem(db, 'course', 'c1');
    expect(next.courses).toHaveLength(0);
    expect(next.classes).toHaveLength(0);
    expect(next.exams).toHaveLength(0);
    expect(next.tasks).toHaveLength(0);
    expect(next.readings).toHaveLength(0);
    expect(next.materials).toHaveLength(0);
    expect(next.flashcards[0].courseId).toBeUndefined();
    expect(next.concepts[0].courseIds).toEqual([]);
    expect(next.bookmarkedCourseIds).toEqual([]);
  });

  it('ao excluir aula, limpa a referência classId das tarefas', () => {
    const db = makeDb();
    const next = deleteManagedItem(db, 'class', 'cl-1');
    expect(next.classes).toHaveLength(0);
    expect(next.tasks[0].classId).toBeUndefined();
  });

  it('ao excluir conceito, limpa referências em aulas, flashcards, estágio e notas', () => {
    const db = makeDb();
    const next = deleteManagedItem(db, 'concept', 'con-1');
    expect(next.concepts).toHaveLength(0);
    expect(next.classes[0].conceptIds).toBeUndefined();
    expect(next.flashcards[0].conceptId).toBeUndefined();
    expect(next.internshipLogs[0].conceptIds).toBeUndefined();
    expect(next.looseNotes[0].conceptIds).toBeUndefined();
  });

  it('ao excluir autor, limpa referências em aulas, conceitos e notas', () => {
    const db = makeDb();
    const next = deleteManagedItem(db, 'author', 'aut-1');
    expect(next.authors).toHaveLength(0);
    expect(next.classes[0].authorIds).toBeUndefined();
    expect(next.concepts[0].authorIds).toEqual([]);
    expect(next.looseNotes[0].authorIds).toBeUndefined();
  });

  it('ao excluir material, limpa referências em aulas e notas', () => {
    const db = makeDb();
    const next = deleteManagedItem(db, 'material', 'm1');
    expect(next.materials).toHaveLength(0);
    expect(next.classes[0].materials).toBeUndefined();
    expect(next.looseNotes[0].materialIds).toBeUndefined();
  });

  it('exclui entidades simples (reading, flashcard, session, quiz, internship, looseNote)', () => {
    const db = makeDb();
    expect(deleteManagedItem(db, 'reading', 'r1').readings).toHaveLength(0);
    expect(deleteManagedItem(db, 'flashcard', 'f1').flashcards).toHaveLength(0);
    expect(deleteManagedItem(db, 'session', 'ss-1').sessions).toHaveLength(0);
    expect(deleteManagedItem(db, 'quizSession', 'qs-1').quizSessions).toHaveLength(0);
    expect(deleteManagedItem(db, 'internship', 'ilog-1').internshipLogs).toHaveLength(0);
    expect(deleteManagedItem(db, 'looseNote', 'ln-1').looseNotes).toHaveLength(0);
    expect(deleteManagedItem(db, 'exam', 'e1').exams).toHaveLength(0);
  });
});

// O vínculo sessão ↔ supervisão tem **fonte única** (`SPEC-009 D3`): ele vive só em
// `discussedLogIds`. Apagar a supervisão não precisa "limpar" nada na sessão — a
// sessão volta a "sem supervisão" por **derivação**, porque o índice não acha mais
// nenhuma supervisão que a discuta. É por isso que `F3` não tem mais como
// reaparecer: não existe segundo lugar onde o vínculo poderia ficar inconsistente.
describe('exclusão de registro de estágio limpa o vínculo', () => {
  const clinical = (id: string, over: Partial<InternshipLog> = {}): InternshipLog => ({
    id,
    type: 'atendimento_clinico',
    date: '2026-08-26',
    hours: 2,
    activity: 'sessão',
    reflections: '',
    patient: 'M.S.',
    sessionNumber: 1,
    ...over,
  });
  const supervision = (id: string, discussedLogIds: string[]): InternshipLog => ({
    id,
    type: 'supervisao',
    date: '2026-08-28',
    hours: 0,
    activity: 'supervisão com D.',
    reflections: '',
    supervisor: 'D.',
    discussedLogIds,
  });

  const db = (logs: InternshipLog[]) =>
    ({ ...makeDb(), internshipLogs: logs }) as ManagedDB;

  const TODAY = '2026-09-01';

  it('apagar a supervisão FAZ a sessão voltar a "sem supervisão" (por derivação)', () => {
    const antes = db([clinical('at-1'), supervision('sup-1', ['at-1'])]);
    expect(statusOf(antes.internshipLogs[0], buildLinkIndex(antes.internshipLogs, TODAY), TODAY).supervised).toBe(true);

    const depois = deleteManagedItem(antes, 'internship', 'sup-1');
    const st = statusOf(depois.internshipLogs[0], buildLinkIndex(depois.internshipLogs, TODAY), TODAY);
    expect(st.supervised).toBe(false);
    expect(st.supervisionIds).toEqual([]);
  });

  it('apagar a sessão tira o id órfão de discussedLogIds da supervisão', () => {
    const antes = db([clinical('at-1'), clinical('at-2'), supervision('sup-1', ['at-1', 'at-2'])]);
    const depois = deleteManagedItem(antes, 'internship', 'at-2');
    expect(depois.internshipLogs.find((l) => l.id === 'sup-1')?.discussedLogIds).toEqual(['at-1']);
  });

  it('apagar a última sessão discutida remove o campo em vez de deixar array vazio', () => {
    const depois = deleteManagedItem(db([clinical('at-1'), supervision('sup-1', ['at-1'])]), 'internship', 'at-1');
    expect(depois.internshipLogs.find((l) => l.id === 'sup-1')?.discussedLogIds).toBeUndefined();
  });

  it('não toca em vínculos de outra supervisão', () => {
    const antes = db([
      clinical('at-1'),
      supervision('sup-1', ['at-1']),
      supervision('sup-2', ['at-2']),
      clinical('at-2'),
    ]);
    const depois = deleteManagedItem(antes, 'internship', 'sup-1');
    expect(depois.internshipLogs.find((l) => l.id === 'sup-2')?.discussedLogIds).toEqual(['at-2']);
  });
});

describe('labels', () => {
  it('existe label e toast para todas as entidades', () => {
    for (const kind of Object.keys(MANAGED_KIND_LABEL) as (keyof typeof MANAGED_KIND_LABEL)[]) {
      expect(MANAGED_KIND_LABEL[kind], `label de ${kind}`).toBeTruthy();
      expect(MANAGED_KIND_REMOVED[kind], `toast de ${kind}`).toBeTruthy();
    }
  });
});