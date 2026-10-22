/**
 * mocks — o dado falso que faz a tela parecer real.
 *
 * Regra desta fase (SPEC-015 D8): **mock nao e placeholder**. Um "Lorem ipsum"
 * ou um `[]` esconde o problema que a migracao precisa revelar — como a tela
 * se comporta com texto de verdade, linha de verdade e numero de verdade. O
 * dado aqui e de um semestre real de Psicologia clinica: 6 disciplinas, 4
 * cartoes vencidos, TCC em 62%, 14h de estagio no mes.
 *
 * Nenhum mock escreve, persiste ou calcula. Sao literais.
 */
import type { MascoteExpression } from '../tokens';

/* ── perfil ──────────────────────────────────────────────────────────────── */
export const profile = {
  name: 'marina',
  displayName: 'marina',
  semester: 5,
  totalSemesters: 10,
  university: 'usp',
  targetCareer: 'psicóloga clínica',
  dailyQuote: 'compreender o ser humano é a forma mais bonita de cuidado.',
  level: 7,
  levelTitle: 'quem acolhe',
  joinedAt: 'março de 2025',
} as const;

/* ── home ────────────────────────────────────────────────────────────────── */
export const todayClasses = [
  { id: 'c1', subject: 'psicopatologia', short: 'psico', time: '08:00 — 09:40', room: 'sala 214', teacher: 'marina w.', status: 'done' as const },
  { id: 'c2', subject: 'psicoterapia av', short: 'psico av', time: '10:00 — 11:40', room: 'sala 107', teacher: 'renato l.', status: 'now' as const },
  { id: 'c3', subject: 'entrevista clínica', short: 'entrevista', time: '14:00 — 15:40', room: 'lab 3', teacher: 'ana p.', status: 'next' as const },
];

export const attentionItems = [
  { id: 't1', kind: 'task' as const, title: 'ler o capítulo 6 — defesa mecanismos', due: 'hoje', course: 'psicopatologia', overdue: false },
  { id: 't2', kind: 'exam' as const, title: 'prova de psicoterapia', due: 'amanhã', course: 'psicoterapia av', overdue: false },
  { id: 't3', kind: 'task' as const, title: 'entregar o TER', due: 'ontem', course: 'estágio i', overdue: true },
  { id: 't4', kind: 'exam' as const, title: 'avaliação de neuro', due: 'em 3 dias', course: 'neuropsicologia', overdue: false },
  { id: 't5', kind: 'task' as const, title: 'revisar os 12 cartões de Theories', due: 'hoje', course: 'teorias', overdue: false },
];

export const weekRhythm = [
  { label: 'd', minutes: 0, isFuture: true },
  { label: 's', minutes: 45, isFuture: true },
  { label: 't', minutes: 120 },
  { label: 'q', minutes: 75 },
  { label: 'q', minutes: 160, isToday: true },
  { label: 's', minutes: 95 },
  { label: 's', minutes: 40 },
];

export const cecinhoTip: { text: string; expression: MascoteExpression } = {
  text: 'tem 12 cartão esperando revisão — começa pelos rápidos ✨',
  expression: 'celebrate-small',
};

/* ── faculdade ───────────────────────────────────────────────────────────── */
export const courses = [
  { id: 'psico', name: 'psicopatologia', code: 'PSI 302', professor: 'marina w.', color: '#D4617C', icon: '🧠', kind: 'obrigatória', nextExam: 'em 4 dias', freq: 82 },
  { id: 'av', name: 'psicoterapia av.', code: 'PSI 341', professor: 'renato l.', color: '#4A879F', icon: '💬', kind: 'obrigatória', nextExam: 'amanhã', freq: 94 },
  { id: 'entrevista', name: 'entrevista clínica', code: 'PSI 318', professor: 'ana p.', color: '#927D6B', icon: '🗣️', kind: 'obrigatória', nextExam: 'em 11 dias', freq: 76 },
  { id: 'neuro', name: 'neuropsicologia', code: 'PSI 355', professor: 'lucas f.', color: '#43805B', icon: '🧩', kind: 'obrigatória', nextExam: 'em 3 dias', freq: 68, freqWarning: true },
  { id: 'estagio', name: 'estágio i', code: 'PSI 390', professor: 'supervisão', color: '#BD913C', icon: '🫶', kind: 'obrigatória', nextExam: 'em 9 dias', freq: 100 },
  { id: 'teorias', name: 'teorias da personalidade', code: 'PSI 310', professor: 'joana v.', color: '#A03B52', icon: '🕯️', kind: 'optativa', nextExam: 'sem prova', freq: 55 },
];

export const internshipSummary = {
  hoursThisMonth: 14,
  records: 6,
  awaitingCare: 2,
};

export const internshipPreviews = [
  { id: 'i1', date: '14/10', hours: 3, patient: 'iniciais', note: 'primeira sessão — anamnese', mood: 'ok' },
  { id: 'i2', date: '11/10', hours: 2, patient: 'm.c.', note: 'sessão 6 — recorte transferencial', mood: 'pending' },
  { id: 'i3', date: '09/10', hours: 4, patient: 'a.r.', note: 'sessão 4 — devolutiva', mood: 'ok' },
];

export const weekEvents = [
  { day: 'qui', label: 'psicoterapia av.', kind: 'aula' },
  { day: 'sex', label: 'prova de neuro', kind: 'prova' },
  { day: 'seg', label: 'entregar TER', kind: 'tarefa' },
  { day: 'qua', label: 'reunião do tcc', kind: 'tcc' },
];

/* ── estudos ─────────────────────────────────────────────────────────────── */
export const study = {
  streakDays: 9,
  minutesToday: 45,
  dueCards: 12,
  quizQuestions: 318,
  tccProgress: 62,
  tccChaptersDone: 5,
  tccChaptersTotal: 8,
} as const;

export const reading = {
  title: 'ameeting do caos',
  author: 'b.',
  progress: 0.34,
  pagesCurrent: 118,
  pagesTotal: 348,
  /** Cor da capa e dado, nao tema — por isso vive aqui e nao em `tokens`. */
  coverColor: '#FFE9EE',
} as const;

export const studyRhythm = [
  { label: 's', minutes: 30, isFuture: true },
  { label: 't', minutes: 90 },
  { label: 'q', minutes: 45 },
  { label: 'q', minutes: 45, isToday: true },
  { label: 's', minutes: 150 },
  { label: 's', minutes: 60 },
  { label: 'd', minutes: 0, isFuture: true },
];

/* ── biblioteca ──────────────────────────────────────────────────────────── */
export const collections = [
  { id: 'col1', title: 'obras do acervo', count: 214, tone: 'rose' as const },
  { id: 'col2', title: 'autores', count: 96, tone: 'blue' as const },
  { id: 'col3', title: 'conceitos', count: 143, tone: 'green' as const },
  { id: 'col4', title: 'abordagens', count: 28, tone: 'amber' as const },
];

export const myBooks = [
  { id: 'b1', title: 'o caso clínico', author: 'm. reich', coverColor: '#FFE9EE', ink: '#71303F', progress: 0.34 },
  { id: 'b2', title: 'memorias de um psychoanalista', author: 'e. fromm', coverColor: '#E6F2F7', ink: '#284955', progress: 0.08 },
  { id: 'b3', title: 'o medo e a loucura', author: 'n. chorhron', coverColor: '#FFF1E5', ink: '#756354', progress: 0 },
];

export const shelfSections = [
  {
    id: 's1',
    title: 'clinica',
    items: [
      { id: 'i1', label: 'transferência', count: 34 },
      { id: 'i2', label: 'resistência', count: 21 },
      { id: 'i3', label: 'contra-transferência', count: 18 },
    ],
  },
  {
    id: 's2',
    title: 'teorias',
    items: [
      { id: 'i4', label: 'psicanálise', count: 46 },
      { id: 'i5', label: 'gestalt', count: 12 },
      { id: 'i6', label: 'humanismo', count: 9 },
    ],
  },
];

/* ── perfil ──────────────────────────────────────────────────────────────── */
export const journey = {
  ordinal: 5,
  total: 10,
  nextRolloverAvailable: true,
  startedAt: 'março de 2025',
  termsDone: 4,
} as const;

export const profileMetrics = [
  { key: 'sessions', value: '46h', label: 'foco', tone: 'brand' as const },
  { key: 'readings', value: '7', label: 'leituras', tone: 'academic' as const },
  { key: 'tasks', value: '128', label: 'tarefas', tone: 'green' as const },
  { key: 'exams', value: '19', label: 'provas', tone: 'academic' as const },
];

export const achievements = [
  { id: 'a1', label: '9 dias seguidos', icon: '🔥', done: true },
  { id: 'a2', label: '100 sessões de foco', icon: '⏳', done: false },
  { id: 'a3', label: 'primeiro TER entregue', icon: '🌿', done: true },
  { id: 'a4', label: 'biblioctlista', icon: '📚', done: false },
];

export const preferences = [
  { id: 'theme', label: 'tema', value: 'rosa claro', icon: '🎨' },
  { id: 'reminder', label: 'lembrete diário', value: 'ligado', icon: '🔔', toggle: true },
  { id: 'gcal', label: 'agenda do google', value: 'desligado', icon: '📅', toggle: true },
];

export const dataTools = [
  { id: 'sync', label: 'sincronizar', hint: 'levar o cantinho para outro aparelho' },
  { id: 'backup', label: 'backup', hint: 'baixar uma copia do seu semester' },
  { id: 'restore', label: 'restaurar', hint: 'voltar de um backup' },
];