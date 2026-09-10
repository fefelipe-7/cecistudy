/*
 * cecistudy ♡ — canonical SQL schema
 * ============================================================================
 * Contrato compartilhado entre o banco nativo (Capacitor/SQLite, TS) e o
 * desktop Flutter+Rust. Fonte de verdade: `src/lib/db/migrations/user.ts`
 * (USER_TABLES_SQL) e `src/lib/db/catalogSchema.ts` (CATALOG_TABLES_SQL).
 *
 * NÃO edite este arquivo manualmente sem atualizar a fonte TS e rodar o
 * verificador (`node cecistudy-rust/contracts/verify-schema.mjs`).
 *
 * Referência de versões (ver `packages/data/src/schema.ts`):
 *   SCHEMA_VERSION      = 13   (versão do payload persistido/backup)
 *   USER_SCHEMA_VERSION = 1    (versão da base SQLite da usuária `cecistudy_user`)
 *   CATALOG_RELEASE     = ver `content/catalog-version.json` (catálogo estático)
 *
 * Dois bancos lógicos (web usa facades JS; nativo usa SQLite):
 *   - `cecistudy_user`    ... dados da usuária (persistência principal)
 *   - `cecistudy_catalog` ... catálogo somente-leitura (questionário/templo)
 *
 * ⚠️ DDL da base da usuária é projeção livre (USER_DB v1 nunca foi publicado):
 * mudanças de shape são livres até o primeiro release nativo com o plugin
 * embutido. O contrato duro entre plataformas é o BackupV2 JSON
 * (ver `backup-v2-spec.md`).
 */

/* ===========================================================================
 * DATABASE: cecistudy_user  (schema v1)
 * Modelo normalizado por coleção: colunas escalares consultáveis + `data_json`
 * com a entidade completa (load reconstrói do `data_json`). Sem FK enforcement
 * (gravação por coleção independente). DDL idempotente (IF NOT EXISTS).
 * ===========================================================================
 */

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

CREATE TABLE IF NOT EXISTS legacy_import_map (
  source_key TEXT PRIMARY KEY,
  imported_at TEXT NOT NULL,
  entity_type TEXT
);

/* ===========================================================================
 * DATABASE: cecistudy_catalog  (somente-leitura)
 * Catálogo estático gerado pela pipeline editorial (`npm run content:build`),
 * embutido em `public/assets/databases/` no nativo. Web usa facades JS.
 * ⚠️ Este DDL precisa espelhar exatamente o `.db` construído
 * (verificado por `npm run db:verify`).
 * ===========================================================================
 */

CREATE TABLE IF NOT EXISTS catalog_release (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  built_at TEXT NOT NULL,
  source_schema_version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS area (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS approach_family (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  color TEXT
);

CREATE TABLE IF NOT EXISTS approach (
  id TEXT PRIMARY KEY,
  family_id TEXT REFERENCES approach_family(id),
  name TEXT NOT NULL,
  short_name TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question (
  id TEXT PRIMARY KEY,
  area TEXT,
  tema TEXT,
  subtema TEXT,
  escola TEXT,
  dificuldade TEXT,
  formato TEXT,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS work (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  familia TEXT,
  title TEXT NOT NULL,
  author TEXT,
  cover_color TEXT,
  accent_color TEXT,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS concept_domain (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS concept (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES concept_domain(id),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_author (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS technique_category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS technique (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES technique_category(id),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comparison (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  phase TEXT NOT NULL,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS topic (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES topic(id),
  name TEXT NOT NULL
);