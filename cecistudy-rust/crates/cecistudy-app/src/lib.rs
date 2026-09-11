//! cecistudy-app — casos de uso orquestrando domain+data+sync+content.
//!
//! Superfície única da camada de aplicação (porta de `packages/application`):
//! nenhuma regra de negócio nova — delegação para data/domain/sync e derivações
//! simples a partir do banco do usuário. Regra de boundary: este crate pode
//! importar common/data/domain/sync/content; **nunca** o contrário.

pub mod use_cases;

use std::path::Path;

use cecistudy_common::{Error, Result};
use cecistudy_data::UserDb;

/// Porta da camada de aplicação sobre um banco de usuário concreto (`UserDb`).
///
/// Abre o banco uma vez e expõe os casos de uso em [`use_cases`]. As conexões
/// são injetadas nos casos de uso via `&UserDb` (nenhuma regra de negócio
/// nova aqui).
#[derive(Debug)]
pub struct App {
  db: UserDb,
}

impl App {
  /// Abre (ou cria) o banco de usuário no caminho informado.
  pub fn open(path: impl AsRef<Path>) -> Result<Self> {
    Ok(Self { db: UserDb::open(path)? })
  }

  /// Abre o banco de usuário em memória (testes).
  pub fn in_memory() -> Result<Self> {
    Ok(Self { db: UserDb::in_memory()? })
  }

  /// Valida o esquema do banco de usuário; devolve o nº de objetos na raiz.
  pub fn verify(&self) -> Result<usize> {
    self.db.verify()
  }

  /// Abre o catálogo estático (templo) em modo somente-leitura.
  pub fn open_catalog(
    path: impl AsRef<Path>,
  ) -> std::result::Result<cecistudy_content::CatalogDb, Error> {
    cecistudy_content::CatalogDb::open_read_only(path)
  }

  /// Capacidades por entidade/plataforma (delegação para `domain`).
  pub fn capability_for(
    &self,
    entity: cecistudy_domain::CapabilityEntity,
    platform: cecistudy_common::Platform,
  ) -> Option<cecistudy_domain::PlatformCapability> {
    cecistudy_domain::capability_for(entity, platform)
  }
}
