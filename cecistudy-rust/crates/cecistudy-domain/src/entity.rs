//! Entidades tipadas dos dados persistentes da usuária (coleções de domínio).
//!
//! Forma derivada **spec-first** de `contracts/schema.sql` (tabelas de `cecistudy_user`)
//!   e fixtures canônicas de `contracts/golden/collections/*` (canonical JSON v1 gerado
//!   pelo TS). Os structs são a representação tipada do `data_json` — a serialização
//!   deve round-trip para o mesmo canonical JSON v1 dos golden files (ver
//!   `tests/entity_roundtrip_test.rs`).
//!
//! Regras:
//! - campos `Option<T>` com `skip_serializing_if = "Option::is_none"` preservam a
//!   ausência do campo (espelho do TS que omite `undefined`);
//! - arrays `#[serde(default)]` toleram payloads antigos sem o campo;
//! - chaves em `camelCase` (canonical v1); nenhuma regra de negócio aqui — só shape.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

fn is_none<T>(value: &Option<T>) -> bool {
  value.is_none()
}

/// Perfil da usuária — tabela `profile`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Profile {
  #[serde(skip_serializing_if = "is_none")]
  pub category_xp: Option<BTreeMap<String, f64>>,
  #[serde(skip_serializing_if = "is_none")]
  pub daily_quote: Option<String>,
  pub name: String,
  #[serde(skip_serializing_if = "is_none")]
  pub photo_url: Option<String>,
  pub semester: f64,
  pub stickers_collected: f64,
  #[serde(skip_serializing_if = "is_none")]
  pub target_career: Option<String>,
  pub total_semesters: f64,
  #[serde(skip_serializing_if = "is_none")]
  pub university: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Slot de horário de aula — tabela `course_schedule`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct CourseScheduleSlot {
  pub day: f64,
  #[serde(skip_serializing_if = "is_none")]
  pub end: Option<String>,
  pub start: String,
}

/// Frequência agregada de uma disciplina.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Attendance {
  pub attended: f64,
  pub total: f64,
}

/// Disciplina — tabela `course`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Course {
  #[serde(skip_serializing_if = "is_none")]
  pub attendance: Option<Attendance>,
  #[serde(skip_serializing_if = "is_none")]
  pub category: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub code: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub color: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub description: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub icon: Option<String>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub min_grade: Option<f64>,
  #[serde(skip_serializing_if = "is_none")]
  pub name: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub professor: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub room: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub schedule: Option<Vec<CourseScheduleSlot>>,
  #[serde(skip_serializing_if = "is_none")]
  pub semester: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Anotação de aula — tabela `class_note`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ClassNote {
  #[serde(skip_serializing_if = "is_none")]
  pub approach_ids: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub author_ids: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub concept_ids: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub course_id: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub date: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub full_notes: Option<String>,
  pub id: String,
  pub number: f64,
  #[serde(skip_serializing_if = "is_none")]
  pub rating: Option<f64>,
  #[serde(skip_serializing_if = "is_none")]
  pub summary: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub title: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Tarefa — tabela `task`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Task {
  #[serde(skip_serializing_if = "is_none")]
  pub category: Option<String>,
  pub completed: bool,
  #[serde(skip_serializing_if = "is_none")]
  pub discipline_id: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub due_date: Option<String>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub priority: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub title: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Avaliação/prova — tabela `assessment`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Assessment {
  pub completed: bool,
  #[serde(skip_serializing_if = "is_none")]
  pub course_id: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub date: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub grade: Option<f64>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub time: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub title: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub topics: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub weight: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub weight_value: Option<f64>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Sessão de estudo — tabela `study_session`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct StudySession {
  #[serde(skip_serializing_if = "is_none")]
  pub course_id: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub date: Option<String>,
  pub duration_minutes: f64,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub notes: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub start_time: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub topic: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Capítulo de leitura — tabela `reading_chapter`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ReadingChapter {
  #[serde(skip_serializing_if = "is_none")]
  pub body: Option<String>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub title: Option<String>,
}

/// Item de leitura — tabela `reading`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ReadingItem {
  #[serde(skip_serializing_if = "is_none")]
  pub author: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub chapters: Option<Vec<ReadingChapter>>,
  #[serde(skip_serializing_if = "is_none")]
  pub course_id: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub highlights: Option<Vec<String>>,
  pub id: String,
  pub read_pages: f64,
  #[serde(skip_serializing_if = "is_none")]
  pub status: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub title: Option<String>,
  pub total_pages: f64,
  #[serde(rename = "type", skip_serializing_if = "is_none")]
  pub kind: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Flashcard — tabela `flashcard`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Flashcard {
  #[serde(skip_serializing_if = "is_none")]
  pub answer: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub concept_id: Option<String>,
  pub ease_factor: f64,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub last_reviewed: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub question: Option<String>,
  pub times_reviewed: f64,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Autor (repertório pessoal) — tabela `author`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Author {
  #[serde(skip_serializing_if = "is_none")]
  pub approach_id: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub bio: Option<String>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub key_concepts: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub lifespan: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub major_works: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub name: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Conceito psicológico — tabela `concept`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Concept {
  #[serde(skip_serializing_if = "is_none")]
  pub approach_id: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub author_ids: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub course_ids: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub definition: Option<String>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub name: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub tags: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Material (artigo/link) — tabela `material`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct MaterialItem {
  #[serde(skip_serializing_if = "is_none")]
  pub added_at: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub author: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub course_id: Option<String>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub tags: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub title: Option<String>,
  #[serde(rename = "type", skip_serializing_if = "is_none")]
  pub kind: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub url: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Técnica (pessoal) — tabela `technique`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Technique {
  #[serde(skip_serializing_if = "is_none")]
  pub approach_id: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub color: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub description: Option<String>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub name: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub related_concept_ids: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub steps: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Autoavaliação de um registro de supervisão.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SupervisionSelfAssessment {
  #[serde(skip_serializing_if = "is_none")]
  pub confidence: Option<String>,
}

/// Registro de estágio — tabela `internship`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct InternshipLog {
  #[serde(skip_serializing_if = "is_none")]
  pub activity: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub after_notes: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub approach: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub before_notes: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub concept_ids: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub date: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub discussed_log_ids: Option<Vec<String>>,
  pub hours: f64,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub next_steps: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub patient: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub phase: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub reflections: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub self_assessment: Option<SupervisionSelfAssessment>,
  #[serde(skip_serializing_if = "is_none")]
  pub session_number: Option<f64>,
  #[serde(skip_serializing_if = "is_none")]
  pub supervision_log_id: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub supervisor: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub theme: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub topics: Option<Vec<String>>,
  #[serde(rename = "type", skip_serializing_if = "is_none")]
  pub kind: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Nota avulsa — tabela `note`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct LooseNote {
  #[serde(skip_serializing_if = "is_none")]
  pub category: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub concept_ids: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub content: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub course_id: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub date: Option<String>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub title: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub updated_at: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Capítulo do TCC — tabela `thesis_chapter`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ThesisChapter {
  pub completed: bool,
  #[serde(skip_serializing_if = "is_none")]
  pub due_date: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub title: Option<String>,
}

/// TCC — tabela `thesis_project`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct TccData {
  #[serde(skip_serializing_if = "is_none")]
  pub advisor: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub chapters: Option<Vec<ThesisChapter>>,
  #[serde(skip_serializing_if = "is_none")]
  pub field: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub objectives: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub problem_statement: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub references: Option<Vec<String>>,
  pub status: String,
  #[serde(skip_serializing_if = "is_none")]
  pub title: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Sticker/realização — tabela `achievement`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Sticker {
  #[serde(skip_serializing_if = "is_none")]
  pub category: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub description: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub emoji: Option<String>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub name: Option<String>,
  pub unlocked: bool,
  #[serde(skip_serializing_if = "is_none")]
  pub unlocked_at: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Streak — tabela `streak`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct StreakData {
  #[serde(skip_serializing_if = "is_none")]
  pub active_days: Option<Vec<String>>,
}

/// Pergunta de um quiz (forma canônica da questão respondida) — tabela `quiz_answer`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct QuizAnswerQuestion {
  #[serde(skip_serializing_if = "is_none")]
  pub answer: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub area: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub dificuldade: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub escola_ou_abordagem: Option<String>,
  pub id: String,
  #[serde(skip_serializing_if = "is_none")]
  pub options: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub question: Option<String>,
}

/// Resposta registrada de uma questão — tabela `quiz_answer`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct QuizAnswer {
  pub correct: bool,
  pub question: QuizAnswerQuestion,
  #[serde(skip_serializing_if = "is_none")]
  pub question_id: Option<String>,
  pub time_ms: f64,
  #[serde(skip_serializing_if = "is_none")]
  pub user_answer: Option<String>,
}

/// Configuração de uma sessão de quiz — coluna `data_json` de `quiz_session`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct QuizConfig {
  #[serde(skip_serializing_if = "is_none")]
  pub areas: Option<Vec<String>>,
  pub count: f64,
  #[serde(skip_serializing_if = "is_none")]
  pub dificuldades: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub escolas: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub temas: Option<Vec<String>>,
}

/// Sessão de quiz — tabela `quiz_session`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct QuizSession {
  #[serde(skip_serializing_if = "is_none")]
  pub answers: Option<Vec<QuizAnswer>>,
  pub config: QuizConfig,
  pub correct_count: f64,
  #[serde(skip_serializing_if = "is_none")]
  pub created_at: Option<String>,
  pub finished_at: f64,
  pub id: String,
  pub score_pct: f64,
  pub started_at: f64,
  pub total_count: f64,
  pub total_time_ms: f64,
  #[serde(skip_serializing_if = "is_none")]
  pub workspace_id: Option<String>,
}

/// Lembrete diário (pref) — canonical JSON `reminder`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Reminder {
  pub enabled: bool,
  #[serde(skip_serializing_if = "is_none")]
  pub time: Option<String>,
}

/// Onboarding (pref) — canonical JSON `onboarding`.
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Onboarding {
  pub completed: bool,
  #[serde(skip_serializing_if = "is_none")]
  pub completed_at: Option<String>,
}

/// Livros/coleções favoritos — array de ids (canonical JSON `savedBookIds`).
pub type SavedBookIds = Vec<String>;

/// Disciplinas favoritas — array de ids (canonical JSON `bookmarkedCourseIds`).
pub type BookmarkedCourseIds = Vec<String>;

/// Progresso de leitura por livro — mapa `book_id → páginas` (tabela `reading_progress`).
pub type ReadingProgress = BTreeMap<String, i64>;
