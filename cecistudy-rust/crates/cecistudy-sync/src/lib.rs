//! cecistudy-sync — carimbos e merge LWW + protocolo de pacotes + provedores
//! (porta de `packages/sync`).
//!
//! Este crate:
//! - [`stamp`] — `SyncIndex` (stamps/records/tombstones), `empty_sync_index`,
//!   `apply_stamp_change`, `merge_indexes`, `tie_break`, `max_stamp` (1.17).
//! - [`merge`] — merge LWW bidirecional de bancos (1.18).
//! - [`provider`] — contrato de provider: `SyncManifest`/`SyncPackage`/
//!   `SyncRemotePackage`, `SyncProvider` trait (CAS via sha), `hash_content`.
//! - [`providers`] — transportes: [`providers::github::GitHubSyncProvider`]
//!   via `reqwest` (1.19).
//!
//! Regra: **funções puras** para o protocolo; o transporte I/O (GitHub) mora
//! nos provedores e recebe o token via injeção de dependência.

pub mod merge;
pub mod provider;
pub mod providers;
pub mod stamp;

pub use merge::{MergeResult, MergeStatsSide, merge_synced_databases};
pub use provider::{
  SYNC_PROTOCOL_VERSION, SyncManifest, SyncPackage, SyncProvider, SyncProviderError,
  SyncProviderErrorKind, SyncRemotePackage, UploadResult, hash_content,
};
pub use providers::github::{DEFAULT_PATH, GitHubSyncConfig, GitHubSyncProvider};
pub use stamp::{
  RECORD_COLLECTION_KEYS, SET_COLLECTION_KEYS, SINGLE_COLLECTION_KEYS, SyncIndex,
  apply_stamp_change, empty_sync_index, max_stamp, merge_indexes, record_ts, tie_break,
  tombstone_ts,
};
