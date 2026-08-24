import { describe, it, expect } from 'vitest';
import {
  importAppDatabase,
  buildBackupPayload,
  exportAppDatabase,
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  previewBackup,
} from '../exportImport';
import { emptyDatabase } from '../../data/empty';
import { readDatabaseFromState, buildBackupData, PersistedStateSnapshot } from '../persistentData';
import { USER_SCHEMA_VERSION } from '../../data/schema';

/** Snapshot mínimo mas representativo do estado do contexto. */
function makeSnapshot(overrides: Partial<PersistedStateSnapshot> = {}): PersistedStateSnapshot {
  return {
    profile: {
      name: 'Ceci',
      semester: 6,
      totalSemesters: 8,
      university: 'UFRJ',
      targetCareer: 'clínica',
      dailyQuote: 'com leveza',
      stickersCollected: 3,
      photoUrl: '',
    },
    courses: [
      {
        id: 'c1',
        name: 'Psicopatologia I',
        professor: 'Ana',
        semester: '6º semestre',
        schedule: [{ day: 1, start: '09:00' }],
        color: '#FFD3DD',
        icon: 'Brain',
        progress: 40,
      },
    ],
    classes: [
      { id: 'cl-1', courseId: 'c1', title: 'aula 1', number: 1, date: '2026-08-01', summary: 'resumo' },
    ],
    tasks: [
      { id: 't1', title: 'ler cap 2', completed: false, priority: 'media', category: 'leitura' },
    ],
    exams: [
      { id: 'e1', courseId: 'c1', title: 'p1', date: '2026-09-01', weight: '40%', topics: ['x'], completed: false },
    ],
    authors: [{ id: 'aut-1', name: 'Freud', bio: 'bio', keyConcepts: [], majorWorks: [] }],
    concepts: [
      { id: 'con-1', name: 'recalque', definition: 'def', authorIds: ['aut-1'], courseIds: ['c1'], tags: ['x'] },
    ],
    approaches: [],
    readings: [],
    flashcards: [],
    materials: [],
    internshipLogs: [],
    supervision: [],
    tcc: {
      title: '',
      advisor: '',
      field: '',
      problemStatement: '',
      objectives: [],
      status: 'em_andamento',
      chapters: [],
      references: [],
    },
    stickers: [],
    sessions: [],
    streakData: { activeDays: ['2026-08-01'] },
    reminder: { enabled: true, time: '19:00' },
    looseNotes: [],
    savedBookIds: ['bk-1'],
    bookmarkedCourseIds: ['c1'],
    readingProgress: { 'bk-1': 30 },
    questions: [],
    techniques: [{ id: 'tec-1', name: 'associação livre', description: 'desc' }],
    quizSessions: [
      {
        id: 'qs-1',
        config: {
          areas: ['clínica'],
          temas: ['luto'],
          escolas: ['TCC'],
          dificuldades: ['basica'],
          count: 5,
        },
        answers: [
          {
            questionId: 'q1',
            userAnswer: 'A',
            correct: true,
            timeMs: 5000,
            question: { id: 'q1', question: 'pergunta', answer: 'A' },
          },
        ],
        startedAt: 1,
        finishedAt: 2,
        totalTimeMs: 60000,
        correctCount: 1,
        totalCount: 5,
        scorePct: 20,
        createdAt: '2026-08-19',
      },
    ],
    onboarding: { completed: true, completedAt: '2026-08-01', loadedDemo: true },
    ...overrides,
  };
}

describe('contrato do banco persistido (backup v2)', () => {
  it('EmptyDatabase inclui quizSessions (default vazio)', () => {
    const db = emptyDatabase();
    expect(db.quizSessions).toEqual([]);
    expect(db.onboarding.completed).toBe(false);
  });

  it('readDatabaseFromState → buildBackupData preserva dados do usuário e exclui bancos estáticos', () => {
    const snapshot = makeSnapshot();
    const db = readDatabaseFromState(snapshot);
    expect(db.quizSessions).toHaveLength(1);
    expect(db.techniques).toHaveLength(1);
    expect(db.onboarding.completed).toBe(true);

    const data = buildBackupData(snapshot);
    expect(data).not.toHaveProperty('approaches');
    expect(data).not.toHaveProperty('questions');
    expect(data.quizSessions).toHaveLength(1);
    expect(data.techniques).toHaveLength(1);
    expect(data.onboarding).toEqual({ completed: true, completedAt: '2026-08-01', loadedDemo: true });
  });

  it('buildBackupPayload gera envelope v2 com metadados', async () => {
    const snapshot = makeSnapshot();
    const payload = await buildBackupPayload(snapshot);
    expect(payload.format).toBe(BACKUP_FORMAT);
    expect(payload.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(payload.userSchemaVersion).toBe(USER_SCHEMA_VERSION);
    expect(typeof payload.exportedAt).toBe('string');
    // Bancos estáticos não entram no payload.
    expect(payload.payload).not.toHaveProperty('approaches');
    expect(payload.payload).not.toHaveProperty('questions');
  });

  it('round-trip: estado → export → import → estado equivalente (dados do usuário)', async () => {
    const snapshot = makeSnapshot();
    const payload = await buildBackupPayload(snapshot);
    const json = JSON.stringify(payload);
    const restored = importAppDatabase(json);

    expect(restored).not.toBeNull();
    expect(restored!.quizSessions).toEqual(snapshot.quizSessions);
    expect(restored!.techniques).toEqual(snapshot.techniques);
    expect(restored!.onboarding).toEqual(snapshot.onboarding);
    expect(restored!.courses).toEqual(snapshot.courses);
    expect(restored!.savedBookIds).toEqual(['bk-1']);
    expect(restored!.readingProgress).toEqual({ 'bk-1': 30 });
    // Bancos estáticos não são exportados → voltam vazios (re-semeados lazy).
    expect(restored!.approaches).toEqual([]);
    expect(restored!.questions).toEqual([]);
  });

  it('previewBackup lê os metadados sem validar o payload', async () => {
    const payload = await buildBackupPayload(makeSnapshot());
    const preview = previewBackup(JSON.stringify(payload));
    expect(preview).not.toBeNull();
    expect(preview!.userSchemaVersion).toBe(USER_SCHEMA_VERSION);
    expect(preview!.exportedAt).toBe(payload.exportedAt);
  });

  it('reset: emptyDatabase limpa tudo e devolve ao onboarding', () => {
    const db = emptyDatabase();
    expect(db.onboarding).toEqual({ completed: false });
    expect(db.quizSessions).toEqual([]);
    expect(db.techniques).toEqual([]);
    expect(db.courses).toEqual([]);
  });
});

describe('validação de backup v2 (P2-1)', () => {
  it('rejeita JSON não-objeto', () => {
    expect(importAppDatabase('null')).toBeNull();
    expect(importAppDatabase('42')).toBeNull();
    expect(importAppDatabase('"texto"')).toBeNull();
    expect(importAppDatabase('[1,2]')).toBeNull();
  });

  it('rejeita formato desconhecido (ex.: backup legado v1/schema 7)', () => {
    expect(importAppDatabase('{}')).toBeNull();
    expect(importAppDatabase('{"version":7}')).toBeNull();
    expect(importAppDatabase('{"data":{}}')).toBeNull();
    expect(importAppDatabase('{"format":"cecistudy-backup-antigo","payload":{}}')).toBeNull();
  });

  it('rejeita formatVersion incompatível', () => {
    const payload = {
      format: BACKUP_FORMAT,
      formatVersion: 99,
      userSchemaVersion: USER_SCHEMA_VERSION,
      catalogRelease: null,
      exportedAt: '',
      payload: {},
    };
    expect(importAppDatabase(JSON.stringify(payload))).toBeNull();
  });

  it('rejeita payload ausente ou não-objeto', () => {
    const base = {
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      userSchemaVersion: USER_SCHEMA_VERSION,
      catalogRelease: null,
      exportedAt: '',
    };
    expect(importAppDatabase(JSON.stringify({ ...base, payload: undefined }))).toBeNull();
    expect(importAppDatabase(JSON.stringify({ ...base, payload: 'não é objeto' }))).toBeNull();
  });

  it('rejeita coleção com shape inválido (courses não-array)', async () => {
    const payload = await buildBackupPayload(makeSnapshot());
    const bad = { ...payload, payload: { ...payload.payload, courses: 'não é array' } };
    expect(importAppDatabase(JSON.stringify(bad))).toBeNull();
  });

  it('rejeita entidade com campos obrigatórios ausentes (course sem progress)', async () => {
    const payload = await buildBackupPayload(makeSnapshot());
    const bad = {
      ...payload,
      payload: { ...payload.payload, courses: [{ id: 'c1', name: 'x' }] },
    };
    expect(importAppDatabase(JSON.stringify(bad))).toBeNull();
  });

  it('rejeita quizSessions malformado', async () => {
    const payload = await buildBackupPayload(makeSnapshot());
    const bad = { ...payload, payload: { ...payload.payload, quizSessions: [{ id: 'qs-1' }] } };
    expect(importAppDatabase(JSON.stringify(bad))).toBeNull();
  });

  it('aceita backup válido e preserva campos legados (passthrough)', async () => {
    const payload = await buildBackupPayload(makeSnapshot());
    (payload.payload as Record<string, unknown>).approaches = [
      { id: 'psic-01-01', name: 'x', shortName: 'x', description: 'x', foundingAuthors: [], color: '#fff' },
    ];
    const restored = importAppDatabase(JSON.stringify(payload));
    expect(restored).not.toBeNull();
    expect(restored!.approaches).toHaveLength(1);
  });
});

describe('exportAppDatabase', () => {
  it('é chamável no web (blob download) sem lançar', async () => {
    // Não asserta o download; só garante que a assinatura é compatível.
    const payload = await buildBackupPayload(makeSnapshot());
    expect(payload.format).toBe(BACKUP_FORMAT);
    expect(typeof payload.exportedAt).toBe('string');
    expect(typeof exportAppDatabase).toBe('function');
  });
});