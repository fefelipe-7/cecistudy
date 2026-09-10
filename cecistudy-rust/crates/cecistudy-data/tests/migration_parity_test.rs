//! Replay das migrações TS (F1.13) contra `contracts/golden/migrations/`.
//!
//! As fixtures foram geradas pelo próprio TS (`migrateDatabase`); este teste
//! reaplica a cadeia 1→13 no Rust e compara arquivo a arquivo (canonical v1),
//! garantindo paridade byte a byte — incluindo os *quirks* do TS.

use std::fs;
use std::path::Path;

use cecistudy_common::canonicalize;
use cecistudy_data::migrations::{apply_step, migrate};
use serde_json::Value;

const MIGRATIONS_DIR: &str = "../../contracts/golden/migrations";

fn read_fixture(rel: &str) -> String {
  let p = Path::new(MIGRATIONS_DIR).join(rel);
  fs::read_to_string(&p)
    .unwrap_or_else(|e| panic!("fixture ausente {rel}: {e} — gere com MIGRATION_WRITE=1 no TS"))
    .trim()
    .to_owned()
}

#[test]
fn replay_1_a_13_bate_com_as_fixtures_do_ts() {
  let mut payload: Value =
    serde_json::from_str(&read_fixture("legacy_payload.v1.json")).expect("v1 válido");

  assert_eq!(canonicalize(&payload), read_fixture("legacy_payload.v1.json"), "v1 não deve mudar");

  for step in 2..=13 {
    apply_step(&mut payload, step).expect("migração roda");
    let expected = read_fixture(&format!("legacy_payload.v{step}.json"));
    assert_eq!(canonicalize(&payload), expected, "divergência no passo v{step}");
  }

  // Idempotência de `migrate` no topo: from=13 não aplica nada.
  let snapshot = canonicalize(&payload);
  for _ in 0..3 {
    migrate(&mut payload, 13).expect("replay v13 é estável");
    assert_eq!(canonicalize(&payload), snapshot);
  }
}

#[test]
fn versoes_desconhecidas_recusadas() {
  let mut a = json_payload();
  assert!(migrate(&mut a, 99).is_err());
  assert!(migrate(&mut a, 0).is_err());
}

fn json_payload() -> Value {
  serde_json::from_str(&read_fixture("legacy_payload.v1.json")).expect("v1 válido")
}
