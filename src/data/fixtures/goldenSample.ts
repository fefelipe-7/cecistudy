/**
 * Fixtures douradas (F0.4) — banco "cheio" de referência compartilhado TS/Rust.
 *
 * O MESMO snapshot alimenta os golden files em
 * `cecistudy-rust/contracts/golden/` (gerados/verificados por
 * `src/lib/__tests__/goldenFixtures.test.ts`) e o teste de paridade Rust
 * (`golden_parity_test.rs`, Fase 1). Dados cênicos: psicologia clínica, pt-BR,
 * sem dados identificáveis de pacientes.
 *
 * ⚠️ Alterar este arquivo muda os golden files — regenere com
 * `GOLDEN_WRITE=1 npm run test -- src/lib/__tests__/goldenFixtures.test.ts`.
 */
import type { PersistedStateSnapshot } from '../../../packages/data/src/persistentData';
import type { BackupV2 } from '../../../packages/data/src/exportImport';
import type { LooseNote } from '../../../src/types';
import { emptyDatabase } from '../empty';

/** exportedAt fixo → o envelope é determinístico (mesmos bytes nos dois lados). */
export const GOLDEN_EXPORTED_AT = '2026-09-10T12:00:00.000Z';

function emptyBackupPayload(): Record<string, unknown> {
  const { approaches: _approaches, questions: _questions, ...userData } = emptyDatabase();
  return userData as Record<string, unknown>;
}

/** Snapshot do estado zerado (equivalente a `emptyDatabase()` como snapshot). */
export function emptySnapshot(): PersistedStateSnapshot {
  const { looseNotes: _unknown, ...db } = emptyDatabase();
  return { ...db, looseNotes: [] as LooseNote[] };
}

/** Snapshot cênico: um semestre com 2 disciplinas, notas, provas, leituras… */
export function sampleSnapshot(): PersistedStateSnapshot {
  const base = emptyDatabase();
  return {
    ...base,
    profile: {
      workspaceId: 'ws-academico',
      name: 'Maite',
      semester: 6,
      totalSemesters: 8,
      university: 'USP',
      targetCareer: 'clínica psicanalítica',
      dailyQuote: 'com leveza e foco ♡',
      stickersCollected: 3,
    },
    courses: [
      {
        id: 'c1',
        workspaceId: 'ws-academico',
        name: 'Teorias da Personalidade',
        code: 'PSI601',
        professor: 'Profa. Helena Duarte',
        semester: '6º Semestre',
        schedule: [
          { day: 2, start: '08:00', end: '09:40' },
          { day: 4, start: '10:00', end: '11:40' },
        ],
        room: 'B-201',
        category: 'obrigatoria',
        color: '#D85F79',
        icon: 'Brain',
        minGrade: 7,
        description: 'estudo das principais teorias de personalidade',
      },
      {
        id: 'c2',
        workspaceId: 'ws-academico',
        name: 'Entrevista e Observação',
        code: 'PSI610',
        professor: 'Prof. Rafael Mota',
        semester: '6º Semestre',
        schedule: [{ day: 3, start: '14:00' }],
        category: 'obrigatoria',
        color: '#4A879F',
        icon: 'Mic',
        description: 'técnicas de entrevista psicológica',
        attendance: { attended: 8, total: 12 },
      },
    ],
    classes: [
      {
        id: 'cl-1',
        workspaceId: 'ws-academico',
        courseId: 'c1',
        title: 'aula 5 — psicodinâmica do self',
        number: 5,
        date: '2026-09-08',
        summary: 'as três instâncias e o conflito intrasubjetivo',
        fullNotes: 'discutimos o ego, id e superego a partir de casos clínicos.',
        conceptIds: ['con-1'],
        authorIds: ['aut-1'],
        approachIds: ['app-01'],
        rating: 5,
      },
      {
        id: 'cl-2',
        workspaceId: 'ws-academico',
        courseId: 'c2',
        title: 'aula 3 — escuta ativa',
        number: 3,
        date: '2026-09-10',
        summary: 'prática de escuta ativa em duplas',
        rating: 4,
      },
    ],
    tasks: [
      {
        id: 't1',
        workspaceId: 'ws-academico',
        title: 'resumir capítulo 7 de Rogers',
        disciplineId: 'c1',
        dueDate: '2026-09-15',
        completed: false,
        priority: 'alta',
        category: 'leitura',
      },
      {
        id: 'task_1750000000002',
        workspaceId: 'ws-academico',
        title: 'transcrever entrevista',
        disciplineId: 'c2',
        completed: true,
        priority: 'media',
        category: 'trabalho',
      },
    ],
    exams: [
      {
        id: 'e1',
        workspaceId: 'ws-academico',
        courseId: 'c1',
        title: 'prova 1 — psicanálise',
        date: '2026-09-22',
        time: '08:00',
        weight: '40% da nota',
        weightValue: 40,
        topics: ['inconsciente', 'mecanismos de defesa'],
        completed: true,
        grade: 8.5,
      },
    ],
    authors: [
      {
        id: 'aut-1',
        workspaceId: 'ws-academico',
        name: 'Sigmund Freud',
        bio: 'neurologista austríaco, criador da psicanálise',
        lifespan: '1856-1939',
        approachId: 'app-01',
        keyConcepts: ['inconsciente', 'transferência'],
        majorWorks: ['A Interpretação dos Sonhos', 'Além do Princípio do Prazer'],
      },
    ],
    concepts: [
      {
        id: 'con-1',
        workspaceId: 'ws-academico',
        name: 'transferência',
        definition: 'deslocamento de sentimentos de figuras passadas para o analista',
        approachId: 'app-01',
        authorIds: ['aut-1'],
        courseIds: ['c1'],
        tags: ['clínica', 'vínculo'],
      },
    ],
    readings: [
      {
        id: 'r1',
        workspaceId: 'ws-academico',
        title: 'O Desenvolvimento da Personalidade',
        author: 'Carl Rogers',
        courseId: 'c1',
        type: 'livro',
        totalPages: 280,
        readPages: 96,
        status: 'lendo',
        highlights: ['enxergar o cliente como pessoa em processo'],
      },
      {
        id: 'r2',
        workspaceId: 'ws-academico',
        title: 'Entrevista clínica: conceitos e técnicas',
        author: 'Eduardo de Castro',
        type: 'livro',
        totalPages: 180,
        readPages: 180,
        status: 'concluido',
        chapters: [
          { id: 'ch-1', title: 'a entrevista inicial', body: 'estabelecimento do contrato.' },
        ],
      },
    ],
    flashcards: [
      {
        id: 'f1',
        workspaceId: 'ws-academico',
        conceptId: 'con-1',
        question: 'o que é transferência?',
        answer: 'deslocamento de sentimentos do passado para o analista',
        lastReviewed: '2026-09-09',
        easeFactor: 2.5,
        timesReviewed: 4,
      },
    ],
    materials: [
      {
        id: 'm1',
        workspaceId: 'ws-academico',
        title: 'Manual de técnicas de entrevista',
        type: 'livro',
        author: 'Marina B. Silva',
        courseId: 'c2',
        url: 'https://biblio.usp.br/exemplar',
        tags: ['entrevista', 'observação'],
        addedAt: '2026-08-20',
      },
    ],
    internshipLogs: [
      {
        id: 'ilog-1',
        workspaceId: 'ws-academico',
        type: 'atendimento_clinico',
        date: '2026-09-08',
        hours: 1.5,
        activity: 'atendimento 12 — paciente M.',
        reflections: 'escuta ativa sustentada; retomamos o luto recente.',
        phase: 'refletir',
        conceptIds: ['con-1'],
        patient: 'M.',
        sessionNumber: 12,
        theme: 'luto',
        approach: 'psicanalítica',
        supervisionLogId: 'ilog-3',
      },
      {
        id: 'ilog-2',
        workspaceId: 'ws-academico',
        type: 'supervisao',
        date: '2026-09-09',
        hours: 1,
        activity: 'supervisão de caso 12',
        reflections: 'discutimos intervenções de suporte no luto.',
        supervisor: 'Helena Duarte',
        topics: ['luto', 'intervenção'],
        nextSteps: ['ler sobre luto complicado'],
        discussedLogIds: ['ilog-1'],
        beforeNotes: 'ansiosa com o caso M.',
        afterNotes: 'plano: espaço para o luto, sem apressar.',
        selfAssessment: { confidence: 'confiante frente à estagiária aceita' },
      },
    ],
    tcc: {
      workspaceId: 'ws-academico',
      title: 'luto e escuta clínica na psicoterapia do idoso',
      advisor: 'Profa. Helena Duarte',
      field: 'Psicologia Clínica',
      problemStatement: 'como a escuta clínica sustenta o processo de luto no idoso?',
      objectives: ['revisar a literatura sobre luto no idoso'],
      status: 'em_andamento',
      chapters: [{ title: 'introdução', completed: true, dueDate: '2026-10-01' }],
      references: ['Worden, J. W. (2018). Tratamento do luto.'],
    },
    stickers: [
      {
        id: 'st-1',
        workspaceId: 'ws-academico',
        name: 'primeira leitura',
        emoji: '📖',
        description: 'concluiu a primeira leitura',
        unlocked: true,
        unlockedAt: '2026-08-15',
        category: 'leituras',
      },
      {
        id: 'st-2',
        name: 'estágio iniciado',
        emoji: '🧭',
        description: 'primeiro registro de estágio',
        unlocked: false,
        category: 'jornada',
      },
    ],
    sessions: [
      {
        id: 'ss-1',
        workspaceId: 'ws-academico',
        courseId: 'c1',
        topic: 'revisão de psicanálise',
        date: '2026-09-09',
        startTime: '18:00',
        durationMinutes: 50,
        notes: 'pomodoro x2',
      },
    ],
    streakData: { activeDays: ['2026-09-08', '2026-09-09', '2026-09-10'] },
    reminder: { enabled: true, time: '20:30' },
    looseNotes: [
      {
        id: 'ln-1',
        title: 'ideia de supervisão',
        content: 'filmar o atendimento? nunca sem consentimento.',
        category: 'ideia',
        date: '2026-09-10T08:00:00.000Z',
      },
      {
        id: 'ln-2',
        workspaceId: 'ws-academico',
        title: 'dúvida sobre luto complicado',
        content: 'levar para a supervisão de quinta.',
        category: 'reflexão',
        date: '2026-09-10T09:30:00-03:00',
        updatedAt: '2026-09-10T09:35:00-03:00',
        courseId: 'c1',
        conceptIds: ['con-1'],
      },
    ],
    savedBookIds: ['bk-1', 'bk-7'],
    bookmarkedCourseIds: ['c2'],
    readingProgress: { 'bk-1': 120, 'bk-7': 44 },
    techniques: [
      {
        id: 'tec-1',
        workspaceId: 'ws-academico',
        name: 'livre associação',
        approachId: 'app-01',
        description: 'falar livremente o que vier à mente',
        steps: ['deitar no divã', 'verbalizar'],
        relatedConceptIds: ['con-1'],
        color: '#D85F79',
      },
    ],
    onboarding: { completed: true, completedAt: '2026-08-01' },
    quizSessions: [
      {
        id: 'qs-1750000000001',
        workspaceId: 'ws-academico',
        config: {
          areas: ['Psicologia Clínica'],
          temas: ['luto'],
          escolas: ['Psicanálise'],
          dificuldades: ['intermediaria'],
          count: 5,
        },
        answers: [
          {
            questionId: 'q-1',
            userAnswer: 'A',
            correct: true,
            timeMs: 32000,
            question: {
              id: 'q-1',
              question: 'qual fase da psicanálise freudiana?',
              options: ['A', 'B', 'C'],
              answer: 'A',
              area: 'Psicologia Clínica',
              escolaOuAbordagem: 'Psicanálise',
              dificuldade: 'intermediaria',
            },
          },
        ],
        startedAt: 1750000000000,
        finishedAt: 1750000300000,
        totalTimeMs: 300000,
        correctCount: 1,
        totalCount: 5,
        scorePct: 20,
        createdAt: '2026-09-10',
      },
    ],
    syncIndex: {
      stamps: { profile: 1750000000000, courses: 1750000001000 },
      records: { courses: { c1: 1750000001000 }, classes: { 'cl-1': 1750000002000 } },
      tombstones: { tasks: { t9: 1750000003000 } },
    },
  };
}

/** Envelope BackupV2 determinístico (exportedAt fixo) para golden. */
export function goldenEnvelope(snapshot: PersistedStateSnapshot): BackupV2 {
  return {
    format: 'cecistudy-user-backup',
    formatVersion: 1,
    userSchemaVersion: 1,
    schemaVersion: 13,
    catalogRelease: null,
    exportedAt: GOLDEN_EXPORTED_AT,
    payload: buildGoldenPayload(snapshot),
  };
}

/** Payload de backup (exclui bancos estáticos) de um snapshot. */
export function buildGoldenPayload(snapshot: PersistedStateSnapshot): Record<string, unknown> {
  const { approaches: _a, questions: _q, ...userData } = snapshot;
  return userData as Record<string, unknown>;
}

/** Chaves de payload ordenadas para os arquivos por-coleção (alfabética). */
export function goldenCollectionKeys(payload: Record<string, unknown>): string[] {
  return Object.keys(payload).sort();
}

export { emptyBackupPayload };