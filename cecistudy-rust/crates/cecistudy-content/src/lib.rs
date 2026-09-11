//! cecistudy-content — catálogo de conhecimento (SQLite somente-leitura).
//!
//! Abre o `.db` do catálogo gerado pela pipeline editorial (`npm run
//! content:build`, embutido em `public/assets/databases/` no nativo) em modo
//! `SQLITE_OPEN_READ_ONLY` e expõe queries read-only de alto nível — porta
//! fiel de `src/lib/db/catalogDb.ts`. A fonte na web é o facade JS; aqui o
//! `.db` é a fonte única e o crate nunca escreve.

use std::path::Path;

use rusqlite::{Connection, OpenFlags};
use serde::{Deserialize, Serialize};

use cecistudy_common::{Error, Result};

fn db_err(e: rusqlite::Error) -> Error {
  Error::Database(e.to_string())
}

/// Coleta as linhas de um `query_map` convertendo erros de SQLite em `Error`.
fn collect_rows<T>(rows: impl Iterator<Item = rusqlite::Result<T>>) -> Result<Vec<T>> {
  let mut out = Vec::new();
  for row in rows {
    out.push(row.map_err(db_err)?);
  }
  Ok(out)
}

/// Prepara `sql` com `params` e mapeia cada linha via `map`.
fn query_rows<T>(
  conn: &Connection,
  sql: &str,
  params: impl rusqlite::Params,
  map: impl FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<T>,
) -> Result<Vec<T>> {
  let mut stmt = conn.prepare(sql).map_err(db_err)?;
  let rows = stmt.query_map(params, map).map_err(db_err)?;
  collect_rows(rows)
}

/// Lê a coluna `data_json` de uma linha e desserializa em [`serde_json::Value`].
fn data_json_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<serde_json::Value> {
  let raw: String = row.get("data_json")?;
  serde_json::from_str(&raw).map_err(|e| {
    rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e))
  })
}

/// Versão do release do catálogo (registro `catalog_release`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CatalogReleaseInfo {
  pub version: String,
  pub content_hash: String,
  pub built_at: String,
}

/// Domínio de conceitos (linha de `concept_domain`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ConceptDomain {
  pub id: String,
  pub name: String,
}

/// Entrada leve do índice de conceitos (sem o corpo — vem de `data_json`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ConceptIndexEntry {
  pub id: String,
  pub name: String,
  pub domain_id: String,
  pub domain_name: Option<String>,
}

/// Categoria de técnicas (linha de `technique_category` — a tabela não tem
/// `data_json`; as técnicas carregam o corpo em `technique.data_json`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TechniqueCategory {
  pub id: String,
  pub name: String,
  pub description: Option<String>,
  pub display_order: i64,
}

/// Catálogo de conhecimento — abre o `.db` embutido somente-leitura.
#[derive(Debug)]
pub struct CatalogDb {
  conn: Connection,
}

impl CatalogDb {
  /// Abre o catálogo em modo `SQLITE_OPEN_READ_ONLY`. Falha se o arquivo não
  /// existir — o catálogo é um asset de release, nunca criado aqui.
  pub fn open_read_only(path: impl AsRef<Path>) -> Result<Self> {
    let conn = Connection::open_with_flags(
      path.as_ref(),
      OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(db_err)?;
    Ok(Self { conn })
  }

  pub fn connection(&self) -> &Connection {
    &self.conn
  }

  /// Executa uma consulta que devolve linhas `data_json`.
  fn prepare_data_json(
    &self,
    sql: &str,
    params: impl rusqlite::Params,
  ) -> Result<Vec<serde_json::Value>> {
    let mut stmt = self.conn.prepare(sql).map_err(db_err)?;
    let rows = stmt.query_map(params, data_json_row).map_err(db_err)?;
    collect_rows(rows)
  }

  /// Versionamento do release (`catalog_release` id=1); `None` se ausente.
  pub fn release_info(&self) -> Result<Option<CatalogReleaseInfo>> {
    let mut stmt = self
      .conn
      .prepare("SELECT version, content_hash, built_at FROM catalog_release WHERE id = 1")
      .map_err(db_err)?;
    let mut rows = stmt.query([]).map_err(db_err)?;
    match rows.next().map_err(db_err)? {
      Some(row) => Ok(Some(CatalogReleaseInfo {
        version: row.get("version").map_err(db_err)?,
        content_hash: row.get("content_hash").map_err(db_err)?,
        built_at: row.get("built_at").map_err(db_err)?,
      })),
      None => Ok(None),
    }
  }

  /// Todas as abordagens (97), em ordem de exibição (`sort_order`).
  pub fn approaches(&self) -> Result<Vec<serde_json::Value>> {
    self.prepare_data_json("SELECT data_json FROM approach ORDER BY sort_order", [])
  }

  /// Todas as questões do banco (3.002), sem filtro.
  pub fn questions(&self) -> Result<Vec<serde_json::Value>> {
    self.prepare_data_json("SELECT data_json FROM question", [])
  }

  /// Obras da biblioteca por tipo (coluna `type`: catalog | interdisciplinary | article).
  pub fn works_by_type(&self, kind: &str) -> Result<Vec<serde_json::Value>> {
    self.prepare_data_json("SELECT data_json FROM work WHERE type = ?1", [kind])
  }

  /// Domínios de conceitos (12), em ordem de exibição.
  pub fn concept_domains(&self) -> Result<Vec<ConceptDomain>> {
    query_rows(
      &self.conn,
      "SELECT id, name FROM concept_domain ORDER BY display_order",
      [],
      |row| Ok(ConceptDomain { id: row.get("id")?, name: row.get("name")? }),
    )
  }

  /// Índice leve dos conceitos (sem o corpo — `data_json` fica no detalhe).
  pub fn concept_index(&self) -> Result<Vec<ConceptIndexEntry>> {
    query_rows(
      &self.conn,
      "SELECT c.id, c.name, c.domain_id, d.name AS domain_name
       FROM concept c
       JOIN concept_domain d ON d.id = c.domain_id
       ORDER BY d.display_order, c.display_order",
      [],
      |row| {
        Ok(ConceptIndexEntry {
          id: row.get("id")?,
          name: row.get("name")?,
          domain_id: row.get("domain_id")?,
          domain_name: row.get("domain_name")?,
        })
      },
    )
  }

  /// Conceitos de um domínio, com corpo completo (`data_json`).
  pub fn concepts_by_domain(&self, domain_id: &str) -> Result<Vec<serde_json::Value>> {
    query_rows(
      &self.conn,
      "SELECT data_json FROM concept WHERE domain_id = ?1 ORDER BY display_order",
      [domain_id],
      data_json_row,
    )
  }

  /// Um conceito pelo id, com corpo completo; `None` se não existir.
  pub fn concept(&self, id: &str) -> Result<Option<serde_json::Value>> {
    let mut stmt =
      self.conn.prepare("SELECT data_json FROM concept WHERE id = ?1").map_err(db_err)?;
    let mut rows = stmt.query([id]).map_err(db_err)?;
    match rows.next().map_err(db_err)? {
      Some(row) => {
        let raw: String = row.get("data_json").map_err(db_err)?;
        Ok(Some(serde_json::from_str(&raw).map_err(Error::json)?))
      }
      None => Ok(None),
    }
  }

  /// Autores curados (person + institution), mais citados primeiro.
  pub fn authors(&self) -> Result<Vec<serde_json::Value>> {
    query_rows(
      &self.conn,
      "SELECT data_json FROM catalog_author ORDER BY question_count DESC, name ASC",
      [],
      data_json_row,
    )
  }

  /// Categorias de técnicas (10), em ordem de exibição.
  pub fn technique_categories(&self) -> Result<Vec<TechniqueCategory>> {
    query_rows(
      &self.conn,
      "SELECT id, name, description, display_order
       FROM technique_category ORDER BY display_order",
      [],
      |row| {
        Ok(TechniqueCategory {
          id: row.get("id")?,
          name: row.get("name")?,
          description: row.get("description")?,
          display_order: row.get("display_order")?,
        })
      },
    )
  }

  /// Técnicas canônicas (136), ou só as de uma categoria.
  pub fn techniques(&self, category_id: Option<&str>) -> Result<Vec<serde_json::Value>> {
    match category_id {
      Some(cat) => self.prepare_data_json(
        "SELECT data_json FROM technique WHERE category_id = ?1 ORDER BY display_order",
        [cat],
      ),
      None => self.prepare_data_json(
        "SELECT t.data_json FROM technique t
         JOIN technique_category c ON c.id = t.category_id
         ORDER BY c.display_order, t.display_order",
        [],
      ),
    }
  }

  /// Comparações editoriais, na ordem de prioridade (P1), fase e id.
  pub fn comparisons(&self) -> Result<Vec<serde_json::Value>> {
    query_rows(
      &self.conn,
      "SELECT data_json FROM comparison
       ORDER BY CASE priority WHEN 'P1' THEN 0 ELSE 1 END, phase ASC, id ASC",
      [],
      data_json_row,
    )
  }

  /// Uma comparação editorial pelo slug; `None` se não existir.
  pub fn comparison_by_slug(&self, slug: &str) -> Result<Option<serde_json::Value>> {
    let mut stmt =
      self.conn.prepare("SELECT data_json FROM comparison WHERE slug = ?1").map_err(db_err)?;
    let mut rows = stmt.query([slug]).map_err(db_err)?;
    match rows.next().map_err(db_err)? {
      Some(row) => {
        let raw: String = row.get("data_json").map_err(db_err)?;
        Ok(Some(serde_json::from_str(&raw).map_err(Error::json)?))
      }
      None => Ok(None),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const CATALOG_DB: &str =
    concat!(env!("CARGO_MANIFEST_DIR"), "/../../../public/assets/databases/cecistudy_catalog.db");

  fn catalog() -> CatalogDb {
    CatalogDb::open_read_only(CATALOG_DB).expect("abre o .db real do catálogo")
  }

  #[test]
  fn release_info_bate_com_o_version_manifest() {
    let db = catalog();
    let info = db.release_info().unwrap().expect("release presente");
    assert_eq!(info.version, "2026.08.24.1");
    assert!(info.content_hash.len() == 64, "sha256 hex");
    assert!(!info.built_at.is_empty());
  }

  #[test]
  fn cardeais_do_catalogo() {
    let db = catalog();
    assert_eq!(db.approaches().unwrap().len(), 97);
    assert_eq!(db.questions().unwrap().len(), 3002);
    assert_eq!(db.authors().unwrap().len(), 139);
    assert_eq!(db.techniques(None).unwrap().len(), 136);
    assert_eq!(db.comparisons().unwrap().len(), 130);
  }

  #[test]
  fn templo_dominios_indices_e_categorias() {
    let db = catalog();
    assert_eq!(db.concept_domains().unwrap().len(), 12);
    assert_eq!(db.concept_index().unwrap().len(), 225);
    assert_eq!(
      db.concepts_by_domain("domain-01-fundamentos-psicologicos").unwrap().len(),
      15,
      "primeiro domínio tem 15 conceitos"
    );

    let cats = db.technique_categories().unwrap();
    assert_eq!(cats.len(), 10);
    assert!(cats.iter().any(|c| c.name == "Técnicas Cognitivas"));
  }

  #[test]
  fn obras_por_tipo() {
    let db = catalog();
    let works = db.works_by_type("article").unwrap();
    assert_eq!(works.len(), 150);
  }

  #[test]
  fn técnicas_partem_as_categorias() {
    let db = catalog();
    let cats = db.technique_categories().unwrap();
    let all = db.techniques(None).unwrap();
    let por_cat: usize = cats.iter().map(|c| db.techniques(Some(&c.id)).unwrap().len()).sum();
    assert_eq!(por_cat, all.len(), "técnicas particionam por categoria");
  }

  #[test]
  fn conceito_por_id_e_comparacao_por_slug() {
    let db = catalog();
    let idx = db.concept_index().unwrap();
    let body = db.concept(&idx[0].id).unwrap().expect("conceito existe");
    assert!(body.get("name").is_some());
    assert_eq!(db.concept("nao-existe").unwrap(), None);

    let comparisons = db.comparisons().unwrap();
    let slug = comparisons
      .first()
      .and_then(|c| c.get("slug").and_then(|s| s.as_str()))
      .expect("comparação tem slug");
    assert!(db.comparison_by_slug(slug).unwrap().is_some());
    assert_eq!(db.comparison_by_slug("nao-existe").unwrap(), None);
  }

  #[test]
  fn banco_aberto_read_only_recusa_escrita() {
    let db = catalog();
    let write_fails = db.connection().execute("CREATE TABLE x (id INT)", []).is_err();
    assert!(write_fails, "catálogo é somente-leitura");
  }
}
