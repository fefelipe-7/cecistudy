/**
 * Normalização entre as coleções do estado do app e o banco SQLite da usuária.
 *
 * - `USER_COLLECTION_KEYS` = as 22 coleções de domínio que vão para o SQLite.
 *   (`reminder`/`onboarding` ficam em Preferences; `approaches`/`questions` são
 *   catálogos estáticos — no nativo vêm do banco do catálogo, não daqui.)
 * - `saveCollection` apaga e regrava a coleção numa transação (modelo "save por
 *   coleção": entidades completas em `data_json`, colunas escalares + join tables
 *   para consulta).
 * - `loadCollection` reconstrói a coleção a partir de `data_json`.
 */
import type { SqlDriver, SqlValue } from './driver.ts';

/** Coleções persistidas na base da usuária (ordem estável p/ import legado). */
export const USER_COLLECTION_KEYS = [
  'profile',
  'courses',
  'classes',
  'tasks',
  'exams',
  'authors',
  'concepts',
  'readings',
  'flashcards',
  'materials',
  'techniques',
  'internshipLogs',
  'supervision',
  'tcc',
  'stickers',
  'sessions',
  'streakData',
  'looseNotes',
  'savedBookIds',
  'bookmarkedCourseIds',
  'readingProgress',
  'quizSessions',
] as const;

export type UserCollectionKey = (typeof USER_COLLECTION_KEYS)[number];

export function isUserCollectionKey(key: string): key is UserCollectionKey {
  return (USER_COLLECTION_KEYS as readonly string[]).includes(key);
}

// ---- helpers ----

type Rec = Record<string, unknown>;

function isRec(v: unknown): v is Rec {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function asArray(value: unknown): Rec[] {
  return Array.isArray(value) ? value.filter(isRec) : [];
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function int(v: unknown): number {
  return num(v) != null ? Math.trunc(num(v) as number) : 0;
}

function json(v: unknown): string {
  return JSON.stringify(v ?? null);
}

/** IDs de relação de um campo `xxxIds?: string[]` (ou `materials`). */
function refIds(entity: Rec, field: string): string[] {
  const raw = entity[field];
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
}

async function transaction(driver: SqlDriver, fn: () => Promise<void>): Promise<void> {
  await driver.exec('BEGIN');
  try {
    await fn();
    await driver.exec('COMMIT');
  } catch (e) {
    try {
      await driver.exec('ROLLBACK');
    } catch {
      /* best-effort */
    }
    throw e;
  }
}

async function insertRows(
  driver: SqlDriver,
  sql: string,
  rowsOf: () => SqlValue[][]
): Promise<void> {
  for (const row of rowsOf()) {
    await driver.run(sql, row);
  }
}

// ---- writers por coleção ----

const LINK_KINDS_CLASS = ['conceptIds', 'authorIds', 'approachIds', 'materials'] as const;
const CLASS_LINK_KIND: Record<(typeof LINK_KINDS_CLASS)[number], string> = {
  conceptIds: 'concept',
  authorIds: 'author',
  approachIds: 'approach',
  materials: 'material',
};

const NOTE_LINK_KIND: Record<string, string> = {
  conceptIds: 'concept',
  authorIds: 'author',
  approachIds: 'approach',
  materialIds: 'material',
};

async function saveCourses(driver: SqlDriver, value: unknown): Promise<void> {
  await driver.run('DELETE FROM course');
  await driver.run('DELETE FROM course_schedule');
  for (const c of asArray(value)) {
    const schedule = Array.isArray(c.schedule) ? c.schedule : [];
    await driver.run(
      'INSERT INTO course (id, name, semester, category, data_json) VALUES (?, ?, ?, ?, ?)',
      [String(c.id), str(c.name), str(c.semester), str(c.category), json(c)]
    );
    for (const slot of schedule) {
      if (!isRec(slot)) continue;
      await driver.run(
        'INSERT INTO course_schedule (course_id, day, start_time, end_time) VALUES (?, ?, ?, ?)',
        [String(c.id), int(slot.day), String(slot.start ?? ''), str(slot.end)]
      );
    }
  }
}

async function saveClasses(driver: SqlDriver, value: unknown): Promise<void> {
  await driver.run('DELETE FROM class_note');
  await driver.run('DELETE FROM class_note_link');
  for (const cl of asArray(value)) {
    await driver.run(
      'INSERT INTO class_note (id, course_id, number, date, rating, data_json) VALUES (?, ?, ?, ?, ?, ?)',
      [
        String(cl.id),
        str(cl.courseId),
        num(cl.number),
        str(cl.date),
        num(cl.rating),
        json(cl),
      ]
    );
    for (const field of LINK_KINDS_CLASS) {
      for (const ref of refIds(cl, field)) {
        await driver.run(
          'INSERT INTO class_note_link (class_note_id, kind, ref_id) VALUES (?, ?, ?)',
          [String(cl.id), CLASS_LINK_KIND[field], ref]
        );
      }
    }
  }
}

/** Reconstrói `activity_event` para tarefas concluídas e sessões (dias ativos). */
async function rebuildActivityEvents(
  driver: SqlDriver,
  eventType: 'task-done' | 'session',
  events: { date: string | null; id: string }[]
): Promise<void> {
  await driver.run('DELETE FROM activity_event WHERE event_type = ?', [eventType]);
  for (const ev of events) {
    if (!ev.date) continue;
    await driver.run(
      'INSERT OR IGNORE INTO activity_event (event_type, event_date, ref_id) VALUES (?, ?, ?)',
      [eventType, ev.date, ev.id]
    );
  }
}

async function saveTasks(driver: SqlDriver, value: unknown): Promise<void> {
  const items = asArray(value);
  await driver.run('DELETE FROM task');
  await driver.run('DELETE FROM task_link');
  for (const t of items) {
    await driver.run(
      `INSERT INTO task (id, discipline_id, class_id, due_date, completed, priority, category, data_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(t.id),
        str(t.disciplineId),
        str(t.classId),
        str(t.dueDate),
        t.completed ? 1 : 0,
        str(t.priority),
        str(t.category),
        json(t),
      ]
    );
  }
  await rebuildActivityEvents(
    driver,
    'task-done',
    items.filter((t) => !!t.completed).map((t) => ({ date: str(t.dueDate), id: String(t.id) }))
  );
}

async function saveExams(driver: SqlDriver, value: unknown): Promise<void> {
  await driver.run('DELETE FROM assessment');
  await driver.run('DELETE FROM assessment_topic');
  for (const e of asArray(value)) {
    await driver.run(
      `INSERT INTO assessment (id, course_id, date, completed, weight_value, grade, data_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        String(e.id),
        str(e.courseId),
        str(e.date),
        e.completed ? 1 : 0,
        num(e.weightValue),
        num(e.grade),
        json(e),
      ]
    );
    for (const topic of refIds(e, 'topics')) {
      await driver.run('INSERT INTO assessment_topic (assessment_id, topic) VALUES (?, ?)', [
        String(e.id),
        topic,
      ]);
    }
  }
}

async function saveConcepts(driver: SqlDriver, value: unknown): Promise<void> {
  await driver.run('DELETE FROM concept');
  await driver.run('DELETE FROM concept_course');
  await driver.run('DELETE FROM concept_author');
  for (const c of asArray(value)) {
    await driver.run(
      'INSERT INTO concept (id, name, approach_id, data_json) VALUES (?, ?, ?, ?)',
      [String(c.id), str(c.name), str(c.approachId), json(c)]
    );
    for (const courseId of refIds(c, 'courseIds')) {
      await driver.run('INSERT INTO concept_course (concept_id, course_id) VALUES (?, ?)', [
        String(c.id),
        courseId,
      ]);
    }
    for (const authorId of refIds(c, 'authorIds')) {
      await driver.run('INSERT INTO concept_author (concept_id, author_id) VALUES (?, ?)', [
        String(c.id),
        authorId,
      ]);
    }
  }
}

async function saveReadings(driver: SqlDriver, value: unknown): Promise<void> {
  await driver.run('DELETE FROM reading');
  await driver.run('DELETE FROM reading_highlight');
  for (const r of asArray(value)) {
    await driver.run(
      `INSERT INTO reading (id, course_id, type, status, total_pages, read_pages, data_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        String(r.id),
        str(r.courseId),
        str(r.type),
        str(r.status),
        num(r.totalPages),
        num(r.readPages),
        json(r),
      ]
    );
    const highlights = Array.isArray(r.highlights) ? r.highlights : [];
    let position = 0;
    for (const h of highlights) {
      if (typeof h !== 'string') continue;
      await driver.run(
        'INSERT INTO reading_highlight (reading_id, position, text) VALUES (?, ?, ?)',
        [String(r.id), position++, h]
      );
    }
  }
}

async function saveInternshipLogs(driver: SqlDriver, value: unknown): Promise<void> {
  await driver.run('DELETE FROM internship');
  await driver.run('DELETE FROM internship_concept');
  await driver.run('DELETE FROM internship_topic');
  for (const l of asArray(value)) {
    await driver.run(
      'INSERT INTO internship (id, type, phase, date, hours, data_json) VALUES (?, ?, ?, ?, ?, ?)',
      [String(l.id), str(l.type), str(l.phase), str(l.date), num(l.hours), json(l)]
    );
    for (const conceptId of refIds(l, 'conceptIds')) {
      await driver.run('INSERT INTO internship_concept (internship_id, concept_id) VALUES (?, ?)', [
        String(l.id),
        conceptId,
      ]);
    }
    for (const topic of refIds(l, 'topics')) {
      await driver.run('INSERT INTO internship_topic (internship_id, topic) VALUES (?, ?)', [
        String(l.id),
        topic,
      ]);
    }
  }
}

async function saveTcc(driver: SqlDriver, value: unknown): Promise<void> {
  if (!isRec(value)) throw new Error('tcc: objeto esperado');
  const chapters = asArray(value.chapters);
  const references = Array.isArray(value.references)
    ? value.references.filter((r): r is string => typeof r === 'string')
    : [];
  await driver.run('DELETE FROM thesis_project');
  await driver.run('DELETE FROM thesis_chapter');
  await driver.run('DELETE FROM thesis_reference');
  await driver.run(
    'INSERT INTO thesis_project (id, title, advisor, field, status, data_json) VALUES (1, ?, ?, ?, ?, ?)',
    [str(value.title), str(value.advisor), str(value.field), str(value.status), json(value)]
  );
  let position = 0;
  for (const ch of chapters) {
    await driver.run(
      'INSERT INTO thesis_chapter (thesis_id, position, title, completed, due_date) VALUES (1, ?, ?, ?, ?)',
      [position++, String(ch.title ?? ''), ch.completed ? 1 : 0, str(ch.dueDate)]
    );
  }
  position = 0;
  for (const ref of references) {
    await driver.run('INSERT INTO thesis_reference (thesis_id, position, reference) VALUES (1, ?, ?)', [
      position++,
      ref,
    ]);
  }
}

async function saveSessions(driver: SqlDriver, value: unknown): Promise<void> {
  const items = asArray(value);
  await driver.run('DELETE FROM study_session');
  for (const s of items) {
    await driver.run(
      'INSERT INTO study_session (id, course_id, date, duration_minutes, data_json) VALUES (?, ?, ?, ?, ?)',
      [String(s.id), str(s.courseId), str(s.date), int(s.durationMinutes), json(s)]
    );
  }
  await rebuildActivityEvents(
    driver,
    'session',
    items.map((s) => ({ date: str(s.date), id: String(s.id) }))
  );
}

async function saveLooseNotes(driver: SqlDriver, value: unknown): Promise<void> {
  await driver.run('DELETE FROM note');
  await driver.run('DELETE FROM note_link');
  for (const n of asArray(value)) {
    await driver.run(
      'INSERT INTO note (id, category, date, updated_at, course_id, data_json) VALUES (?, ?, ?, ?, ?, ?)',
      [String(n.id), str(n.category), str(n.date), str(n.updatedAt), str(n.courseId), json(n)]
    );
    for (const [field, kind] of Object.entries(NOTE_LINK_KIND)) {
      for (const ref of refIds(n, field)) {
        await driver.run('INSERT INTO note_link (note_id, kind, ref_id) VALUES (?, ?, ?)', [
          String(n.id),
          kind,
          ref,
        ]);
      }
    }
  }
}

async function saveSavedItems(
  driver: SqlDriver,
  itemType: 'book' | 'course',
  value: unknown
): Promise<void> {
  await driver.run('DELETE FROM saved_catalog_item WHERE item_type = ?', [itemType]);
  for (const id of Array.isArray(value) ? value : []) {
    if (typeof id !== 'string') continue;
    await driver.run(
      'INSERT INTO saved_catalog_item (item_type, item_id, saved_at) VALUES (?, ?, ?)',
      [itemType, id, new Date().toISOString()]
    );
  }
}

async function saveQuizSessions(driver: SqlDriver, value: unknown): Promise<void> {
  await driver.run('DELETE FROM quiz_session');
  await driver.run('DELETE FROM quiz_answer');
  for (const q of asArray(value)) {
    const config = isRec(q.config) ? q.config : {};
    await driver.run(
      `INSERT INTO quiz_session (id, created_at, started_at, finished_at, score_pct, correct_count, total_count, data_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(q.id),
        str(q.createdAt),
        num(q.startedAt),
        num(q.finishedAt),
        num(q.scorePct),
        int(q.correctCount),
        int(q.totalCount),
        json(q),
      ]
    );
    const answers = asArray(q.answers);
    let position = 0;
    for (const a of answers) {
      await driver.run(
        `INSERT INTO quiz_answer (quiz_session_id, position, question_id, correct, time_ms, data_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          String(q.id),
          position++,
          str(a.questionId),
          a.correct ? 1 : 0,
          num(a.timeMs),
          json(a),
        ]
      );
    }
    void config;
  }
}

/**
 * Regrava uma coleção inteira numa transação. `value` é o estado do contexto
 * (array da entidade ou objeto singleton). Lança erro em shape inválido.
 */
export async function saveCollection(
  driver: SqlDriver,
  key: UserCollectionKey,
  value: unknown
): Promise<void> {
  await transaction(driver, async () => {
    switch (key) {
      case 'profile':
        if (!isRec(value)) throw new Error('profile: objeto esperado');
        await driver.run('DELETE FROM profile');
        await driver.run('INSERT INTO profile (id, data_json) VALUES (1, ?)', [json(value)]);
        break;
      case 'streakData':
        if (!isRec(value)) throw new Error('streakData: objeto esperado');
        await driver.run('DELETE FROM streak');
        await driver.run('INSERT INTO streak (id, active_days_json) VALUES (1, ?)', [
          json(Array.isArray(value.activeDays) ? value.activeDays : []),
        ]);
        break;
      case 'tcc':
        return saveTcc(driver, value);
      case 'courses':
        return saveCourses(driver, value);
      case 'classes':
        return saveClasses(driver, value);
      case 'tasks':
        return saveTasks(driver, value);
      case 'exams':
        return saveExams(driver, value);
      case 'authors':
        await driver.run('DELETE FROM author');
        await insertRows(
          driver,
          'INSERT INTO author (id, name, approach_id, data_json) VALUES (?, ?, ?, ?)',
          () =>
            asArray(value).map((a) => [
              String(a.id),
              str(a.name),
              str(a.approachId),
              json(a),
            ])
        );
        break;
      case 'concepts':
        return saveConcepts(driver, value);
      case 'readings':
        return saveReadings(driver, value);
      case 'flashcards':
        await driver.run('DELETE FROM flashcard');
        await insertRows(
          driver,
          'INSERT INTO flashcard (id, concept_id, course_id, last_reviewed, times_reviewed, data_json) VALUES (?, ?, ?, ?, ?, ?)',
          () =>
            asArray(value).map((f) => [
              String(f.id),
              str(f.conceptId),
              str(f.courseId),
              str(f.lastReviewed),
              num(f.timesReviewed),
              json(f),
            ])
        );
        break;
      case 'materials':
        await driver.run('DELETE FROM material');
        await insertRows(
          driver,
          'INSERT INTO material (id, course_id, type, added_at, data_json) VALUES (?, ?, ?, ?, ?)',
          () =>
            asArray(value).map((m) => [
              String(m.id),
              str(m.courseId),
              str(m.type),
              str(m.addedAt),
              json(m),
            ])
        );
        break;
      case 'techniques':
        await driver.run('DELETE FROM technique');
        await insertRows(
          driver,
          'INSERT INTO technique (id, name, approach_id, data_json) VALUES (?, ?, ?, ?)',
          () =>
            asArray(value).map((t) => [
              String(t.id),
              str(t.name),
              str(t.approachId),
              json(t),
            ])
        );
        break;
      case 'internshipLogs':
        return saveInternshipLogs(driver, value);
      case 'supervision':
        await driver.run('DELETE FROM supervision_notebook');
        await insertRows(
          driver,
          'INSERT INTO supervision_notebook (id, date, supervisor, data_json) VALUES (?, ?, ?, ?)',
          () =>
            asArray(value).map((s) => [
              String(s.id),
              str(s.date),
              str(s.supervisor),
              json(s),
            ])
        );
        break;
      case 'stickers':
        await driver.run('DELETE FROM achievement');
        await insertRows(
          driver,
          'INSERT INTO achievement (id, unlocked, unlocked_at, category, data_json) VALUES (?, ?, ?, ?, ?)',
          () =>
            asArray(value).map((s) => [
              String(s.id),
              s.unlocked ? 1 : 0,
              str(s.unlockedAt),
              str(s.category),
              json(s),
            ])
        );
        break;
      case 'sessions':
        return saveSessions(driver, value);
      case 'looseNotes':
        return saveLooseNotes(driver, value);
      case 'savedBookIds':
        return saveSavedItems(driver, 'book', value);
      case 'bookmarkedCourseIds':
        return saveSavedItems(driver, 'course', value);
      case 'readingProgress':
        if (!isRec(value)) throw new Error('readingProgress: objeto esperado');
        await driver.run('DELETE FROM reading_progress');
        for (const [bookId, pages] of Object.entries(value)) {
          await driver.run('INSERT INTO reading_progress (book_id, pages) VALUES (?, ?)', [
            bookId,
            typeof pages === 'number' ? pages : 0,
          ]);
        }
        break;
      case 'quizSessions':
        return saveQuizSessions(driver, value);
    }
  });
}

// ---- readers ----

async function loadSingletonJson(driver: SqlDriver): Promise<unknown> {
  const rows = await driver.query('SELECT data_json FROM profile LIMIT 1');
  return rows.length > 0 ? JSON.parse(String(rows[0].data_json)) : undefined;
}

/**
 * Lê uma coleção do banco. Retorna `undefined` quando nunca foi gravada
 * (o chamador decide o default — seeds/empty).
 */
export async function loadCollection<T = unknown>(
  driver: SqlDriver,
  key: UserCollectionKey
): Promise<T | undefined> {
  switch (key) {
    case 'profile':
      return (await loadSingletonJson(driver)) as T | undefined;
    case 'streakData': {
      const rows = await driver.query('SELECT active_days_json FROM streak LIMIT 1');
      if (rows.length === 0) return undefined;
      const activeDays = JSON.parse(String(rows[0].active_days_json));
      return { activeDays: Array.isArray(activeDays) ? activeDays : [] } as T;
    }
    case 'tcc': {
      const rows = await driver.query('SELECT data_json FROM thesis_project WHERE id = 1');
      return rows.length > 0 ? (JSON.parse(String(rows[0].data_json)) as T) : undefined;
    }
    case 'savedBookIds': {
      const rows = await driver.query(
        "SELECT item_id FROM saved_catalog_item WHERE item_type = 'book'"
      );
      return rows.map((r) => String(r.item_id)) as T;
    }
    case 'bookmarkedCourseIds': {
      const rows = await driver.query(
        "SELECT item_id FROM saved_catalog_item WHERE item_type = 'course'"
      );
      return rows.map((r) => String(r.item_id)) as T;
    }
    case 'readingProgress': {
      const rows = await driver.query('SELECT book_id, pages FROM reading_progress');
      const out: Record<string, number> = {};
      for (const r of rows) out[String(r.book_id)] = Number(r.pages ?? 0);
      return out as T;
    }
    default: {
      const table = TABLE_BY_KEY[key];
      const rows = await driver.query(`SELECT data_json FROM ${table}`);
      return rows.map((r) => JSON.parse(String(r.data_json))) as T;
    }
  }
}

/** Lê todas as coleções presentes no banco (chamada única de hidratação). */
export async function loadAllCollections(
  driver: SqlDriver
): Promise<Partial<Record<UserCollectionKey, unknown>>> {
  const out: Partial<Record<UserCollectionKey, unknown>> = {};
  for (const key of USER_COLLECTION_KEYS) {
    out[key] = await loadCollection(driver, key);
  }
  return out;
}

const TABLE_BY_KEY: Record<Exclude<UserCollectionKey, 'profile' | 'streakData' | 'tcc' | 'savedBookIds' | 'bookmarkedCourseIds' | 'readingProgress'>, string> = {
  courses: 'course',
  classes: 'class_note',
  tasks: 'task',
  exams: 'assessment',
  authors: 'author',
  concepts: 'concept',
  readings: 'reading',
  flashcards: 'flashcard',
  materials: 'material',
  techniques: 'technique',
  internshipLogs: 'internship',
  supervision: 'supervision_notebook',
  stickers: 'achievement',
  sessions: 'study_session',
  looseNotes: 'note',
  quizSessions: 'quiz_session',
};
