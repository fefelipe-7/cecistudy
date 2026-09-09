import { describe, it, expect } from 'vitest';
import { migrateDatabase, SCHEMA_VERSION, DEFAULT_WORKSPACE_ID } from '../schema';

describe('schema — migração 11 → 12 (escopo de workspace)', () => {
  const sample = {
    profile: { name: 'Ceci' },
    courses: [{ id: 'c1', name: 'Psicologia' }],
    classes: [{ id: 'cl-1', courseId: 'c1', title: 'aula' }],
    tasks: [{ id: 't1', title: 'x', completed: false, priority: 'baixa', category: 'outro' }],
    exams: [{ id: 'e1', courseId: 'c1', title: 'p1', date: '2026-01-01', weight: '40%', topics: [], completed: false }],
    authors: [{ id: 'aut-1', name: 'Freud', bio: '', keyConcepts: [], majorWorks: [] }],
    concepts: [{ id: 'con-1', name: 'c', definition: 'd', authorIds: [], courseIds: [], tags: [] }],
    readings: [{ id: 'r1', title: 'l', author: 'a', type: 'livro', status: 'nao_iniciado' }],
    flashcards: [{ id: 'f1', question: 'q', answer: 'a' }],
    materials: [{ id: 'm1', title: 't', type: 'pdf', author: 'a', tags: [], addedAt: '2026-01-01' }],
    internshipLogs: [{ id: 'ilog-1', type: 'estagio', date: '2026-01-01', hours: 2, activity: 'x', reflections: '' }],
    supervision: [{ id: 's1', date: '2026-01-01', questions: [], conceptIds: [], referenceIds: [], nextSteps: [], selfAssessment: {} }],
    stickers: [{ id: 'st-1', name: 'n', emoji: '♡', description: 'd', unlocked: false, category: 'jornada' }],
    sessions: [{ id: 'ss-1', topic: 't', date: '2026-01-01', durationMinutes: 25 }],
    techniques: [{ id: 'tec-1', name: 'n', description: 'd' }],
    quizSessions: [{ id: 'qs-1', config: { areas: [], temas: [], escolas: [], dificuldades: [], count: 5 }, answers: [], startedAt: 0, finishedAt: 0, totalTimeMs: 0, correctCount: 0, totalCount: 0, scorePct: 0, createdAt: '2026-01-01' }],
    looseNotes: [{ id: 'ln-1', title: 't', content: 'c', category: 'ideia', date: '2026-01-01' }],
    tcc: { title: '', advisor: '', field: '', problemStatement: '', objectives: [], status: 'em_andamento', chapters: [], references: [] },
  };

  it('SCHEMA_VERSION é 13', () => {
    expect(SCHEMA_VERSION).toBe(13);
  });

  it('adiciona workspaceId default a todas as entidades sincronizáveis', () => {
    const next = migrateDatabase(11, sample) as Record<string, any>;
    expect(next.courses[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.classes[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.tasks[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.exams[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.authors[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.concepts[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.readings[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.flashcards[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.materials[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.internshipLogs[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.supervision[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.stickers[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.sessions[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.techniques[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.quizSessions[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.looseNotes[0].workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.profile.workspaceId).toBe(DEFAULT_WORKSPACE_ID);
    expect(next.tcc.workspaceId).toBe(DEFAULT_WORKSPACE_ID);
  });

  it('não sobrescreve workspaceId já presente (idempotente)', () => {
    const withWs = migrateDatabase(11, sample) as Record<string, any>;
    withWs.courses[0].workspaceId = 'ws-pro';
    const again = migrateDatabase(11, withWs) as Record<string, any>;
    expect(again.courses[0].workspaceId).toBe('ws-pro');
  });
});

describe('schema — migração 12 → 13 (rename internshipLogsLegacy → internshipLogs)', () => {
  it('renomeia a chave legada e preserva o conteúdo', () => {
    const legacy = { internshipLogsLegacy: [{ id: 'ilog-1', type: 'estagio' }] };
    const next = migrateDatabase(12, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.internshipLogs).toEqual([{ id: 'ilog-1', type: 'estagio' }]);
    expect(next.internshipLogsLegacy).toBeUndefined();
  });

  it('é idempotente quando a chave nova já existe', () => {
    const both = { internshipLogs: [{ id: 'ilog-9' }], internshipLogsLegacy: [{ id: 'ilog-1' }] };
    const next = migrateDatabase(12, both as Record<string, unknown>) as Record<string, any>;
    expect(next.internshipLogs).toEqual([{ id: 'ilog-9' }]);
    expect(next.internshipLogsLegacy).toBeUndefined();
  });
});
