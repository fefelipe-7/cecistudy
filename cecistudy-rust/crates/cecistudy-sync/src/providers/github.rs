//! GitHubSyncProvider — primeiro provedor de sincronização do cecistudy.
//!
//! Armazena UM arquivo (`cecistudy/sync-package.json`) num repositório privado
//! do usuário. O GitHub NÃO é o banco: guardamos apenas o `SyncPackage`
//! (snapshot do domínio + manifesto). O CAS (compare-and-swap) usa o `sha` do
//! blob que a própria Contents API exige no PUT — se o remoto mudou, ela
//! responde 409 e nós recusamos o upload (`RemoteChanged`).
//!
//! Credenciais: o token NUNCA é hardcoded. Chega via `get_token` (injetado pelo
//! shell a partir de storage seguro). Porta de `packages/sync/src/providers/github.ts`.

use base64::Engine as _;
use reqwest::blocking::Client;
use reqwest::header::{ACCEPT, AUTHORIZATION, HeaderValue};

use crate::provider::{
  SyncManifest, SyncPackage, SyncProvider, SyncProviderError, SyncProviderErrorKind,
  SyncRemotePackage, UploadResult,
};

/// Caminho do arquivo dentro do repo (default do TS).
pub const DEFAULT_PATH: &str = "cecistudy/sync-package.json";

/// Normaliza o caminho configurado (fallback para o default).
pub fn normalize_path(path: Option<&str>) -> String {
  let p = path.filter(|s| !s.is_empty()).unwrap_or(DEFAULT_PATH);
  p.trim_start_matches('/').to_string()
}

/// Configuração do provedor GitHub.
pub struct GitHubSyncConfig {
  pub owner: String,
  pub repo: String,
  /// Resolve o token em runtime (PAT da usuária). Nunca embutido no binário.
  pub get_token: Box<dyn Fn() -> String + Send + Sync>,
  /// Caminho do arquivo dentro do repo. Default: `cecistudy/sync-package.json`.
  pub path: Option<String>,
}

/// Provedor GitHub que implementa [`SyncProvider`] via `reqwest` (blocking).
pub struct GitHubSyncProvider {
  config: GitHubSyncConfig,
  path: String,
  base_url: String,
  client: Client,
}

impl GitHubSyncProvider {
  pub fn new(config: GitHubSyncConfig) -> Self {
    let path = normalize_path(config.path.as_deref());
    Self { config, path, base_url: "https://api.github.com".to_string(), client: Client::new() }
  }

  /// Só usado em testes: aponta o provider para um mock local (mockito).
  #[cfg(test)]
  fn with_mock_base(mut self, base_url: &str) -> Self {
    self.base_url = base_url.to_string();
    self
  }

  fn api_url(&self) -> String {
    format!(
      "{}/repos/{}/{}/contents/{}",
      self.base_url, self.config.owner, self.config.repo, self.path
    )
  }

  fn headers(&self) -> Result<reqwest::header::HeaderMap, SyncProviderError> {
    let token = (self.config.get_token)();
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert(
      AUTHORIZATION,
      HeaderValue::from_str(&format!("Bearer {token}"))
        .map_err(|e| SyncProviderError::new(SyncProviderErrorKind::Unknown, e.to_string()))?,
    );
    headers.insert(ACCEPT, HeaderValue::from_static("application/vnd.github+json"));
    headers.insert(
      reqwest::header::HeaderName::from_static("x-github-api-version"),
      HeaderValue::from_static("2022-11-28"),
    );
    headers.insert(reqwest::header::USER_AGENT, HeaderValue::from_static("cecistudy-rust"));
    Ok(headers)
  }

  fn map_error(status: u16, message: Option<&str>) -> SyncProviderError {
    match status {
      401 | 403 => SyncProviderError::new(
        SyncProviderErrorKind::Auth,
        message.unwrap_or("token inválido ou sem acesso"),
      ),
      409 => SyncProviderError::new(
        SyncProviderErrorKind::RemoteChanged,
        "o remoto mudou desde a última leitura",
      ),
      _ => SyncProviderError::new(
        SyncProviderErrorKind::Unknown,
        message.unwrap_or(&format!("github {status}")).to_string(),
      ),
    }
  }
}

/// Resposta da Contents API (GET: content base64 + sha; PUT: sha do novo blob).
#[derive(serde::Deserialize)]
struct GitHubContentResponse {
  content: Option<String>,
  sha: Option<String>,
  message: Option<String>,
}

impl SyncProvider for GitHubSyncProvider {
  fn get_manifest(&self) -> Result<Option<SyncManifest>, SyncProviderError> {
    self.download_package().map(|r| r.map(|pkg| pkg.package.manifest))
  }

  fn download_package(&self) -> Result<Option<SyncRemotePackage>, SyncProviderError> {
    let headers = self.headers()?;
    let res = self
      .client
      .get(self.api_url())
      .headers(headers)
      .send()
      .map_err(|e| SyncProviderError::new(SyncProviderErrorKind::Network, e.to_string()))?;
    if res.status().as_u16() == 404 {
      return Ok(None);
    }
    if !res.status().is_success() {
      let status = res.status().as_u16();
      let message =
        res.json::<GitHubContentResponse>().ok().and_then(|data| data.message).unwrap_or_default();
      return Err(Self::map_error(status, if message.is_empty() { None } else { Some(&message) }));
    }
    let data: GitHubContentResponse = res
      .json()
      .map_err(|e| SyncProviderError::new(SyncProviderErrorKind::Unknown, e.to_string()))?;
    let content = data.content.ok_or_else(|| {
      SyncProviderError::new(SyncProviderErrorKind::Unknown, "resposta sem conteúdo")
    })?;
    let sha = data
      .sha
      .ok_or_else(|| SyncProviderError::new(SyncProviderErrorKind::Unknown, "resposta sem sha"))?;
    let decoded = base64::engine::general_purpose::STANDARD
      .decode(content)
      .map_err(|e| SyncProviderError::new(SyncProviderErrorKind::Unknown, e.to_string()))?;
    let pkg: SyncPackage = serde_json::from_slice(&decoded)
      .map_err(|e| SyncProviderError::new(SyncProviderErrorKind::Unknown, e.to_string()))?;
    Ok(Some(SyncRemotePackage::new(pkg, sha)))
  }

  fn upload_package(
    &self,
    pkg: &SyncPackage,
    base_sha: Option<&str>,
  ) -> Result<UploadResult, SyncProviderError> {
    let raw = serde_json::to_vec(pkg)
      .map_err(|e| SyncProviderError::new(SyncProviderErrorKind::Unknown, e.to_string()))?;
    let content = base64::engine::general_purpose::STANDARD.encode(raw);
    let mut body = serde_json::json!({
      "message": format!("cecistudy sync r{}", pkg.manifest.revision),
      "content": content,
    });
    if let Some(sha) = base_sha {
      body["sha"] = serde_json::Value::String(sha.to_string());
    }
    let headers = self.headers()?;
    let res = self
      .client
      .put(self.api_url())
      .headers(headers)
      .json(&body)
      .send()
      .map_err(|e| SyncProviderError::new(SyncProviderErrorKind::Network, e.to_string()))?;
    if !res.status().is_success() {
      let status = res.status().as_u16();
      let message =
        res.json::<GitHubContentResponse>().ok().and_then(|data| data.message).unwrap_or_default();
      return Err(Self::map_error(status, if message.is_empty() { None } else { Some(&message) }));
    }
    let data: GitHubContentResponse = res
      .json()
      .map_err(|e| SyncProviderError::new(SyncProviderErrorKind::Unknown, e.to_string()))?;
    let sha = data.sha.ok_or_else(|| {
      SyncProviderError::new(SyncProviderErrorKind::Unknown, "upload sem sha de retorno")
    })?;
    Ok(UploadResult { revision: pkg.manifest.revision, sha })
  }
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

  fn make_provider(base_url: &str) -> GitHubSyncProvider {
    GitHubSyncProvider::new(GitHubSyncConfig {
      owner: "fefelipe-7".into(),
      repo: "cecistudy-sync".into(),
      get_token: Box::new(|| "ghp_test".to_string()),
      path: None,
    })
    .with_mock_base(base_url)
  }

  fn sha_of(pkg: &SyncPackage) -> String {
    base64::engine::general_purpose::STANDARD.encode(serde_json::to_vec(pkg).unwrap())
  }

  #[test]
  fn retorna_none_quando_nao_ha_pacote_remoto_404() {
    let mut server = mockito::Server::new();
    server
      .mock("GET", "/repos/fefelipe-7/cecistudy-sync/contents/cecistudy/sync-package.json")
      .with_status(404)
      .create();
    let p = make_provider(&server.url());
    assert!(p.get_manifest().unwrap().is_none());
    assert!(p.download_package().unwrap().is_none());
  }

  #[test]
  fn baixa_pacote_remoto_e_decodifica_o_snapshot() {
    let mut server = mockito::Server::new();
    server
      .mock("GET", "/repos/fefelipe-7/cecistudy-sync/contents/cecistudy/sync-package.json")
      .with_status(200)
      .with_body(
        serde_json::json!({ "content": sha_of(&make_package(3)), "sha": "s3" }).to_string(),
      )
      .create();
    let p = make_provider(&server.url());
    let remote = p.download_package().unwrap().unwrap();
    assert_eq!(remote.sha, "s3");
    assert_eq!(remote.package.manifest.revision, 3);
    assert_eq!(remote.package.snapshot["profile"]["name"], "ceci");
  }

  #[test]
  fn sobe_pacote_novo_sem_sha_e_retorna_nova_revisao() {
    let mut server = mockito::Server::new();
    server
      .mock("PUT", "/repos/fefelipe-7/cecistudy-sync/contents/cecistudy/sync-package.json")
      .with_status(201)
      .with_body(serde_json::json!({ "sha": "sha-1" }).to_string())
      .create();
    let p = make_provider(&server.url());
    let res = p.upload_package(&make_package(1), None).unwrap();
    assert_eq!(res.revision, 1);
    assert_eq!(res.sha, "sha-1");
  }

  #[test]
  fn atualiza_pacote_com_sha_base_correto_cas_ok() {
    let mut server = mockito::Server::new();
    server
      .mock("PUT", "/repos/fefelipe-7/cecistudy-sync/contents/cecistudy/sync-package.json")
      .with_status(200)
      .with_body(serde_json::json!({ "sha": "sha-3" }).to_string())
      .create();
    let p = make_provider(&server.url());
    let res = p.upload_package(&make_package(3), Some("s2")).unwrap();
    assert_eq!(res.revision, 3);
    assert_eq!(res.sha, "sha-3");
  }

  #[test]
  fn recusa_upload_quando_o_sha_base_esta_obsoleto_409() {
    let mut server = mockito::Server::new();
    server
      .mock("PUT", "/repos/fefelipe-7/cecistudy-sync/contents/cecistudy/sync-package.json")
      .with_status(409)
      .with_body(serde_json::json!({ "message": "sha mismatch" }).to_string())
      .create();
    let p = make_provider(&server.url());
    let err = p.upload_package(&make_package(3), Some("stale")).unwrap_err();
    assert_eq!(err.kind, SyncProviderErrorKind::RemoteChanged);
  }

  #[test]
  fn erro_401_vira_sync_provider_error_auth() {
    let mut server = mockito::Server::new();
    server
      .mock("GET", "/repos/fefelipe-7/cecistudy-sync/contents/cecistudy/sync-package.json")
      .with_status(401)
      .with_body(serde_json::json!({ "message": "Bad credentials" }).to_string())
      .create();
    let p = make_provider(&server.url());
    let err = p.download_package().unwrap_err();
    assert_eq!(err.kind, SyncProviderErrorKind::Auth);
  }

  #[test]
  fn erro_403_vira_sync_provider_error_auth() {
    let mut server = mockito::Server::new();
    server
      .mock("GET", "/repos/fefelipe-7/cecistudy-sync/contents/cecistudy/sync-package.json")
      .with_status(403)
      .with_body(serde_json::json!({ "message": "Forbidden" }).to_string())
      .create();
    let p = make_provider(&server.url());
    let err = p.download_package().unwrap_err();
    assert_eq!(err.kind, SyncProviderErrorKind::Auth);
  }

  #[test]
  fn normalize_path_fallback_e_limpa_a_barra() {
    assert_eq!(normalize_path(None), "cecistudy/sync-package.json");
    assert_eq!(normalize_path(Some("")), "cecistudy/sync-package.json");
    assert_eq!(normalize_path(Some("/outro/arquivo.json")), "outro/arquivo.json");
  }
}
