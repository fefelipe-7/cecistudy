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

  it('SCHEMA_VERSION é 20', () => {
    expect(SCHEMA_VERSION).toBe(20);
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

describe('schema — migração 13 → 14 (repertório da disciplina, SPEC-001)', () => {
  it('faz backfill dos arrays de repertório em courses antigos', () => {
    const legacy = { courses: [{ id: 'c1', name: 'x', professor: 'p', semester: '1', schedule: [], color: '#fff', icon: 'Brain' }] };
    const next = migrateDatabase(13, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.courses[0].conceptIds).toEqual([]);
    expect(next.courses[0].authorIds).toEqual([]);
    expect(next.courses[0].bibliographyIds).toEqual([]);
  });

  it('preserva vínculos já presentes (idempotente)', () => {
    const legacy = {
      courses: [
        { id: 'c1', name: 'x', professor: 'p', semester: '1', schedule: [], color: '#fff', icon: 'Brain', conceptIds: ['con-1'], authorIds: ['aut-1'], bibliographyIds: ['cat-1'] },
      ],
    };
    const next = migrateDatabase(13, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.courses[0].conceptIds).toEqual(['con-1']);
    expect(next.courses[0].authorIds).toEqual(['aut-1']);
    expect(next.courses[0].bibliographyIds).toEqual(['cat-1']);
  });
});

describe('schema — migração 14 → 15 (frequência detalhada, spec-frequencia)', () => {
  it('converte o par legado {attended,total} para CourseAttendance', () => {
    const legacy = {
      courses: [
        { id: 'c1', name: 'x', professor: 'p', semester: '1', schedule: [], color: '#fff', icon: 'Brain', attendance: { attended: 8, total: 12 } },
      ],
    };
    const next = migrateDatabase(14, legacy as Record<string, unknown>) as Record<string, any>;
    // + horas backfilladas pela migração 17 (schedule vazio → 2h/aula).
    expect(next.courses[0].attendance).toEqual({
      total: 12,
      minPct: 75,
      baseAttended: 8,
      records: [],
      totalHours: 24,
      baseHoursDone: 16,
    });
  });

  it('ignora frequência sem total (não vira rastreador ativo)', () => {
    const legacy = {
      courses: [
        { id: 'c1', name: 'x', professor: 'p', semester: '1', schedule: [], color: '#fff', icon: 'Brain', attendance: { attended: 3 } },
      ],
    };
    const next = migrateDatabase(14, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.courses[0].attendance).toBeUndefined();
  });

  it('preserva o shape novo intocado (idempotente) — horas são backfilladas pela 17', () => {
    const legacy = {
      courses: [
        { id: 'c1', name: 'x', professor: 'p', semester: '1', schedule: [], color: '#fff', icon: 'Brain', attendance: { total: 12, minPct: 75, baseAttended: 8, records: [{ id: 'ar-1', date: '2026-09-01', status: 'presente' }] } },
      ],
    };
    const next = migrateDatabase(14, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.courses[0].attendance).toEqual({
      total: 12,
      minPct: 75,
      baseAttended: 8,
      records: [{ id: 'ar-1', date: '2026-09-01', status: 'presente' }],
      totalHours: 24,
      baseHoursDone: 16,
    });
  });
});

describe('schema — migração 16 → 17 (frequência em horas, SPEC-004)', () => {
  it('faz backfill de totalHours/baseHoursDone a partir das aulas × duração média', () => {
    const legacy = {
      courses: [
        {
          id: 'c1', name: 'x', professor: 'p', semester: '1', icon: 'Brain',
          schedule: [{ day: 1, start: '19:00', end: '21:00' }], // 2h
          attendance: { total: 33, minPct: 75, baseAttended: 8, records: [] },
        },
      ],
    };
    const next = migrateDatabase(16, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.courses[0].attendance).toEqual({
      total: 33,
      minPct: 75,
      baseAttended: 8,
      records: [],
      totalHours: 66, // 33 × 2h
      baseHoursDone: 16, // 8 × 2h
    });
  });

  it('usa a duração média dos slots (mais de um slot)', () => {
    const legacy = {
      courses: [
        {
          id: 'c1', name: 'x', professor: 'p', semester: '1', icon: 'Brain',
          schedule: [
            { day: 1, start: '19:00', end: '21:00' }, // 2h
            { day: 3, start: '19:00', end: '20:30' }, // 1,5h → média 1,75h
          ],
          attendance: { total: 20, minPct: 75, baseAttended: 0, records: [] },
        },
      ],
    };
    const next = migrateDatabase(16, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.courses[0].attendance.total).toBe(20);
    expect(next.courses[0].attendance.totalHours).toBe(35); // 20 × 1,75 = 35
    expect(next.courses[0].attendance.baseHoursDone).toBe(0);
  });

  it('não sobrescreve horas já presentes (idempotente)', () => {
    const legacy = {
      courses: [
        {
          id: 'c1', name: 'x', professor: 'p', semester: '1', icon: 'Brain',
          schedule: [{ day: 1, start: '19:00', end: '21:00' }],
          attendance: { total: 33, minPct: 75, baseAttended: 8, records: [], totalHours: 66, baseHoursDone: 16 },
        },
      ],
    };
    const next = migrateDatabase(16, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.courses[0].attendance.totalHours).toBe(66);
    expect(next.courses[0].attendance.baseHoursDone).toBe(16);
  });

  it('morre em silêncio para curso sem attendance', () => {
    const legacy = {
      courses: [
        { id: 'c1', name: 'x', professor: 'p', semester: '1', schedule: [], color: '#fff', icon: 'Brain' },
      ],
    };
    const next = migrateDatabase(16, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.courses[0].attendance).toBeUndefined();
    expect(next.courses[0].id).toBe('c1');
  });

  it('ignora attendance sem total numérico', () => {
    const legacy = {
      courses: [
        {
          id: 'c1', name: 'x', professor: 'p', semester: '1', icon: 'Brain',
          schedule: [],
          attendance: { minPct: 75, records: [] },
        },
      ],
    };
    const next = migrateDatabase(16, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.courses[0].attendance.totalHours).toBeUndefined();
    expect(next.courses[0].attendance.baseHoursDone).toBeUndefined();
  });
});

describe('schema — migração 17 → 18 (período letivo, SPEC-005)', () => {
  const legacy = {
    profile: { name: 'ceci', semester: 6, totalSemesters: 8 },
    courses: [
      { id: 'c1', name: 'Psicologia Social', professor: 'p', semester: '6º Semestre', schedule: [], color: '#fff', icon: 'Brain' },
    ],
    classes: [
      { id: 'cl-1', courseId: 'c1', title: 'aula 1', date: '2026-03-05' },
      { id: 'cl-2', courseId: 'c1', title: 'aula 2', date: '2026-02-11' },
    ],
    exams: [{ id: 'e1', courseId: 'c1', title: 'p1', date: '2026-06-20' }],
  };

  it('cria o período ativo com o ordinal vindo de profile.semester', () => {
    const next = migrateDatabase(17, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.academicTerms).toHaveLength(1);
    expect(next.academicTerms[0]).toMatchObject({
      id: 'trm-active',
      ordinal: 6,
      status: 'ativo',
      label: '6º semestre',
    });
  });

  it('startedAt é a menor data do payload (nunca Date.now)', () => {
    const next = migrateDatabase(17, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.academicTerms[0].startedAt).toBe('2026-02-11');
  });

  it('sem data nenhuma no payload cai na constante determinística', () => {
    const empty = { profile: { name: 'ceci' } };
    const next = migrateDatabase(17, empty as Record<string, unknown>) as Record<string, any>;
    expect(next.academicTerms[0].startedAt).toBe('2026-01-01');
  });

  it('liga cada disciplina ao período e dá status ativo', () => {
    const next = migrateDatabase(17, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.courses[0].termId).toBe('trm-active');
    expect(next.courses[0].status).toBe('ativo');
  });

  it('normaliza semester do perfil: string legada ("6º") vira ordinal numérico', () => {
    const old = { profile: { name: 'ceci', semester: '6º Semestre' } };
    const next = migrateDatabase(17, old as Record<string, unknown>) as Record<string, any>;
    expect(next.profile.semester).toBe(6);
    expect(next.academicTerms[0].ordinal).toBe(6);
  });

  it('ordena por string, não por Date: 2026-02-11 vence 2026-03-05', () => {
    const next = migrateDatabase(17, legacy as Record<string, unknown>) as Record<string, any>;
    expect(next.academicTerms[0].startedAt < '2026-03-05').toBe(true);
  });

  it('idempotente: re-aplicar não duplica o período nem sobrescreve o curso', () => {
    const once = migrateDatabase(17, legacy as Record<string, unknown>) as Record<string, unknown>;
    const twice = migrateDatabase(17, once as Record<string, unknown>) as Record<string, any>;
    expect(twice.academicTerms).toHaveLength(1);
    expect(twice.courses[0].termId).toBe('trm-active');
    expect(twice.academicTerms[0].ordinal).toBe(6);
  });

  it('não sobrescreve termId/status já presentes', () => {
    const already = {
      ...legacy,
      academicTerms: [
        { id: 'trm-x', label: '5º semestre', ordinal: 5, status: 'ativo', startedAt: '2025-08-01' },
      ],
      courses: [{ ...legacy.courses[0], termId: 'trm-x', status: 'arquivado' }],
    };
    const next = migrateDatabase(17, already as Record<string, unknown>) as Record<string, any>;
    expect(next.academicTerms).toHaveLength(1);
    expect(next.academicTerms[0].id).toBe('trm-x');
    expect(next.courses[0].termId).toBe('trm-x');
    expect(next.courses[0].status).toBe('arquivado');
  });

  it('aceita payload com academicTerms já populado e sem termo ativo', () => {
    const closed = {
      ...legacy,
      academicTerms: [
        { id: 'trm-old', label: '5º semestre', ordinal: 5, status: 'encerrado', startedAt: '2025-08-01', endedAt: '2025-12-20' },
      ],
    };
    const next = migrateDatabase(17, closed as Record<string, unknown>) as Record<string, any>;
    expect(next.academicTerms).toHaveLength(2);
    expect(next.academicTerms[1].id).toBe('trm-active');
    expect(next.academicTerms[1].status).toBe('ativo');
  });

  it('totalSemesters ausente cai em 8 na [18] e a cadeia 17 → 19 entrega 10', () => {
    // A [18] continua defaultando 8 (ela não deve conhecer a SPEC-006), mas quem
    // migra de verdade encadeia até a [19], que conserta. O valor final é 10.
    const via19 = migrateDatabase(17, { profile: { name: 'ceci' } } as Record<string, unknown>) as Record<string, any>;
    expect(via19.profile.totalSemesters).toBe(10);
  });

  it('ordinal fora da faixa é clampado em 1..12', () => {
    const big = { profile: { name: 'ceci', semester: 99 } };
    const next = migrateDatabase(17, big as Record<string, unknown>) as Record<string, any>;
    expect(next.academicTerms[0].ordinal).toBe(12);
    const neg = { profile: { name: 'ceci', semester: -3 } };
    const next2 = migrateDatabase(17, neg as Record<string, unknown>) as Record<string, any>;
    expect(next2.academicTerms[0].ordinal).toBe(1);
  });
});

describe('schema — migração 18 → 19 (total de semestres do curso, SPEC-006)', () => {
  // B7: `totalSemesters` era 8 e **Psi no Brasil tem 10**. Com 8, o `% do curso`
  // estourava 100% no 8º, `semestersLeft` dava 0, o adesivo de "formada" unlockava
  // cedo e o CTA "virar" disparava permanentemente do 8º em diante.
  //
  // O critério é **incondicional** de propósito: o app é de uso pessoal
  // (`AGENTS.md` — "Público: a própria usuária, uso individual"), então o 8 não
  // era escolha de ninguém, era o default errado. Uma regra conservadora ("só
  // corrige quem já passou do 8º") NÃO corrigiria o caso dela — que está no 6º.
  // E quem legitimamente tiver um curso de 8 reassina o total no Perfil, que é
  // editável com clamp `1..12` (F6).

  const withTotal = (totalSemesters: number, semester: number) =>
    ({
      profile: { name: 'ceci', semester, totalSemesters },
      academicTerms: [
        { id: 'trm-active', label: `${semester}º semestre`, ordinal: semester, status: 'ativo', startedAt: '2026-02-01' },
      ],
      courses: [],
    }) as Record<string, unknown>;

  it('corrige 8 → 10 mesmo estando no 6º (o caso real da usuária)', () => {
    const next = migrateDatabase(18, withTotal(8, 6)) as Record<string, any>;
    expect(next.profile.totalSemesters).toBe(10);
  });

  it('corrige 8 → 10 também quem já passou do 8º', () => {
    const next = migrateDatabase(18, withTotal(8, 9)) as Record<string, any>;
    expect(next.profile.totalSemesters).toBe(10);
  });

  it('NÃO toca quem já configurou outro total (10, 12, …)', () => {
    expect((migrateDatabase(18, withTotal(12, 6)) as Record<string, any>).profile.totalSemesters).toBe(12);
    expect((migrateDatabase(18, withTotal(10, 6)) as Record<string, any>).profile.totalSemesters).toBe(10);
  });

  it('preserva o resto do payload (período e disciplinas intocados)', () => {
    const next = migrateDatabase(18, withTotal(8, 6)) as Record<string, any>;
    expect(next.academicTerms).toHaveLength(1);
    expect(next.academicTerms[0].ordinal).toBe(6);
    expect(next.profile.semester).toBe(6);
  });

  it('idempotente: re-aplicar não muda nada (18→19→19 dá o mesmo)', () => {
    const once = migrateDatabase(18, withTotal(8, 6)) as Record<string, unknown>;
    const twice = migrateDatabase(19, once) as Record<string, any>;
    expect(twice.profile.totalSemesters).toBe(10);
    expect(twice.academicTerms).toHaveLength(1);
  });

  it('sem profile no payload, não quebra (morte silenciosa)', () => {
    const next = migrateDatabase(18, { courses: [] } as Record<string, unknown>) as Record<string, any>;
    expect(next).toBeTruthy();
  });
});
