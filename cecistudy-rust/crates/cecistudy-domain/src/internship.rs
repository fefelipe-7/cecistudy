//! Estágio e supervisão — agregado sobre `entity::InternshipLog` + caderno de
//! supervisão (tabela `supervision_notebook` do `schema.sql`) (R2, spec-first).
//!
//! As entidades persistidas já vivem em [`crate::entity`] (forma canonical do
//! golden `internshipLogs.json`); este módulo adiciona o **comportamento de
//! domínio**: caderno de supervisão tipado e agregações (horas, sessões,
//! fases) usadas pelo diário do estágio.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::entity::{InternshipLog, SupervisionSelfAssessment};
use cecistudy_common::make_id;

fn is_none<T>(v: &Option<T>) -> bool {
  v.is_none()
}

/// Caderno de supervisão — tabela `supervision_notebook` (id, date,
/// supervisor, `data_json` com este shape tipado).
#[derive(Clone, Debug, PartialEq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SupervisionNotebook {
  pub id: String,
  pub date: String,
  pub supervisor: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub before_notes: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub after_notes: Option<String>,
  #[serde(skip_serializing_if = "is_none")]
  pub discussed_log_ids: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub next_steps: Option<Vec<String>>,
  #[serde(skip_serializing_if = "is_none")]
  pub self_assessment: Option<SupervisionSelfAssessment>,
}

/// Resumo agregado do diário de estágio (horas por fase, contagens).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InternshipSummary {
  pub total_hours: f64,
  pub session_count: usize,
  pub supervision_count: usize,
  /// Horas acumuladas por fase (`phase` textual do registro; `sem-fase` quando ausente).
  pub by_phase: BTreeMap<String, f64>,
  pub last_date: Option<String>,
}

/// Próximo número de sessão (1.0 quando vazio; máximo + 1 caso contrário).
pub fn next_session_number(logs: &[InternshipLog]) -> f64 {
  logs
    .iter()
    .filter_map(|l| l.session_number)
    .fold(1.0_f64, |acc, n| if n >= acc { n + 1.0 } else { acc })
}

/// Agrega horas, contagens de sessão/supervisões e horas por fase.
pub fn summarise(logs: &[InternshipLog], notebooks: &[SupervisionNotebook]) -> InternshipSummary {
  let mut by_phase: BTreeMap<String, f64> = BTreeMap::new();
  for l in logs {
    *by_phase.entry(l.phase.as_deref().unwrap_or("sem-fase").to_owned()).or_insert(0.0) += l.hours;
  }
  InternshipSummary {
    total_hours: logs.iter().map(|l| l.hours).sum(),
    session_count: logs.len(),
    supervision_count: notebooks.len(),
    by_phase,
    last_date: logs.iter().filter_map(|l| l.date.clone()).max(),
  }
}

pub struct NotebookInput {
  pub date: String,
  pub supervisor: Option<String>,
  pub before_notes: Option<String>,
  pub after_notes: Option<String>,
  pub discussed_log_ids: Option<Vec<String>>,
  pub next_steps: Option<Vec<String>>,
  pub self_assessment: Option<SupervisionSelfAssessment>,
}

/// Cria um caderno de supervisão com id e datas do registro.
pub fn create_notebook(input: NotebookInput) -> SupervisionNotebook {
  SupervisionNotebook {
    id: make_id("sup-").to_string(),
    date: input.date,
    supervisor: input.supervisor,
    before_notes: input.before_notes,
    after_notes: input.after_notes,
    discussed_log_ids: input.discussed_log_ids,
    next_steps: input.next_steps,
    self_assessment: input.self_assessment,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn log(
    id: &str,
    hours: f64,
    phase: Option<&str>,
    session: Option<f64>,
    date: Option<&str>,
  ) -> InternshipLog {
    InternshipLog {
      id: id.into(),
      hours,
      phase: phase.map(str::to_owned),
      session_number: session,
      date: date.map(str::to_owned),
      ..Default::default()
    }
  }

  #[test]
  fn next_session_number_vazio_e_nao_vazio() {
    assert_eq!(next_session_number(&[]), 1.0);
    let logs = vec![
      log("a", 3.0, Some("intervenção"), Some(1.0), Some("2026-08-01")),
      log("b", 2.0, Some("intervenção"), Some(2.0), Some("2026-08-08")),
    ];
    assert_eq!(next_session_number(&logs), 3.0);
    let sem_numero = vec![log("c", 1.0, None, None, None)];
    assert_eq!(next_session_number(&sem_numero), 1.0);
  }

  #[test]
  fn summary_agrega_horas_sessoes_fases_e_data() {
    let logs = vec![
      log("a", 3.0, Some("intervenção"), Some(1.0), Some("2026-08-01")),
      log("b", 2.0, Some("intervenção"), Some(2.0), Some("2026-08-08")),
      log("c", 1.0, None, None, Some("2026-08-10")),
    ];
    let s = summarise(&logs, &[]);
    assert_eq!(s.total_hours, 6.0);
    assert_eq!(s.session_count, 3);
    assert_eq!(s.supervision_count, 0);
    assert_eq!(s.last_date.as_deref(), Some("2026-08-10"));
    assert_eq!(s.by_phase["intervenção"], 5.0);
    assert_eq!(s.by_phase["sem-fase"], 1.0);
  }

  #[test]
  fn notebook_round_trip_preserva_opcionais() {
    let n = create_notebook(NotebookInput {
      date: "2026-08-15".into(),
      supervisor: Some("psi. supervisora".into()),
      before_notes: None,
      after_notes: Some("evolução do caso".into()),
      discussed_log_ids: Some(vec!["a".into(), "b".into()]),
      next_steps: None,
      self_assessment: Some(SupervisionSelfAssessment { confidence: Some("boa".into()) }),
    });
    let json = serde_json::to_string(&n).unwrap();
    assert!(!json.contains("\"before_notes\""), "{json}");
    assert!(!json.contains("\"next_steps\""), "{json}");
    let back: SupervisionNotebook = serde_json::from_str(&json).unwrap();
    assert_eq!(n, back);
    assert!(back.self_assessment.is_some());
  }
}
