//! Matriz de capacidades por plataforma — paridade com
//! `packages/domain/src/core/domain/capabilities.ts` (F1.8 → F0.5).
//!
//! A UI consulta a matriz (não espalha `if (isDesktop)`): para cada entidade x
//! plataforma decide projeção e ações.
//!
//! ⚠️ Entidades acadêmicas **legadas** (course, task, exam, classNote, flashcard,
//! reading, studySession, material, internshipLog, tcc, sticker, quizSession)
//! são **desktop-only** (D7): o mobile não muda — capability_for nelas com
//! `Platform::Mobile` retorna `None`.

use serde::{Deserialize, Serialize};

use cecistudy_common::Platform;

/// Construtor compacto das rows da matriz (evita 5 campos repetidos por linha).
macro_rules! cap {
  ($entity:ident, $platform:ident, $view:literal, $create:literal, $edit:literal, $delete:literal, $projection:ident) => {
    PlatformCapability {
      entity: CapabilityEntity::$entity,
      platform: Platform::$platform,
      can_view: $view,
      can_create: $create,
      can_edit: $edit,
      can_delete: $delete,
      projection: Projection::$projection,
    }
  };
}

/// Projeção de UI recomendada para uma entidade numa plataforma.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Projection {
  Compact,
  Standard,
  Rich,
}

/// Entidade sujeita à matriz de capacidades.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CapabilityEntity {
  Document,
  Concept,
  Relation,
  Event,
  Responsibility,
  Project,
  Output,
  ContentBase,
  Publication,
  // ---- entidades acadêmicas legadas (desktop-only; D7) ----
  Course,
  Task,
  Exam,
  ClassNote,
  Flashcard,
  Reading,
  StudySession,
  Material,
  InternshipLog,
  Tcc,
  Sticker,
  QuizSession,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct PlatformCapability {
  pub entity: CapabilityEntity,
  pub platform: Platform,
  pub can_view: bool,
  pub can_create: bool,
  pub can_edit: bool,
  pub can_delete: bool,
  pub projection: Projection,
}

/// Matriz padrão (espelho do `DEFAULT_CAPABILITIES` do TS). Desktop edita tudo;
/// mobile é captura/consulta para as noves entidades principais e **não** tem
/// rows para as legadas.
pub static DEFAULT_CAPABILITIES: &[PlatformCapability] = &[
  // platform primárias (nove) — desktop e mobile
  cap!(Document, Desktop, true, true, true, true, Rich),
  cap!(Document, Mobile, true, true, true, false, Standard),
  cap!(Concept, Desktop, true, true, true, true, Rich),
  cap!(Concept, Mobile, true, false, false, false, Compact),
  cap!(Relation, Desktop, true, true, true, true, Rich),
  cap!(Relation, Mobile, true, false, false, false, Compact),
  cap!(Event, Desktop, true, true, true, true, Standard),
  cap!(Event, Mobile, true, true, true, false, Compact),
  cap!(Responsibility, Desktop, true, true, true, true, Standard),
  cap!(Responsibility, Mobile, true, true, true, false, Compact),
  cap!(Project, Desktop, true, true, true, true, Rich),
  cap!(Project, Mobile, true, false, false, false, Compact),
  cap!(Output, Desktop, true, true, true, true, Rich),
  cap!(Output, Mobile, true, false, false, false, Compact),
  cap!(ContentBase, Desktop, true, true, true, true, Standard),
  cap!(ContentBase, Mobile, true, true, true, false, Compact),
  cap!(Publication, Desktop, true, true, true, true, Standard),
  cap!(Publication, Mobile, true, false, false, false, Compact),
  // ---- acadêmicas legadas: desktop-only (CRUD completo; D7) ----
  cap!(Course, Desktop, true, true, true, true, Rich),
  cap!(Task, Desktop, true, true, true, true, Standard),
  cap!(Exam, Desktop, true, true, true, true, Standard),
  cap!(ClassNote, Desktop, true, true, true, true, Rich),
  cap!(Flashcard, Desktop, true, true, true, true, Standard),
  cap!(Reading, Desktop, true, true, true, true, Standard),
  cap!(StudySession, Desktop, true, true, true, true, Standard),
  cap!(Material, Desktop, true, true, true, true, Standard),
  cap!(InternshipLog, Desktop, true, true, true, true, Rich),
  cap!(Tcc, Desktop, true, true, true, true, Rich),
  cap!(Sticker, Desktop, true, true, true, true, Compact),
  cap!(QuizSession, Desktop, true, true, true, true, Standard),
];

/// Procura a capacidade `(entidade, plataforma)` — espelho de `capabilityFor`.
pub fn capability_for(entity: CapabilityEntity, platform: Platform) -> Option<PlatformCapability> {
  DEFAULT_CAPABILITIES.iter().copied().find(|c| c.entity == entity && c.platform == platform)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn desktop_legado_tem_crud_completo() {
    for e in [
      CapabilityEntity::Course,
      CapabilityEntity::Task,
      CapabilityEntity::Exam,
      CapabilityEntity::ClassNote,
      CapabilityEntity::Flashcard,
      CapabilityEntity::Reading,
      CapabilityEntity::StudySession,
      CapabilityEntity::Material,
      CapabilityEntity::InternshipLog,
      CapabilityEntity::Tcc,
      CapabilityEntity::Sticker,
      CapabilityEntity::QuizSession,
    ] {
      let c = capability_for(e, Platform::Desktop).expect("legado desktop deve ter row");
      assert!(c.can_view && c.can_create && c.can_edit && c.can_delete, "{e:?}");
      assert_eq!(
        c.projection,
        match e {
          CapabilityEntity::Course
          | CapabilityEntity::ClassNote
          | CapabilityEntity::InternshipLog
          | CapabilityEntity::Tcc => Projection::Rich,
          CapabilityEntity::Sticker => Projection::Compact,
          _ => Projection::Standard,
        }
      );
      assert!(
        capability_for(e, Platform::Mobile).is_none(),
        "legado {e:?} NÃO deve ter row mobile (D7)"
      );
    }
  }

  #[test]
  fn mobile_captura_consulta_novo() {
    assert_eq!(
      capability_for(CapabilityEntity::Document, Platform::Mobile).unwrap().projection,
      Projection::Standard
    );
    assert!(!capability_for(CapabilityEntity::Concept, Platform::Mobile).unwrap().can_create);
    assert!(capability_for(CapabilityEntity::Concept, Platform::Desktop).unwrap().can_delete);
    assert!(capability_for(CapabilityEntity::Publication, Platform::Mobile).unwrap().can_view);
    assert!(!capability_for(CapabilityEntity::Publication, Platform::Mobile).unwrap().can_create);
  }

  #[test]
  fn serde_alinhado_ao_ts() {
    let cap = capability_for(CapabilityEntity::ContentBase, Platform::Mobile).unwrap();
    let json = serde_json::to_string(&cap).unwrap();
    assert!(json.contains("\"contentBase\""), "camelCase: {json}");
    assert!(json.contains("\"mobile\""), "lowercase: {json}");
    let back: PlatformCapability = serde_json::from_str(&json).unwrap();
    assert_eq!(cap, back);
  }
}
