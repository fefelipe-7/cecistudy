//! cecistudy-common — fundação compartilhada de todos os crates.
//!
//! - [`error`]  — tipo de erro único (`Error`) com `thiserror`.
//! - [`id`]     — `EntityId` (newtype) + `make_id`/`prefix_of` (paridade com
//!   `packages/domain/src/core/domain/ids.ts`).
//! - [`time`]   — timestamps ISO 8601 UTC (`iso_now_ms`, civil-from-days).
//! - [`platform`] — `Platform` (`desktop`/`mobile`) — cross-cutting.
//! - [`json`]   — **canonical JSON v1** (`canonicalize`) — paridade byte a byte
//!   com `packages/contracts/src/canonical-json.ts`. Ver
//!   `cecistudy-rust/docs/canonical-json-v1.md`.

pub mod error;
pub mod id;
pub mod json;
pub mod platform;
pub mod time;

pub use error::{Error, Result};
pub use id::{EntityId, make_id, prefix_of};
pub use json::canonicalize;
pub use platform::Platform;
pub use time::{Timestamp, iso_now_ms, millis_since_epoch};
