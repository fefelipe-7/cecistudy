//! Timestamps ISO 8601 UTC — `YYYY-MM-DDTHH:MM:SS.mmmZ` (formato de
//! `Date.toISOString()` do JS; paridade com o formato dos dados persistidos).

use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

/// Marca temporal em formato ISO 8601 UTC com millis (`2026-09-10T12:00:00.000Z`).
#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Timestamp(String);

impl Timestamp {
  pub fn now() -> Self {
    Timestamp(iso_now_ms())
  }

  pub fn as_str(&self) -> &str {
    &self.0
  }
}

impl TryFrom<String> for Timestamp {
  type Error = crate::Error;
  fn try_from(s: String) -> std::result::Result<Self, Self::Error> {
    if s.is_empty() { Err(crate::Error::InvalidTimestamp(s)) } else { Ok(Timestamp(s)) }
  }
}

impl From<Timestamp> for String {
  fn from(t: Timestamp) -> Self {
    t.0
  }
}

impl std::fmt::Display for Timestamp {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.write_str(&self.0)
  }
}

/// Milissegundos desde a época Unix (UTC).
pub fn millis_since_epoch() -> u64 {
  SystemTime::now().duration_since(UNIX_EPOCH).expect("relógio antes da época Unix").as_millis()
    as u64
}

/// Timestamp atual no formato ISO 8601 UTC com 3 dígitos de milissegundos.
pub fn iso_now_ms() -> String {
  let ms = millis_since_epoch();
  let (secs, msecs) = (ms / 1000, ms % 1000);
  let days = (secs / 86_400) as i64;
  let secs_of_day = secs % 86_400;
  let (y, mo, d) = civil_from_days(days);
  let (hh, mi, ss) = (secs_of_day / 3600, (secs_of_day % 3600) / 60, secs_of_day % 60);
  format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z", y, mo, d, hh, mi, ss, msecs)
}

/// Converte dias desde 1970-01-01 (civil) em (ano, mês, dia).
/// Algoritmo de Howard Hinnant (`civil_from_days`).
fn civil_from_days(z: i64) -> (i64, i64, i64) {
  let z = z + 719_468;
  let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
  let doe = (z - era * 146_097) as u64; // [0, 146096]
  let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365; // [0, 399]
  let y = (yoe as i64) + era * 400;
  let doy = doe - (365 * yoe + yoe / 4 - yoe / 100); // [0, 365]
  let mp = (5 * doy + 2) / 153; // [0, 11]
  let d = doy - (153 * mp + 2) / 5 + 1; // [1, 31]
  let m = if mp < 10 { mp + 3 } else { mp - 9 }; // [1, 12]
  (if m <= 2 { y + 1 } else { y }, m as i64, d as i64)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn iso_agora_tem_formato_correto() {
    let s = iso_now_ms();
    assert_eq!(s.len(), 24, "YYYY-MM-DDTHH:MM:SS.mmmZ tem 24 chars: {s}");
    assert!(s.ends_with('Z'));
    assert!(s.contains('T'));
    assert!(s.matches('-').count() == 2);
  }

  #[test]
  fn civil_from_days_epocas_conhecidas() {
    assert_eq!(civil_from_days(0), (1970, 1, 1));
    assert_eq!(civil_from_days(20_000), (2024, 10, 4));
    assert_eq!(civil_from_days(-1), (1969, 12, 31));
  }

  #[test]
  fn timestamp_roundtrip_serde() {
    let t = Timestamp::now();
    let json = serde_json::to_string(&t).unwrap();
    let back: Timestamp = serde_json::from_str(&json).unwrap();
    assert_eq!(t, back);
  }
}
