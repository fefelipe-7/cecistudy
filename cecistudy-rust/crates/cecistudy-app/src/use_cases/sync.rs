//! Casos de uso: sincronização push/pull com provider injetado (porta do
//! `engine.ts`, sem persistência de `syncIndex` no banco — checkpoint fica na
//! memória/FFI até a F1.14b).

use std::fmt;

use serde_json::{Map, Value};

use cecistudy_common::{Error, Result, canonicalize, iso_now_ms};
use cecistudy_data::{
  SCHEMA_VERSION, is_user_collection_key, load_all_collections, save_collection,
};
use cecistudy_sync::{
  MergeResult, SYNC_PROTOCOL_VERSION, SyncManifest, SyncPackage, SyncProvider, SyncProviderError,
  SyncProviderErrorKind, UploadResult, empty_sync_index, hash_content, merge_synced_databases,
};

use crate::App;

/// Checkpoint de sincronização (estado externo ao banco; o FFI guarda).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncCheckpoint {
  /// Revisão base do último pacote que este dispositivo viu/acessou.
  pub base_revision: u32,
  /// SHA do blob remoto conhecido (base para o CAS no próximo upload).
  pub base_blob_sha: Option<String>,
  /// Timestamp do último sync.
  pub last_sync_at: Option<String>,
  /// Dispositivo do último sync.
  pub last_device_id: Option<String>,
  /// Máximo carimbo local conhecido (usado no merge LWW).
  pub last_local_max_stamp: u64,
}

pub const INITIAL_CHECKPOINT: SyncCheckpoint = SyncCheckpoint {
  base_revision: 0,
  base_blob_sha: None,
  last_sync_at: None,
  last_device_id: None,
  last_local_max_stamp: 0,
};

/// Dependências do motor de sync (device_id + versão do app no manifesto).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncEngineDeps {
  pub device_id: String,
  pub app_version: String,
}

/// Erro dos casos de uso de sync (banco local OU provider de transporte).
#[derive(Debug, thiserror::Error)]
pub enum SyncUseCaseError {
  #[error("banco local: {0}")]
  Db(#[from] Error),
  #[error("provedor de sync: {0}")]
  Provider(#[from] SyncProviderError),
}

/// Resultado do push: novo checkpoint + revisão/sha ackados pelo provider.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncPushOutcome {
  pub sha: String,
  pub revision: u32,
  pub checkpoint: SyncCheckpoint,
}

/// Resultado do pull: prévia do merge + manifesto/sha remotos recebidos.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncPullOutcome {
  pub preview: SyncPreview,
  pub remote_manifest: SyncManifest,
  pub remote_sha: String,
}

/// Prévia do que cada lado ganha/perde com o merge (visão agregada).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SyncPreview {
  pub added: usize,
  pub updated: usize,
  pub removed: usize,
}

impl App {
  /// Snapshot syncável = coleções presentes + `syncIndex` vazio.
  pub fn syncable_snapshot(&self) -> Result<Value> {
    let mut syncable = Map::new();
    for (key, value) in load_all_collections(self.db.connection())? {
      if let Some(value) = value {
        syncable.insert(key, value);
      }
    }
    syncable.insert(
      "syncIndex".to_owned(),
      serde_json::to_value(empty_sync_index()).map_err(Error::json)?,
    );
    Ok(Value::Object(syncable))
  }

  /// Empurra a base local para o provider (CAS via `base_blob_sha`).
  pub fn sync_push(
    &self,
    provider: &dyn SyncProvider,
    deps: &SyncEngineDeps,
    checkpoint: &SyncCheckpoint,
  ) -> std::result::Result<SyncPushOutcome, SyncUseCaseError> {
    let local_snapshot = self.syncable_snapshot()?;
    let canonical_local = canonicalize(&local_snapshot);
    let revision = checkpoint.base_revision + 1;

    let manifest = SyncManifest {
      schema_version: SCHEMA_VERSION as u32,
      protocol_version: SYNC_PROTOCOL_VERSION,
      app_version: deps.app_version.clone(),
      revision,
      device_id: deps.device_id.clone(),
      workspace_scope: "default".to_owned(),
      parent_revision: Some(checkpoint.base_revision),
      content_hash: hash_content(&canonical_local),
      created_at: iso_now_ms(),
    };
    let pkg = SyncPackage { manifest, snapshot: local_snapshot };
    let result = provider.upload_package(&pkg, checkpoint.base_blob_sha.as_deref())?;

    Ok(SyncPushOutcome {
      sha: result.sha.clone(),
      revision: result.revision,
      checkpoint: next_checkpoint(&result, deps),
    })
  }

  /// Puxa o pacote remoto, faz o merge LWW e grava as coleções mescladas.
  pub fn sync_pull(
    &self,
    provider: &dyn SyncProvider,
  ) -> std::result::Result<SyncPullOutcome, SyncUseCaseError> {
    let remote = provider.download_package()?.ok_or_else(|| {
      SyncProviderError::new(SyncProviderErrorKind::NotFound, "nenhum pacote remoto")
    })?;
    let local_snapshot = self.syncable_snapshot()?;

    let MergeResult { merged, local, remote: remote_side } =
      merge_synced_databases(&local_snapshot, &remote.package.snapshot);

    apply_merged(self, &merged)?;

    Ok(SyncPullOutcome {
      preview: SyncPreview {
        added: local.added + remote_side.added,
        updated: local.updated + remote_side.updated,
        removed: local.removed + remote_side.removed,
      },
      remote_manifest: remote.package.manifest.clone(),
      remote_sha: remote.sha.clone(),
    })
  }
}

fn next_checkpoint(result: &UploadResult, deps: &SyncEngineDeps) -> SyncCheckpoint {
  SyncCheckpoint {
    base_revision: result.revision,
    base_blob_sha: Some(result.sha.clone()),
    last_sync_at: Some(iso_now_ms()),
    last_device_id: Some(deps.device_id.clone()),
    last_local_max_stamp: 0,
  }
}

fn apply_merged(app: &App, merged: &Value) -> Result<()> {
  let Some(obj) = merged.as_object() else {
    return Err(Error::Validation("merge deve ser um objeto de coleções".into()));
  };
  for (key, value) in obj {
    if is_user_collection_key(key) {
      save_collection(app.db.connection(), key, value)?;
    }
  }
  Ok(())
}

impl fmt::Display for SyncPreview {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "+{} ~{} -{}", self.added, self.updated, self.removed)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn checkpoint_inicial_eh_zero() {
    assert_eq!(INITIAL_CHECKPOINT.base_revision, 0);
    assert_eq!(INITIAL_CHECKPOINT.base_blob_sha, None);
    assert_eq!(INITIAL_CHECKPOINT.last_sync_at, None);
    assert_eq!(INITIAL_CHECKPOINT.last_device_id, None);
    assert_eq!(INITIAL_CHECKPOINT.last_local_max_stamp, 0);
  }

  #[test]
  fn preview_display_formata_stats() {
    let p = SyncPreview { added: 2, updated: 1, removed: 0 };
    assert_eq!(p.to_string(), "+2 ~1 -0");
  }
}
