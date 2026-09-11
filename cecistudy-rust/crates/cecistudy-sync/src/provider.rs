//! Contrato de um provedor de sincronização (Fase Sync — GitHub provider).
//!
//! Porta de `packages/sync/src/provider.ts` (TS). O cecistudy NÃO depende do
//! GitHub: o `SyncProvider` é apenas um meio de transporte/armazenamento do
//! pacote de sincronização. O app conhece o protocolo (`SyncPackage`/
//! `SyncManifest`); o provider conhece a API de transporte.
//!
//! Regra de arquitetura: código puro, sem acoplamento a UI ou runtime; o
//! transporte usa `reqwest` e recebe o token via injeção de dependência.

use std::error::Error;
use std::fmt;

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Versão do protocolo de sincronização do cecistudy.
pub const SYNC_PROTOCOL_VERSION: u32 = 1;

/// Manifesto versionado do pacote — permite CAS, auditoria e migração futura.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncManifest {
  /// SCHEMA_VERSION do domínio (BancoPersistido).
  pub schema_version: u32,
  /// Versão deste protocolo de sync (`SYNC_PROTOCOL_VERSION`).
  pub protocol_version: u32,
  /// Versão do app que gerou o pacote.
  pub app_version: String,
  /// Revisão global monotônica (compare-and-swap).
  pub revision: u32,
  /// Identificador estável do dispositivo que gerou o pacote.
  pub device_id: String,
  /// Escopo de workspaces sincronizados (MVP: 'default').
  pub workspace_scope: String,
  /// Revisão da qual este pacote é derivado (null na primeira versão).
  #[serde(default)]
  pub parent_revision: Option<u32>,
  /// Hash de conteúdo do snapshot (detecta alteração sem baixar tudo).
  pub content_hash: String,
  /// ISO timestamp da geração.
  pub created_at: String,
}

/// Pacote de sincronização próprio do cecistudy (não um dump de Git).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SyncPackage {
  pub manifest: SyncManifest,
  /// Snapshot do domínio (BackupV2 puro, com syncIndex).
  pub snapshot: Value,
}

/// Pacote remoto já com o sha do blob (usado para CAS no próximo upload).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SyncRemotePackage {
  pub package: SyncPackage,
  pub sha: String,
}

impl SyncRemotePackage {
  /// Constrói um `SyncRemotePackage` a partir de um pacote + sha.
  pub fn new(package: SyncPackage, sha: String) -> Self {
    Self { package, sha }
  }
}

/// Resultado do upload: nova revisão + sha do blob criado.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UploadResult {
  pub revision: u32,
  pub sha: String,
}

/// Classificação de erro do provedor.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SyncProviderErrorKind {
  /// O remoto mudou desde a última leitura (CAS falhou).
  RemoteChanged,
  /// Falha de rede/HTTP.
  Network,
  /// Token inválido ou sem acesso.
  Auth,
  /// Sem pacote remoto ainda.
  NotFound,
  /// Erro não classificado.
  Unknown,
}

/// Erro de transporte com `kind` estável para decisão de fluxo.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SyncProviderError {
  pub kind: SyncProviderErrorKind,
  pub message: String,
}

impl SyncProviderError {
  pub fn new(kind: SyncProviderErrorKind, message: impl Into<String>) -> Self {
    Self { kind, message: message.into() }
  }
}

impl fmt::Display for SyncProviderError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.message)
  }
}

impl Error for SyncProviderError {}

/// Meio de transporte do pacote de sincronização.
///
/// O CAS (compare-and-swap) é feito pelo provider: `upload_package` recebe o
/// `base_sha` do blob remoto conhecido e recusa (`RemoteChanged`) se o remoto
/// mudou nesse meio-tempo.
pub trait SyncProvider: Send + Sync {
  /// Manifesto remoto atual, ou `None` se não houver pacote ainda.
  fn get_manifest(&self) -> Result<Option<SyncManifest>, SyncProviderError>;

  /// Pacote remoto + sha do blob, ou `None` se não houver.
  fn download_package(&self) -> Result<Option<SyncRemotePackage>, SyncProviderError>;

  /// Sobe o pacote; exige o `base_sha` para CAS. Devolve nova revisão + sha.
  fn upload_package(
    &self,
    pkg: &SyncPackage,
    base_sha: Option<&str>,
  ) -> Result<UploadResult, SyncProviderError>;
}

/// Hash de conteúdo estável e barato (FNV-1a 32-bit), usado para detectar
/// alteração no snapshot sem baixá-lo por completo. Não é criptográfico.
///
/// Paridade com o TS: a iteração é sobre **code units UTF-16** (como
/// `charCodeAt`/`Math.imul` do JS), não bytes UTF-8.
pub fn hash_content(input: &str) -> String {
  let mut h: u32 = 0x811c_9dc5;
  for unit in input.encode_utf16() {
    h ^= u32::from(unit);
    h = h.wrapping_mul(0x0100_0193);
  }
  format!("{h:08x}")
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_manifest(revision: u32) -> SyncManifest {
    SyncManifest {
      schema_version: 10,
      protocol_version: 1,
      app_version: "1.0.0".into(),
      revision,
      device_id: "notebook".into(),
      workspace_scope: "default".into(),
      parent_revision: revision.checked_sub(1),
      content_hash: "abc123".into(),
      created_at: "2026-01-01T00:00:00.000Z".into(),
    }
  }

  fn make_package(revision: u32) -> SyncPackage {
    SyncPackage {
      manifest: make_manifest(revision),
      snapshot: serde_json::json!({ "profile": { "name": "ceci" } }),
    }
  }

  /// Provider em memória para validar o contrato sem rede.
  struct InMemoryProvider {
    pkg: std::sync::Mutex<Option<SyncRemotePackage>>,
    fail_upload: bool,
  }

  impl SyncProvider for InMemoryProvider {
    fn get_manifest(&self) -> Result<Option<SyncManifest>, SyncProviderError> {
      Ok(self.download_package()?.map(|r| r.package.manifest))
    }

    fn download_package(&self) -> Result<Option<SyncRemotePackage>, SyncProviderError> {
      Ok(self.pkg.lock().unwrap().clone())
    }

    fn upload_package(
      &self,
      pkg: &SyncPackage,
      _base_sha: Option<&str>,
    ) -> Result<UploadResult, SyncProviderError> {
      if self.fail_upload {
        return Err(SyncProviderError::new(SyncProviderErrorKind::RemoteChanged, "simulado"));
      }
      let sha = format!("sha-{}", pkg.manifest.revision);
      *self.pkg.lock().unwrap() = Some(SyncRemotePackage::new(pkg.clone(), sha.clone()));
      Ok(UploadResult { revision: pkg.manifest.revision, sha })
    }
  }

  #[test]
  fn protocol_version_eh_1() {
    assert_eq!(SYNC_PROTOCOL_VERSION, 1);
  }

  #[test]
  fn hash_content_eh_estavel_e_sensivel() {
    assert_eq!(hash_content("abc"), hash_content("abc"));
    assert_ne!(hash_content("abc"), hash_content("abd"));
  }

  #[test]
  fn hash_content_bate_com_o_ts() {
    // Valores capturados do `hashContent` do TS (packages/sync + node).
    assert_eq!(hash_content("abc"), "1a47e90b");
    assert_eq!(hash_content("abd"), "1f47f0ea");
    assert_eq!(hash_content(""), "811c9dc5");
    assert_eq!(hash_content("cecistudy"), "bb092d1a");
    // inclui code units UTF-16 (paridade com charCodeAt do TS)
    assert_eq!(hash_content("bom dia, ção — áéíóú"), "3148a7b6");
  }

  #[test]
  fn provider_implementa_upload_download_manifest() {
    let p = InMemoryProvider { pkg: std::sync::Mutex::new(None), fail_upload: false };
    assert!(p.get_manifest().unwrap().is_none());
    assert!(p.download_package().unwrap().is_none());

    let pkg = make_package(1);
    let res = p.upload_package(&pkg, None).unwrap();
    assert_eq!(res.revision, 1);
    assert_eq!(res.sha, "sha-1");
    let remote = p.download_package().unwrap().unwrap();
    assert_eq!(remote.package.manifest.revision, 1);
  }

  #[test]
  fn sync_provider_error_carrega_o_kind() {
    let e = SyncProviderError::new(SyncProviderErrorKind::Auth, "sem token");
    assert_eq!(e.kind, SyncProviderErrorKind::Auth);
    assert_eq!(e.to_string(), "sem token");
  }

  #[test]
  fn sync_remote_package_serializa_com_sha() {
    let r = SyncRemotePackage::new(make_package(2), "s3".into());
    let json = serde_json::to_string(&r).unwrap();
    assert!(json.contains("\"sha\":\"s3\""));
    assert!(json.contains("\"manifest\""));
  }
}
