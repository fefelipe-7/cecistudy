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
use cecistudy_data::{
  USER_COLLECTION_KEYS, UserDb, is_user_collection_key, load_all_collections, load_collection,
  save_collection,
};
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
fn courses_roundtrip() {
  roundtrip_case("courses");
}

#[test]
fn classes_roundtrip() {
  roundtrip_case("classes");
}

#[test]
fn tasks_roundtrip() {
  roundtrip_case("tasks");
}

#[test]
fn exams_roundtrip() {
  roundtrip_case("exams");
}

#[test]
fn concepts_roundtrip() {
  roundtrip_case("concepts");
}

#[test]
fn readings_roundtrip() {
  roundtrip_case("readings");
}

#[test]
fn internship_logs_roundtrip() {
  roundtrip_case("internshipLogs");
}

#[test]
fn tcc_roundtrip() {
  roundtrip_case("tcc");
}

#[test]
fn sessions_roundtrip() {
  roundtrip_case("sessions");
}

#[test]
fn loose_notes_roundtrip() {
  roundtrip_case("looseNotes");
}

#[test]
fn quiz_sessions_roundtrip() {
  roundtrip_case("quizSessions");
}

/// `supervision` está na base (tabela `supervision_notebook`) mas não sai no
/// payload/golden — roundtrip próprio (save → load == entidade gravada).
#[test]
fn supervision_roundtrip_proprio() {
  let db = UserDb::in_memory().unwrap();
  let conn = db.connection();
  let value = serde_json::json!([
    { "id": "sup-1", "date": "2026-09-10", "supervisor": "Maria", "notes": "ok", "verified": true }
  ]);
  save_collection(conn, "supervision", &value).unwrap();
  assert_eq!(load_collection(conn, "supervision").unwrap(), Some(value));
}

#[test]
fn load_all_cobre_as_22_colecoes() {
  let db = UserDb::in_memory().unwrap();
  let conn = db.connection();

  // Banco vazio: todas as chaves presentes, singletons/prefs = None.
  let all = load_all_collections(conn).unwrap();
  let keys: Vec<&str> = all.iter().map(|(k, _)| k.as_str()).collect();
  assert_eq!(keys.len(), 22, "precisamente as 22 chaves");
  for k in USER_COLLECTION_KEYS {
    assert!(keys.contains(k), "chave {k} faltando em load_all (obtidas: {keys:?})");
    assert!(is_user_collection_key(k));
  }

  // Após gravar alguns sample, o valor surge em load_all.
  let profile = serde_json::from_str::<Value>(golden("sample", "profile").trim()).unwrap();
  save_collection(conn, "profile", &profile).unwrap();
  let authors = serde_json::from_str::<Value>(golden("sample", "authors").trim()).unwrap();
  save_collection(conn, "authors", &authors).unwrap();

  let all = load_all_collections(conn).unwrap();
  let map: std::collections::HashMap<&str, &Option<Value>> =
    all.iter().map(|(k, v)| (k.as_str(), v)).collect();
  assert!(map["profile"].is_some());
  assert!(map["authors"].is_some());
  // Coleção array não gravada → `Some([])` (default branch do load TS).
  assert_eq!(map["courses"], &Some(serde_json::json!([])));
  assert!(map["tcc"].is_none(), "singleton tcc nunca gravado → None");
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
fn paridade_integrada_payload_sample() {
  // F1.16 nível DB: importa o payload sample inteiro (todas as coleções
  // com golden), regrava tudo num único banco e confere que `load_all`
  // reproduz cada fixture em canonical v1 (mesmo fluxo do nativo TS).
  let db = UserDb::in_memory().unwrap();
  let conn = db.connection();

  let mut gravadas = 0;
  let mut check_width: Option<usize> = None;
  for &key in USER_COLLECTION_KEYS {
    let path = Path::new(GOLDEN).join("sample").join(format!("{key}.json"));
    if !path.exists() {
      continue; // `supervision` não sai no payload/golden (teste próprio separado)
    }
    let raw = fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path:?}: {e}"));
    let value: Value = serde_json::from_str(raw.trim()).unwrap();
    save_collection(conn, key, &value).expect("save_collection do sample");
    gravadas += 1;
  }

  let all = load_all_collections(conn).unwrap();
  let mut carregadas = 0;
  for (key, loaded) in &all {
    let path = Path::new(GOLDEN).join("sample").join(format!("{key}.json"));
    if !path.exists() {
      continue;
    }
    let raw = fs::read_to_string(&path).unwrap();
    let loaded = loaded.as_ref().expect("coleção gravada deve recarregar");
    let mut canonical = canonicalize(loaded);
    canonical.push('\n');
    assert_eq!(canonical, raw, "paridade integrada divergente para `{key}`");
    carregadas += 1;
    check_width = check_width.or(Some(raw.len()));
  }

  // Todas as coleções com fixture passaram pelos dois fluxos.
  assert_eq!(gravadas, carregadas, "toda collection gravada deve ser recarregada e idêntica");
  assert!(gravadas >= 21, "esperava ~21 coleções com golden sample, obtive {gravadas}");
  assert!(check_width.is_some());
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

/// F1.16 — paridade integrada do payload: grava TODAS as coleções sample num
/// mesmo banco (join-tables e tudo) e reconstrói com `load_all_collections`;
/// cada coleção deve continuar byte-a-byte igual ao seu golden.
#[test]
fn payload_sample_integrado_reproducao_dos_fixtures() {
  let db = UserDb::in_memory().unwrap();
  let conn = db.connection();

  let mut gravadas = 0usize;
  for key in USER_COLLECTION_KEYS {
    let path = Path::new(GOLDEN).join("sample").join(format!("{key}.json"));
    if !path.exists() {
      continue; // supervision: só DB, sem golden/payload
    }
    let value: Value = serde_json::from_str(golden("sample", key).trim()).unwrap();
    save_collection(conn, key, &value).unwrap();
    gravadas += 1;
  }
  assert_eq!(gravadas, 21, "esperava 21 coleções golden gravadas (das 22 − supervision)");

  let all = load_all_collections(conn).unwrap();
  for (key, loaded) in &all {
    let path = Path::new(GOLDEN).join("sample").join(format!("{key}.json"));
    if !path.exists() {
      continue;
    }
    let loaded = loaded.as_ref().expect("coleção gravada presente no load_all");
    let mut canonical = canonicalize(loaded);
    canonical.push('\n');
    assert_eq!(canonical, golden("sample", key), "payload integrado divergiu em `{key}`");
  }
}
