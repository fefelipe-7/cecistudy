//! Parity test TS ↔ Rust (F1.16): os golden files em `contracts/golden/` foram
//! gerados pelo canonical JSON v1 **do TS**. Este teste garante que o
//! `canonicalize()` do Rust produz exatamente os mesmos bytes — prova de
//! interop para backups, sync e comparação.
//!
//! Regenerar os arquivos: `GOLDEN_WRITE=1 npm run test -- src/lib/__tests__/goldenFixtures.test.ts`
//! (nunca editar o byte do golden sem regenerar nos dois lados).

use std::fs;
use std::path::{Path, PathBuf};

use cecistudy_common::canonicalize;
use serde_json::Value;

const GOLDEN_DIR: &str = "../../contracts/golden";

fn golden_files() -> Vec<PathBuf> {
  let root = Path::new(GOLDEN_DIR);
  let mut files = vec![root.join("full_backup.empty.json"), root.join("full_backup.sample.json")];
  for label in ["empty", "sample"] {
    let dir = root.join(format!("collections/{label}"));
    let mut entries: Vec<PathBuf> = fs::read_dir(&dir)
      .unwrap_or_else(|e| panic!("sem diretório {dir:?}: {e}"))
      .map(|e| e.expect("entrada válida").path())
      .filter(|p| p.extension().is_some_and(|x| x == "json"))
      .collect();
    entries.sort();
    files.extend(entries);
  }
  files
}

#[test]
fn golden_files_sao_canonical_v1_no_rust() {
  let files = golden_files();
  assert!(files.len() >= 10, "esperava dezenas de arquivos golden, obtive {}", files.len());
  for path in files {
    let bytes = fs::read(&path).unwrap_or_else(|e| panic!("lendo {:?}: {e}", path));
    let text = std::str::from_utf8(&bytes).unwrap_or_else(|e| panic!("utf8 {:?}: {e}", path));
    let value: Value =
      serde_json::from_str(text).unwrap_or_else(|e| panic!("parse {:?}: {e}", path));
    let mut canonical = canonicalize(&value);
    canonical.push('\n'); // golden é canonical + newline (mesmo do lado TS)
    assert_eq!(
      canonical.as_bytes(),
      bytes.as_slice(),
      "byte divergente do golden (paridade TS↔Rust): {:?}",
      path
    );
  }
}
