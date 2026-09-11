//! Casos de uso: backup (exportação/importação do envelope v2).

use serde_json::{Map, Value};

use cecistudy_common::{Result, iso_now_ms};
use cecistudy_data::{
  build_backup, import_backup, is_user_collection_key, load_all_collections, save_collection,
};

use crate::App;

impl App {
  /// Exporta o backup canônico (payload das coleções presentes + envelope v2).
  pub fn export_backup(&self) -> Result<String> {
    let payload = present_collections(self)?;
    let backup = build_backup(payload, iso_now_ms());
    Ok(backup.to_canonical())
  }

  /// Importa um backup: migra + valida + mescla e grava só as coleções de
  /// usuário persistidas (prefs/estáticos: `reminder`, `onboarding`,
  /// `syncIndex`, `approaches`, `questions` ficam fora — regra F1.15b).
  pub fn import_backup(&self, json: &str) -> Result<()> {
    let payload = import_backup(json)?;
    for (key, value) in payload {
      if is_user_collection_key(&key) {
        save_collection(self.db.connection(), &key, &value)?;
      }
    }
    Ok(())
  }
}

fn present_collections(app: &App) -> Result<Map<String, Value>> {
  let mut payload = Map::new();
  for (key, value) in load_all_collections(app.db.connection())? {
    if let Some(value) = value {
      payload.insert(key, value);
    }
  }
  Ok(payload)
}
