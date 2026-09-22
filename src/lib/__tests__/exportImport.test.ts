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
    onboarding: { completed: true, completedAt: '2026-08-01' },
    syncIndex: { stamps: {}, records: {}, tombstones: {} },
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
    expect(data.onboarding).toEqual({ completed: true, completedAt: '2026-08-01' });
  });

  it('backup NÃO exporta estado visual de sessão (separação B6/B7)', async () => {
    // O estado visual de sessão (ex-DesktopSessionState, apps/desktop — legado
    // removido 2026-09) vive fora do snapshot do banco (chaves próprias como
    // 'desktopSession'); jamais deve aparecer no payload de backup compartilhado.
    const snapshot = makeSnapshot();
    const payload = await buildBackupPayload(snapshot);
    expect(payload.payload).not.toHaveProperty('desktopSession');
    expect(payload.payload).not.toHaveProperty('isKnowledgeGraphOpen');
    expect(payload.payload).not.toHaveProperty('sidebarCollapsed');
    expect(payload.payload).not.toHaveProperty('canvasClarity');
    expect(payload.payload).not.toHaveProperty('density');
  });

  it('backup NÃO exporta o estado de navegação (pilha/sub-tabs — dono do motor por casca)', async () => {
    // A navegação virou estado de motor por casca (spec 07): a pilha
    // (`navigationStack`/`activeTab`/`focusedStudyScreen`/sub-tabs) e a chave
    // `nav*` usada no cache do `readDatabaseFromState` não são dados do usuário
    // e não entram no backup compartilhado pelas cascas.
    const snapshot = makeSnapshot();
    const payload = await buildBackupPayload(snapshot);
    expect(payload.payload).not.toHaveProperty('navigationStack');
    expect(payload.payload).not.toHaveProperty('activeTab');
    expect(payload.payload).not.toHaveProperty('subTabFaculdade');
    expect(payload.payload).not.toHaveProperty('subTabEstudos');
    expect(payload.payload).not.toHaveProperty('subTabBiblioteca');
    expect(payload.payload).not.toHaveProperty('focusedStudyScreen');
    for (const key of Object.keys(payload.payload)) {
      expect(key.startsWith('nav')).toBe(false);
    }
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
    const restored = await importAppDatabase(json);

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

  it('round-trip preserva categoryXp (campo opcional dos níveis)', async () => {
    const snapshot = makeSnapshot({
      profile: {
        ...makeSnapshot().profile,
        categoryXp: { faculdade: 20, estudo: 170, leituras: 0, jornada: 50 },
      },
    });
    const payload = await buildBackupPayload(snapshot);
    const restored = await importAppDatabase(JSON.stringify(payload));
    expect(restored).not.toBeNull();
    expect(restored!.profile.categoryXp).toEqual({
      faculdade: 20,
      estudo: 170,
      leituras: 0,
      jornada: 50,
    });
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
  it('rejeita JSON não-objeto', async () => {
    expect(await importAppDatabase('null')).toBeNull();
    expect(await importAppDatabase('42')).toBeNull();
    expect(await importAppDatabase('"texto"')).toBeNull();
    expect(await importAppDatabase('[1,2]')).toBeNull();
  });

  it('rejeita formato desconhecido (ex.: backup legado v1/schema 7)', async () => {
    expect(await importAppDatabase('{}')).toBeNull();
    expect(await importAppDatabase('{"version":7}')).toBeNull();
    expect(await importAppDatabase('{"data":{}}')).toBeNull();
    expect(await importAppDatabase('{"format":"cecistudy-backup-antigo","payload":{}}')).toBeNull();
  });

  it('rejeita formatVersion incompatível', async () => {
    const payload = {
      format: BACKUP_FORMAT,
      formatVersion: 99,
      userSchemaVersion: USER_SCHEMA_VERSION,
      catalogRelease: null,
      exportedAt: '',
      payload: {},
    };
    expect(await importAppDatabase(JSON.stringify(payload))).toBeNull();
  });

  it('rejeita payload ausente ou não-objeto', async () => {
    const base = {
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      userSchemaVersion: USER_SCHEMA_VERSION,
      catalogRelease: null,
      exportedAt: '',
    };
    expect(await importAppDatabase(JSON.stringify({ ...base, payload: undefined }))).toBeNull();
    expect(await importAppDatabase(JSON.stringify({ ...base, payload: 'não é objeto' }))).toBeNull();
  });

  it('rejeita coleção com shape inválido (courses não-array)', async () => {
    const payload = await buildBackupPayload(makeSnapshot());
    const bad = { ...payload, payload: { ...payload.payload, courses: 'não é array' } };
    expect(await importAppDatabase(JSON.stringify(bad))).toBeNull();
  });

  it('rejeita entidade com campos obrigatórios ausentes (course sem cor)', async () => {
    const payload = await buildBackupPayload(makeSnapshot());
    const bad = {
      ...payload,
      payload: { ...payload.payload, courses: [{ id: 'c1', name: 'x' }] },
    };
    expect(await importAppDatabase(JSON.stringify(bad))).toBeNull();
  });

  it('rejeita quizSessions malformado', async () => {
    const payload = await buildBackupPayload(makeSnapshot());
    const bad = { ...payload, payload: { ...payload.payload, quizSessions: [{ id: 'qs-1' }] } };
    expect(await importAppDatabase(JSON.stringify(bad))).toBeNull();
  });

  it('aceita backup válido e preserva campos legados (passthrough)', async () => {
    const payload = await buildBackupPayload(makeSnapshot());
    (payload.payload as Record<string, unknown>).approaches = [
      { id: 'psic-01-01', name: 'x', shortName: 'x', description: 'x', foundingAuthors: [], color: '#fff' },
    ];
    const restored = await importAppDatabase(JSON.stringify(payload));
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

// ---------------------------------------------------------------------------
// Fase 0 — migração de backups antigos (reversibilidade antes de mexer no domínio)
// ---------------------------------------------------------------------------

/** Envelope de backup exportado em uma versão antiga do schema (ex.: v5). */
function makeLegacyBackupV5() {
  // Forma de dados ANTERIOR às migrações 6..11:
  // - ainda traz mood (currentMood/moodHistory) e profile.avatarMood;
  // - courses trazem `progress`/`progressOverride` e `schedule` como string;
  // - ainda NÃO existem quizSessions / supervisions / syncIndex.
  const data: Record<string, unknown> = {
    currentMood: { mood: 'ok', note: '' },
    moodHistory: [],
    profile: {
      name: 'Ceci',
      semester: 6,
      totalSemesters: 8,
      university: 'UFRJ',
      targetCareer: 'clínica',
      dailyQuote: 'com leveza',
      stickersCollected: 3,
      avatarMood: 'ok',
    },
    courses: [
      {
        id: 'c1',
        name: 'Psicopatologia I',
        professor: 'Ana',
        semester: '6º semestre',
        schedule: 'seg 09:00',
        color: '#FFD3DD',
        icon: 'Brain',
        progress: 50,
        progressOverride: 60,
      },
    ],
    classes: [{ id: 'cl-1', courseId: 'c1', title: 'aula 1', number: 1, date: '2026-08-01', summary: 'resumo' }],
    tasks: [{ id: 't1', title: 'ler cap 2', completed: false, priority: 'media', category: 'leitura' }],
    exams: [{ id: 'e1', courseId: 'c1', title: 'p1', date: '2026-09-01', weight: '40%', topics: ['x'], completed: false }],
    authors: [{ id: 'aut-1', name: 'Freud', bio: 'bio' }],
    concepts: [{ id: 'con-1', name: 'recalque', definition: 'def', authorIds: ['aut-1'], courseIds: ['c1'], tags: ['x'] }],
    readings: [],
    flashcards: [],
    materials: [],
    internshipLogs: [],
    tcc: { title: '', advisor: '', field: '', problemStatement: '', objectives: [], status: 'em_andamento', chapters: [], references: [] },
    stickers: [],
    sessions: [],
    streakData: { activeDays: ['2026-08-01'] },
    reminder: { enabled: true, time: '19:00' },
    looseNotes: [],
    savedBookIds: ['bk-1'],
    bookmarkedCourseIds: ['c1'],
    readingProgress: { 'bk-1': 30 },
    techniques: [{ id: 'tec-1', name: 'associação livre', description: 'desc' }],
    onboarding: { completed: true, completedAt: '2026-08-01' },
  };
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    userSchemaVersion: USER_SCHEMA_VERSION,
    catalogRelease: null,
    exportedAt: '2025-01-01T00:00:00.000Z',
    schemaVersion: 5,
    payload: data,
  };
}

describe('migração de backups antigos (Fase 0)', () => {
  it('recusa backup de versão de schema futura (> atual)', async () => {
    const legacy = makeLegacyBackupV5();
    legacy.schemaVersion = 999;
    expect(await importAppDatabase(JSON.stringify(legacy))).toBeNull();
  });

  it('migra backup v5 → atual e normaliza shapes (mood, schedule, progress)', async () => {
    const legacy = makeLegacyBackupV5();
    const restored = await importAppDatabase(JSON.stringify(legacy));

    expect(restored).not.toBeNull();
    // Mood removido pelas migrações 6 (campos de mood do backup) — não vaza para o banco.
    expect(restored).not.toHaveProperty('currentMood');
    expect(restored).not.toHaveProperty('moodHistory');
    expect((restored!.profile as unknown as Record<string, unknown>)).not.toHaveProperty('avatarMood');
    // progress removido pela migração 11.
    const course = restored!.courses[0] as unknown as Record<string, unknown>;
    expect(course).not.toHaveProperty('progress');
    expect(course).not.toHaveProperty('progressOverride');
    // schedule string → array (migração 9).
    expect(Array.isArray(course.schedule)).toBe(true);
    expect((course.schedule as unknown[]).length).toBeGreaterThan(0);
    // coleções adicionadas por migrações intermediárias ganham defaults.
expect(restored!.quizSessions).toEqual([]);
     expect(restored!.syncIndex).toEqual({ stamps: {}, records: {}, tombstones: {} });
    // dados do usuário preservados.
    expect(restored!.savedBookIds).toEqual(['bk-1']);
    expect(restored!.readingProgress).toEqual({ 'bk-1': 30 });
    expect(restored!.techniques).toHaveLength(1);
  });

  it('migra backup v8 (sem syncIndex/quizSessions já presentes) sem duplicar', async () => {
    const snapshot = makeSnapshot();
    const payload = { ...snapshot, syncIndex: undefined, quizSessions: undefined } as Record<string, unknown>;
    const envelope = {
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      userSchemaVersion: USER_SCHEMA_VERSION,
      catalogRelease: null,
      exportedAt: '2025-06-01T00:00:00.000Z',
      schemaVersion: 8,
      payload,
    };
    const restored = await importAppDatabase(JSON.stringify(envelope));
    expect(restored).not.toBeNull();
    expect(restored!.quizSessions).toEqual([]);
    expect(restored!.syncIndex).toEqual({ stamps: {}, records: {}, tombstones: {} });
  });

  it('migra backup v13: course sem repertório ganha arrays vazios (SPEC-001)', async () => {
    // Backup produzido ANTES da SPEC-001: courses ainda não têm os vínculos
    // explícitos de repertório. `SCHEMA_VERSION` 14 deve fazer o backfill `[]`.
    const snapshot = makeSnapshot();
    const payload = { ...snapshot } as Record<string, unknown>;
    const envelope = {
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      userSchemaVersion: USER_SCHEMA_VERSION,
      catalogRelease: null,
      exportedAt: '2026-09-20T00:00:00.000Z',
      schemaVersion: 13,
      payload,
    };
    const restored = await importAppDatabase(JSON.stringify(envelope));
    expect(restored).not.toBeNull();
    const course = restored!.courses[0] as unknown as Record<string, unknown>;
    expect(course.conceptIds).toEqual([]);
    expect(course.authorIds).toEqual([]);
    expect(course.bibliographyIds).toEqual([]);
  });

  it('round-trip preserva vínculos de repertório da disciplina', async () => {
    const snapshot = makeSnapshot({
      courses: [
        {
          id: 'c1',
          name: 'Psicopatologia I',
          professor: 'Ana',
          semester: '6º semestre',
          schedule: [{ day: 1, start: '09:00' }],
          color: '#FFD3DD',
          icon: 'Brain',
          conceptIds: ['con-1'],
          authorIds: ['aut-1'],
          bibliographyIds: ['cat-1', 'r-1'],
        },
      ],
    });
    const payload = await buildBackupPayload(snapshot);
    const restored = await importAppDatabase(JSON.stringify(payload));
    expect(restored).not.toBeNull();
    expect(restored!.courses[0].conceptIds).toEqual(['con-1']);
    expect(restored!.courses[0].authorIds).toEqual(['aut-1']);
    expect(restored!.courses[0].bibliographyIds).toEqual(['cat-1', 'r-1']);
  });
});