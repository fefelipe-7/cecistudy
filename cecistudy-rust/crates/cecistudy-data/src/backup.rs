//! Backup v2 (F1.15) — envelope `cecistudy-user-backup`.
//!
//! Porta de `packages/data/src/exportImport.ts` (para de coleções em
//! `persistentData.ts`/`backupSchema.ts` — ver espec: `contracts/backup-v2-spec.md`).
//!
//! Fatia F1.15 = **envelope**: construir (build), parsear (com migração de
//! schema quando `schemaVersion < atual`) e serializar em **Canonical JSON v1**
//! para paridade byte-a-byte com `contracts/golden/full_backup.*`.
//! A validação por coleção (Zod) será portada numa fatia seguinte (F1.x)
//! reutilizando este parse.
//!
//! ⚠️ Contrato duro: nunca comparar com `serde_json::to_string` — usar
//! [`BackupV2::to_canonical`].

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::migrations::{SCHEMA_VERSION, migrate};
use cecistudy_common::{Error, canonicalize};

/// `BACKUP_FORMAT` / `BACKUP_FORMAT_VERSION` / `USER_SCHEMA_VERSION` (TS).
pub const BACKUP_FORMAT: &str = "cecistudy-user-backup";
pub const BACKUP_FORMAT_VERSION: i64 = 1;
pub const BACKUP_USER_SCHEMA_VERSION: i64 = 1;

/// Envelope completo do backup v2 (campos em camelCase no JSON).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupV2 {
  pub format: String,
  pub format_version: i64,
  pub user_schema_version: i64,
  /// Presente desde v2; `None` = backup antigo (sem migração).
  pub schema_version: Option<i64>,
  /// Sempre `null` hoje (catálogo tem release próprio, não viaja no backup).
  pub catalog_release: Option<String>,
  pub exported_at: String,
  pub payload: Map<String, Value>,
}

impl BackupV2 {
  /// Serializa como **Canonical JSON v1** (chaves ordenadas, número ECMA).
  pub fn to_canonical(&self) -> String {
    canonicalize(&serde_json::to_value(self).expect("backup v2 serializa"))
  }
}

/// Monta o envelope a partir do payload de usuário (decisão de banco →
/// payload vive na camada de dados/repos).
pub fn build_backup(payload: Map<String, Value>, exported_at: String) -> BackupV2 {
  BackupV2 {
    format: BACKUP_FORMAT.to_owned(),
    format_version: BACKUP_FORMAT_VERSION,
    user_schema_version: BACKUP_USER_SCHEMA_VERSION,
    schema_version: Some(SCHEMA_VERSION as i64),
    catalog_release: None,
    exported_at,
    payload,
  }
}

/// Valida o envelope e devolve o backup com o payload **migrado** até a versão
/// atual. Rejeita formato/versão desconhecidos e backups de versão futura —
/// nunca devolve um banco parcial (a validação por coleção é fatia seguinte).
pub fn parse_backup(json: &str) -> Result<BackupV2, Error> {
  let value: Value =
    serde_json::from_str(json).map_err(|e| Error::Json(format!("JSON inválido: {}", e)))?;
  let obj =
    value.as_object().ok_or_else(|| Error::Validation("backup não é um objeto JSON".into()))?;

  let format = obj
    .get("format")
    .and_then(Value::as_str)
    .ok_or_else(|| Error::Validation("campo `format` ausente".into()))?;
  if format != BACKUP_FORMAT {
    return Err(Error::Validation(format!("formato `{format}` não é `{BACKUP_FORMAT}`")));
  }
  let format_version = obj
    .get("formatVersion")
    .and_then(Value::as_i64)
    .ok_or_else(|| Error::Validation("campo `formatVersion` ausente ou não-número".into()))?;
  if format_version != BACKUP_FORMAT_VERSION {
    return Err(Error::Validation(format!(
      "formatVersion {format_version} não suportado (esperado {BACKUP_FORMAT_VERSION})"
    )));
  }
  let payload_raw =
    obj.get("payload").ok_or_else(|| Error::Validation("campo `payload` ausente".into()))?;
  let mut payload = match payload_raw {
    Value::Object(m) => m.clone(),
    _ => return Err(Error::Validation("`payload` não é um objeto JSON".into())),
  };

  let schema_version = obj.get("schemaVersion").and_then(Value::as_i64);
  if let Some(v) = schema_version {
    if v > SCHEMA_VERSION as i64 {
      return Err(Error::Validation(format!(
        "backup de versão futura ({v} > {SCHEMA_VERSION}) — app desatualizado"
      )));
    }
    if v < SCHEMA_VERSION as i64 {
      let mut value = Value::Object(std::mem::take(&mut payload));
      migrate(&mut value, v as i32)?;
      payload = match value {
        Value::Object(m) => m,
        _ => unreachable!("migrate exige objeto"),
      };
    }
  }

  Ok(BackupV2 {
    format: format.to_owned(),
    format_version,
    user_schema_version: obj.get("userSchemaVersion").and_then(Value::as_i64).unwrap_or(0),
    schema_version,
    catalog_release: obj.get("catalogRelease").and_then(Value::as_str).map(String::from),
    exported_at: obj.get("exportedAt").and_then(Value::as_str).unwrap_or_default().to_owned(),
    payload,
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn build_monta_envelope_canonico() {
    let payload: Map<String, Value> = serde_json::from_str(r#"{"courses":[{"id":"c1"}]}"#).unwrap();
    let backup = build_backup(payload, "2026-09-10T12:00:00.000Z".to_owned());
    assert_eq!(&backup.format, BACKUP_FORMAT);
    assert_eq!(backup.schema_version, Some(SCHEMA_VERSION as i64));
    let raw = serde_json::to_value(&backup).unwrap();
    assert_eq!(raw["formatVersion"], 1);
    assert_eq!(raw["userSchemaVersion"], 1);
    assert_eq!(raw["catalogRelease"], Value::Null);
    assert_eq!(raw["payload"]["courses"][0]["id"], "c1");
  }

  #[test]
  fn parse_rejeita_formato_ou_versao_errados() {
    let bad_format = r#"{"format":"outro","formatVersion":1,"payload":{}}"#;
    assert!(parse_backup(bad_format).is_err());
    let bad_version = r#"{"format":"cecistudy-user-backup","formatVersion":2,"payload":{}}"#;
    assert!(parse_backup(bad_version).is_err());
    let json_invalido = "{nope";
    assert!(parse_backup(json_invalido).is_err());
  }

  #[test]
  fn parse_rejeita_versao_futura() {
    let future = format!(
      r#"{{"format":"cecistudy-user-backup","formatVersion":1,"schemaVersion":{},"payload":{{}}}}"#,
      SCHEMA_VERSION + 1
    );
    assert!(parse_backup(&future).is_err());
  }

  #[test]
  fn sem_schema_version_aceita_sem_migracao() {
    let old =
      r#"{"format":"cecistudy-user-backup","formatVersion":1,"payload":{"profile":{"name":"x"}}}"#;
    let parsed = parse_backup(old).unwrap();
    assert_eq!(parsed.schema_version, None);
    assert_eq!(parsed.payload["profile"]["name"], "x");
  }
}
