//! Identificadores de entidade — paridade funcional com
//! `packages/domain/src/core/domain/ids.ts`.
//!
//! Formato: `<prefixo>-<epochMs em base36>-<contador em base36>-<random6>`
//! (o formato é só legibilidade/hash; unicidade vem do contador + aleatoriedade).

use std::sync::atomic::{AtomicU64, Ordering};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::time::millis_since_epoch;

static COUNTER: AtomicU64 = AtomicU64::new(0);

/// Identificador estável e opaco de entidade (equivale ao `EntityId = string` do TS).
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct EntityId(pub String);

impl EntityId {
  /// Construtor a partir de uma string id; falha se vazia.
  pub fn new(raw: impl Into<String>) -> std::result::Result<Self, crate::Error> {
    let raw = raw.into();
    if raw.is_empty() { Err(crate::Error::InvalidEntityId(raw)) } else { Ok(Self(raw)) }
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }

  /// Prefixo da entidade (primeiro token antes de `-`), ex.: `doc`, `cal`.
  pub fn prefix(&self) -> Option<String> {
    prefix_of(&self.0)
  }
}

impl std::fmt::Display for EntityId {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.write_str(&self.0)
  }
}

/// Gera um id no formato `prefix-base36ms-base36counter-random6`.
pub fn make_id(prefix: &str) -> EntityId {
  let ms = millis_since_epoch();
  let counter = COUNTER.fetch_add(1, Ordering::Relaxed);
  let rand = Uuid::new_v4().simple().to_string();
  EntityId(format!("{}-{}-{}-{}", prefix, base36(ms), base36(counter), &rand[..6]))
}

/// Extrai o prefixo (ex.: `doc-...` → `doc`). `None` quando não há um separador `-`.
pub fn prefix_of(id: &str) -> Option<String> {
  let mut it = id.split('-');
  let first = it.next()?;
  if it.next().is_none() || first.is_empty() {
    return None;
  }
  Some(first.to_owned())
}

fn base36(mut n: u64) -> String {
  if n == 0 {
    return "0".to_owned();
  }
  const DIGITS: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyz";
  let mut buf = Vec::new();
  while n > 0 {
    buf.push(DIGITS[(n % 36) as usize]);
    n /= 36;
  }
  buf.reverse();
  String::from_utf8(buf).expect("base36 só gera bytes ASCII")
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn make_id_formato_e_prefixo() {
    let id = make_id("doc");
    assert!(id.as_str().starts_with("doc-"));
    assert_eq!(id.prefix(), Some("doc".to_owned()));
    assert_eq!(prefix_of("cal-abc-1"), Some("cal".to_owned()));
    assert_eq!(prefix_of("semhifen"), None);
    assert_eq!(prefix_of(""), None);
  }

  #[test]
  fn ids_sao_unicos() {
    let a = make_id("doc");
    let b = make_id("doc");
    assert_ne!(a, b);
  }

  #[test]
  fn entity_id_rejeita_vazio() {
    assert!(EntityId::new("").is_err());
    assert!(EntityId::new("doc-x").is_ok());
  }

  #[test]
  fn base36_roundtrip() {
    assert_eq!(base36(0), "0");
    assert_eq!(base36(35), "z");
    assert_eq!(base36(36), "10");
  }
}
