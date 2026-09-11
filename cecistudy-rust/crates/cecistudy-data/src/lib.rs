//! cecistudy-data — banco da usuária (SQLite via `rusqlite`, single-writer).
//!
//! O DDL canônico vive em `contracts/schema.sql` (fonte da verdade; verificado
//! por `verify-schema.mjs`). Este crate:
//! - [`schema`] — embute o `.sql`, aplica (idempotente) e verifica completude
//!   (espelho do `.mjs`: SCHEMA_VERSION do header vs `packages/data/src/schema.ts`).
//! - [`migrations`] — migrações de payload JSON 1→13 (porta fiel das do TS).
//! - [`connection`] — `UserDb` (abre/cria, pragmas single-writer) e `CatalogDb`
//!   (somente-leitura, abrindo o `.db` embutido do catálogo).
//! - [`backup`] — envelope v2 (`cecistudy-user-backup`): build/parse (com
//!   migração) + serialização canônica.
//! - [`payload`] — validação por coleção (porta do `backupSchema` Zod) e
//!   import validado.
//! - [`repositories`] — CRUD por coleção na base da usuária (porta do
//!   normalize.ts).

pub mod backup;
pub mod connection;
pub mod migrations;
pub mod payload;
pub mod repositories;
pub mod schema;

pub use backup::{BackupV2, build_backup, parse_backup};
pub use connection::{CatalogDb, UserDb};
pub use migrations::{SCHEMA_VERSION, apply_step, migrate};
pub use payload::{import_backup, validate_payload};
pub use repositories::{
  USER_COLLECTION_KEYS, is_user_collection_key, load_all_collections, load_collection,
  save_collection,
};
pub use schema::{
  EXPECTED_CATALOG_TABLES, EXPECTED_TABLES_COUNT, EXPECTED_USER_TABLES, apply_schema, verify_schema,
};
