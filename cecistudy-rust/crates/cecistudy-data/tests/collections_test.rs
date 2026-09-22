//! Fronteira tipada dos repositórios (R1b): as 22 coleções da base devem
//! mapear para as entidades de `cecistudy_domain::entity` sem perda (round-trip
//! tipificado ↔ canonical JSON v1 em memória e via banco).

use std::fs;
use std::path::Path;

use cecistudy_common::canonicalize;
use cecistudy_data::USER_COLLECTION_KEYS;
use cecistudy_data::collections::Collection;
use cecistudy_data::repositories::load_collection;
use cecistudy_data::UserDb;
use serde_json::Value;

const GOLDEN: &str = "../../contracts/golden/collections";

fn golden(label: &str, key: &str) -> String {
  fs::read_to_string(Path::new(GOLDEN).join(label).join(format!("{key}.json")))
    .unwrap_or_else(|e| panic!("fixture {label}/{key}.json: {e}"))
}

fn canon_with_newline(value: &Value) -> String {
  let mut canonical = canonicalize(value);
  canonical.push('\n');
  canonical
}

#[test]
fn colecoes_golden_mapeiam_para_entidades_tipadas() {
  let mut cobertas = 0usize;
  for key in USER_COLLECTION_KEYS {
    let path = Path::new(GOLDEN).join("sample").join(format!("{key}.json"));
    if !path.exists() {
      continue; // supervision: só DB, sem golden/payload
    }
    let raw = golden("sample", key);
    let value: Value = serde_json::from_str(raw.trim()).unwrap();

    let typed = Collection::from_value(key, value).unwrap_or_else(|e| panic!("{key}: {e}"));
    assert_eq!(typed.key(), *key, "key() do tipo diverge da chave da coleção");

    let back = typed.to_value();
    assert_eq!(
      canon_with_newline(&back),
      raw,
      "tipificado → canonical divergiu do golden para `{key}`"
    );
    cobertas += 1;
  }
  assert_eq!(cobertas, 21, "esperava 21 coleções golden tipadas (das 22 − supervision)");
}

#[test]
fn roundtrip_tipado_via_banco_preserva_canonical() {
  for key in USER_COLLECTION_KEYS {
    let path = Path::new(GOLDEN).join("sample").join(format!("{key}.json"));
    if !path.exists() {
      continue;
    }
    let raw = golden("sample", key);
    let value: Value = serde_json::from_str(raw.trim()).unwrap();
    let typed = Collection::from_value(key, value).unwrap();

    let db = UserDb::in_memory().unwrap();
    typed.save(db.connection()).unwrap();
    let loaded = Collection::load(db.connection(), key).unwrap().unwrap();
    assert_eq!(loaded, typed, "save/load tipado não é identidade para `{key}`");

    assert_eq!(
      canon_with_newline(&loaded.to_value()),
      raw,
      "round-trip tipado via banco divergiu do golden para `{key}`"
    );
  }
}

#[test]
fn supervision_tipado_roundtrip_proprio() {
  let db = UserDb::in_memory().unwrap();
  let typed = Collection::from_value(
    "supervision",
    serde_json::json!([
      { "id": "sup-1", "date": "2026-09-10", "supervisor": "Maria", "notes": "ok", "verified": true }
    ]),
  )
  .unwrap();

  typed.save(db.connection()).unwrap();
  let loaded = Collection::load(db.connection(), "supervision").unwrap().unwrap();
  assert_eq!(loaded, typed);
  assert_eq!(load_collection(db.connection(), "supervision").unwrap(), Some(typed.to_value()));
}

#[test]
fn semanticas_vazias_preservadas_na_fronteira() {
  let db = UserDb::in_memory().unwrap();

  // Singletons nunca gravados → None.
  assert_eq!(Collection::load(db.connection(), "profile").unwrap(), None);
  assert_eq!(Collection::load(db.connection(), "tcc").unwrap(), None);
  assert_eq!(Collection::load(db.connection(), "streakData").unwrap(), None);

  // Arrays com tabela vazia → coleção vazia tipada.
  let authors = Collection::load(db.connection(), "authors").unwrap().unwrap();
  assert_eq!(authors.to_value(), serde_json::json!([]));

  // Pref sem tabela (reminder/onboarding/syncIndex) → None.
  assert_eq!(Collection::load(db.connection(), "reminder").unwrap(), None);
  assert_eq!(Collection::load(db.connection(), "onboarding").unwrap(), None);

  // Chave desconhecida → None no load (espelho do engine). from_value rejeita.
  assert_eq!(Collection::load(db.connection(), "algumaColecaoExtra").unwrap(), None);
  assert!(Collection::from_value("algumaColecaoExtra", serde_json::json!({})).is_err());
}

#[test]
fn forma_invalida_e_rejeitada_na_deserializacao_tipada() {
  let err = Collection::from_value("profile", serde_json::json!("não-objeto")).unwrap_err();
  assert!(err.to_string().contains("profile"), "erro deve citar a coleção: {err}");
}
