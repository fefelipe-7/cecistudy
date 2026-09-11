//! Leitura por coleção (porta de `loadCollection` do normalize.ts).
//!
//! Semânticas espelho do TS:
//! - singletons (`profile`, `streakData`, `tcc`) → `None` se nunca gravados;
//! - arrays de entidades → `Some([])` se a tabela está vazia (default `[]`);
//! - `readingProgress` → `Some({})` mesmo vazio;
//! - coleção desconhecida (pref sem tabela) → `None`.

use rusqlite::{Connection, OptionalExtension};

use cecistudy_common::Error;

use crate::schema::db_err;

use serde_json::Value;

fn json_of(raw: &str, key: &str) -> Result<Value, Error> {
  serde_json::from_str(raw).map_err(|e| Error::Database(format!("{key}: data_json inválido: {e}")))
}

/// Lê um singleton (`LIMIT 1`; perfil/thesis) de uma coluna JSON.
fn load_singleton(
  conn: &Connection,
  table: &str,
  col: &str,
  key: &str,
) -> Result<Option<Value>, Error> {
  let sql = format!("SELECT {col} FROM {table} LIMIT 1");
  let raw: Option<String> = conn.query_row(&sql, [], |r| r.get(0)).optional().map_err(db_err)?;
  raw.map(|r| json_of(&r, key)).transpose()
}

/// Lê uma tabela "plana" de entidades (coluna `data_json`).
fn load_json_rows(conn: &Connection, table: &str, key: &str) -> Result<Value, Error> {
  let sql = format!("SELECT data_json FROM {table}");
  let mut stmt = conn.prepare(&sql).map_err(db_err)?;
  let rows = stmt.query_map([], |r| r.get::<_, String>(0)).map_err(db_err)?;
  let mut out = Vec::new();
  for row in rows {
    out.push(json_of(&row.map_err(db_err)?, key)?);
  }
  Ok(Value::Array(out))
}

fn load_saved_ids(conn: &Connection, item_type: &str) -> Result<Value, Error> {
  let mut stmt =
    conn.prepare("SELECT item_id FROM saved_catalog_item WHERE item_type = ?1").map_err(db_err)?;
  let rows = stmt.query_map([item_type], |r| r.get::<_, String>(0)).map_err(db_err)?;
  let mut out = Vec::new();
  for row in rows {
    out.push(Value::String(row.map_err(db_err)?));
  }
  Ok(Value::Array(out))
}

fn load_reading_progress(conn: &Connection) -> Result<Value, Error> {
  let mut stmt = conn.prepare("SELECT book_id, pages FROM reading_progress").map_err(db_err)?;
  let rows = stmt
    .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1).unwrap_or(0))))
    .map_err(db_err)?;
  let mut out = serde_json::Map::new();
  for row in rows {
    let (book_id, pages) = row.map_err(db_err)?;
    out.insert(book_id, Value::Number(pages.into()));
  }
  Ok(Value::Object(out))
}

/// Tabela "plana" por coleção (o `data_json` reconstrói a entidade completa).
fn table_by_key(key: &str) -> Option<&'static str> {
  Some(match key {
    "courses" => "course",
    "classes" => "class_note",
    "tasks" => "task",
    "exams" => "assessment",
    "authors" => "author",
    "concepts" => "concept",
    "readings" => "reading",
    "flashcards" => "flashcard",
    "materials" => "material",
    "techniques" => "technique",
    "internshipLogs" => "internship",
    "supervision" => "supervision_notebook",
    "stickers" => "achievement",
    "sessions" => "study_session",
    "looseNotes" => "note",
    "quizSessions" => "quiz_session",
    _ => return None,
  })
}

/// Lê uma coleção do banco. `None` = nunca gravada (o chamador decide default).
pub fn load_collection(conn: &Connection, key: &str) -> Result<Option<Value>, Error> {
  match key {
    "profile" => load_singleton(conn, "profile", "data_json", key),
    "tcc" => load_singleton(conn, "thesis_project", "data_json", key),
    "streakData" => {
      let raw: Option<String> = conn
        .query_row("SELECT active_days_json FROM streak LIMIT 1", [], |r| r.get(0))
        .optional()
        .map_err(db_err)?;
      match raw {
        None => Ok(None),
        Some(active_days_json) => {
          let active_days = json_of(&active_days_json, key)?;
          let arr = if active_days.is_array() { active_days } else { Value::Array(vec![]) };
          Ok(Some(serde_json::json!({ "activeDays": arr })))
        }
      }
    }
    "savedBookIds" => Ok(Some(load_saved_ids(conn, "book")?)),
    "bookmarkedCourseIds" => Ok(Some(load_saved_ids(conn, "course")?)),
    "readingProgress" => Ok(Some(load_reading_progress(conn)?)),
    _ => match table_by_key(key) {
      Some(table) => Ok(Some(load_json_rows(conn, table, key)?)),
      None => Ok(None),
    },
  }
}

/// Lê todas as coleções presentes no banco (chamada única de hidratação).
/// Espelho de `loadAllCollections`: todas as chaves aparecem, `None` quando
/// a coleção nunca foi gravada (o chamador decide o default — seeds/empty).
pub fn load_all_collections(conn: &Connection) -> Result<Vec<(String, Option<Value>)>, Error> {
  crate::repositories::USER_COLLECTION_KEYS
    .iter()
    .map(|key| Ok(((*key).to_owned(), load_collection(conn, key)?)))
    .collect()
}
