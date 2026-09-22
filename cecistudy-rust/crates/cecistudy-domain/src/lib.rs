//! cecistudy-domain — entidades, invariações e capacidades do domínio.
//!
//! Porta de `packages/domain/src/core/domain/` (TS). Regra: nenhuma dependência
//! de UI/Flutter/banco aqui — só `serde` + `cecistudy-common`.
//!
//! Módulos (por tracker do plano):
//! - [`workspace`] — entidade Workspace (`workspace.ts`).
//! - [`capabilities`] — matriz de capacidades por plataforma (`capabilities.ts`).
//! - [`entity`] — entidades tipadas dos dados persistidos da usuária (R1;
//!   forma derivada de `contracts/schema.sql` + golden files).
//! - [`calendar`] — calendário semanal desktop (M-CAL; R2, spec-first).
//! - [`knowledge`] — documentos, blocos e grafo de conhecimento (M-DOC/R2).
//! - [`marketing`] — marketing studio (M-MKT; R2, spec-first).
//! - [`projects`] — projetos acadêmicos e outputs (TCC/R2, spec-first).
//! - [`internship`] — registro de estágio e supervisão (R2, spec-first).

pub mod calendar;
pub mod capabilities;
pub mod entity;
pub mod internship;
pub mod knowledge;
pub mod marketing;
pub mod projects;
pub mod workspace;

pub use calendar::{
  CalendarEvent, CalendarItemStatus, CommitmentLevel, ExecutionRecord, ModuleOrigin, Occurrence,
  PlanningBlock, RecurrenceRule, Responsibility, SourceRef, Subtask, create_responsibility,
};
pub use capabilities::{
  CapabilityEntity, DEFAULT_CAPABILITIES, PlatformCapability, Projection, capability_for,
};
pub use marketing::{Channel, ChannelVariant, ContentBase, EditorialStatus, create_content_base};
pub use projects::{
  AcademicNode, AcademicNodeKind, CitationProfile, MAX_ACTIVE_PROJECTS, Output, OutputFormat,
  Project, ProjectStatus, ProjectType, Reference, ReferenceType, Requiredness,
  active_project_count, can_add_project, create_project,
};
pub use workspace::{DefaultModule, Workspace, WorkspaceKind, WorkspaceSettings, create_workspace};
