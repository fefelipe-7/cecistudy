//! Calendário semanal (M-CAL) — modelo de eventos, responsabilidades e
//! planejado × real (F1.3).
//!
//! Spec-first a partir de `spec/05-modulos-greenfield.md` (M-CAL) e do
//! `01-task-breakdown-flutter-rust.md` (§3.2/1.3): o calendário é **dono do
//! tempo** — eventos são projeções de entidades de origem (Faculdade/Estudos/
//! TCC/Estágio/Google), e a edição despacha ao dono do conteúdo (não duplica
//! estado). Campos opcionais usam `#[serde(default)]` para aceitar projeções
//! parciais das fontes (keys ausentes valem `None`/`[]`).

use serde::{Deserialize, Serialize};

use cecistudy_common::{EntityId, Timestamp, make_id};

/// Nível de compromisso de um item (obrigatório → opcional).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CommitmentLevel {
  Obrigatorio,
  Importante,
  Recomendado,
  Opcional,
}

/// Estado de um item no calendário.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CalendarItemStatus {
  Pendente,
  EmAndamento,
  Concluido,
  Cancelado,
}

/// Origem do item (a camada visual que o produziu); não é a fonte de verdade
/// do conteúdo — apenas a projeção.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ModuleOrigin {
  Faculdade,
  Estudos,
  Tcc,
  Estagio,
  Google,
}

/// Vínculo do item ao dono do conteúdo (origem do `packages/application`).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceRef {
  pub module: ModuleOrigin,
  pub entity_id: EntityId,
  /// Tipo da entidade de origem (ex.: `exam`, `task`, `session`, `classNote`).
  pub kind: String,
}

/// Regra de recorrência (simplificada; freq é rótulo editorial do TS de origem).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecurrenceRule {
  pub freq: String,
  #[serde(default)]
  pub interval: Option<u32>,
  #[serde(default)]
  pub ends_at: Option<Timestamp>,
  #[serde(default)]
  pub count: Option<u32>,
}

/// Ocorrência de um evento recorrente (instância concreta).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Occurrence {
  pub id: EntityId,
  pub start: Timestamp,
  #[serde(default)]
  pub end: Option<Timestamp>,
  #[serde(default)]
  pub cancelled: Option<bool>,
  pub status: CalendarItemStatus,
}

/// Subtarefa de uma responsabilidade.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Subtask {
  pub id: EntityId,
  pub title: String,
  #[serde(default)]
  pub done: bool,
  #[serde(default)]
  pub created_at: Option<Timestamp>,
}

/// Responsabilidade (compromisso com subtarefas) — entidade própria do
/// calendário, ligada à origem via `source`.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Responsibility {
  pub id: EntityId,
  pub title: String,
  pub commitment: CommitmentLevel,
  pub source: SourceRef,
  #[serde(default)]
  pub subtasks: Vec<Subtask>,
  #[serde(default)]
  pub due_date: Option<Timestamp>,
  #[serde(default)]
  pub notes: Option<String>,
  pub created_at: Timestamp,
  pub updated_at: Timestamp,
}

/// Bloco de planejamento (a faixa do calendário editorial/camada visual).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanningBlock {
  pub id: EntityId,
  pub title: String,
  pub start: Timestamp,
  #[serde(default)]
  pub end: Option<Timestamp>,
  pub status: CalendarItemStatus,
  pub origin: ModuleOrigin,
  #[serde(default)]
  pub kind: Option<String>,
}

/// Registro de execução (planejado × real).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionRecord {
  pub id: EntityId,
  pub date: Timestamp,
  #[serde(default)]
  pub planned_start: Option<Timestamp>,
  #[serde(default)]
  pub actual_start: Option<Timestamp>,
  #[serde(default)]
  pub actual_end: Option<Timestamp>,
  #[serde(default)]
  pub duration_minutes: Option<f64>,
  #[serde(default)]
  pub note: Option<String>,
}

/// Evento de calendário — projeção temporal; a origem (`source`) é dona do
/// conteúdo. Todo o detalhe de planejamento/execução é opcional.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
  pub id: EntityId,
  pub title: String,
  pub start: Timestamp,
  #[serde(default)]
  pub end: Option<Timestamp>,
  #[serde(default)]
  pub all_day: Option<bool>,
  #[serde(default)]
  pub recurrence: Option<RecurrenceRule>,
  #[serde(default)]
  pub occurrence: Option<Occurrence>,
  pub origin: ModuleOrigin,
  pub source: SourceRef,
  pub status: CalendarItemStatus,
  pub commitment: CommitmentLevel,
  #[serde(default)]
  pub planning: Option<Vec<PlanningBlock>>,
  #[serde(default)]
  pub execution: Option<Vec<ExecutionRecord>>,
}

pub struct ResponsibilityInput {
  pub title: String,
  pub commitment: Option<CommitmentLevel>,
  pub source: SourceRef,
  pub due_date: Option<Timestamp>,
  pub subtasks: Option<Vec<Subtask>>,
  pub notes: Option<String>,
}

/// Cria uma responsabilidade com defaults do contrato: compromisso
/// `Recomendado`, sem subtarefas, timestamps de criação iguais.
pub fn create_responsibility(input: ResponsibilityInput) -> Responsibility {
  let now = Timestamp::now();
  Responsibility {
    id: make_id("resp"),
    title: input.title,
    commitment: input.commitment.unwrap_or(CommitmentLevel::Recomendado),
    source: input.source,
    subtasks: input.subtasks.unwrap_or_default(),
    due_date: input.due_date,
    notes: input.notes,
    created_at: now.clone(),
    updated_at: now,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn source() -> SourceRef {
    SourceRef {
      module: ModuleOrigin::Faculdade,
      entity_id: EntityId::new("exam-1").unwrap(),
      kind: "exam".into(),
    }
  }

  #[test]
  fn opcionais_ausentes_lêem_como_none() {
    // Projeção parcial de uma fonte: só campos obrigatórios presentes.
    let json = r#"{"id":"resp-1","title":"prova","commitment":"importante","source":{"module":"faculdade","entityId":"exam-1","kind":"exam"},"createdAt":"2026-09-12T10:00:00.000Z","updatedAt":"2026-09-12T10:00:00.000Z"}"#;
    let r: Responsibility = serde_json::from_str(json).unwrap();
    assert_eq!(r.subtasks, vec![]);
    assert!(r.due_date.is_none());
    assert!(r.notes.is_none());
  }

  #[test]
  fn round_trip_com_todos_os_opcionais_preenchidos() {
    let mut r = create_responsibility(ResponsibilityInput {
      title: "estágio — paciente A".into(),
      commitment: Some(CommitmentLevel::Obrigatorio),
      source: source(),
      due_date: Some(Timestamp::now()),
      subtasks: Some(vec![Subtask {
        id: make_id("sub"),
        title: "relatório".into(),
        done: false,
        created_at: Some(Timestamp::now()),
      }]),
      notes: Some("anexar ficha".into()),
    });
    r.updated_at = r.created_at.clone();
    let json = serde_json::to_string(&r).unwrap();
    let back: Responsibility = serde_json::from_str(&json).unwrap();
    assert_eq!(r, back);
    assert!(json.contains("\"dueDate\""), "{json}");
    assert!(json.contains("\"createdAt\""), "{json}");
  }

  #[test]
  fn serde_nomeia_enum_de_origem_em_minusculo() {
    let e = CalendarEvent {
      id: make_id("evt"),
      title: "aula".into(),
      start: Timestamp::now(),
      end: None,
      all_day: None,
      recurrence: None,
      occurrence: None,
      origin: ModuleOrigin::Tcc,
      source: source(),
      status: CalendarItemStatus::EmAndamento,
      commitment: CommitmentLevel::Importante,
      planning: None,
      execution: None,
    };
    let json = serde_json::to_string(&e).unwrap();
    assert!(json.contains("\"origin\":\"tcc\""), "{json}");
    assert!(json.contains("\"status\":\"emAndamento\""), "{json}");
  }
}
