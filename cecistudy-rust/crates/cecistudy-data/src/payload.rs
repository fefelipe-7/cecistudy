//! Validação do payload por coleção (F1.15b) — porta do `backupSchema.ts` (Zod).
//!
//! Regras-fonte: `packages/data/src/backupSchema.ts` (+ invariantes da
//! `contracts/backup-v2-spec.md` §2/§2.1):
//! - coleção ausente → tolerada (default no merge);
//! - coleção presente com shape inválido → backup inteiro rejeitado (nunca parcial);
//! - campos extras passam intactos (`.passthrough()`), então checamos apenas os
//!   campos validados do Zod;
//! - `approaches`/`questions` jamais participam.
//!
//! Rejeita no PRIMEIRO erro (caminho funcional, ex. `courses[2].schedule[0].day`)
//! — o TS loga o flatten inteiro, mas ambos rejeitam o arquivo. Suficiente para o
//! roteiro de import: `parse_backup` → `validate_payload` → merge (F1.14).

use rusqlite::Connection;
use serde_json::{Map, Value};

use crate::backup::{BackupV2, parse_backup};
use crate::collections::Collection;
use crate::repositories::USER_COLLECTION_KEYS;
use cecistudy_common::Error;

type JsonMap = Map<String, Value>;

/// Payload tipificado pós-import (R1c): as coleções de usuário mapeadas para
/// [`Collection`] (forma verificada por serde) + as "prefs"/coleções extras
/// sem entidade tipada (`reminder`, `onboarding`, `syncIndex`, passthrough)
/// preservadas como `Value`.
#[derive(Debug, Clone, PartialEq)]
pub struct TypedPayload {
  pub collections: Vec<(String, Collection)>,
  pub prefs: JsonMap,
}

impl TypedPayload {
  /// Grava todas as coleções tipadas no banco (mesma semântica de regravação
  /// completa por coleção do `save_collection`).
  pub fn apply(&self, conn: &Connection) -> Result<(), Error> {
    for (_, collection) in &self.collections {
      collection.save(conn)?;
    }
    Ok(())
  }
}

/// Converte um payload **já validado** para a forma tipada: cada coleção de
/// `USER_COLLECTION_KEYS` presente vira [`Collection`]; o restante (prefs e
/// coleções extras do passthrough) fica em `prefs`.
pub fn typed_payload(payload: &JsonMap) -> Result<TypedPayload, Error> {
  let mut collections = Vec::with_capacity(USER_COLLECTION_KEYS.len());
  let mut prefs = JsonMap::new();
  for (key, value) in payload {
    if USER_COLLECTION_KEYS.contains(&key.as_str()) {
      collections.push((key.clone(), Collection::from_value(key, value.clone())?));
    } else {
      prefs.insert(key.clone(), value.clone());
    }
  }
  Ok(TypedPayload { collections, prefs })
}

/// Valida o payload (migrado) de um backup. `Ok(())` = aceito.
pub fn validate_payload(payload: &JsonMap) -> Result<(), Error> {
  let mut errors: Vec<String> = Vec::new();
  let mut check = |key: &str, items: Option<&Vec<Value>>| {
    let Some(items) = items else { return };
    for (i, item) in items.iter().enumerate() {
      if let Err(e) = f_for(key, item) {
        errors.push(format!("{key}[{i}]: {e}"));
      }
    }
  };

  if let Some(v) = payload.get("profile") {
    validate_obj(v, |m| {
      missing_str(m, &["name", "university", "targetCareer", "dailyQuote"])?;
      missing_num(m, &["semester", "totalSemesters", "stickersCollected"])
    })
    .map_err(Error::Validation)?;
  }

  check("courses", payload.get("courses").and_then(Value::as_array));
  check("classes", payload.get("classes").and_then(Value::as_array));
  check("tasks", payload.get("tasks").and_then(Value::as_array));
  check("exams", payload.get("exams").and_then(Value::as_array));
  check("authors", payload.get("authors").and_then(Value::as_array));
  check("concepts", payload.get("concepts").and_then(Value::as_array));
  check("readings", payload.get("readings").and_then(Value::as_array));
  check("flashcards", payload.get("flashcards").and_then(Value::as_array));
  check("materials", payload.get("materials").and_then(Value::as_array));
  check("internshipLogs", payload.get("internshipLogs").and_then(Value::as_array));
  check("supervision", payload.get("supervision").and_then(Value::as_array));
  check("stickers", payload.get("stickers").and_then(Value::as_array));
  check("sessions", payload.get("sessions").and_then(Value::as_array));
  check("looseNotes", payload.get("looseNotes").and_then(Value::as_array));
  check("techniques", payload.get("techniques").and_then(Value::as_array));
  check("quizSessions", payload.get("quizSessions").and_then(Value::as_array));

  if let Some(v) = payload.get("tcc") {
    validate_obj(v, validate_tcc).map_err(Error::Validation)?;
  }
  if let Some(v) = payload.get("streakData") {
    validate_obj(v, |m| str_array(m, "activeDays")).map_err(Error::Validation)?;
  }
  if let Some(v) = payload.get("reminder") {
    validate_obj(v, |m| {
      missing_str(m, &["time"])?;
      if !m.get("enabled").is_some_and(Value::is_boolean) {
        return Err("`enabled` ausente ou não-booleano".to_owned());
      }
      Ok(())
    })
    .map_err(Error::Validation)?;
  }
  if let Some(v) = payload.get("onboarding") {
    validate_obj(v, |m| {
      if !m.get("completed").is_some_and(Value::is_boolean) {
        return Err("`completed` ausente ou não-booleano".to_owned());
      }
      Ok(())
    })
    .map_err(Error::Validation)?;
  }
  if let Some(v) = payload.get("syncIndex") {
    validate_obj(v, validate_sync_index).map_err(Error::Validation)?;
  }
  if let Some(v) = payload.get("readingProgress")
    && !v.as_object().is_some_and(|m| m.values().all(Value::is_number))
  {
    errors.push("readingProgress: deve ser record<string, number>".to_owned());
  }
  for key in ["savedBookIds", "bookmarkedCourseIds"] {
    if let Some(v) = payload.get(key)
      && !v.as_array().is_some_and(|a| a.iter().all(Value::is_string))
    {
      errors.push(format!("{key}: deve ser array de strings"));
    }
  }

  if let Some(e) = errors.first() {
    return Err(Error::Validation(format!("backup inválido: {e}")));
  }
  Ok(())
}

/// Importa um backup validando tudo (equivalente ao fim de `importAppDatabase`).
/// Devolve o payload migrado e validado — o merge com defaults de banco vazio
/// e a aplicação ao SQLite são responsabilidade dos repositórios (F1.14).
pub fn import_backup(json: &str) -> Result<JsonMap, Error> {
  let backup: BackupV2 = parse_backup(json)?;
  validate_payload(&backup.payload)?;
  Ok(backup.payload)
}

/// Importa validando e devolve o payload **tipado** (R1c): as coleções de
/// usuário como [`Collection`], prontas para `TypedPayload::apply`.
pub fn import_backup_typed(json: &str) -> Result<TypedPayload, Error> {
  typed_payload(&import_backup(json)?)
}

fn f_for(key: &str, item: &Value) -> Result<(), String> {
  match key {
    "courses" => validate_obj(item, validate_course),
    "classes" => validate_obj(item, |m| {
      missing_str(m, &["id", "courseId", "title", "date", "summary"])?;
      if !m.get("number").is_some_and(Value::is_number) {
        return Err("`number` ausente ou não-número".to_owned());
      }
      Ok(())
    }),
    "tasks" => validate_obj(item, |m| {
      missing_str(m, &["id", "title"])?;
      if !m.get("completed").is_some_and(Value::is_boolean) {
        return Err("`completed` ausente ou não-booleano".to_owned());
      }
      enum_in(m.get("priority"), &["alta", "media", "baixa"], "priority")?;
      enum_in(
        m.get("category"),
        &["leitura", "trabalho", "revisao", "estagio", "outro"],
        "category",
      )
    }),
    "exams" => validate_obj(item, |m| {
      missing_str(m, &["id", "courseId", "title", "date", "weight"])?;
      str_array(m, "topics")?;
      if !m.get("completed").is_some_and(Value::is_boolean) {
        return Err("`completed` ausente ou não-booleano".to_owned());
      }
      Ok(())
    }),
    "authors" => validate_obj(item, |m| missing_str(m, &["id", "name", "bio"])),
    "concepts" => validate_obj(item, |m| {
      missing_str(m, &["id", "name", "definition"])?;
      str_array(m, "authorIds")?;
      str_array(m, "courseIds")?;
      str_array(m, "tags")
    }),
    "readings" => validate_obj(item, |m| {
      missing_str(m, &["id", "title", "author"])?;
      enum_in(m.get("type"), &["livro", "artigo", "capitulo", "pdf"], "type")?;
      enum_in(m.get("status"), &["nao_iniciado", "lendo", "concluido"], "status")
    }),
    "flashcards" => validate_obj(item, |m| missing_str(m, &["id", "question", "answer"])),
    "materials" => validate_obj(item, |m| {
      missing_str(m, &["id", "title", "author", "addedAt"])?;
      str_array(m, "tags")?;
      enum_in(m.get("type"), &["artigo", "livro", "pdf", "link", "slides"], "type")
    }),
    "internshipLogs" => validate_obj(item, |m| {
      missing_str(m, &["id", "type", "date", "activity", "reflections"])?;
      if !m.get("hours").is_some_and(Value::is_number) {
        return Err("`hours` ausente ou não-número".to_owned());
      }
      Ok(())
    }),
    "supervision" => validate_obj(item, |m| {
      missing_str(m, &["id", "date"])?;
      str_array(m, "questions")?;
      str_array(m, "conceptIds")?;
      str_array(m, "referenceIds")?;
      str_array(m, "nextSteps")
    }),
    "stickers" => validate_obj(item, |m| {
      missing_str(m, &["id", "name", "emoji", "description"])?;
      if !m.get("unlocked").is_some_and(Value::is_boolean) {
        return Err("`unlocked` ausente ou não-booleano".to_owned());
      }
      enum_in(m.get("category"), &["faculdade", "estudo", "leituras", "jornada"], "category")
    }),
    "sessions" => validate_obj(item, |m| {
      missing_str(m, &["id", "topic", "date"])?;
      if !m.get("durationMinutes").is_some_and(Value::is_number) {
        return Err("`durationMinutes` ausente ou não-número".to_owned());
      }
      Ok(())
    }),
    "looseNotes" => validate_obj(item, |m| {
      missing_str(m, &["id", "title", "content", "date"])?;
      enum_in(m.get("category"), &["reflexão", "estudo", "ideia", "lembrete"], "category")
    }),
    "techniques" => validate_obj(item, |m| missing_str(m, &["id", "name", "description"])),
    "quizSessions" => validate_quiz_session(item),
    other => Err(format!("coleção `{other}` não é array de entidades")),
  }
}

fn validate_course(m: &JsonMap) -> Result<(), String> {
  missing_str(m, &["id", "name", "professor", "semester", "color", "icon"])?;
  if let Some(schedule) = m.get("schedule").and_then(Value::as_array) {
    for (i, slot) in schedule.iter().enumerate() {
      let slot_err = validate_obj(slot, |sm| {
        match sm.get("day") {
          Some(Value::Number(n)) if n.as_i64().is_some_and(|d| (0..=6).contains(&d)) => {}
          _ => return Err("`day` ausente ou fora de 0–6".to_owned()),
        }
        if !sm.get("start").is_some_and(Value::is_string) {
          return Err("`start` ausente ou não-string".to_owned());
        }
        if let Some(end) = sm.get("end")
          && !end.is_string()
        {
          return Err("`end` não-string".to_owned());
        }
        Ok(())
      });
      if let Err(e) = slot_err {
        return Err(format!("schedule[{i}]: {e}"));
      }
    }
  }
  Ok(())
}

fn validate_tcc(m: &JsonMap) -> Result<(), String> {
  missing_str(m, &["title", "advisor", "field", "problemStatement"])?;
  str_array(m, "objectives")?;
  str_array(m, "references")?;
  enum_in(m.get("status"), &["em_andamento", "revisao", "concluido"], "status")?;
  if let Some(chapters) = m.get("chapters").and_then(Value::as_array) {
    for (i, ch) in chapters.iter().enumerate() {
      let err = validate_obj(ch, |cm| {
        missing_str(cm, &["title"])?;
        if !cm.get("completed").is_some_and(Value::is_boolean) {
          return Err("`completed` ausente ou não-booleano".to_owned());
        }
        Ok(())
      });
      if let Err(e) = err {
        return Err(format!("chapters[{i}]: {e}"));
      }
    }
  }
  Ok(())
}

fn validate_sync_index(m: &JsonMap) -> Result<(), String> {
  if let Some(stamps) = m.get("stamps")
    && !as_num_map(stamps)
  {
    return Err("`stamps` deve ser record<string, number>".to_owned());
  }
  for key in ["records", "tombstones"] {
    if let Some(Value::Object(inner)) = m.get(key) {
      for (k, v) in inner {
        if !v.as_object().is_some_and(as_num_map_inner) {
          return Err(format!("`{key}.{k}` deve ser record<string, number>"));
        }
      }
    } else if m.contains_key(key) {
      return Err(format!("`{key}` deve ser um objeto"));
    }
  }
  Ok(())
}

fn as_num_map(v: &Value) -> bool {
  v.as_object().is_some_and(as_num_map_inner)
}

fn as_num_map_inner(m: &JsonMap) -> bool {
  m.values().all(Value::is_number)
}

fn validate_quiz_session(v: &Value) -> Result<(), String> {
  validate_obj(v, |m| {
    missing_str(m, &["id", "createdAt"])?;
    for k in ["startedAt", "finishedAt", "totalTimeMs", "correctCount", "totalCount", "scorePct"] {
      if !m.get(k).is_some_and(Value::is_number) {
        return Err(format!("`{k}` ausente ou não-número"));
      }
    }
    if let Some(config) = m.get("config") {
      validate_obj(config, |cm| {
        str_array(cm, "areas")?;
        str_array(cm, "temas")?;
        str_array(cm, "escolas")?;
        if !cm.get("count").is_some_and(Value::is_number) {
          return Err("`count` ausente ou não-número".to_owned());
        }
        if let Some(ds) = cm.get("dificuldades").and_then(Value::as_array) {
          for (i, d) in ds.iter().enumerate() {
            let ok =
              d.as_str().is_some_and(|s| ["basica", "intermediaria", "avancada"].contains(&s));
            if !ok {
              return Err(format!("dificuldades[{i}] inválido"));
            }
          }
        }
        Ok(())
      })?;
    }
    if let Some(answers) = m.get("answers").and_then(Value::as_array) {
      for (i, a) in answers.iter().enumerate() {
        let err = validate_obj(a, |am| {
          missing_str(am, &["questionId", "userAnswer"])?;
          if !am.get("correct").is_some_and(Value::is_boolean) {
            return Err("`correct` ausente ou não-booleano".to_owned());
          }
          if !am.get("timeMs").is_some_and(Value::is_number) {
            return Err("`timeMs` ausente ou não-número".to_owned());
          }
          if let Some(q) = am.get("question") {
            validate_obj(q, |qm| missing_str(qm, &["id", "question", "answer"]))?;
          }
          Ok(())
        });
        if let Err(e) = err {
          return Err(format!("answers[{i}]: {e}"));
        }
      }
    }
    Ok(())
  })
}

fn validate_obj(v: &Value, f: impl FnOnce(&JsonMap) -> Result<(), String>) -> Result<(), String> {
  let m = v.as_object().ok_or_else(|| "não é um objeto JSON".to_owned())?;
  f(m)
}

fn missing_str(m: &JsonMap, keys: &[&str]) -> Result<(), String> {
  for k in keys {
    if !m.get(*k).is_some_and(Value::is_string) {
      return Err(format!("`{k}` ausente ou não-string"));
    }
  }
  Ok(())
}

fn missing_num(m: &JsonMap, keys: &[&str]) -> Result<(), String> {
  for k in keys {
    if !m.get(*k).is_some_and(Value::is_number) {
      return Err(format!("`{k}` ausente ou não-número"));
    }
  }
  Ok(())
}

fn str_array(m: &JsonMap, key: &str) -> Result<(), String> {
  if !m.get(key).and_then(Value::as_array).is_some_and(|a| a.iter().all(Value::is_string)) {
    return Err(format!("`{key}` deve ser array de strings"));
  }
  Ok(())
}

fn enum_in(v: Option<&Value>, allowed: &[&str], name: &str) -> Result<(), String> {
  match v.and_then(Value::as_str) {
    Some(s) if allowed.contains(&s) => Ok(()),
    Some(_) => Err(format!("`{name}` com valor não permitido")),
    None => Err(format!("`{name}` ausente ou não-string")),
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use cecistudy_common::canonicalize;

  fn read_sample_payload() -> JsonMap {
    let raw = std::fs::read_to_string("../../contracts/golden/full_backup.sample.json").unwrap();
    serde_json::from_str::<Value>(raw.trim()).unwrap()["payload"].as_object().unwrap().clone()
  }

  #[test]
  fn aceita_payload_vazio() {
    assert!(validate_payload(&Map::new()).is_ok());
  }

  #[test]
  fn rejeita_curso_com_schedule_invalido() {
    let p: JsonMap = serde_json::from_str(
      r##"{"courses":[{"id":"c1","name":"x","professor":"p","semester":"1","color":"#fff","icon":"Brain","schedule":[{"day":9,"start":"08:00"}]}]}"##,
    )
    .unwrap();
    let err = validate_payload(&p).unwrap_err().to_string();
    assert!(err.contains("courses[0]"), "{err}");
    assert!(err.contains("day"), "{err}");
  }

  #[test]
  fn rejeita_tarefa_com_prioridade_invalida() {
    let p: JsonMap = serde_json::from_str(
      r#"{"tasks":[{"id":"t1","title":"x","completed":false,"priority":"urgente","category":"leitura"}]}"#,
    )
    .unwrap();
    assert!(validate_payload(&p).is_err());
  }

  #[test]
  fn rejeita_sync_index_malformado() {
    let p: JsonMap =
      serde_json::from_str(r#"{"syncIndex":{"records":{"classes":{"cl-1":"não-número"}}}}"#)
        .unwrap();
    assert!(validate_payload(&p).is_err());
  }

  #[test]
  fn aceita_colecao_extra_passthrough() {
    let p: JsonMap =
      serde_json::from_str(r#"{"savedBookIds":["bk-1"],"unknownCollection":{"sonho":"miguel"}}"#)
        .unwrap();
    assert!(validate_payload(&p).is_ok());
  }

  #[test]
  fn import_backup_aceita_sample() {
    let raw = std::fs::read_to_string("../../contracts/golden/full_backup.sample.json").unwrap();
    let payload = import_backup(raw.trim()).unwrap();
    assert!(payload.contains_key("courses"));
    assert!(!payload.contains_key("approaches"));
    assert!(!payload.contains_key("questions"));
  }

  #[test]
  fn sample_atende_todo_o_schema() {
    let p = read_sample_payload();
    assert!(validate_payload(&p).is_ok(), "sample deve ser válido");
  }

  #[test]
  fn import_backup_typed_mapeia_todas_as_colecoes_usuario() {
    let raw = std::fs::read_to_string("../../contracts/golden/full_backup.sample.json").unwrap();
    let root: Value = serde_json::from_str(raw.trim()).unwrap();
    let payload = root["payload"].as_object().unwrap();

    let typed = import_backup_typed(raw.trim()).unwrap();
    // Todas as coleções com golden viram Collection (21 de 22; supervision não sai no payload).
    assert_eq!(typed.collections.len(), 21, "esperava 21 coleções tipadas");
    for (key, collection) in &typed.collections {
      assert!(USER_COLLECTION_KEYS.contains(&key.as_str()), "{key} não é coleção de usuário");
      let raw_value = payload.clone().get(key.as_str()).cloned().unwrap();
      assert_eq!(
        canonicalize(&collection.to_value()),
        canonicalize(&raw_value),
        "canonical divergiu no payload tipado para `{key}`"
      );
    }
    assert!(typed.prefs.keys().all(|k| !USER_COLLECTION_KEYS.contains(&k.as_str())));
  }

  #[test]
  fn typed_payload_preserva_prefs_e_passthrough() {
    let p: JsonMap = serde_json::from_str(
      r#"{"profile":{"name":"Maite","semester":6,"totalSemesters":8,"university":"USP","targetCareer":"clínica","dailyQuote":"ok","stickersCollected":0},"reminder":{"enabled":true,"time":"08:00"},"onboarding":{"completed":true},"syncIndex":{"stamps":{}},"unknownCollection":{"sonho":"miguel"}}"#,
    )
    .unwrap();
    let typed = typed_payload(&p).unwrap();
    assert_eq!(typed.collections.len(), 1);
    assert_eq!(typed.collections[0].0, "profile");
    for k in ["reminder", "onboarding", "syncIndex", "unknownCollection"] {
      assert!(typed.prefs.contains_key(k), "pref/passthrough {k} sumiu");
    }
  }

  #[test]
  fn typed_payload_apply_grava_em_banco() {
    use crate::UserDb;
    let raw = std::fs::read_to_string("../../contracts/golden/full_backup.sample.json").unwrap();
    let typed = import_backup_typed(raw.trim()).unwrap();
    let db = UserDb::in_memory().unwrap();

    // Aplica um subconjunto (courses + readings) e reconstrói tipado do banco.
    let subset: Vec<(String, crate::Collection)> = typed
      .collections
      .iter()
      .filter(|(k, _)| matches!(k.as_str(), "courses" | "readings"))
      .cloned()
      .collect();
    for (_, collection) in &subset {
      collection.save(db.connection()).unwrap();
    }
    for (key, expected) in &subset {
      let loaded = crate::Collection::load(db.connection(), key).unwrap().unwrap();
      assert_eq!(loaded.to_value(), expected.to_value(), "aplicação tipada divergiu em {key}");
    }
  }
}
