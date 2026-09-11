//! Casos de uso: tarefas (coleção de registros `tasks`).

use serde_json::{Map, Value};

use cecistudy_common::{Error, Result, make_id};
use cecistudy_data::{load_collection, save_collection, validate_payload};

use crate::App;

const KEY: &str = "tasks";

impl App {
  /// Lista todas as tarefas (vazio quando não há).
  pub fn list_tasks(&self) -> Result<Vec<Value>> {
    Ok(as_array(
      load_collection(self.db.connection(), KEY)?.unwrap_or_else(|| Value::Array(vec![])),
    ))
  }

  /// Cria uma tarefa nova (id gerado se ausente) e grava a coleção.
  pub fn create_task(&self, task: &Value) -> Result<Value> {
    let mut task = task.clone();
    if task.get("id").and_then(Value::as_str).is_none_or(str::is_empty) {
      task["id"] = Value::String(make_id("t").to_string());
    }
    validate_one(&task)?;

    let mut items = self.list_tasks()?;
    items.push(task.clone());
    save_collection(self.db.connection(), KEY, &Value::Array(items))?;
    Ok(task)
  }

  /// Alterna o estado de conclusão de uma tarefa (erro se não existir).
  pub fn toggle_task(&self, id: &str) -> Result<Value> {
    let mut items = self.list_tasks()?;
    let task = items
      .iter_mut()
      .find(|t| t.get("id").and_then(Value::as_str) == Some(id))
      .ok_or_else(|| Error::Validation("tarefa não encontrada".into()))?;
    let done = task
      .get("completed")
      .and_then(Value::as_bool)
      .ok_or_else(|| Error::Validation("tarefa sem `completed`".into()))?;
    task["completed"] = Value::Bool(!done);
    save_collection(self.db.connection(), KEY, &Value::Array(items))?;
    load_collection(self.db.connection(), KEY)?
      .and_then(|v| v.as_array().cloned())
      .and_then(|arr| arr.into_iter().find(|t| t.get("id").and_then(Value::as_str) == Some(id)))
      .ok_or_else(|| Error::Validation("tarefa não encontrada após gravar".into()))
  }

  /// Remove a tarefa (idempotente: ausente = ok).
  pub fn delete_task(&self, id: &str) -> Result<()> {
    let items: Vec<Value> = self
      .list_tasks()?
      .into_iter()
      .filter(|t| t.get("id").and_then(Value::as_str) != Some(id))
      .collect();
    save_collection(self.db.connection(), KEY, &Value::Array(items))
  }
}

fn as_array(value: Value) -> Vec<Value> {
  value.as_array().cloned().unwrap_or_default()
}

fn validate_one(task: &Value) -> Result<()> {
  let mut payload: Map<String, Value> = Map::new();
  payload.insert(KEY.to_string(), Value::Array(vec![task.clone()]));
  validate_payload(&payload)
}
