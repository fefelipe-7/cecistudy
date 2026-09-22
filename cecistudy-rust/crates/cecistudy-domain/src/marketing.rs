//! Marketing Studio (M-MKT) — posicionamento, conteúdo-base, variantes por
//! canal, publicações e métricas (F1.5).
//!
//! Spec-first a partir de `spec/05-modulos-greenfield.md` (M-MKT) e do
//! `01-task-breakdown-flutter-rust.md` (§3.2/1.5). `ChannelVariant.body` é
//! `Option<serde_json::Value>` — o corpo varia por canal (legenda/roteiro/cenas).

use serde::{Deserialize, Serialize};
use serde_json::Value;

use cecistudy_common::{EntityId, Timestamp, make_id};

/// Canal de publicação.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Channel {
  Instagram,
  Tiktok,
  Linkedin,
}

/// Fluxo editorial: `ideia → selecionado → briefing → rascunho →
/// em_revisao → aprovado → agendado → publicado` (pular etapas é permitido).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum EditorialStatus {
  Ideia,
  Selecionado,
  Briefing,
  Rascunho,
  EmRevisao,
  Aprovado,
  Agendado,
  Publicado,
}

/// Identidade de posicionamento. Sugestões entram como rascunho e nunca são
/// auto-aplicadas (decidido na spec M-MKT).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PositioningProfile {
  pub id: EntityId,
  pub identity: String,
  #[serde(default)]
  pub pillars: Vec<String>,
  #[serde(default)]
  pub audience: Option<String>,
  #[serde(default)]
  pub tone: Option<String>,
  #[serde(default)]
  pub hypotheses: Vec<String>,
  /// Rascunhos de sugestão (cada um um bloco não tipado aguardando aprovação).
  #[serde(default)]
  pub suggestions: Vec<Value>,
  pub updated_at: Timestamp,
}

/// Fila de ideias de conteúdo.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentIdea {
  pub id: EntityId,
  pub title: String,
  #[serde(default)]
  pub prompt: Option<String>,
  #[serde(default)]
  pub channel: Option<Channel>,
  pub status: EditorialStatus,
  #[serde(default)]
  pub linked_project_id: Option<EntityId>,
  pub created_at: Timestamp,
}

/// Conteúdo-base (a fonte única do módulo; variantes nascem dele).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentBase {
  pub id: EntityId,
  pub title: String,
  #[serde(default)]
  pub summary: Option<String>,
  #[serde(default)]
  pub body: Option<Value>,
  #[serde(default)]
  pub channels: Vec<ChannelVariant>,
  #[serde(default)]
  pub project_id: Option<EntityId>,
  pub status: EditorialStatus,
  pub created_at: Timestamp,
  pub updated_at: Timestamp,
}

/// Variante de um `ContentBase` para um canal (independente dos demais).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChannelVariant {
  pub id: EntityId,
  pub content_base_id: EntityId,
  pub channel: Channel,
  #[serde(default)]
  pub caption: Option<String>,
  #[serde(default)]
  pub script: Option<String>,
  #[serde(default)]
  pub scenes: Vec<Value>,
  #[serde(default)]
  pub cta: Option<String>,
  /// Corpo da variante — conteúdo por canal (legenda/roteiro/cenas/CTA).
  #[serde(default)]
  pub body: Option<Value>,
  pub status: EditorialStatus,
  #[serde(default)]
  pub scheduled_at: Option<Timestamp>,
  #[serde(default)]
  pub publication_id: Option<EntityId>,
}

/// Publicação efetivada de uma variante.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Publication {
  pub id: EntityId,
  pub content_base_id: EntityId,
  pub channel: Channel,
  pub published_at: Timestamp,
  #[serde(default)]
  pub url: Option<String>,
  #[serde(default)]
  pub metrics: Vec<MetricSnapshot>,
}

/// Snapshot de métricas por publicação+canal (manual como fallback).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricSnapshot {
  pub id: EntityId,
  pub publication_id: EntityId,
  pub channel: Channel,
  pub captured_at: Timestamp,
  #[serde(default)]
  pub reach: Option<f64>,
  #[serde(default)]
  pub impressions: Option<f64>,
  #[serde(default)]
  pub engagement: Option<f64>,
  #[serde(default)]
  pub likes: Option<f64>,
  #[serde(default)]
  pub comments: Option<f64>,
  #[serde(default)]
  pub shares: Option<f64>,
  #[serde(default)]
  pub saves: Option<f64>,
  /// Fonte da medição (`manual` ou a API de origem).
  pub source: String,
}

/// Insight estratégico derivado das métricas (direção sugerida, não aplicada).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StrategicInsight {
  pub id: EntityId,
  pub channel: Channel,
  pub title: String,
  pub body: String,
  #[serde(default)]
  pub metric: Option<String>,
  #[serde(default)]
  pub direction: Option<String>,
  pub generated_at: Timestamp,
}

pub struct ContentBaseInput<'a> {
  pub title: String,
  pub summary: Option<String>,
  pub body: Option<Value>,
  pub project_id: Option<EntityId>,
  pub channels: Option<&'a [ChannelVariant]>,
}

/// Cria um conteúdo-base no estado `Ideia`, com timestamps de criação iguais.
pub fn create_content_base(input: ContentBaseInput) -> ContentBase {
  let now = Timestamp::now();
  ContentBase {
    id: make_id("cb"),
    title: input.title,
    summary: input.summary,
    body: input.body,
    channels: input.channels.map(<[ChannelVariant]>::to_vec).unwrap_or_default(),
    project_id: input.project_id,
    status: EditorialStatus::Ideia,
    created_at: now.clone(),
    updated_at: now,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn default_do_content_base_e_ideia() {
    let cb = create_content_base(ContentBaseInput {
      title: "reels sobre ansiedade".into(),
      summary: None,
      body: None,
      project_id: None,
      channels: None,
    });
    assert_eq!(cb.status, EditorialStatus::Ideia);
    assert_eq!(cb.channels, vec![]);
    assert!(cb.id.as_str().starts_with("cb-"));
  }

  #[test]
  fn variant_body_preserva_json_por_canal() {
    let variants = vec![
      ChannelVariant {
        id: make_id("var"),
        content_base_id: make_id("cb"),
        channel: Channel::Instagram,
        caption: Some("legenda".into()),
        script: None,
        scenes: vec![],
        cta: Some("link na bio".into()),
        body: Some(serde_json::json!({"slides": ["1", "2"], "fonte": "DSM-5"})),
        status: EditorialStatus::Rascunho,
        scheduled_at: None,
        publication_id: None,
      },
      ChannelVariant {
        id: make_id("var"),
        content_base_id: make_id("cb"),
        channel: Channel::Linkedin,
        caption: None,
        script: None,
        scenes: vec![],
        cta: Some("comente".into()),
        body: None,
        status: EditorialStatus::EmRevisao,
        scheduled_at: None,
        publication_id: None,
      },
    ];
    let json = serde_json::to_string(&variants).unwrap();
    assert!(json.contains("\"fonte\":\"DSM-5\""), "{json}");
    let back: Vec<ChannelVariant> = serde_json::from_str(&json).unwrap();
    assert_eq!(back, variants);
    assert!(back[0].body.is_some());
    assert!(back[1].body.is_none());
  }

  #[test]
  fn aprovar_um_canal_nao_aprovado_o_outro() {
    let mut a = ChannelVariant {
      id: make_id("var"),
      content_base_id: make_id("cb"),
      channel: Channel::Tiktok,
      caption: None,
      script: Some("roteiro".into()),
      scenes: vec![],
      cta: None,
      body: None,
      status: EditorialStatus::Aprovado,
      scheduled_at: None,
      publication_id: None,
    };
    let mut b = a.clone();
    b.id = make_id("var");
    a.status = EditorialStatus::Aprovado;
    b.status = EditorialStatus::Rascunho;
    assert_ne!(a.status, b.status);
  }
}
