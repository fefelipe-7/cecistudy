/**
 * Schema da base da usuária (`cecistudy_user`).
 *
 * Modelo normalizado por coleção: colunas escalares consultáveis + `data_json`
 * com a entidade completa (o load reconstrói do `data_json`; as colunas/joins
 * servem a consultas futuras sem parser JSON). Relações N–N em join tables.
 * Sem foreign keys enforcement — gravação é por coleção independente
 * (uma transação por coleção em `normalize.saveCollection`).
 *
 * Os passos vivem em `migrations.ts`: 1 = schema base, 2 = `deck`,
 * 3 = leitura (SPEC-M-014). Um passo aplicado nunca é editado.
 *
 * ⚠️ Toda mudança de tabela a partir daqui é um passo novo numerado.
 */

/** Versão de schema da base da usuária (espelha `data/schema.ts`). */
export const USER_SCHEMA_VERSION = 4;

/** Nome lógico do banco da usuária (sem extensão). */
export const USER_DB_NAME = 'cecistudy_user';

/**
 * Tabela `deck` — baralhos de flashcards (chegou no payload com a migração 16,
 * mas só ganhou tabela no passo 2 do schema da usuária). Vive separada porque
 * é o passo de migração 2: instalações já na v1 não têm a tabela e precisam
 * criá-la. `IF NOT EXISTS` → reaplicar em base nova é no-op.
 */
export const DECK_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS deck (
  id TEXT PRIMARY KEY,
  name TEXT,
  color TEXT,
  workspace_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deck_workspace ON deck(workspace_id);
`;

/** DDL completo da base da usuária (idempotente — `IF NOT EXISTS` em tudo). */
export const USER_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course (
  id TEXT PRIMARY KEY,
  name TEXT,
  semester TEXT,
  category TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_course_semester ON course(semester);

CREATE TABLE IF NOT EXISTS course_schedule (
  course_id TEXT NOT NULL,
  day INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT
);
CREATE INDEX IF NOT EXISTS idx_course_schedule_course ON course_schedule(course_id);

CREATE TABLE IF NOT EXISTS class_note (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  number INTEGER,
  date TEXT,
  rating INTEGER,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_class_note_course ON class_note(course_id);
CREATE INDEX IF NOT EXISTS idx_class_note_date ON class_note(date);

-- kind ∈ concept | author | approach | material
CREATE TABLE IF NOT EXISTS class_note_link (
  class_note_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  ref_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_class_note_link_note ON class_note_link(class_note_id);

CREATE TABLE IF NOT EXISTS task (
  id TEXT PRIMARY KEY,
  discipline_id TEXT,
  class_id TEXT,
  due_date TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  priority TEXT,
  category TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_task_completed ON task(completed);
CREATE INDEX IF NOT EXISTS idx_task_due_date ON task(due_date);

-- Reservado para relações futuras de tarefa (hoje gravado vazio).
CREATE TABLE IF NOT EXISTS task_link (
  task_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  ref_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_task_link_task ON task_link(task_id);

CREATE TABLE IF NOT EXISTS assessment (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  date TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  weight_value REAL,
  grade REAL,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assessment_course ON assessment(course_id);
CREATE INDEX IF NOT EXISTS idx_assessment_date ON assessment(date);

CREATE TABLE IF NOT EXISTS assessment_topic (
  assessment_id TEXT NOT NULL,
  topic TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_assessment_topic_assessment ON assessment_topic(assessment_id);

CREATE TABLE IF NOT EXISTS study_session (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  date TEXT,
  duration_minutes INTEGER,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_study_session_date ON study_session(date);

CREATE TABLE IF NOT EXISTS flashcard (
  id TEXT PRIMARY KEY,
  concept_id TEXT,
  course_id TEXT,
  last_reviewed TEXT,
  times_reviewed INTEGER,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_flashcard_course ON flashcard(course_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_last_reviewed ON flashcard(last_reviewed);
${DECK_TABLES_SQL}

CREATE TABLE IF NOT EXISTS reading (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  type TEXT,
  status TEXT,
  total_pages INTEGER,
  read_pages INTEGER,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reading_status ON reading(status);

CREATE TABLE IF NOT EXISTS reading_highlight (
  reading_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  text TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reading_highlight_reading ON reading_highlight(reading_id);

CREATE TABLE IF NOT EXISTS reading_progress (
  book_id TEXT PRIMARY KEY,
  pages INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS author (
  id TEXT PRIMARY KEY,
  name TEXT,
  approach_id TEXT,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS concept (
  id TEXT PRIMARY KEY,
  name TEXT,
  approach_id TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_concept_approach ON concept(approach_id);

CREATE TABLE IF NOT EXISTS concept_course (
  concept_id TEXT NOT NULL,
  course_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_concept_course_concept ON concept_course(concept_id);

CREATE TABLE IF NOT EXISTS concept_author (
  concept_id TEXT NOT NULL,
  author_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_concept_author_concept ON concept_author(concept_id);

CREATE TABLE IF NOT EXISTS material (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  type TEXT,
  added_at TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_material_course ON material(course_id);

CREATE TABLE IF NOT EXISTS technique (
  id TEXT PRIMARY KEY,
  name TEXT,
  approach_id TEXT,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note (
  id TEXT PRIMARY KEY,
  category TEXT,
  date TEXT,
  updated_at TEXT,
  course_id TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_note_updated_at ON note(updated_at);

-- kind ∈ concept | author | approach | material
CREATE TABLE IF NOT EXISTS note_link (
  note_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  ref_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_note_link_note ON note_link(note_id);

CREATE TABLE IF NOT EXISTS internship (
  id TEXT PRIMARY KEY,
  type TEXT,
  phase TEXT,
  date TEXT,
  hours REAL,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_internship_date ON internship(date);

CREATE TABLE IF NOT EXISTS internship_concept (
  internship_id TEXT NOT NULL,
  concept_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_internship_concept_log ON internship_concept(internship_id);

CREATE TABLE IF NOT EXISTS internship_topic (
  internship_id TEXT NOT NULL,
  topic TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_internship_topic_log ON internship_topic(internship_id);

CREATE TABLE IF NOT EXISTS supervision_notebook (
  id TEXT PRIMARY KEY,
  date TEXT,
  supervisor TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_supervision_date ON supervision_notebook(date);

CREATE TABLE IF NOT EXISTS thesis_project (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  title TEXT,
  advisor TEXT,
  field TEXT,
  status TEXT,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS thesis_chapter (
  thesis_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  due_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_thesis_chapter_thesis ON thesis_chapter(thesis_id);

CREATE TABLE IF NOT EXISTS thesis_reference (
  thesis_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  reference TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_thesis_reference_thesis ON thesis_reference(thesis_id);

CREATE TABLE IF NOT EXISTS achievement (
  id TEXT PRIMARY KEY,
  unlocked INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT,
  category TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_achievement_unlocked ON achievement(unlocked);

CREATE TABLE IF NOT EXISTS quiz_session (
  id TEXT PRIMARY KEY,
  created_at TEXT,
  started_at INTEGER,
  finished_at INTEGER,
  score_pct REAL,
  correct_count INTEGER,
  total_count INTEGER,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quiz_session_created_at ON quiz_session(created_at);

CREATE TABLE IF NOT EXISTS quiz_answer (
  quiz_session_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  question_id TEXT,
  correct INTEGER NOT NULL DEFAULT 0,
  time_ms INTEGER,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quiz_answer_session ON quiz_answer(quiz_session_id);

-- Favoritos compartilhados: livros salvos (item_type 'book') e disciplinas favoritas ('course').
CREATE TABLE IF NOT EXISTS saved_catalog_item (
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  saved_at TEXT,
  PRIMARY KEY (item_type, item_id)
);

CREATE TABLE IF NOT EXISTS streak (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  active_days_json TEXT NOT NULL
);

-- Dias ativos derivados de tarefas concluídas (event_type 'task-done') e sessões ('session').
CREATE TABLE IF NOT EXISTS activity_event (
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  ref_id TEXT,
  PRIMARY KEY (event_type, event_date, ref_id)
);

-- Períodos letivos (SPEC-005). LWW por registro (o sync resolve pelo id);
-- data_json é a fonte, as colunas são projeção p/ query (período ativo, ordem).
CREATE TABLE IF NOT EXISTS academic_term (
  id TEXT PRIMARY KEY,
  label TEXT,
  ordinal INTEGER,
  status TEXT,
  started_at TEXT,
  ended_at TEXT,
  updated_at TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_academic_term_status ON academic_term(status);
CREATE INDEX IF NOT EXISTS idx_academic_term_ordinal ON academic_term(ordinal);

CREATE TABLE IF NOT EXISTS legacy_import_map (
  source_key TEXT PRIMARY KEY,
  imported_at TEXT NOT NULL,
  entity_type TEXT
);
`.trim();

/**
 * Passo 3 — leitura (SPEC-M-014): sessões, destaques e marcadores.
 *
 * `reading_highlight` (v1) é a **projeção legada** de `ReadingItem.highlights`
 * (`normalize.ts`), sem `data_json` e sem `id` — não serve de tabela da coleção
 * nova. Por isso os destaques vão para `reading_highlight_entry`.
 *
 * Colunas são projeção para consulta (`reading_id`, `date`, `color`); a fonte
 * continua sendo `data_json`, como em todas as coleções-array.
 */
export const READING_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS reading_session (
  id TEXT PRIMARY KEY,
  reading_id TEXT,
  kind TEXT,
  date TEXT,
  unit TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reading_session_reading ON reading_session(reading_id);
CREATE INDEX IF NOT EXISTS idx_reading_session_date ON reading_session(date);

CREATE TABLE IF NOT EXISTS reading_highlight_entry (
  id TEXT PRIMARY KEY,
  reading_id TEXT,
  color TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reading_highlight_entry_reading ON reading_highlight_entry(reading_id);

CREATE TABLE IF NOT EXISTS reading_bookmark (
  id TEXT PRIMARY KEY,
  reading_id TEXT,
  created_at TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reading_bookmark_reading ON reading_bookmark(reading_id);
`.trim();

/**
 * Passo 4 — TCC como coleções (SPEC-012).
 *
 * `thesis_chapter`/`thesis_reference` do passo 1 eram **projeção write-only do
 * singleton**: sem `id`, sem `data_json`, e nada no app as lia (`normalize.ts`
 * reconstruía tudo de `thesis_project.data_json`). Coleção própria exige `id` +
 * `data_json`, e SQLite não troca a chave de tabela existente — daí o `DROP` +
 * `CREATE`, sem perda (a verdade está no `data_json` do singleton, e o dreno do
 * boot, `DataClientProvider`, repõe os capítulos a partir dele).
 *
 * `DROP`+`CREATE` ficam num **único `exec`**: o runner não abre transação por
 * passo (`migrations.ts:55-62`), e um `exec` atômico é a garantia disponível
 * contra base sem tabela no meio do passo. Este é o primeiro `DROP TABLE` do
 * projeto — comentado e testado por ser precedente.
 */
export const THESIS_TABLES_SQL = `
DROP TABLE IF EXISTS thesis_chapter;
DROP TABLE IF EXISTS thesis_reference;

CREATE TABLE thesis_chapter (
  id TEXT PRIMARY KEY,
  thesis_id TEXT,
  parent_id TEXT,
  position INTEGER,
  title TEXT,
  stage TEXT,
  due_date TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_thesis_chapter_thesis ON thesis_chapter(thesis_id);
CREATE INDEX IF NOT EXISTS idx_thesis_chapter_due_date ON thesis_chapter(due_date);

CREATE TABLE thesis_reference (
  id TEXT PRIMARY KEY,
  thesis_id TEXT,
  reading_id TEXT,
  status TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_thesis_reference_thesis ON thesis_reference(thesis_id);

CREATE TABLE thesis_meeting (
  id TEXT PRIMARY KEY,
  thesis_id TEXT,
  date TEXT,
  status TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_thesis_meeting_thesis ON thesis_meeting(thesis_id);
CREATE INDEX IF NOT EXISTS idx_thesis_meeting_date ON thesis_meeting(date);

CREATE TABLE thesis_task (
  id TEXT PRIMARY KEY,
  thesis_id TEXT,
  due_date TEXT,
  status TEXT,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_thesis_task_thesis ON thesis_task(thesis_id);
CREATE INDEX IF NOT EXISTS idx_thesis_task_due_date ON thesis_task(due_date);

CREATE TABLE thesis_writing_log (
  id TEXT PRIMARY KEY,
  thesis_id TEXT,
  date TEXT,
  words INTEGER,
  data_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_thesis_writing_log_thesis ON thesis_writing_log(thesis_id);
CREATE INDEX IF NOT EXISTS idx_thesis_writing_log_date ON thesis_writing_log(date);
`.trim();
