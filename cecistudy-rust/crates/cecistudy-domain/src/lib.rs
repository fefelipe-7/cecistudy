//! cecistudy-domain — entidades, invariações e capacidades do domínio.
//!
//! Porta de `packages/domain/src/core/domain/` (TS). Regra: nenhuma dependência
//! de UI/Flutter/banco aqui — só `serde` + `cecistudy-common`.
//!
//! Módulos (por tracker do plano):
//! - [`workspace`] — entidade Workspace (`workspace.ts`).
//! - [`capabilities`] — matriz de capacidades por plataforma (`capabilities.ts`).

pub mod capabilities;
pub mod workspace;

pub use capabilities::{
  CapabilityEntity, DEFAULT_CAPABILITIES, PlatformCapability, Projection, capability_for,
};
pub use workspace::{DefaultModule, Workspace, WorkspaceKind, WorkspaceSettings, create_workspace};
