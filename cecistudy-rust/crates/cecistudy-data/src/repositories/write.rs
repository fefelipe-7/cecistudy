//! Escrita por coleção (porta de `saveCollection` do normalize.ts).
//!
//! Cada escritor roda dentro de uma transação iniciada por `save_collection`.
//! Entidade completa em `data_json`; colunas escalares + join-tables como
//! projeção de consulta (espelho fiel do TS).

use rusqlite::types::Value as RV;
use rusqlite::{Connection, params_from_iter};

use cecistudy_common::Error;
use cecistudy_common::iso_now_ms;

use crate::repositories::{as_array, id, int, json, num, ref_ids, str};
use crate::schema::db_err;

use serde_json::Value;

type V = RV;

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
          "INSERT INTO saved_catalog_item (item_type, item_id, saved_at) VALUES (?1, ?2, ?3)",
          params_from_iter([t(item_type.to_owned()), t(id.to_owned()), t(iso_now_ms())]),
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

// ---- escritores de projeção (slice B) ----

fn save_courses(conn: &Connection, value: &Value) -> Result<(), Error> {
  conn.execute("DELETE FROM course", []).map_err(db_err)?;
  conn.execute("DELETE FROM course_schedule", []).map_err(db_err)?;
  for c in as_array(value) {
    let row = vec![t(id(c)), s(&c["name"]), s(&c["semester"]), s(&c["category"]), t(json(c))];
    conn
      .execute(
        "INSERT INTO course (id, name, semester, category, data_json) VALUES (?1, ?2, ?3, ?4, ?5)",
        params_from_iter(row),
      )
      .map_err(db_err)?;
    let schedule = c.get("schedule").and_then(Value::as_array).map_or(&[][..], |a| a);
    for slot in schedule {
      if !slot.is_object() {
        continue;
      }
      let start =
        slot.get("start").and_then(Value::as_str).map(|s| s.to_owned()).unwrap_or_default();
      conn
        .execute(
          "INSERT INTO course_schedule (course_id, day, start_time, end_time) VALUES (?1, ?2, ?3, ?4)",
          params_from_iter([
            t(id(c)),
            V::Integer(int(&slot["day"])),
            V::Text(start),
            if let Some(e) = str(&slot["end"]) { V::Text(e) } else { V::Null },
          ]),
        )
        .map_err(db_err)?;
    }
  }
  Ok(())
}

/// Regrava `activity_event` para tarefas concluídas e sessões (dias ativos).
fn rebuild_activity_events(
  conn: &Connection,
  event_type: &str,
  events: &[(Option<String>, String)],
) -> Result<(), Error> {
  conn
    .execute("DELETE FROM activity_event WHERE event_type = ?1", [t(event_type.to_owned())])
    .map_err(db_err)?;
  for (date, ref_id) in events {
    if let Some(date) = date {
      conn
        .execute(
          "INSERT OR IGNORE INTO activity_event (event_type, event_date, ref_id) VALUES (?1, ?2, ?3)",
          params_from_iter([t(event_type.to_owned()), t(date.clone()), t(ref_id.clone())]),
        )
        .map_err(db_err)?;
    }
  }
  Ok(())
}

const CLASS_LINK_KIND: [(&str, &str); 4] = [
  ("conceptIds", "concept"),
  ("authorIds", "author"),
  ("approachIds", "approach"),
  ("materials", "material"),
];

const NOTE_LINK_KIND: [(&str, &str); 4] = [
  ("conceptIds", "concept"),
  ("authorIds", "author"),
  ("approachIds", "approach"),
  ("materialIds", "material"),
];

fn save_classes(conn: &Connection, value: &Value) -> Result<(), Error> {
  conn.execute("DELETE FROM class_note", []).map_err(db_err)?;
  conn.execute("DELETE FROM class_note_link", []).map_err(db_err)?;
  for cl in as_array(value) {
    conn
      .execute(
        "INSERT INTO class_note (id, course_id, number, date, rating, data_json) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params_from_iter([
          t(id(cl)),
          match str(&cl["courseId"]) {
            Some(x) => V::Text(x),
            None => V::Null,
          },
          match num(&cl["number"]) {
            Some(x) => V::Real(x),
            None => V::Null,
          },
          match str(&cl["date"]) {
            Some(x) => V::Text(x),
            None => V::Null,
          },
          match num(&cl["rating"]) {
            Some(x) => V::Real(x),
            None => V::Null,
          },
          t(json(cl)),
        ]),
      )
      .map_err(db_err)?;
    for (field, kind) in CLASS_LINK_KIND {
      for r in ref_ids(cl, field) {
        conn
          .execute(
            "INSERT INTO class_note_link (class_note_id, kind, ref_id) VALUES (?1, ?2, ?3)",
            params_from_iter([t(id(cl)), t(kind.to_owned()), t(r.to_owned())]),
          )
          .map_err(db_err)?;
      }
    }
  }
  Ok(())
}

fn save_tasks(conn: &Connection, value: &Value) -> Result<(), Error> {
  let items = as_array(value);
  conn.execute("DELETE FROM task", []).map_err(db_err)?;
  conn.execute("DELETE FROM task_link", []).map_err(db_err)?;
  for task in &items {
    conn
      .execute(
        "INSERT INTO task (id, discipline_id, class_id, due_date, completed, priority, category, data_json) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params_from_iter([
          t(id(task)),
          match str(&task["disciplineId"]) { Some(x) => V::Text(x), None => V::Null },
          match str(&task["classId"]) { Some(x) => V::Text(x), None => V::Null },
          match str(&task["dueDate"]) { Some(x) => V::Text(x), None => V::Null },
          b(&task["completed"]),
          match str(&task["priority"]) { Some(x) => V::Text(x), None => V::Null },
          match str(&task["category"]) { Some(x) => V::Text(x), None => V::Null },
          t(json(task)),
        ]),
      )
      .map_err(db_err)?;
  }
  let done: Vec<(Option<String>, String)> = items
    .iter()
    .filter(|task| task["completed"].as_bool().unwrap_or(false))
    .map(|task| (str(&task["dueDate"]), id(task)))
    .collect();
  rebuild_activity_events(conn, "task-done", &done)
}

fn save_exams(conn: &Connection, value: &Value) -> Result<(), Error> {
  conn.execute("DELETE FROM assessment", []).map_err(db_err)?;
  conn.execute("DELETE FROM assessment_topic", []).map_err(db_err)?;
  for e in as_array(value) {
    conn
      .execute(
        "INSERT INTO assessment (id, course_id, date, completed, weight_value, grade, data_json) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params_from_iter([
          t(id(e)),
          match str(&e["courseId"]) {
            Some(x) => V::Text(x),
            None => V::Null,
          },
          match str(&e["date"]) {
            Some(x) => V::Text(x),
            None => V::Null,
          },
          b(&e["completed"]),
          match num(&e["weightValue"]) {
            Some(x) => V::Real(x),
            None => V::Null,
          },
          match num(&e["grade"]) {
            Some(x) => V::Real(x),
            None => V::Null,
          },
          t(json(e)),
        ]),
      )
      .map_err(db_err)?;
    for topic in ref_ids(e, "topics") {
      conn
        .execute(
          "INSERT INTO assessment_topic (assessment_id, topic) VALUES (?1, ?2)",
          params_from_iter([t(id(e)), t(topic.to_owned())]),
        )
        .map_err(db_err)?;
    }
  }
  Ok(())
}

fn save_concepts(conn: &Connection, value: &Value) -> Result<(), Error> {
  conn.execute("DELETE FROM concept", []).map_err(db_err)?;
  conn.execute("DELETE FROM concept_course", []).map_err(db_err)?;
  conn.execute("DELETE FROM concept_author", []).map_err(db_err)?;
  for c in as_array(value) {
    conn
      .execute(
        "INSERT INTO concept (id, name, approach_id, data_json) VALUES (?1, ?2, ?3, ?4)",
        params_from_iter([
          t(id(c)),
          match str(&c["name"]) {
            Some(x) => V::Text(x),
            None => V::Null,
          },
          match str(&c["approachId"]) {
            Some(x) => V::Text(x),
            None => V::Null,
          },
          t(json(c)),
        ]),
      )
      .map_err(db_err)?;
    for cid in ref_ids(c, "courseIds") {
      conn
        .execute(
          "INSERT INTO concept_course (concept_id, course_id) VALUES (?1, ?2)",
          params_from_iter([t(id(c)), t(cid.to_owned())]),
        )
        .map_err(db_err)?;
    }
    for aid in ref_ids(c, "authorIds") {
      conn
        .execute(
          "INSERT INTO concept_author (concept_id, author_id) VALUES (?1, ?2)",
          params_from_iter([t(id(c)), t(aid.to_owned())]),
        )
        .map_err(db_err)?;
    }
  }
  Ok(())
}

fn save_readings(conn: &Connection, value: &Value) -> Result<(), Error> {
  conn.execute("DELETE FROM reading", []).map_err(db_err)?;
  conn.execute("DELETE FROM reading_highlight", []).map_err(db_err)?;
  for r in as_array(value) {
    conn
      .execute(
        "INSERT INTO reading (id, course_id, type, status, total_pages, read_pages, data_json) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params_from_iter([
          t(id(r)),
          match str(&r["courseId"]) {
            Some(x) => V::Text(x),
            None => V::Null,
          },
          match str(&r["type"]) {
            Some(x) => V::Text(x),
            None => V::Null,
          },
          match str(&r["status"]) {
            Some(x) => V::Text(x),
            None => V::Null,
          },
          match num(&r["totalPages"]) {
            Some(x) => V::Real(x),
            None => V::Null,
          },
          match num(&r["readPages"]) {
            Some(x) => V::Real(x),
            None => V::Null,
          },
          t(json(r)),
        ]),
      )
      .map_err(db_err)?;
    if let Some(highlights) = r.get("highlights").and_then(Value::as_array) {
      for (position, h) in highlights.iter().filter_map(|h| h.as_str()).enumerate() {
        conn
          .execute(
            "INSERT INTO reading_highlight (reading_id, position, text) VALUES (?1, ?2, ?3)",
            params_from_iter([t(id(r)), V::Integer(position as i64), t(h.to_owned())]),
          )
          .map_err(db_err)?;
      }
    }
  }
  Ok(())
}

fn save_internship_logs(conn: &Connection, value: &Value) -> Result<(), Error> {
  conn.execute("DELETE FROM internship", []).map_err(db_err)?;
  conn.execute("DELETE FROM internship_concept", []).map_err(db_err)?;
  conn.execute("DELETE FROM internship_topic", []).map_err(db_err)?;
  for l in as_array(value) {
    conn
      .execute(
        "INSERT INTO internship (id, type, phase, date, hours, data_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params_from_iter([
          t(id(l)),
          match str(&l["type"]) { Some(x) => V::Text(x), None => V::Null },
          match str(&l["phase"]) { Some(x) => V::Text(x), None => V::Null },
          match str(&l["date"]) { Some(x) => V::Text(x), None => V::Null },
          match num(&l["hours"]) { Some(x) => V::Real(x), None => V::Null },
          t(json(l)),
        ]),
      )
      .map_err(db_err)?;
    for cid in ref_ids(l, "conceptIds") {
      conn
        .execute(
          "INSERT INTO internship_concept (internship_id, concept_id) VALUES (?1, ?2)",
          params_from_iter([t(id(l)), t(cid.to_owned())]),
        )
        .map_err(db_err)?;
    }
    for topic in ref_ids(l, "topics") {
      conn
        .execute(
          "INSERT INTO internship_topic (internship_id, topic) VALUES (?1, ?2)",
          params_from_iter([t(id(l)), t(topic.to_owned())]),
        )
        .map_err(db_err)?;
    }
  }
  Ok(())
}

fn save_tcc(conn: &Connection, value: &Value) -> Result<(), Error> {
  let obj = object_or_err(value, "tcc")?;
  let chapters_value = obj.get("chapters").cloned().unwrap_or(Value::Array(vec![]));
  let chapters = as_array(&chapters_value);
  let references: Vec<&str> = obj
    .get("references")
    .and_then(Value::as_array)
    .map_or(Vec::new(), |a| a.iter().filter_map(Value::as_str).collect());
  conn.execute("DELETE FROM thesis_project", []).map_err(db_err)?;
  conn.execute("DELETE FROM thesis_chapter", []).map_err(db_err)?;
  conn.execute("DELETE FROM thesis_reference", []).map_err(db_err)?;
  conn
    .execute(
      "INSERT INTO thesis_project (id, title, advisor, field, status, data_json) VALUES (1, ?1, ?2, ?3, ?4, ?5)",
      params_from_iter([
        match str(&obj["title"]) { Some(x) => V::Text(x), None => V::Null },
        match str(&obj["advisor"]) { Some(x) => V::Text(x), None => V::Null },
        match str(&obj["field"]) { Some(x) => V::Text(x), None => V::Null },
        match str(&obj["status"]) { Some(x) => V::Text(x), None => V::Null },
        t(json(value)),
      ]),
    )
    .map_err(db_err)?;
  let mut position = 0_i64;
  for ch in chapters {
    conn
      .execute(
        "INSERT INTO thesis_chapter (thesis_id, position, title, completed, due_date) VALUES (1, ?1, ?2, ?3, ?4)",
        params_from_iter([
          V::Integer(position),
          match ch.get("title").and_then(Value::as_str) {
            Some(x) => V::Text(x.to_owned()),
            None => V::Text(String::new()),
          },
          b(&ch["completed"]),
          match str(&ch["dueDate"]) { Some(x) => V::Text(x), None => V::Null },
        ]),
      )
      .map_err(db_err)?;
    position += 1;
  }
  position = 0;
  for r in references {
    conn
      .execute(
        "INSERT INTO thesis_reference (thesis_id, position, reference) VALUES (1, ?1, ?2)",
        params_from_iter([V::Integer(position), t(r.to_owned())]),
      )
      .map_err(db_err)?;
    position += 1;
  }
  Ok(())
}

fn save_sessions(conn: &Connection, value: &Value) -> Result<(), Error> {
  let items = as_array(value);
  conn.execute("DELETE FROM study_session", []).map_err(db_err)?;
  for s in &items {
    conn
      .execute(
        "INSERT INTO study_session (id, course_id, date, duration_minutes, data_json) VALUES (?1, ?2, ?3, ?4, ?5)",
        params_from_iter([
          t(id(s)),
          match str(&s["courseId"]) { Some(x) => V::Text(x), None => V::Null },
          match str(&s["date"]) { Some(x) => V::Text(x), None => V::Null },
          V::Integer(int(&s["durationMinutes"])),
          t(json(s)),
        ]),
      )
      .map_err(db_err)?;
  }
  let sess: Vec<(Option<String>, String)> =
    items.iter().map(|s| (str(&s["date"]), id(s))).collect();
  rebuild_activity_events(conn, "session", &sess)
}

fn save_loose_notes(conn: &Connection, value: &Value) -> Result<(), Error> {
  conn.execute("DELETE FROM note", []).map_err(db_err)?;
  conn.execute("DELETE FROM note_link", []).map_err(db_err)?;
  for n in as_array(value) {
    conn
      .execute(
        "INSERT INTO note (id, category, date, updated_at, course_id, data_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params_from_iter([
          t(id(n)),
          match str(&n["category"]) { Some(x) => V::Text(x), None => V::Null },
          match str(&n["date"]) { Some(x) => V::Text(x), None => V::Null },
          match str(&n["updatedAt"]) { Some(x) => V::Text(x), None => V::Null },
          match str(&n["courseId"]) { Some(x) => V::Text(x), None => V::Null },
          t(json(n)),
        ]),
      )
      .map_err(db_err)?;
    for (field, kind) in NOTE_LINK_KIND {
      for r in ref_ids(n, field) {
        conn
          .execute(
            "INSERT INTO note_link (note_id, kind, ref_id) VALUES (?1, ?2, ?3)",
            params_from_iter([t(id(n)), t(kind.to_owned()), t(r.to_owned())]),
          )
          .map_err(db_err)?;
      }
    }
  }
  Ok(())
}

fn save_quiz_sessions(conn: &Connection, value: &Value) -> Result<(), Error> {
  conn.execute("DELETE FROM quiz_session", []).map_err(db_err)?;
  conn.execute("DELETE FROM quiz_answer", []).map_err(db_err)?;
  for q in as_array(value) {
    conn
      .execute(
        "INSERT INTO quiz_session (id, created_at, started_at, finished_at, score_pct, correct_count, total_count, data_json) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params_from_iter([
          t(id(q)),
          match str(&q["createdAt"]) { Some(x) => V::Text(x), None => V::Null },
          match num(&q["startedAt"]) { Some(x) => V::Real(x), None => V::Null },
          match num(&q["finishedAt"]) { Some(x) => V::Real(x), None => V::Null },
          match num(&q["scorePct"]) { Some(x) => V::Real(x), None => V::Null },
          V::Integer(int(&q["correctCount"])),
          V::Integer(int(&q["totalCount"])),
          t(json(q)),
        ]),
      )
      .map_err(db_err)?;
    let answers_value = q.get("answers").cloned().unwrap_or(Value::Array(vec![]));
    let answers = as_array(&answers_value);
    for (position, a) in answers.into_iter().enumerate() {
      conn
        .execute(
          "INSERT INTO quiz_answer (quiz_session_id, position, question_id, correct, time_ms, data_json) \
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
          params_from_iter([
            t(id(q)),
            V::Integer(position as i64),
            match str(&a["questionId"]) { Some(x) => V::Text(x), None => V::Null },
            b(&a["correct"]),
            match num(&a["timeMs"]) { Some(x) => V::Real(x), None => V::Null },
            t(json(a)),
          ]),
        )
        .map_err(db_err)?;
    }
  }
  Ok(())
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
    "courses" => save_courses(conn, value),
    "classes" => save_classes(conn, value),
    "tasks" => save_tasks(conn, value),
    "exams" => save_exams(conn, value),
    "concepts" => save_concepts(conn, value),
    "readings" => save_readings(conn, value),
    "internshipLogs" => save_internship_logs(conn, value),
    "tcc" => save_tcc(conn, value),
    "sessions" => save_sessions(conn, value),
    "looseNotes" => save_loose_notes(conn, value),
    "quizSessions" => save_quiz_sessions(conn, value),
    "flashcards" => save_flashcards(conn, value),
    "materials" => save_materials(conn, value),
    "techniques" => save_techniques(conn, value),
    "supervision" => save_supervision(conn, value),
    "stickers" => save_stickers(conn, value),
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
