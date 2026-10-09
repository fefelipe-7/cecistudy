/**
 * Validação runtime (Zod) do payload de backup/importação.
 *
 * Objetivo: rejeitar arquivos estruturalmente inválidos ANTES de aplicá-los,
 * com erros específicos por coleção. Coleções ausentes são toleradas (recebem
 * defaults de `emptyDatabase` via migração), mas coleções presentes devem
 * respeitar o formato esperado. Entidades usam `.passthrough()` para preservar
 * campos legados/decorativos sem travar imports de backups antigos.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Entidades (validação de forma — campos legados passam intactos)
// ---------------------------------------------------------------------------

const passthrough = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough();

const stringArray = z.array(z.string());
const optionalStringArray = stringArray.optional();
const optionalNumber = z.number().optional();

const userProfileSchema = passthrough({
  name: z.string(),
  semester: z.number(),
  totalSemesters: z.number(),
  university: z.string(),
  targetCareer: z.string(),
  dailyQuote: z.string(),
  stickersCollected: z.number(),
});

const courseScheduleSlotSchema = z.object({
  day: z.number().int().min(0).max(6),
  start: z.string(),
  end: z.string().optional(),
});

const courseSchema = passthrough({
  id: z.string(),
  name: z.string(),
  professor: z.string(),
  semester: z.string(),
  schedule: z.array(courseScheduleSlotSchema),
  color: z.string(),
  icon: z.string(),
  // SPEC-005: `termId` nullish (disciplina avulsa/fora de período é o escape
  // hatch anti-órfão, e um backup antigo simplesmente não tem a chave).
  // `status` com default para tolerar backup v17 (sem o campo) sem reprovar.
  termId: z.string().nullish(),
  status: z.enum(['ativo', 'arquivado']).default('ativo'),
});

const classNoteSchema = passthrough({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  number: z.number(),
  date: z.string(),
  summary: z.string(),
});

const taskSchema = passthrough({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  priority: z.enum(['alta', 'media', 'baixa']),
  category: z.enum(['leitura', 'trabalho', 'revisao', 'estagio', 'outro']),
});

const examSchema = passthrough({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  date: z.string(),
  weight: z.string(),
  topics: stringArray,
  completed: z.boolean(),
});

const authorSchema = passthrough({
  id: z.string(),
  name: z.string(),
  bio: z.string(),
});

const conceptSchema = passthrough({
  id: z.string(),
  name: z.string(),
  definition: z.string(),
  authorIds: stringArray,
  courseIds: stringArray,
  tags: stringArray,
});

const readingChapterSchema = passthrough({
  id: z.string(),
  title: z.string(),
  body: z.string(),
});

const readingItemSchema = passthrough({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  type: z.enum(['livro', 'artigo', 'capitulo', 'pdf']),
  status: z.enum(['nao_iniciado', 'lendo', 'concluido']),
});

const flashcardSchema = passthrough({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
});

const materialSchema = passthrough({
  id: z.string(),
  title: z.string(),
  type: z.enum(['artigo', 'livro', 'pdf', 'link', 'slides']),
  author: z.string(),
  tags: stringArray,
  addedAt: z.string(),
});

const internshipLogSchema = passthrough({
  id: z.string(),
  type: z.string(),
  date: z.string(),
  hours: z.number(),
  activity: z.string(),
  reflections: z.string(),
});

const supervisionNotebookSchema = passthrough({
  id: z.string(),
  date: z.string(),
  supervisor: z.string().optional(),
  questions: stringArray,
  conceptIds: stringArray,
  referenceIds: stringArray,
  nextSteps: stringArray,
  selfAssessment: z
    .object({
      confidence: z.string().optional(),
      limits: z.string().optional(),
      themes: z.string().optional(),
    })
    .passthrough()
    .optional(),
  beforeNotes: z.string().optional(),
  afterNotes: z.string().optional(),
});

// SPEC-012: o TCC emagrecece. `chapters`/`references` eram obrigatórios aqui —
// sem removê-los, o `tcc` migrado (que não os tem mais) reprovaria o import e o
// "backup restaurado" sumiria sem erro. Os campos novos entram como obrigatórios
// porque toda carga em ≥22 passa pela `MIGRATIONS[22]`, que os semeia.
const tccSchema = passthrough({
  id: z.string(),
  title: z.string(),
  advisor: z.string(),
  field: z.string(),
  problemStatement: z.string(),
  objectives: stringArray,
  status: z.enum(['em_andamento', 'revisao', 'concluido']),
  reminderPrefs: z
    .object({
      enabled: z.boolean(),
      chapterDaysBefore: z.array(z.number()),
      milestoneDaysBefore: z.array(z.number()),
      time: z.string(),
      meetingEve: z.boolean(),
      meetingMinutesBefore: z.array(z.number()),
    })
    .passthrough(),
});

const stickerSchema = passthrough({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  description: z.string(),
  unlocked: z.boolean(),
  category: z.enum(['faculdade', 'estudo', 'leituras', 'jornada']),
});

const sessionSchema = passthrough({
  id: z.string(),
  topic: z.string(),
  date: z.string(),
  durationMinutes: z.number(),
});

const streakDataSchema = passthrough({
  activeDays: stringArray,
});

const reminderSchema = passthrough({
  enabled: z.boolean(),
  time: z.string(),
});

const looseNoteSchema = passthrough({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  category: z.enum(['reflexão', 'estudo', 'ideia', 'lembrete']),
  date: z.string(),
});

const techniqueSchema = passthrough({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

const onboardingSchema = passthrough({
  completed: z.boolean(),
});

/** Nota de uma disciplina no período (frozen no fechamento). Espelha `TermGrade`. */
const termGradeSchema = passthrough({
  courseId: z.string(),
  label: z.string(),
  grade: z.number().optional(),
});

/** Métricas congeladas no encerramento do período (SPEC-005). */
const termSummarySchema = passthrough({
  closedAt: z.string(),
  courses: z.number(),
  archivedCourses: z.number(),
  carriedCourses: z.number(),
  classNotes: z.number(),
  tasksCompleted: z.number(),
  tasksCarriedOver: z.number(),
  readingsCompleted: z.number(),
  pagesRead: z.number(),
  focusMinutes: z.number(),
  loggedHours: z.number(),
  bestStreak: z.number(),
  grades: z.array(termGradeSchema),
  highlights: stringArray,
});

/** Período letivo (SPEC-005). `summary` só existe depois de `encerrado`. */
const academicTermSchema = passthrough({
  id: z.string(),
  label: z.string(),
  ordinal: z.number().int().min(1).max(12),
  status: z.enum(['planejado', 'ativo', 'encerrado']),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  statusTransitionAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  summary: termSummarySchema.optional(),
});

/** Índice de sincronização (carimbos/tombstones) — opcional; backups antigos não o trazem. */
const syncIndexSchema = passthrough({
  stamps: z.record(z.string(), z.number()).optional(),
  records: z.record(z.string(), z.record(z.string(), z.number())).optional(),
  tombstones: z.record(z.string(), z.record(z.string(), z.number())).optional(),
});

const studyQuestionSchema = passthrough({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
});

const quizAnswerSchema = passthrough({
  questionId: z.string(),
  userAnswer: z.string(),
  correct: z.boolean(),
  timeMs: z.number(),
  question: studyQuestionSchema,
});

const quizConfigSchema = passthrough({
  areas: stringArray,
  temas: stringArray,
  escolas: stringArray,
  dificuldades: z.array(z.enum(['basica', 'intermediaria', 'avancada'])),
  count: z.number(),
});

const quizSessionSchema = passthrough({
  id: z.string(),
  config: quizConfigSchema,
  answers: z.array(quizAnswerSchema),
  startedAt: z.number(),
  finishedAt: z.number(),
  totalTimeMs: z.number(),
  correctCount: z.number(),
  totalCount: z.number(),
  scorePct: z.number(),
  createdAt: z.string(),
});

// ---------------------------------------------------------------------------
// Leitura — sessões, destaques e marcadores (SPEC-M-014)
// ---------------------------------------------------------------------------

const readingSessionSchema = passthrough({
  id: z.string(),
  workspaceId: z.string().optional(),
  readingId: z.string(),
  kind: z.enum(['session', 'baseline']),
  date: z.string(),
  unit: z.enum(['pages', 'position', 'time']),
  fromPage: z.number().optional(),
  toPage: z.number().optional(),
  fromPercent: z.number().optional(),
  toPercent: z.number().optional(),
  fromBlockId: z.string().optional(),
  toBlockId: z.string().optional(),
  minutes: z.number().optional(),
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

const readingHighlightSchema = passthrough({
  id: z.string(),
  workspaceId: z.string().optional(),
  readingId: z.string(),
  kind: z.enum(['text', 'manual']),
  anchor: z
    .object({
      sectionId: z.string(),
      blockId: z.string(),
      start: z.number(),
      end: z.number(),
    })
    .optional(),
  quote: z.string(),
  page: z.number().optional(),
  color: z.enum(['idea', 'doubt', 'quote', 'review']),
  note: z.string().optional(),
  conceptIds: z.array(z.string()).optional(),
  authorIds: z.array(z.string()).optional(),
  flashcardId: z.string().optional(),
  looseNoteId: z.string().optional(),
  contentVersion: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const readingBookmarkSchema = passthrough({
  id: z.string(),
  workspaceId: z.string().optional(),
  readingId: z.string(),
  sectionId: z.string(),
  blockId: z.string(),
  label: z.string().optional(),
  createdAt: z.string(),
});

// ---------------------------------------------------------------------------
// TCC (SPEC-012) — capítulos, referências, reuniões, pendências e escrita
// ---------------------------------------------------------------------------

const thesisChapterSchema = passthrough({
  id: z.string(),
  thesisId: z.string(),
  position: z.number(),
  title: z.string(),
  kind: z.string(),
  requiredness: z.string(),
  stage: z.enum(['a_fazer', 'escrevendo', 'em_revisao', 'pronto']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const thesisReferenceSchema = passthrough({
  id: z.string(),
  thesisId: z.string(),
  readingId: z.string(),
  status: z.enum(['candidata', 'lida', 'citada', 'descartada']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const thesisMeetingSchema = passthrough({
  id: z.string(),
  thesisId: z.string(),
  date: z.string(),
  mode: z.string(),
  status: z.enum(['agendada', 'realizada', 'cancelada']),
  decisions: stringArray,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const thesisTaskSchema = passthrough({
  id: z.string(),
  thesisId: z.string(),
  title: z.string(),
  origin: z.enum(['orientadora', 'minha']),
  status: z.enum(['aberta', 'em_andamento', 'resolvida', 'arquivada']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const thesisWritingLogSchema = passthrough({
  id: z.string(),
  thesisId: z.string(),
  date: z.string(),
  words: z.number(),
  createdAt: z.string(),
});

// ---------------------------------------------------------------------------
// Banco completo (coleções opcionais — ausência recebe default; presença valida)
// ---------------------------------------------------------------------------

/** Valida o objeto `data` migrado de um backup. Coleções ausentes são toleradas. */
export const backupDataSchema = z
  .object({
    profile: userProfileSchema,
    courses: z.array(courseSchema),
    classes: z.array(classNoteSchema),
    tasks: z.array(taskSchema),
    exams: z.array(examSchema),
    authors: z.array(authorSchema),
    concepts: z.array(conceptSchema),
    readings: z.array(readingItemSchema),
    flashcards: z.array(flashcardSchema),
    materials: z.array(materialSchema),
    internshipLogs: z.array(internshipLogSchema),
    supervision: z.array(supervisionNotebookSchema),
    tcc: tccSchema,
    stickers: z.array(stickerSchema),
    sessions: z.array(sessionSchema),
    streakData: streakDataSchema,
    reminder: reminderSchema,
    looseNotes: z.array(looseNoteSchema),
    savedBookIds: stringArray,
    bookmarkedCourseIds: stringArray,
    readingProgress: z.record(z.string(), z.number()),
    techniques: z.array(techniqueSchema),
    quizSessions: z.array(quizSessionSchema),
    academicTerms: z.array(academicTermSchema),
    readingSessions: z.array(readingSessionSchema),
    readingHighlights: z.array(readingHighlightSchema),
    readingBookmarks: z.array(readingBookmarkSchema),
    thesisChapters: z.array(thesisChapterSchema),
    thesisReferences: z.array(thesisReferenceSchema),
    thesisMeetings: z.array(thesisMeetingSchema),
    thesisTasks: z.array(thesisTaskSchema),
    thesisWritingLogs: z.array(thesisWritingLogSchema),
    onboarding: onboardingSchema,
    syncIndex: syncIndexSchema.optional(),
  })
  .partial()
  .passthrough();

export type ValidatedBackupData = z.infer<typeof backupDataSchema>;
