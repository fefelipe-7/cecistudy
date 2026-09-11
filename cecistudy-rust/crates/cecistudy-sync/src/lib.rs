//! cecistudy-sync — carimbos e merge LWW + protocolo de pacotes (porta de
//! `packages/sync`).
//!
//! Este crate:
//! - [`stamp`] — `SyncIndex` (stamps/records/tombstones), `empty_sync_index`,
//!   `apply_stamp_change`, `merge_indexes`, `tie_break`, `max_stamp` (1.17).
//!   (1.18 `merge` e 1.19 `provider` entram nas próximas tarefas do plano.)
//!
//! Regra: **funções puras, sem IO de rede aqui** — o provedor de transporte
//! (GitHub) será injetado na 1.19.

pub mod stamp;

pub use stamp::{
  RECORD_COLLECTION_KEYS, SET_COLLECTION_KEYS, SINGLE_COLLECTION_KEYS, SyncIndex,
  apply_stamp_change, empty_sync_index, max_stamp, merge_indexes, record_ts, tie_break,
  tombstone_ts,
};
