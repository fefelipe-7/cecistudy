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
      'study_session', 'flashcard', 'quiz_session', 'quiz_answer', 'reading',
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

  it('tcc com capítulos e referências (singleton)', async () => {
    const tcc = {
      title: 'Luto e psicoterapia', advisor: 'Profa. X', field: 'Clínica',
      problemStatement: '', objectives: [], status: 'em_andamento',
      chapters: [{ title: 'Intro', completed: true }, { title: 'Método', completed: false }],
      references: ['Beck (1979)', 'Freud (1917)'],
    };
    await saveCollection(d, 'tcc', tcc);
    expect(await loadCollection(d, 'tcc')).toEqual(tcc);
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
});
