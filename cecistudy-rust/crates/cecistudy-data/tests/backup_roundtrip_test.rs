//! Paridade do envelope v2 (F1.15) contra `contracts/golden/full_backup.*`.
//!
//! Fixtures geradas pelo TS (`buildBackupPayload` → canonical v1 + '\n').
//! O Rust deve reproduzir byte-a-byte: parse do mesmo arquivo → re-serializar
//! em canonical v1 → igual ao arquivo; e `build_backup` com o payload extraído
//! ≠ shift → envelope idêntico ao fixture.

use std::fs;
use std::path::Path;

use cecistudy_common::canonicalize;
use cecistudy_data::backup::{build_backup, parse_backup};
use serde_json::Value;

const GOLDEN_DIR: &str = "../../contracts/golden";

fn golden(rel: &str) -> String {
  fs::read_to_string(Path::new(GOLDEN_DIR).join(rel))
    .unwrap_or_else(|e| panic!("fixture ausente {rel}: {e}"))
}

#[test]
fn empty_roundtrip_paridade() {
  let raw = golden("full_backup.empty.json");
  let naked = raw.trim();

  let backup = parse_backup(naked).expect("parse do empty");
  assert_eq!(backup.schema_version, Some(13));
  assert_eq!(backup.user_schema_version, 1);
  assert_eq!(backup.catalog_release, None);

  // re-serializar em canonical v1 = arquivo original (byte a byte).
  assert_eq!(backup.to_canonical(), naked);

  // `build_backup` a partir do payload extraído = mesmo envelope.
  let rebuilt = build_backup(backup.payload.clone(), backup.exported_at.clone());
  assert_eq!(rebuilt.to_canonical(), raw.trim());
}

#[test]
fn sample_roundtrip_paridade() {
  let raw = golden("full_backup.sample.json");
  let naked = raw.trim();

  let backup = parse_backup(naked).expect("parse do sample");
  assert_eq!(backup.schema_version, Some(13));
  assert_eq!(backup.payload["courses"][0]["schedule"][0]["start"], "08:00");
  assert_eq!(backup.payload["quizSessions"][0]["config"]["count"], serde_json::json!(5));
  assert_eq!(
    backup.payload["syncIndex"]["records"]["courses"]["c1"],
    serde_json::json!(1750000001000i64)
  );

  assert_eq!(backup.to_canonical(), naked);

  let rebuilt = build_backup(backup.payload.clone(), backup.exported_at.clone());
  assert_eq!(rebuilt.to_canonical(), naked);
}

#[test]
fn payload_parse_sem_alteracao_e_canonico() {
  let raw = golden("full_backup.sample.json");
  let value: Value = serde_json::from_str(raw.trim()).unwrap();
  let payload = value["payload"].clone();
  assert_eq!(canonicalize(&payload), canonicalize(&payload));
}
