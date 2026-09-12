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

#[cfg(test)]
mod tests {
  use super::*;
  use cecistudy_data::{load_collection, save_collection};

  #[test]
  fn export_import_roundtrip_preserva_colecoes() {
    let app = App::in_memory().unwrap();
    save_collection(
      app.db.connection(),
      "courses",
      &serde_json::json!([
        { "id": "c1", "name": "Teorias da Personalidade", "professor": "x", "semester": "6º", "color": "#D85F79", "icon": "Brain", "schedule": [{ "day": 2, "start": "08:00" }] }
      ]),
    )
    .unwrap();
    save_collection(app.db.connection(), "profile", &serde_json::json!({
      "name": "Ceci", "university": "U", "targetCareer": "psi", "dailyQuote": "bora", "semester": 6, "totalSemesters": 10, "stickersCollected": 0
    })).unwrap();

    let json = app.export_backup().unwrap();
    assert!(json.contains("cecistudy-user-backup"));

    let fresh = App::in_memory().unwrap();
    assert!(fresh.get_profile().unwrap().is_none());
    fresh.import_backup(&json).unwrap();
    let courses = load_collection(fresh.db.connection(), "courses").unwrap().unwrap();
    assert_eq!(courses.as_array().unwrap()[0].get("id").unwrap(), "c1");
  }

  #[test]
  fn import_ignora_colecoes_nao_de_usuario() {
    let app = App::in_memory().unwrap();
    let payload = serde_json::json!({
      "approaches": [{ "id": "app-1", "name": "Psicanálise" }],
      "courses": []
    });
    let backup = cecistudy_data::build_backup(
      payload.as_object().unwrap().clone(),
      "2026-09-10T12:00:00.000Z".into(),
    );
    app.import_backup(&backup.to_canonical()).unwrap();
    // escolha por não ser coleção de usuário: approaches NÃO foi gravada.
    assert!(load_collection(app.db.connection(), "approaches").unwrap().is_none());
  }

  #[test]
  fn importa_o_fixture_dourado_de_contrato() {
    let fixture =
      concat!(env!("CARGO_MANIFEST_DIR"), "/../../contracts/golden/full_backup.sample.json");
    let json = std::fs::read_to_string(fixture).unwrap();

    let app = App::in_memory().unwrap();
    app.import_backup(&json).unwrap();

    let courses = load_collection(app.db.connection(), "courses").unwrap().unwrap();
    assert_eq!(courses.as_array().unwrap().len(), 2);
    let profile = load_collection(app.db.connection(), "profile").unwrap().unwrap();
    assert_eq!(profile.get("name").unwrap().as_str().unwrap(), "Maite");
  }
}
