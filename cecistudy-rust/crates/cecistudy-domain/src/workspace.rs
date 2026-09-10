//! Workspace — universo isolado de conhecimento, trabalho e contexto.
//! Paridade com `packages/domain/src/core/domain/workspace.ts` (F1.8).

use serde::{Deserialize, Serialize};

use cecistudy_common::{EntityId, Timestamp, make_id};

/// Tipo de workspace (rótulo editorial; sem regra de negócio própria).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WorkspaceKind {
  Academico,
  Profissional,
  Pessoal,
}

/// Módulo inicial ao abrir o workspace.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DefaultModule {
  Home,
  Conhecimento,
  Calendario,
  Projetos,
  Estudos,
  Marketing,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct WorkspaceSettings {
  pub default_module: DefaultModule,
}

/// Workspace = universo isolado (por padrão não vaza contexto para os demais).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Workspace {
  pub id: EntityId,
  pub name: String,
  pub kind: WorkspaceKind,
  pub created_at: Timestamp,
  pub updated_at: Timestamp,
  pub settings: WorkspaceSettings,
  pub isolated: bool,
}

/// Mesmos defaults do TS: `kind → academico`, `defaultModule → conhecimento`,
/// `isolated → true`, timestamps iguais na criação.
pub fn create_workspace(input: WorkspaceInput) -> Workspace {
  let now = Timestamp::now();
  Workspace {
    id: make_id("ws"),
    name: input.name,
    kind: input.kind.unwrap_or(WorkspaceKind::Academico),
    created_at: now.clone(),
    updated_at: now,
    settings: WorkspaceSettings {
      default_module: input.default_module.unwrap_or(DefaultModule::Conhecimento),
    },
    isolated: true,
  }
}

pub struct WorkspaceInput {
  pub name: String,
  pub kind: Option<WorkspaceKind>,
  pub default_module: Option<DefaultModule>,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn cria_com_defaults_do_ts() {
    let ws = create_workspace(WorkspaceInput {
      name: "meu cantinho".into(),
      kind: None,
      default_module: None,
    });
    assert!(ws.id.as_str().starts_with("ws-"));
    assert_eq!(ws.kind, WorkspaceKind::Academico);
    assert_eq!(ws.settings.default_module, DefaultModule::Conhecimento);
    assert!(ws.isolated);
    assert_eq!(ws.created_at, ws.updated_at);
  }

  #[test]
  fn serde_camel_cases_nao_pendentes() {
    let ws = create_workspace(WorkspaceInput {
      name: "x".into(),
      kind: Some(WorkspaceKind::Pessoal),
      default_module: Some(DefaultModule::Calendario),
    });
    let json = serde_json::to_string(&ws).unwrap();
    assert!(json.contains("\"default_module\":\"calendario\""), "{json}");
  }
}
