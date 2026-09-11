//! Repositórios da base da usuária — CRUD por coleção.
//!
//! Porta fiel de `src/lib/db/normalize.ts`: cada coleção é regravada por
//! completo numa transação (`DELETE` + `INSERT`), com as entidades completas
//! em `data_json` e colunas escalares/join-tables como projeção de consulta.
//! `load` reconstrói as entidades a partir de `data_json`.

pub mod read;
pub mod write;

pub use read::{load_all_collections, load_collection};
pub use write::save_collection;

use serde_json::Value;

/// As 22 coleções de domínio persistidas na base da usuária (espelho de
/// `USER_COLLECTION_KEYS` do normalize.ts). `reminder`/`onboarding`/`syncIndex`
/// são "prefs" sem tabela no schema (no TS viviam em Preferences) — a
/// persistência própria delas é decisão de follow-up (F1.14b).
pub const USER_COLLECTION_KEYS: &[&str] = &[
  "profile",
  "courses",
  "classes",
  "tasks",
  "exams",
  "authors",
  "concepts",
  "readings",
  "flashcards",
  "materials",
  "techniques",
  "internshipLogs",
  "supervision",
  "tcc",
  "stickers",
  "sessions",
  "streakData",
  "looseNotes",
  "savedBookIds",
  "bookmarkedCourseIds",
  "readingProgress",
  "quizSessions",
];

/// `true` se `key` é uma das coleções de domínio da base da usuária.
pub fn is_user_collection_key(key: &str) -> bool {
  USER_COLLECTION_KEYS.contains(&key)
}

// ---- helpers de shape (espelho do normalize.ts) ----

/// Itens-objeto de um array (não-objetos são ignorados).
pub(crate) fn as_array(value: &Value) -> Vec<&Value> {
  value.as_array().map_or(Vec::new(), |a| a.iter().filter(|v| v.is_object()).collect())
}

/// String não-vazia, ou `None`.
pub(crate) fn str(value: &Value) -> Option<String> {
  value.as_str().map(str::to_owned).filter(|s| !s.is_empty())
}

/// Número finito, ou `None`.
pub(crate) fn num(value: &Value) -> Option<f64> {
  value.as_f64().filter(|n| n.is_finite())
}

/// Trunca número (Math.trunc); `0` para ausente.
pub(crate) fn int(value: &Value) -> i64 {
  num(value).map_or(0, |n| n.trunc() as i64)
}

/// Serializa compacto (o `data_json` guarda a entidade completa).
pub(crate) fn json(value: &Value) -> String {
  serde_json::to_string(value).expect("serializar Value não falha")
}

/// IDs string de um campo de relação (`conceptIds`, `authorIds`, `materials`, …).
pub(crate) fn ref_ids<'a>(entity: &'a Value, field: &str) -> Vec<&'a str> {
  entity
    .get(field)
    .and_then(Value::as_array)
    .map_or(Vec::new(), |a| a.iter().filter_map(Value::as_str).collect())
}

/// `id` da entidade (usado nas join-tables / chaves filhas).
pub(crate) fn id(entity: &Value) -> String {
  entity.get("id").and_then(Value::as_str).unwrap_or("").to_owned()
}
