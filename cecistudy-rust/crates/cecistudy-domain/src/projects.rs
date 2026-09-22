//! Projetos acadêmicos (TCC) — projeto, árvore de seções, outputs e
//! referências (F1.6).
//!
//! Spec-first a partir de `spec/05-modulos-greenfield.md` e do
//! `01-task-breakdown-flutter-rust.md` (§3.2/1.6). Invariante central:
//! no máximo [`MAX_ACTIVE_PROJECTS`] projetos ativos por vez.

use serde::{Deserialize, Serialize};

use cecistudy_common::{EntityId, Timestamp, make_id};

/// Número máximo de projetos ativos simultâneos (invariante do contrato).
pub const MAX_ACTIVE_PROJECTS: usize = 5;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ProjectType {
  Tcc,
  Artigo,
  Monografia,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ProjectStatus {
  Ativo,
  Pausado,
  Concluido,
  Arquivado,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AcademicNodeKind {
  Capitulo,
  Secao,
  Subsecao,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Requiredness {
  Obrigatoria,
  Opcional,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
  Docx,
  Pdf,
  Latex,
  Markdown,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CitationProfile {
  Abnt,
  Vancouver,
  Apa,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ReferenceType {
  Livro,
  Artigo,
  Site,
  Norma,
  Outro,
}

/// Nó da árvore acadêmica (capítulo/seção/subseção).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AcademicNode {
  pub id: EntityId,
  pub kind: AcademicNodeKind,
  pub title: String,
  pub position: u32,
  pub requiredness: Requiredness,
  #[serde(default)]
  pub completed: bool,
  #[serde(default)]
  pub due_date: Option<Timestamp>,
  #[serde(default)]
  pub children: Vec<AcademicNode>,
}

/// Referência bibliográfica (ABNT inicial).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Reference {
  pub id: EntityId,
  pub kind: ReferenceType,
  pub raw: String,
  pub position: u32,
}

/// Citação dentro de um documento (aponta para uma referência).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Citation {
  pub id: EntityId,
  pub reference_id: EntityId,
  #[serde(default)]
  pub context: Option<String>,
  #[serde(default)]
  pub page: Option<String>,
  pub created_at: Timestamp,
}

/// Artefato produzido a partir de um projeto (exportação).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Output {
  pub id: EntityId,
  pub project_id: EntityId,
  pub format: OutputFormat,
  pub title: String,
  #[serde(default)]
  pub updated_at: Option<Timestamp>,
}

/// Projeto acadêmico — árvore de seções + outputs + referências.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
  pub id: EntityId,
  pub title: String,
  pub kind: ProjectType,
  pub status: ProjectStatus,
  pub citation_profile: CitationProfile,
  #[serde(default)]
  pub advisor: Option<String>,
  #[serde(default)]
  pub field: Option<String>,
  #[serde(default)]
  pub tree: Vec<AcademicNode>,
  #[serde(default)]
  pub outputs: Vec<Output>,
  #[serde(default)]
  pub references: Vec<Reference>,
  pub created_at: Timestamp,
  pub updated_at: Timestamp,
}

/// Conta os projetos **ativos** (`ProjectStatus::Ativo`).
pub fn active_project_count(projects: &[Project]) -> usize {
  projects.iter().filter(|p| p.status == ProjectStatus::Ativo).count()
}

/// `true` enquanto `active < MAX_ACTIVE_PROJECTS`.
pub fn can_add_project(active_count: usize) -> bool {
  active_count < MAX_ACTIVE_PROJECTS
}

fn tcc_chapter(id: &str, position: u32, title: &str) -> AcademicNode {
  AcademicNode {
    id: EntityId(id.to_owned()),
    kind: AcademicNodeKind::Capitulo,
    title: title.into(),
    position,
    requiredness: Requiredness::Obrigatoria,
    completed: false,
    due_date: None,
    children: vec![],
  }
}

/// Árvore TCC padrão (4 capítulos) — especificada em 1.6.
pub fn default_tcc_tree() -> Vec<AcademicNode> {
  vec![
    tcc_chapter("tcc-c1", 1, "introdução"),
    tcc_chapter("tcc-c2", 2, "revisão da literatura"),
    tcc_chapter("tcc-c3", 3, "método"),
    tcc_chapter("tcc-c4", 4, "resultados e discussão"),
  ]
}

pub struct ProjectInput<'a> {
  pub title: String,
  pub kind: Option<ProjectType>,
  pub citation_profile: Option<CitationProfile>,
  pub advisor: Option<String>,
  pub field: Option<String>,
  pub tree: Option<&'a [AcademicNode]>,
}

/// Cria um projeto **ativo**; para `kind == Tcc` (padrão) gera a árvore
/// TCC padrão (4 capítulos). Timestamps de criação iguais.
pub fn create_project(input: ProjectInput) -> Project {
  let now = Timestamp::now();
  let kind = input.kind.unwrap_or(ProjectType::Tcc);
  let tree = match input.tree {
    Some(t) => t.to_vec(),
    None if kind == ProjectType::Tcc => default_tcc_tree(),
    None => vec![],
  };
  Project {
    id: make_id("proj"),
    title: input.title,
    kind,
    status: ProjectStatus::Ativo,
    citation_profile: input.citation_profile.unwrap_or(CitationProfile::Abnt),
    advisor: input.advisor,
    field: input.field,
    tree,
    outputs: vec![],
    references: vec![],
    created_at: now.clone(),
    updated_at: now,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn can_add_project_0_4_5() {
    assert!(can_add_project(0));
    assert!(can_add_project(4));
    assert!(!can_add_project(5));
    assert!(!can_add_project(6));
  }

  #[test]
  fn active_project_count_conta_somente_ativos() {
    let mut p1 = create_project(ProjectInput {
      title: "tcc".into(),
      kind: None,
      citation_profile: None,
      advisor: None,
      field: None,
      tree: None,
    });
    p1.status = ProjectStatus::Pausado;
    let p2 = create_project(ProjectInput {
      title: "artigo".into(),
      kind: Some(ProjectType::Artigo),
      citation_profile: Some(CitationProfile::Vancouver),
      advisor: None,
      field: None,
      tree: Some(&[]),
    });
    let projects = vec![p1, p2];
    assert_eq!(active_project_count(&projects), 1);
    assert!(can_add_project(active_project_count(&projects)));
  }

  #[test]
  fn tcc_gera_arvore_padrao_de_4_capitulos() {
    let p = create_project(ProjectInput {
      title: "meu tcc".into(),
      kind: None,
      citation_profile: None,
      advisor: Some("profa. x".into()),
      field: None,
      tree: None,
    });
    assert_eq!(p.tree.len(), 4);
    assert!(p.tree.iter().all(|n| n.kind == AcademicNodeKind::Capitulo));
    assert_eq!((1..=4).collect::<Vec<_>>(), p.tree.iter().map(|n| n.position).collect::<Vec<_>>());
    assert!(p.tree.iter().all(|n| !n.completed));
    let back: Project = serde_json::from_str(&serde_json::to_string(&p).unwrap()).unwrap();
    assert_eq!(p, back);
  }
}
