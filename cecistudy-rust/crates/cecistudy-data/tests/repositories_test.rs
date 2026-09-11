//! Paridade dos repositórios (F1.14, slice A) contra as coleções golden.
//!
//! O teste grava a coleção `sample` no banco (via `save_collection`) e
//! reconstrói com `load_collection` — o resultado em canonical v1 deve ser
//! byte-a-byte igual ao fixture (mesmos bytes que o TS produz no nativo).
//!
//! Regenerar os arquivos: `GOLDEN_WRITE=1 npm run test -- src/lib/__tests__/goldenFixtures.test.ts`.

use std::fs;
use std::path::Path;

use cecistudy_common::canonicalize;
use cecistudy_data::{UserDb, load_collection, save_collection};
use serde_json::Value;

const GOLDEN: &str = "../../contracts/golden/collections";

fn golden(label: &str, key: &str) -> String {
  fs::read_to_string(Path::new(GOLDEN).join(label).join(format!("{key}.json")))
    .unwrap_or_else(|e| panic!("fixture {label}/{key}.json: {e}"))
}

fn roundtrip_case(key: &str) {
  let raw = golden("sample", key);
  let value: Value = serde_json::from_str(raw.trim()).unwrap();
  let db = UserDb::in_memory().unwrap();
  save_collection(db.connection(), key, &value).expect("save_collection não falha");
  let loaded =
    load_collection(db.connection(), key).unwrap().expect("coleção gravada deve retornar valor");

  let mut canonical = canonicalize(&loaded);
  canonical.push('\n');
  assert_eq!(canonical, raw, "round-trip divergente para `{key}`");
}

#[test]
fn perfil_roundtrip() {
  roundtrip_case("profile");
}

#[test]
fn autores_roundtrip() {
  roundtrip_case("authors");
}

#[test]
fn flashcards_roundtrip() {
  roundtrip_case("flashcards");
}

#[test]
fn materiais_roundtrip() {
  roundtrip_case("materials");
}

#[test]
fn tecnicas_roundtrip() {
  roundtrip_case("techniques");
}

#[test]
fn stickers_roundtrip() {
  roundtrip_case("stickers");
}

#[test]
fn saved_book_ids_roundtrip() {
  roundtrip_case("savedBookIds");
}

#[test]
fn bookmarked_course_ids_roundtrip() {
  roundtrip_case("bookmarkedCourseIds");
}

#[test]
fn reading_progress_roundtrip() {
  roundtrip_case("readingProgress");
}

#[test]
fn streak_data_roundtrip() {
  roundtrip_case("streakData");
}

#[test]
fn banco_vazio_semanticas_do_ts() {
  let db = UserDb::in_memory().unwrap();
  let conn = db.connection();

  // Singletons: `None` quando nunca gravados.
  assert_eq!(load_collection(conn, "profile").unwrap(), None);
  assert_eq!(load_collection(conn, "streakData").unwrap(), None);
  assert_eq!(load_collection(conn, "tcc").unwrap(), None);

  // Arrays de entidades: `Some([])` mesmo com a tabela vazia.
  assert_eq!(load_collection(conn, "authors").unwrap(), Some(serde_json::json!([])));
  assert_eq!(load_collection(conn, "courses").unwrap(), Some(serde_json::json!([])));

  // Record de progresso: `Some({})` mesmo vazio.
  assert_eq!(load_collection(conn, "readingProgress").unwrap(), Some(serde_json::json!({})));

  // Pref sem tabela (reminder/onboarding/syncIndex — F1.14b): `None`.
  assert_eq!(load_collection(conn, "reminder").unwrap(), None);
  assert_eq!(load_collection(conn, "onboarding").unwrap(), None);
}

#[test]
fn sobrescrita_substitui_colecao_inteira() {
  let db = UserDb::in_memory().unwrap();
  let conn = db.connection();

  save_collection(conn, "authors", &serde_json::json!([{ "id": "a1", "name": "primeiro" }]))
    .unwrap();
  save_collection(conn, "authors", &serde_json::json!([{ "id": "a2", "name": "segundo" }]))
    .unwrap();

  let loaded = load_collection(conn, "authors").unwrap().unwrap();
  assert_eq!(loaded, serde_json::json!([{ "id": "a2", "name": "segundo" }]));
}

#[test]
fn colecao_desconhecida_ignorada_sem_falhar() {
  let db = UserDb::in_memory().unwrap();
  save_collection(db.connection(), "algumaColecaoExtra", &serde_json::json!({ "x": 1 })).unwrap();
  assert_eq!(load_collection(db.connection(), "algumaColecaoExtra").unwrap(), None);
}
