/**
 * Testes da base da usuária em SQLite: migrações, round-trip das coleções,
 * import legado (uma vez por chave) e limpeza total.
 *
 * Usam o driver sql.js — o mesmo caminho de código (`runUserMigrations` +
 * `saveCollection`/`loadCollection`) que o app executa no nativo.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createSqlJsDriver } from '../sqlJsDriver';
import { runUserMigrations, getAppliedVersion, LATEST_USER_VERSION } from '../migrations';
import { USER_TABLES_SQL, DECK_TABLES_SQL, READING_TABLES_SQL } from '../migrations/user';
import {
  saveCollection,
  loadCollection,
  loadAllCollections,
  USER_COLLECTION_KEYS,
  isUserCollectionKey,
} from '../normalize';
import { hasLegacyImport, importLegacyCollections } from '../legacyImport';
import { clearUserData } from '../userDb';

async function openDb() {
  const d = createSqlJsDriver();
  await d.open();
  return d;
}

function sourceOf(values: Record<string, unknown>) {
  return async (key: string) => (key in values ? JSON.stringify(values[key]) : null);
}

describe('migrações da base da usuária', () => {
  it('aplica v1 e reporta versão corrente', async () => {
    const d = await openDb();
    expect(await getAppliedVersion(d)).toBe(0);
    const version = await runUserMigrations(d);
    expect(version).toBe(LATEST_USER_VERSION);
    expect(await getAppliedVersion(d)).toBe(LATEST_USER_VERSION);
  });

  it('é idempotente (rodar duas vezes não duplica nada)', async () => {
    const d = await openDb();
    await runUserMigrations(d);
    await saveCollection(d, 'courses', [
      { id: 'c1', name: 'A', schedule: [] },
    ]);
    await runUserMigrations(d);
    const courses = await loadCollection<unknown[]>(d, 'courses');
    expect(courses).toHaveLength(1);
  });

  it('cria todas as tabelas esperadas', async () => {
    const d = await openDb();
    await runUserMigrations(d);
    const rows = await d.query("SELECT name FROM sqlite_master WHERE type='table'");
    const tables = rows.map((r) => String(r.name));
    for (const t of ['profile', 'course', 'course_schedule', 'task', 'assessment',
      'study_session', 'flashcard', 'deck', 'quiz_session', 'quiz_answer', 'reading',
      'reading_progress', 'author', 'concept', 'material', 'technique', 'note',
      'internship', 'supervision_notebook', 'thesis_project', 'achievement',
      'saved_catalog_item', 'streak', 'activity_event', 'legacy_import_map']) {
      expect(tables).toContain(t);
    }
  });
});

describe('round-trip das coleções', () => {
  let d: Awaited<ReturnType<typeof openDb>>;

  beforeEach(async () => {
    d = await openDb();
    await runUserMigrations(d);
  });

  it('keys conhecidas passam no isUserCollectionKey', () => {
    expect(isUserCollectionKey('courses')).toBe(true);
    expect(isUserCollectionKey('techniques')).toBe(true);
    expect(isUserCollectionKey('reminder')).toBe(false);
    expect(isUserCollectionKey('onboarding')).toBe(false);
    expect(isUserCollectionKey('questions')).toBe(false);
    expect(isUserCollectionKey('nao-existe')).toBe(false);
  });

  it('profile (singleton)', async () => {
    const profile = { name: 'Ceci', semester: 8, photoUrl: '' };
    await saveCollection(d, 'profile', profile);
    expect(await loadCollection(d, 'profile')).toEqual(profile);
  });

  it('courses com horários estruturados', async () => {
    const courses = [
      { id: 'c1', name: 'Psicopatologia I', semester: '8º Semestre', category: 'obrigatoria',
        schedule: [{ day: 2, start: '19:00', end: '20:40' }, { day: 4, start: '19:00' }] },
      { id: 'c2', name: 'TCC', schedule: [] },
    ];
    await saveCollection(d, 'courses', courses);
    expect(await loadCollection(d, 'courses')).toEqual(courses);

    // colunas normalizadas para consulta
    const slots = await d.query(
      'SELECT day, start_time FROM course_schedule WHERE course_id = ? ORDER BY day',
      ['c1']
    );
    expect(slots).toEqual([
      { day: 2, start_time: '19:00' },
      { day: 4, start_time: '19:00' },
    ]);
  });

  it('classes com links de conceitos/autores/abordagens/materiais', async () => {
    const classes = [{
      id: 'cl-1', courseId: 'c1', title: 'Aula 1', number: 1, date: '2026-08-10',
      conceptIds: ['con-1'], authorIds: ['aut-1'], approachIds: [], materials: [],
    }];
    await saveCollection(d, 'classes', classes);
    expect(await loadCollection(d, 'classes')).toEqual(classes);
    const links = await d.query(
      "SELECT kind, ref_id FROM class_note_link WHERE class_note_id = 'cl-1' ORDER BY kind"
    );
    expect(links).toEqual([
      { kind: 'author', ref_id: 'aut-1' },
      { kind: 'concept', ref_id: 'con-1' },
    ]);
  });

  it('tasks concluídas geram activity_event', async () => {
    const tasks = [
      { id: 't1', title: 'ler', completed: true, dueDate: '2026-08-22' },
      { id: 't2', title: 'escrever', completed: false, dueDate: null },
      { id: 't3', title: 'sem prazo', completed: true, dueDate: undefined },
    ];
    await saveCollection(d, 'tasks', tasks);
    expect(await loadCollection(d, 'tasks')).toHaveLength(3);
    const events = await d.query(
      "SELECT event_date FROM activity_event WHERE event_type = 'task-done'"
    );
    expect(events).toEqual([{ event_date: '2026-08-22' }]);
  });

  it('exams com tópicos', async () => {
    const exams = [{ id: 'e1', courseId: 'c1', date: '2026-09-01', topics: ['DSM-5', 'ansiedade'] }];
    await saveCollection(d, 'exams', exams);
    expect(await loadCollection(d, 'exams')).toEqual(exams);
  });

  it('readings com destaques', async () => {
    const readings = [{
      id: 'r1', type: 'livro', status: 'lendo', totalPages: 300, readPages: 120,
      highlights: ['trecho importante', 'outro trecho'],
    }];
    await saveCollection(d, 'readings', readings);
    expect(await loadCollection(d, 'readings')).toEqual(readings);
  });

  it('tcc legado (com capítulos dentro) sobrevive ao round-trip do singleton', async () => {
    // SPEC-012: o app não grava mais essa forma — mas a base de uma instalação
    // antiga carrega exatamente isso em `thesis_project.data_json`, e é daí que
    // o dreno do boot (`DataClientProvider`) extrai os capítulos. O round-trip
    // tem que preservá-la byte a byte até o dreno reescrever.
    const tcc = {
      title: 'Luto e psicoterapia', advisor: 'Profa. X', field: 'Clínica',
      problemStatement: '', objectives: [], status: 'em_andamento',
      chapters: [{ title: 'Intro', completed: true }, { title: 'Método', completed: false }],
      references: ['Beck (1979)', 'Freud (1917)'],
    };
    await saveCollection(d, 'tcc', tcc);
    expect(await loadCollection(d, 'tcc')).toEqual(tcc);
  });

  it('coleções do TCC gravam e leem (id + data_json, SPEC-012)', async () => {
    const chapters = [{
      id: 'thc-1', thesisId: 'tcc-main', position: 0, title: 'introdução',
      kind: 'capitulo', requiredness: 'obrigatorio', stage: 'pronto',
      createdAt: '1970-01-01T00:00:00.000Z', updatedAt: '1970-01-01T00:00:00.000Z',
    }];
    const refs = [{
      id: 'thr-1', thesisId: 'tcc-main', readingId: 'r-legacy-tcc-1', status: 'citada',
      createdAt: '1970-01-01T00:00:00.000Z', updatedAt: '1970-01-01T00:00:00.000Z',
    }];
    const meetings = [{ id: 'thm-1', thesisId: 'tcc-main', date: '2026-10-15', mode: 'online', status: 'agendada', decisions: [], createdAt: 'x', updatedAt: 'x' }];
    const tasks = [{ id: 'tts-1', thesisId: 'tcc-main', title: 'ler artigo', origin: 'orientadora', status: 'aberta', createdAt: 'x', updatedAt: 'x' }];
    const logs = [{ id: 'twl-1', thesisId: 'tcc-main', date: '2026-10-05', words: 300, createdAt: 'x' }];
    await saveCollection(d, 'thesisChapters', chapters);
    await saveCollection(d, 'thesisReferences', refs);
    await saveCollection(d, 'thesisMeetings', meetings);
    await saveCollection(d, 'thesisTasks', tasks);
    await saveCollection(d, 'thesisWritingLogs', logs);
    expect(await loadCollection(d, 'thesisChapters')).toEqual(chapters);
    expect(await loadCollection(d, 'thesisReferences')).toEqual(refs);
    expect(await loadCollection(d, 'thesisMeetings')).toEqual(meetings);
    expect(await loadCollection(d, 'thesisTasks')).toEqual(tasks);
    expect(await loadCollection(d, 'thesisWritingLogs')).toEqual(logs);
  });

  it('quizSessions com respostas', async () => {
    const sessions = [{
      id: 'qs-1', createdAt: '2026-08-22', startedAt: 1, finishedAt: 2,
      scorePct: 80, correctCount: 4, totalCount: 5,
      answers: [{ questionId: 'q1', userAnswer: 'A', correct: true, timeMs: 1000 }],
    }];
    await saveCollection(d, 'quizSessions', sessions);
    expect(await loadCollection(d, 'quizSessions')).toEqual(sessions);
  });

  it('streakData / savedBookIds / bookmarkedCourseIds / readingProgress', async () => {
    await saveCollection(d, 'streakData', { activeDays: ['2026-08-21', '2026-08-22'] });
    await saveCollection(d, 'savedBookIds', ['bk-1', 'inter-2']);
    await saveCollection(d, 'bookmarkedCourseIds', ['c1']);
    await saveCollection(d, 'readingProgress', { 'bk-1': 42 });

    expect(await loadCollection(d, 'streakData')).toEqual({ activeDays: ['2026-08-21', '2026-08-22'] });
    expect(await loadCollection(d, 'savedBookIds')).toEqual(['bk-1', 'inter-2']);
    expect(await loadCollection(d, 'bookmarkedCourseIds')).toEqual(['c1']);
    expect(await loadCollection(d, 'readingProgress')).toEqual({ 'bk-1': 42 });

    // favoritos de livro não apagam os de disciplina (escopo por tipo)
    await saveCollection(d, 'savedBookIds', ['bk-9']);
    expect(await loadCollection(d, 'bookmarkedCourseIds')).toEqual(['c1']);
  });

  it('looseNotes com vínculos', async () => {
    const notes = [{
      id: 'n-1', title: 'ideia', content: 'texto', category: 'ideia',
      date: '2026-08-22T10:00:00Z', conceptIds: ['con-1'], materialIds: ['m-1'],
    }];
    await saveCollection(d, 'looseNotes', notes);
    expect(await loadCollection(d, 'looseNotes')).toEqual(notes);
  });

  it('decks: round-trip preserva o baralho (colunas + data_json)', async () => {
    const decks = [
      {
        id: 'd1',
        workspaceId: 'ws-academico',
        name: 'transferência e contratransferência',
        description: 'revisão da aula de psicanálise',
        color: '#E97891',
        createdAt: '2026-08-18',
        updatedAt: '2026-09-09',
      },
    ];
    await saveCollection(d, 'decks', decks);
    expect(await loadCollection(d, 'decks')).toEqual(decks);
  });

  it('loadAllCollections devolve tudo que foi gravado', async () => {
    await saveCollection(d, 'profile', { name: 'Ceci' });
    await saveCollection(d, 'sessions', [{ id: 'ss-1', date: '2026-08-22', durationMinutes: 25 }]);
    const all = await loadAllCollections(d);
    expect(all.profile).toEqual({ name: 'Ceci' });
    expect(all.sessions).toEqual([{ id: 'ss-1', date: '2026-08-22', durationMinutes: 25 }]);
    expect(Object.keys(all)).toHaveLength(USER_COLLECTION_KEYS.length);
  });

  it('coleção-array nunca gravada retorna vazia; singleton retorna undefined', async () => {
    expect(await loadCollection<unknown[]>(d, 'authors')).toEqual([]);
    expect(await loadCollection(d, 'profile')).toBeUndefined();
  });

  it('saveCollection rejeita shape inválido sem gravar meia-coleção', async () => {
    await saveCollection(d, 'tasks', [{ id: 't0', completed: false }]);
    await expect(saveCollection(d, 'profile', [])).rejects.toThrow();
    // rollback: tasks anteriores intactas
    expect(await loadCollection<unknown[]>(d, 'tasks')).toHaveLength(1);
  });
});

describe('import legado', () => {
  let d: Awaited<ReturnType<typeof openDb>>;

  beforeEach(async () => {
    d = await openDb();
    await runUserMigrations(d);
  });

  it('importa uma única vez (reimport pula via legacy_import_map)', async () => {
    const read = sourceOf({ courses: [{ id: 'c1', schedule: [] }] });
    const first = await importLegacyCollections(d, USER_COLLECTION_KEYS, read);
    expect(first.imported).toContain('courses');
    expect(first.errors).toHaveLength(0);

    // segunda rodada com dado DIFERENTE não sobrescreve
    const read2 = sourceOf({ courses: [{ id: 'cX', schedule: [] }] });
    const second = await importLegacyCollections(d, USER_COLLECTION_KEYS, read2);
    expect(second.imported).not.toContain('courses');
    expect(second.skipped).toContain('courses');
    const courses = await loadCollection<unknown[]>(d, 'courses');
    expect((courses[0] as { id: string }).id).toBe('c1');
  });

  it('valida shape (singleton vs array) e reporta erro sem travar as demais', async () => {
    const read = sourceOf({ profile: [1, 2], streakData: { activeDays: [] }, authors: 'ops' });
    const report = await importLegacyCollections(d, USER_COLLECTION_KEYS, read);
    expect(report.errors.map((e) => e.key).sort()).toEqual(['authors', 'profile']);
    expect(report.imported).toContain('streakData');
  });

  it('hasLegacyImport marca só o que foi importado', async () => {
    const read = sourceOf({ profile: { name: 'C' } });
    await importLegacyCollections(d, USER_COLLECTION_KEYS, read);
    expect(await hasLegacyImport(d, 'profile')).toBe(true);
    expect(await hasLegacyImport(d, 'courses')).toBe(false);
  });
});

describe('clearUserData', () => {
  it('limpa conteúdo mas mantém schema utilizável', async () => {
    const d = await openDb();
    await runUserMigrations(d);
    await saveCollection(d, 'courses', [{ id: 'c1', schedule: [] }]);
    await importLegacyCollections(
      d,
      USER_COLLECTION_KEYS,
      sourceOf({ profile: { name: 'C' } })
    );

    await clearUserData(d);

    expect(await loadCollection<unknown[]>(d, 'courses')).toEqual([]);
    expect(await loadCollection(d, 'profile')).toBeUndefined();
    // base continua utilizável após o reset
    await saveCollection(d, 'tasks', [{ id: 't1', completed: false }]);
    expect(await loadCollection<unknown[]>(d, 'tasks')).toHaveLength(1);
  });

  it('limpa as 5 tabelas do TCC — nada ressuscita (SPEC-012)', async () => {
    // O comentário do `userDb.ts` registra o incidente do `deck`/`academic_term`
    // fora da lista: o reset apagava tudo e o load seguinte relia as tabelas.
    // As 5 novas não podem repetir.
    const d = await openDb();
    await runUserMigrations(d);
    await saveCollection(d, 'thesisChapters', [{ id: 'thc-1', title: 'x' }]);
    await saveCollection(d, 'thesisReferences', [{ id: 'thr-1', readingId: 'r' }]);
    await saveCollection(d, 'thesisMeetings', [{ id: 'thm-1', date: '2026-10-15' }]);
    await saveCollection(d, 'thesisTasks', [{ id: 'tts-1', title: 'x' }]);
    await saveCollection(d, 'thesisWritingLogs', [{ id: 'twl-1', words: 1 }]);

    await clearUserData(d);

    for (const key of ['thesisChapters', 'thesisReferences', 'thesisMeetings', 'thesisTasks', 'thesisWritingLogs'] as const) {
      expect(await loadCollection<unknown[]>(d, key)).toEqual([]);
    }
  });
});

describe('SPEC-012 — passo 4: base v3 com tcc legado atualiza sem perder nada', () => {
  it('o DROP das projeções preserva o data_json e as tabelas novas funcionam', async () => {
    // Instalação antiga: passos 1..3 aplicados, tcc legado no `data_json`
    // (as tabelas `thesis_chapter`/`thesis_reference` antigas eram projeção
    // write-only — nada as lia, `normalize.ts` reconstruía do singleton).
    const d = await openDb();
    await d.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`);
    await d.exec(USER_TABLES_SQL);
    await d.exec(DECK_TABLES_SQL);
    await d.exec(READING_TABLES_SQL);
    for (const v of [1, 2, 3]) {
      await d.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
        v,
        '1970-01-01T00:00:00.000Z',
      ]);
    }
    const legacyTcc = {
      title: 'luto e escuta', advisor: 'Helena', field: 'clínica',
      problemStatement: '', objectives: [], status: 'em_andamento',
      chapters: [{ title: 'introdução', completed: false, dueDate: '2026-10-01' }],
      references: ['Worden (2018)'],
    };
    await saveCollection(d, 'tcc', legacyTcc);
    expect(await getAppliedVersion(d)).toBe(3);

    // Atualização para o build SPEC-012: só o passo 4 falta.
    await runUserMigrations(d);
    expect(await getAppliedVersion(d)).toBe(4);

    // A fonte da verdade atravessou o DROP intacta — é dela que o dreno extrai.
    expect(await loadCollection(d, 'tcc')).toEqual(legacyTcc);
    // E as tabelas recriadas/criadas aceitam a forma nova (id + data_json).
    const migrated = [{
      id: 'thc-1', thesisId: 'tcc-main', position: 0, title: 'introdução',
      kind: 'capitulo', requiredness: 'obrigatorio', stage: 'a_fazer',
      dueDate: '2026-10-01',
      createdAt: '1970-01-01T00:00:00.000Z', updatedAt: '1970-01-01T00:00:00.000Z',
    }];
    await saveCollection(d, 'thesisChapters', migrated);
    expect(await loadCollection(d, 'thesisChapters')).toEqual(migrated);
    // Idempotente: reabrir a base não re-dropa nada (o runner pula o 4 aplicado).
    await runUserMigrations(d);
    expect(await loadCollection(d, 'thesisChapters')).toEqual(migrated);
  });
});
