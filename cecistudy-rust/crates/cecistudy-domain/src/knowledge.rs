//! Conhecimento (M-DOC/Base de Conhecimento) — documentos, blocos e o grafo
//! de relações entre conceitos/documentos (F1.4).
//!
//! Spec-first a partir de `spec/05-modulos-greenfield.md` (M-DOC) e do
//! `01-task-breakdown-flutter-rust.md` (§3.2/1.4). `Block.meta` e as relações
//! carregam `Option<serde_json::Value>` para conteúdo extra não tipado.
//!
//! > Nota de spec: o breakdown lista "7 enums" em 1.4 mas nomeia 6
//! > (`BlockType`, `RelationKind`, `RelationProvenance`, `SuggestionType`,
//! > `SuggestionStatus`, `LearningDimension`); implementados os 6 nomeados —
//! > não inventa-se um sétimo sem contrato.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use cecistudy_common::{EntityId, Timestamp, make_id};

/// Tipo de bloco do modelo canônico de documento (M-DOC).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum BlockType {
  Paragrafo,
  Titulo,
  Tabela,
  Imagem,
  Citacao,
  Codigo,
  Latex,
  NotaDeRodape,
  ReferenciaCruzada,
}

/// Tipo de relação entre nós da base de conhecimento.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RelationKind {
  BaseadaEm,
  Cita,
  DerivaDe,
  Complementa,
  Contradiz,
}

/// Proveniência de uma relação (manual ou sugerida/importada).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RelationProvenance {
  Manual,
  Automatica,
  Importada,
}

/// Tipo de sugestão apresentada à usuária (rascunho, nunca auto-aplicada).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SuggestionType {
  Associacao,
  Leitura,
  Revisao,
}

/// Ciclo de vida de uma sugestão.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SuggestionStatus {
  Pendente,
  Aceita,
  Descartada,
}

/// Dimensão de aprendizagem acompanhada pelo `LearningState`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LearningDimension {
  Conhecimento,
  Habito,
  Dominio,
}

/// Bloco do modelo canônico de documento. `meta` carrega conteúdo extra
/// dependente de tipo (ex.: alt de imagem, linguagem de código, colspan).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Block {
  pub id: EntityId,
  pub kind: BlockType,
  pub content: String,
  #[serde(default)]
  pub meta: Option<Value>,
}

/// Documento da base de conhecimento (nodes do grafo).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Document {
  pub id: EntityId,
  pub title: String,
  #[serde(default)]
  pub blocks: Vec<Block>,
  #[serde(default)]
  pub relations: Vec<Relation>,
  #[serde(default)]
  pub tags: Vec<String>,
  #[serde(default)]
  pub workspace_id: Option<String>,
  pub created_at: Timestamp,
  pub updated_at: Timestamp,
}

/// Aresta do grafo de conhecimento entre dois nós.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Relation {
  pub id: EntityId,
  pub from: EntityId,
  pub to: EntityId,
  pub kind: RelationKind,
  pub provenance: RelationProvenance,
  #[serde(default)]
  pub strength: Option<f64>,
  #[serde(default)]
  pub meta: Option<Value>,
  pub created_at: Timestamp,
}

/// Sugestão de associação/leitura/revisão (entra como rascunho).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Suggestion {
  pub id: EntityId,
  pub from: EntityId,
  pub to: EntityId,
  pub kind: SuggestionType,
  pub status: SuggestionStatus,
  #[serde(default)]
  pub rationale: Option<String>,
  pub created_at: Timestamp,
}

/// Política de associação automática (quais kinds e força mínima).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssociationPolicy {
  pub name: String,
  #[serde(default)]
  pub relation_kinds: Vec<RelationKind>,
  #[serde(default)]
  pub min_strength: Option<f64>,
  #[serde(default)]
  pub auto_apply: bool,
}

/// Estado de aprendizagem de uma dimensão sobre um nó.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LearningState {
  pub dimension: LearningDimension,
  #[serde(default)]
  pub mastered: Option<bool>,
  #[serde(default)]
  pub level: Option<f64>,
  #[serde(default)]
  pub reviews: Option<u32>,
  #[serde(default)]
  pub last_reviewed: Option<Timestamp>,
}

pub struct DocumentInput {
  pub title: String,
  pub blocks: Option<Vec<Block>>,
  pub tags: Option<Vec<String>>,
  pub workspace_id: Option<String>,
}

/// Cria um documento vazio (sem blocos/relações), com timestamps iguais.
pub fn create_document(input: DocumentInput) -> Document {
  let now = Timestamp::now();
  Document {
    id: make_id("doc"),
    title: input.title,
    blocks: input.blocks.unwrap_or_default(),
    relations: vec![],
    tags: input.tags.unwrap_or_default(),
    workspace_id: input.workspace_id,
    created_at: now.clone(),
    updated_at: now,
  }
}

/// Cria uma relação manual entre dois nós (proveniência `Manual`).
pub fn create_relation(from: EntityId, to: EntityId, kind: RelationKind) -> Relation {
  Relation {
    id: make_id("rel"),
    from,
    to,
    kind,
    provenance: RelationProvenance::Manual,
    strength: None,
    meta: None,
    created_at: Timestamp::now(),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn block_meta_round_trip_com_map_desconhecido() {
    let b = Block {
      id: make_id("blk"),
      kind: BlockType::Imagem,
      content: "figura-1.png".into(),
      meta: Some(serde_json::json!({"alt": "gráfico de evolução", "figure": false})),
    };
    let json = serde_json::to_string(&b).unwrap();
    let back: Block = serde_json::from_str(&json).unwrap();
    assert_eq!(back, b);
    assert!(json.contains("\"alt\""), "{json}");
  }

  #[test]
  fn create_document_defaults_e_round_trip() {
    let d = create_document(DocumentInput {
      title: "nota de supervisão".into(),
      blocks: None,
      tags: None,
      workspace_id: Some("ws-1".into()),
    });
    assert!(d.id.as_str().starts_with("doc-"));
    assert_eq!(d.blocks, vec![]);
    assert!(d.tags.is_empty());
    assert_eq!(d.workspace_id.as_deref(), Some("ws-1"));
    let back: Document = serde_json::from_str(&serde_json::to_string(&d).unwrap()).unwrap();
    assert_eq!(d, back);
  }

  #[test]
  fn create_relation_manual_sem_strength() {
    let from = EntityId::new("con-1").unwrap();
    let to = EntityId::new("con-2").unwrap();
    let r = create_relation(from, to, RelationKind::DerivaDe);
    assert_eq!(r.provenance, RelationProvenance::Manual);
    assert_eq!(r.kind, RelationKind::DerivaDe);
    let back: Relation = serde_json::from_str(&serde_json::to_string(&r).unwrap()).unwrap();
    assert_eq!(r, back);
  }
}
