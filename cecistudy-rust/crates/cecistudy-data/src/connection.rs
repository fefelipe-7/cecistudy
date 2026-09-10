//! Conexões SQLite: banco da usuária (single-writer) e catálogo (read-only).

use std::path::Path;

use rusqlite::{Connection, OpenFlags};

use cecistudy_common::Error;

use crate::schema::{apply_schema, db_err, verify_schema};

/// Banco da usuária — a única conexão de escrita (single-writer; WAL).
///
/// Cria o arquivo se necessário, aplica o DDL canônico (idempotente) e configura
/// o modo de diário para escrita serializada.
#[derive(Debug)]
pub struct UserDb {
  conn: Connection,
}

impl UserDb {
  /// Abre/cria o banco da usuária em `path`, aplicando o `schema.sql`.
  pub fn open(path: impl AsRef<Path>) -> Result<Self, Error> {
    let path = path.as_ref();
    let parent = path.parent().expect("caminho com pai");
    std::fs::create_dir_all(parent)
      .map_err(|e| Error::Database(format!("mkdir {parent:?}: {e}")))?;

    let conn = Connection::open(path).map_err(db_err)?;
    let db = Self::prepare(conn)?;
    Ok(db)
  }

  /// Banco em memória (testes) com o mesmo DDL aplicado.
  pub fn in_memory() -> Result<Self, Error> {
    let conn = Connection::open_in_memory().map_err(db_err)?;
    Self::prepare(conn)
  }

  fn prepare(conn: Connection) -> Result<Self, Error> {
    apply_schema(&conn)?;
    conn.pragma_update(None, "journal_mode", "WAL").map_err(db_err)?;
    conn.pragma_update(None, "synchronous", "NORMAL").map_err(db_err)?;
    Ok(Self { conn })
  }

  pub fn connection(&self) -> &Connection {
    &self.conn
  }

  /// Verifica a integridade do DDL contra o contrato (48 tabelas).
  pub fn verify(&self) -> Result<usize, Error> {
    verify_schema(&self.conn)
  }
}

/// Catálogo somente-leitura — abre o `.db` embutido (nunca cria nem escreve).
#[derive(Debug)]
pub struct CatalogDb {
  conn: Connection,
}

impl CatalogDb {
  /// Abre o catálogo em modo `SQLITE_OPEN_READ_ONLY`. Falha se o arquivo não
  /// existir (catálogo desktop é asset de release).
  pub fn open_readonly(path: impl AsRef<Path>) -> Result<Self, Error> {
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
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn user_db_in_memory_aplica_schema() {
    let db = UserDb::in_memory().expect("banco em memória");
    assert_eq!(db.verify().unwrap(), crate::schema::EXPECTED_TABLES_COUNT);
  }

  #[test]
  fn inserts_escalares_e_data_json() {
    let db = UserDb::in_memory().unwrap();
    let conn = db.connection();
    conn
      .execute(
        "INSERT INTO course (id, name, semester, data_json) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![
          "c-1",
          "psicodiagnóstico",
          "3",
          r#"{"id":"c-1","name":"psicodiagnóstico"}"#
        ],
      )
      .unwrap();
    let n: i64 = conn.query_row("SELECT COUNT(*) FROM course", [], |r| r.get(0)).unwrap();
    assert_eq!(n, 1);
    let name: String =
      conn.query_row("SELECT name FROM course WHERE id = 'c-1'", [], |r| r.get(0)).unwrap();
    assert_eq!(name, "psicodiagnóstico");
  }

  #[test]
  fn catalog_readonly_tmp_file() {
    let dir = std::env::temp_dir();
    let path = dir.join(format!("cecistudy-catalog-test-{}.db", std::process::id()));
    // Catálogo mínimo com a tabela singleton de release.
    let conn = Connection::open(&path).unwrap();
    conn
      .execute_batch(
        "CREATE TABLE IF NOT EXISTS catalog_release (
           id INTEGER PRIMARY KEY CHECK (id = 1),
           version TEXT NOT NULL,
           content_hash TEXT NOT NULL,
           built_at TEXT NOT NULL,
           source_schema_version INTEGER NOT NULL
         );
         INSERT INTO catalog_release (id, version, content_hash, built_at, source_schema_version)
           VALUES (1, '1.2.3', 'abc', '2026-01-01T00:00:00.000Z', 13);",
      )
      .unwrap();
    drop(conn);

    let cat = CatalogDb::open_readonly(&path).expect("abre read-only");
    let version: String =
      cat.connection().query_row("SELECT version FROM catalog_release", [], |r| r.get(0)).unwrap();
    assert_eq!(version, "1.2.3");

    // Read-only: escrever deve falhar.
    let write_fails = cat
      .connection()
      .execute("INSERT INTO catalog_release VALUES (1, 'x','x','x',0)", [])
      .is_err();
    assert!(write_fails, "banco somente-leitura não aceita escrita");
    drop(cat);
    let _ = std::fs::remove_file(&path);
  }
}
