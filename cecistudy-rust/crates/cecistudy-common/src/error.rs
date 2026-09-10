//! Erro único do domínio/data/sync (análogo às exceções tipadas do TS).

/// Erro base compartilhado por todos os crates de `cecistudy-rust`.
#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error("identificador inválido: {0}")]
  InvalidEntityId(String),

  #[error("timestamp ISO inválido: {0}")]
  InvalidTimestamp(String),

  #[error("json: {0}")]
  Json(String),

  #[error("validação de domínio: {0}")]
  Validation(String),

  #[error("repositório: {0}")]
  Repository(String),

  #[error("banco de dados: {0}")]
  Database(String),
}

pub type Result<T> = std::result::Result<T, Error>;

impl Error {
  /// Ajudante para converter erros de serialização em [`Error::Json`].
  pub fn json<E: std::fmt::Display>(e: E) -> Self {
    Error::Json(e.to_string())
  }
}
