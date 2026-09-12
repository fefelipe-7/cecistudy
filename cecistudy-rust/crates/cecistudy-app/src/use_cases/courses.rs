//! Casos de uso: disciplinas (coleção de registros `courses`).

use serde_json::{Map, Value};

use cecistudy_common::{Error, Result, make_id};
use cecistudy_data::{load_collection, save_collection, validate_payload};

use crate::App;

const KEY: &str = "courses";

impl App {
  /// Lista todas as disciplinas (ordem de inserção; vazio quando não há).
  pub fn list_courses(&self) -> Result<Vec<Value>> {
    Ok(as_array(
      load_collection(self.db.connection(), KEY)?.unwrap_or_else(|| Value::Array(vec![])),
    ))
  }

  /// Cria uma disciplina nova (id gerado se ausente) e grava a coleção.
  pub fn create_course(&self, course: &Value) -> Result<Value> {
    let mut course = course.clone();
    if course.get("id").and_then(Value::as_str).is_none_or(str::is_empty) {
      course["id"] = Value::String(make_id("c").to_string());
    }
    validate_one(&course)?;

    let mut items = self.list_courses()?;
    items.push(course.clone());
    save_collection(self.db.connection(), KEY, &Value::Array(items))?;
    Ok(course)
  }

  /// Atualiza a disciplina existente (upsert por id; erro se não existir).
  pub fn update_course(&self, course: &Value) -> Result<Value> {
    let id = course
      .get("id")
      .and_then(Value::as_str)
      .filter(|s| !s.is_empty())
      .ok_or_else(|| Error::Validation("disciplina sem id".into()))?;
    validate_one(course)?;

    let mut items = self.list_courses()?;
    let idx = items
      .iter()
      .position(|c| c.get("id").and_then(Value::as_str) == Some(id))
      .ok_or_else(|| Error::Validation("disciplina não encontrada para atualizar".into()))?;
    items[idx] = course.clone();
    save_collection(self.db.connection(), KEY, &Value::Array(items))?;
    Ok(course.clone())
  }

  /// Remove a disciplina (idempotente: ausente = ok).
  pub fn delete_course(&self, id: &str) -> Result<()> {
    let items: Vec<Value> = self
      .list_courses()?
      .into_iter()
      .filter(|c| c.get("id").and_then(Value::as_str) != Some(id))
      .collect();
    save_collection(self.db.connection(), KEY, &Value::Array(items))
  }
}

fn as_array(value: Value) -> Vec<Value> {
  value.as_array().cloned().unwrap_or_default()
}

fn validate_one(course: &Value) -> Result<()> {
  let mut payload: Map<String, Value> = Map::new();
  payload.insert(KEY.to_string(), Value::Array(vec![course.clone()]));
  validate_payload(&payload)
}

#[cfg(test)]
mod tests {
  use super::*;

  fn valid_course(id: &str) -> Value {
    serde_json::json!({
      "id": id,
      "name": "Teorias da Personalidade",
      "professor": "Profa. Helena",
      "semester": "6º Semestre",
      "color": "#D85F79",
      "icon": "Brain",
      "schedule": [{ "day": 2, "start": "08:00", "end": "09:40" }]
    })
  }

  #[test]
  fn criar_listar_e_ler() {
    let app = App::in_memory().unwrap();
    let created = app.create_course(&valid_course("")).unwrap();
    assert!(!created.get("id").unwrap().as_str().unwrap().is_empty());
    assert_eq!(app.list_courses().unwrap().len(), 1);
  }

  #[test]
  fn criar_valida_payload_imcompleto() {
    let app = App::in_memory().unwrap();
    let err = app.create_course(&serde_json::json!({ "id": "c9" })).unwrap_err();
    assert!(err.to_string().contains("course"));
  }

  #[test]
  fn atualizar_upsert_por_id() {
    let app = App::in_memory().unwrap();
    app.create_course(&valid_course("c1")).unwrap();
    let mut updated = valid_course("c1");
    updated["name"] = Value::String("Psicologia da Personalidade".into());
    app.update_course(&updated).unwrap();
    let all = app.list_courses().unwrap();
    assert_eq!(all[0].get("name").unwrap().as_str().unwrap(), "Psicologia da Personalidade");
    assert_eq!(all.len(), 1);
  }

  #[test]
  fn atualizar_exige_id() {
    let app = App::in_memory().unwrap();
    let err = app.update_course(&valid_course("")).unwrap_err();
    assert!(err.to_string().contains("id"));
  }

  #[test]
  fn deletar_idempotente() {
    let app = App::in_memory().unwrap();
    app.create_course(&valid_course("c1")).unwrap();
    app.delete_course("c1").unwrap();
    app.delete_course("c1").unwrap();
    assert!(app.list_courses().unwrap().is_empty());
  }
}
