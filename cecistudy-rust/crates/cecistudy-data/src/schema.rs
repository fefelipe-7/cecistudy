//! Aplicação e verificação do DDL canônico (paridade com
//! `cecistudy-rust/contracts/verify-schema.mjs`).

use rusqlite::Connection;

use cecistudy_common::Error;

/// Converte erros do `rusqlite` para nossa `Error::Database`.
pub(crate) fn db_err(e: rusqlite::Error) -> Error {
  Error::Database(e.to_string())
}

/// DDL canônico embutido (contrato; nunca duplicar conteúdo manualmente).
pub const SCHEMA_SQL: &str = include_str!("../../../contracts/schema.sql");

/// Número de tabelas distintas criadas pelo `schema.sql` (36 user + 14 catálogo
/// − 2 sobrepostas `concept`/`technique` = 48) — como reporta o `.mjs`.
pub const EXPECTED_TABLES_COUNT: usize = 48;

/// Tabelas esperadas do banco da usuária (espelho do `.mjs`).
pub const EXPECTED_USER_TABLES: &[&str] = &[
  "profile",
  "course",
  "course_schedule",
  "class_note",
  "class_note_link",
  "task",
  "task_link",
  "assessment",
  "assessment_topic",
  "study_session",
  "flashcard",
  "reading",
  "reading_highlight",
  "reading_progress",
  "author",
  "concept",
  "concept_course",
  "concept_author",
  "material",
  "technique",
  "note",
  "note_link",
  "internship",
  "internship_concept",
  "internship_topic",
  "supervision_notebook",
  "thesis_project",
  "thesis_chapter",
  "thesis_reference",
  "achievement",
  "quiz_session",
  "quiz_answer",
  "saved_catalog_item",
  "streak",
  "activity_event",
  "legacy_import_map",
];

/// Tabelas esperadas do catálogo (espelho do `.mjs`).
pub const EXPECTED_CATALOG_TABLES: &[&str] = &[
  "catalog_release",
  "area",
  "approach_family",
  "approach",
  "question",
  "work",
  "concept_domain",
  "concept",
  "catalog_author",
  "technique_category",
  "technique",
  "comparison",
  "question_category",
  "topic",
];

/// Aplica o `schema.sql` completo (idempotente — `IF NOT EXISTS`).
///
/// Como no `.mjs`, o DDL declara os DOIS bancos lógicos num só arquivo; aplicá-lo
/// inteiro ao banco da usuária também cria as tabelas de catálogo (inaplicáveis,
/// mas inofensivas). O catálogo *real* desktop usa o `.db` embutido (read-only).
pub fn apply_schema(conn: &Connection) -> Result<(), Error> {
  conn.execute_batch(SCHEMA_SQL).map_err(|e| Error::Database(format!("schema.sql: {e}")))
}

/// Verifica completude/tipos das tabelas esperadas (espelho do `.mjs`).
///
/// Retorna o número total de tabelas distintas (48 esperado).
pub fn verify_schema(conn: &Connection) -> Result<usize, Error> {
  let mut stmt = conn
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .map_err(db_err)?;
  let rows = stmt.query_map([], |row| row.get::<_, String>(0)).map_err(db_err)?;

  let mut present = std::collections::BTreeSet::new();
  for name in rows {
    present.insert(name.map_err(db_err)?);
  }

  for expected in EXPECTED_USER_TABLES.iter().chain(EXPECTED_CATALOG_TABLES) {
    if !present.contains(*expected) {
      return Err(Error::Database(format!("tabela esperada ausente: {expected}")));
    }
  }
  Ok(present.len())
}

/// Lê `PRAGMA user_version` (0 num banco virgem; migrações incrementais usam
/// isso para decidir quantos passos de `1→13` aplicar).
pub fn user_version(conn: &Connection) -> Result<i64, Error> {
  conn.query_row("PRAGMA user_version", [], |row| row.get(0)).map_err(db_err)
}

#[cfg(test)]
mod tests {
  use super::*;

  fn mem() -> Connection {
    Connection::open_in_memory().expect("sqlite em memória")
  }

  #[test]
  fn schema_aplica_e_verifica_48_tabelas() {
    let conn = mem();
    apply_schema(&conn).expect("schema.sql deve rodar limpo");
    let count = verify_schema(&conn).expect("todas as tabelas esperadas");
    assert_eq!(count, EXPECTED_TABLES_COUNT);
  }

  #[test]
  fn schema_e_idempotente() {
    let conn = mem();
    apply_schema(&conn).unwrap();
    apply_schema(&conn).expect("IF NOT EXISTS → reaplicar não pode falhar");
    assert_eq!(verify_schema(&conn).unwrap(), EXPECTED_TABLES_COUNT);
  }

  #[test]
  fn tabelas_de_projecao_tem_colunas_scalares() {
    let conn = mem();
    apply_schema(&conn).unwrap();

    let has_col = |table: &str, col: &str| -> bool {
      conn.prepare(&format!("SELECT {col} FROM {table}")).is_ok()
    };
    assert!(has_col("course", "data_json"));
    assert!(has_col("task", "completed"));
    assert!(has_col("reading_progress", "pages"));
    assert!(has_col("activity_event", "event_type"));
    assert!(!has_col("profile", "data_json_inexistente"));
  }

  #[test]
  fn user_version_banco_virgem() {
    let conn = mem();
    assert_eq!(user_version(&conn).expect("leitura"), 0);
    conn.execute_batch("PRAGMA user_version = 13").unwrap();
    assert_eq!(user_version(&conn).unwrap(), 13);
  }
}
