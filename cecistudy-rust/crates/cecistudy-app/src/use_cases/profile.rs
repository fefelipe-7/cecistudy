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
