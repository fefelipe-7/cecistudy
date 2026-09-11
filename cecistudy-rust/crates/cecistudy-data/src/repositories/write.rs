//! Escrita por coleção (porta de `saveCollection` do normalize.ts).
//!
//! Cada escritor roda dentro de uma transação iniciada por `save_collection`.
//! Coleções de projeção especial (courses/classes/tasks/exams/concepts/readings/
//! internshipLogs/tcc/sessions/looseNotes/quizSessions) são ler portadas — ver
//! slice B (F1.14).

use rusqlite::types::Value as V;
use rusqlite::{Connection, params_from_iter};

use cecistudy_common::Error;

use crate::repositories::{as_array, id, json, num, str};
use crate::schema::db_err;

use serde_json::Value;

fn t(text: String) -> V {
  V::Text(text)
}

/// `str` → coluna TEXT (`NULL` se ausente/vazia).
fn s(value: &Value) -> V {
  match str(value) {
    Some(s) => V::Text(s),
    None => V::Null,
  }
}

/// `num` → coluna numérica; inteiro vira INTEGER e decimal vira REAL.
fn n(value: &Value) -> V {
  match num(value) {
    Some(x) if x.fract() != 0.0 => V::Real(x),
    Some(x) => V::Integer(x as i64),
    None => V::Null,
  }
}

/// booleano → `1`/`0` (colunas INTEGER de flag).
fn b(value: &Value) -> V {
  V::Integer(value.as_bool().unwrap_or(false) as i64)
}

/// Regrava uma tabela "plana" (`DELETE` + `INSERT` das linhas completas).
fn save_rows(
  conn: &Connection,
  delete_sql: &str,
  insert_sql: &str,
  items: &[&Value],
  row: impl Fn(&Value) -> Vec<V>,
) -> Result<(), Error> {
  conn.execute(delete_sql, []).map_err(db_err)?;
  for item in items {
    conn.execute(insert_sql, params_from_iter(row(item))).map_err(db_err)?;
  }
  Ok(())
}

fn object_or_err<'a>(
  value: &'a Value,
  key: &str,
) -> Result<&'a serde_json::Map<String, Value>, Error> {
  value.as_object().ok_or_else(|| Error::Validation(format!("{key}: objeto esperado")))
}

fn save_profile(conn: &Connection, value: &Value) -> Result<(), Error> {
  object_or_err(value, "profile")?;
  conn.execute("DELETE FROM profile", []).map_err(db_err)?;
  conn
    .execute("INSERT INTO profile (id, data_json) VALUES (1, ?1)", [t(json(value))])
    .map_err(db_err)?;
  Ok(())
}

fn save_streak_data(conn: &Connection, value: &Value) -> Result<(), Error> {
  let obj = object_or_err(value, "streakData")?;
  let active_days = match obj.get("activeDays") {
    Some(a) if a.is_array() => a.clone(),
    _ => serde_json::json!([]),
  };
  conn.execute("DELETE FROM streak", []).map_err(db_err)?;
  conn
    .execute("INSERT INTO streak (id, active_days_json) VALUES (1, ?1)", [t(json(&active_days))])
    .map_err(db_err)?;
  Ok(())
}

fn save_saved_ids(conn: &Connection, item_type: &str, value: &Value) -> Result<(), Error> {
  conn
    .execute("DELETE FROM saved_catalog_item WHERE item_type = ?1", [t(item_type.to_owned())])
    .map_err(db_err)?;
  let ids = value.as_array().map_or(&[][..], |a| a).iter();
  for item in ids {
    if let Some(id) = item.as_str() {
      conn
        .execute(
          "INSERT INTO saved_catalog_item (item_type, item_id) VALUES (?1, ?2)",
          [t(item_type.to_owned()), t(id.to_owned())],
        )
        .map_err(db_err)?;
    }
  }
  Ok(())
}

fn save_reading_progress(conn: &Connection, value: &Value) -> Result<(), Error> {
  let obj = object_or_err(value, "readingProgress")?;
  conn.execute("DELETE FROM reading_progress", []).map_err(db_err)?;
  for (book_id, pages) in obj {
    let pages = pages.as_f64().unwrap_or(0.0) as i64;
    conn
      .execute(
        "INSERT INTO reading_progress (book_id, pages) VALUES (?1, ?2)",
        [t(book_id.clone()), V::Integer(pages)],
      )
      .map_err(db_err)?;
  }
  Ok(())
}

fn save_authors(conn: &Connection, value: &Value) -> Result<(), Error> {
  let items = as_array(value);
  save_rows(
    conn,
    "DELETE FROM author",
    "INSERT INTO author (id, name, approach_id, data_json) VALUES (?1, ?2, ?3, ?4)",
    &items,
    |a| vec![t(id(a)), s(&a["name"]), s(&a["approachId"]), t(json(a))],
  )
}

fn save_flashcards(conn: &Connection, value: &Value) -> Result<(), Error> {
  let items = as_array(value);
  save_rows(
    conn,
    "DELETE FROM flashcard",
    "INSERT INTO flashcard (id, concept_id, course_id, last_reviewed, times_reviewed, data_json) \
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    &items,
    |f| {
      vec![
        t(id(f)),
        s(&f["conceptId"]),
        s(&f["courseId"]),
        s(&f["lastReviewed"]),
        n(&f["timesReviewed"]),
        t(json(f)),
      ]
    },
  )
}

fn save_materials(conn: &Connection, value: &Value) -> Result<(), Error> {
  let items = as_array(value);
  save_rows(
    conn,
    "DELETE FROM material",
    "INSERT INTO material (id, course_id, type, added_at, data_json) VALUES (?1, ?2, ?3, ?4, ?5)",
    &items,
    |m| vec![t(id(m)), s(&m["courseId"]), s(&m["type"]), s(&m["addedAt"]), t(json(m))],
  )
}

fn save_techniques(conn: &Connection, value: &Value) -> Result<(), Error> {
  let items = as_array(value);
  save_rows(
    conn,
    "DELETE FROM technique",
    "INSERT INTO technique (id, name, approach_id, data_json) VALUES (?1, ?2, ?3, ?4)",
    &items,
    |tc| vec![t(id(tc)), s(&tc["name"]), s(&tc["approachId"]), t(json(tc))],
  )
}

fn save_supervision(conn: &Connection, value: &Value) -> Result<(), Error> {
  let items = as_array(value);
  save_rows(
    conn,
    "DELETE FROM supervision_notebook",
    "INSERT INTO supervision_notebook (id, date, supervisor, data_json) VALUES (?1, ?2, ?3, ?4)",
    &items,
    |su| vec![t(id(su)), s(&su["date"]), s(&su["supervisor"]), t(json(su))],
  )
}

fn save_stickers(conn: &Connection, value: &Value) -> Result<(), Error> {
  let items = as_array(value);
  save_rows(
    conn,
    "DELETE FROM achievement",
    "INSERT INTO achievement (id, unlocked, unlocked_at, category, data_json) VALUES (?1, ?2, ?3, ?4, ?5)",
    &items,
    |st| vec![t(id(st)), b(&st["unlocked"]), s(&st["unlockedAt"]), s(&st["category"]), t(json(st))],
  )
}

/// Regrava uma coleção inteira numa transação. Coleções desconhecidas (campos
/// extras do payload) são ignoradas — espelho do `switch` sem default do TS.
pub fn save_collection(conn: &Connection, key: &str, value: &Value) -> Result<(), Error> {
  transaction(conn, || match key {
    "profile" => save_profile(conn, value),
    "streakData" => save_streak_data(conn, value),
    "savedBookIds" => save_saved_ids(conn, "book", value),
    "bookmarkedCourseIds" => save_saved_ids(conn, "course", value),
    "readingProgress" => save_reading_progress(conn, value),
    "authors" => save_authors(conn, value),
    "flashcards" => save_flashcards(conn, value),
    "materials" => save_materials(conn, value),
    "techniques" => save_techniques(conn, value),
    "supervision" => save_supervision(conn, value),
    "stickers" => save_stickers(conn, value),
    "courses" | "classes" | "tasks" | "exams" | "concepts" | "readings" | "internshipLogs"
    | "tcc" | "sessions" | "looseNotes" | "quizSessions" => Err(Error::Validation(format!(
      "coleção `{key}`: escritor de projeção pendente (F1.14 slice B)"
    ))),
    _ => Ok(()),
  })
}

fn transaction(conn: &Connection, f: impl FnOnce() -> Result<(), Error>) -> Result<(), Error> {
  conn.execute_batch("BEGIN").map_err(db_err)?;
  match f() {
    Ok(()) => {
      conn.execute_batch("COMMIT").map_err(db_err)?;
      Ok(())
    }
    Err(e) => {
      let _ = conn.execute_batch("ROLLBACK");
      Err(e)
    }
  }
}
