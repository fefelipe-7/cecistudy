//! Plataforma alvo — paridade com `Platform = 'desktop' | 'mobile'` do TS.
//! Usada pela matriz de capacidades (F1.8) e pela ponte FFI.

use serde::{Deserialize, Serialize};

/// Plataforma em que uma operação/capacidade se aplica.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Platform {
  Desktop,
  Mobile,
}

impl Platform {
  pub fn as_str(self) -> &'static str {
    match self {
      Platform::Desktop => "desktop",
      Platform::Mobile => "mobile",
    }
  }
}

impl std::fmt::Display for Platform {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.write_str(self.as_str())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn serde_lowercase() {
    assert_eq!(serde_json::to_string(&Platform::Desktop).unwrap(), "\"desktop\"");
    assert_eq!(serde_json::to_string(&Platform::Mobile).unwrap(), "\"mobile\"");
    assert_eq!(serde_json::from_str::<Platform>("\"desktop\"").unwrap(), Platform::Desktop);
  }
}
