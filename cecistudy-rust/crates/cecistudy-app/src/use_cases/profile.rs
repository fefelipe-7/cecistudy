//! Casos de uso do perfil do usuário (porta de `packages/application`).

use serde_json::{Map, Value};

use cecistudy_common::Result;
use cecistudy_data::{load_collection, save_collection, validate_payload};

use crate::App;

const KEY: &str = "profile";

/// Devolve o perfil do usuário (ou `None` se não foi criado).
pub fn get_profile(app: &App) -> Result<Option<Value>> {
  load_collection(app.db.connection(), KEY)
}

/// Cria/substitui o perfil do usuário (valida a entidade antes de gravar).
pub fn update_profile(app: &App, profile: &Value) -> Result<()> {
  let mut payload = Map::new();
  payload.insert(KEY.to_string(), profile.clone());
  validate_payload(&payload)?;
  save_collection(app.db.connection(), KEY, profile)
}

impl App {
  /// Devolve o perfil do usuário (ou `None` se não foi criado).
  pub fn get_profile(&self) -> Result<Option<Value>> {
    get_profile(self)
  }

  /// Cria/substitui o perfil do usuário (valida a entidade antes de gravar).
  pub fn update_profile(&self, profile: &Value) -> Result<()> {
    update_profile(self, profile)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn aceita_e_devolve_o_perfil() {
    let app = App::in_memory().unwrap();
    assert!(app.get_profile().unwrap().is_none());

    let profile = serde_json::json!({
      "name": "Ceci",
      "university": "UNESP",
      "targetCareer": "psicóloga clínica",
      "dailyQuote": "bora estudar?",
      "semester": 6,
      "totalSemesters": 10,
      "stickersCollected": 0
    });
    app.update_profile(&profile).unwrap();
    let got = app.get_profile().unwrap().unwrap();
    assert_eq!(got.get("name").unwrap().as_str().unwrap(), "Ceci");
  }

  #[test]
  fn rejeita_perfil_incompleto() {
    let app = App::in_memory().unwrap();
    let err = app.update_profile(&serde_json::json!({ "name": "Ceci" })).unwrap_err();
    assert!(!err.to_string().is_empty());
  }
}
