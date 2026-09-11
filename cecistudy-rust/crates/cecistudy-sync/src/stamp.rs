//! Carimbos de alteração para sincronização entre dispositivos (Fase Sync S1).
//!
//! Porta de `packages/sync/src/stamp.ts` (TS). Funções **puras** — sem acesso a
//! React/storage. Consumidas pela gravação automática (`useStampedState`) e pelo
//! merge LWW bidirecional (`merge.rs`).
//!
//! Modelo:
//! - Cada coleção tem `stamps[chave]` = última alteração (epoch ms).
//! - Coleções-array têm ainda `records[chave][id]` = última alteração do registro.
//! - Remoções viram `tombstones[chave][id]` — propagam a deleção e impedem
//!   ressurreição no merge.
//!
//! > ⚠️ Nota de paridade: o `stable_key` do TS usa `JSON.stringify` (ordem de
//! > inserção). Aqui usamos `canonicalize` (JSON canônico v1, chaves ordenadas) —
//! > determinístico e estável entre crates. Empates de timestamp ainda resolvem
//! > simetricamente (o desempate exige só que `stable_key` seja uma função pura
//! > do valor); a ordenação interna das chaves não afeta a convergência.

use std::collections::{BTreeMap, HashSet};

use serde::{Deserialize, Serialize};

use cecistudy_common::canonicalize;
use serde_json::Value;

/// Coleções de registros — merge LWW por registro (carimbos em `records`).
pub const RECORD_COLLECTION_KEYS: [&str; 16] = [
  "courses",
  "classes",
  "tasks",
  "exams",
  "authors",
  "concepts",
  "readings",
  "flashcards",
  "materials",
  "internshipLogs",
  "supervision",
  "sessions",
  "techniques",
  "quizSessions",
  "looseNotes",
  "questions",
];

/// Coleções de valor único — merge por LWW da coleção inteira.
pub const SINGLE_COLLECTION_KEYS: [&str; 7] =
  ["profile", "tcc", "stickers", "streakData", "reminder", "onboarding", "readingProgress"];

/// Coleções-set (ids) — merge por união.
pub const SET_COLLECTION_KEYS: [&str; 2] = ["savedBookIds", "bookmarkedCourseIds"];

/// Índice de sync (carimbo da coleção + carimbos de registro + tombstones).
/// Mesma forma de `SyncIndex` no TS (`stamps`/`records`/`tombstones`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
pub struct SyncIndex {
  #[serde(default)]
  pub stamps: BTreeMap<String, u64>,
  #[serde(default)]
  pub records: BTreeMap<String, BTreeMap<String, u64>>,
  #[serde(default)]
  pub tombstones: BTreeMap<String, BTreeMap<String, u64>>,
}

/// `emptySyncIndex()`.
pub fn empty_sync_index() -> SyncIndex {
  SyncIndex::default()
}

fn is_record_collection(key: &str) -> bool {
  RECORD_COLLECTION_KEYS.contains(&key)
}

fn id_of(item: &Value) -> Option<&str> {
  item.get("id").and_then(Value::as_str)
}

fn index_by_id(items: &[Value]) -> BTreeMap<&str, &Value> {
  let mut map = BTreeMap::new();
  for item in items {
    if let Some(id) = id_of(item) {
      map.insert(id, item);
    }
  }
  map
}

/// Serialização estável o suficiente para detectar mudança de conteúdo.
fn stable_key(item: &Value) -> String {
  canonicalize(item)
}

/// Desempate simétrico do LWW (dois lados com timestamp igual). Escolhe a
/// serialização "maior". Determinístico nos dois dispositivos → convergem.
pub fn tie_break(local: &Value, remote: &Value) -> Value {
  if stable_key(remote) > stable_key(local) { remote.clone() } else { local.clone() }
}

/// Resultado de [`apply_stamp_change`].
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StampChangeResult {
  pub index: SyncIndex,
  /// Quantidade de registros criados/alterados (para stats).
  pub changed_records: usize,
  pub removed_ids: Vec<String>,
}

/// Aplica uma mudança de coleção ao índice.
/// - Array de registros: carimba criados/alterados e gera tombstones dos removidos.
/// - Qualquer valor: bump do stamp da coleção.
///
/// Retorna um NOVO índice (imutável) — nunca muta `prev`.
pub fn apply_stamp_change(
  prev: &SyncIndex,
  key: &str,
  old_value: &Value,
  new_value: &Value,
  now: u64,
) -> StampChangeResult {
  let mut stamps = prev.stamps.clone();
  stamps.insert(key.to_owned(), now);
  let mut records = prev.records.clone();
  let mut tombstones = prev.tombstones.clone();
  let mut changed_records = 0usize;
  let mut removed_ids: Vec<String> = vec![];

  if is_record_collection(key) && new_value.is_array() {
    let new_items = new_value.as_array().expect("is_array garantiu");
    let old_map = {
      let arr = old_value.as_array();
      match arr {
        Some(items) => index_by_id(items),
        None => BTreeMap::new(),
      }
    };
    let mut new_ids: HashSet<&str> = HashSet::new();

    for item in new_items {
      let Some(id) = id_of(item) else { continue };
      new_ids.insert(id);
      let before = old_map.get(id);
      if before.is_none_or(|before| stable_key(before) != stable_key(item)) {
        records.entry(key.to_owned()).or_default().insert(id.to_owned(), now);
        changed_records += 1;
      }
    }

    for id in old_map.keys() {
      if !new_ids.contains(id) {
        removed_ids.push((*id).to_owned());
        tombstones.entry(key.to_owned()).or_default().insert((*id).to_owned(), now);
        // Limpa o stamp do registro removido (o tombstone passa a valer).
        if let Some(key_records) = records.get_mut(key) {
          key_records.remove(*id);
        }
      }
    }
  }

  StampChangeResult {
    index: SyncIndex { stamps, records, tombstones },
    changed_records,
    removed_ids,
  }
}

/// Timestamp efetivo de um registro vivo (0 quando desconhecido).
pub fn record_ts(index: &SyncIndex, key: &str, id: &str) -> u64 {
  index.records.get(key).and_then(|m| m.get(id)).copied().unwrap_or(0)
}

/// Timestamp efetivo de um tombstone (0 quando inexistente).
pub fn tombstone_ts(index: &SyncIndex, key: &str, id: &str) -> u64 {
  index.tombstones.get(key).and_then(|m| m.get(id)).copied().unwrap_or(0)
}

fn max_ts_map(x: &BTreeMap<String, u64>, y: &BTreeMap<String, u64>) -> BTreeMap<String, u64> {
  let mut out = x.clone();
  for (k, v) in y {
    let e = out.entry(k.clone()).or_insert(0);
    *e = (*e).max(*v);
  }
  out
}

/// Une dois índices (pós-merge): mantém o máximo de cada carimbo/tombstone.
/// Simétrico → ambos os dispositivos chegam ao mesmo índice.
pub fn merge_indexes(a: &SyncIndex, b: &SyncIndex) -> SyncIndex {
  let records_keys: HashSet<&String> = a.records.keys().chain(b.records.keys()).collect();
  let records = records_keys
    .iter()
    .map(|k| {
      let x = a.records.get(*k).cloned().unwrap_or_default();
      let y = b.records.get(*k).cloned().unwrap_or_default();
      ((*k).clone(), max_ts_map(&x, &y))
    })
    .collect();

  let tombstones_keys: HashSet<&String> = a.tombstones.keys().chain(b.tombstones.keys()).collect();
  let tombstones = tombstones_keys
    .iter()
    .map(|k| {
      let x = a.tombstones.get(*k).cloned().unwrap_or_default();
      let y = b.tombstones.get(*k).cloned().unwrap_or_default();
      ((*k).clone(), max_ts_map(&x, &y))
    })
    .collect();

  SyncIndex { stamps: max_ts_map(&a.stamps, &b.stamps), records, tombstones }
}

/// Maior carimbo presente no índice (epoch ms). 0 se vazio.
pub fn max_stamp(index: &SyncIndex) -> u64 {
  let mut max = 0u64;
  for v in index.stamps.values() {
    max = max.max(*v);
  }
  for m in index.records.values() {
    for v in m.values() {
      max = max.max(*v);
    }
  }
  for m in index.tombstones.values() {
    for v in m.values() {
      max = max.max(*v);
    }
  }
  max
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  #[test]
  fn bumpa_stamp_da_colecao_em_qualquer_mudanca() {
    let idx = empty_sync_index();
    let old = json!({ "name": "" });
    let new = json!({ "name": "Ceci" });
    let result = apply_stamp_change(&idx, "profile", &old, &new, 100);
    assert_eq!(result.index.stamps.get("profile"), Some(&100));
    assert_eq!(idx.stamps.get("profile"), None, "índice original não é mutado");
  }

  #[test]
  fn carimba_registros_novos_e_alterados() {
    let prev = json!([{ "id": "c1", "name": "antiga" }]);
    let next = json!([
      { "id": "c1", "name": "renomeada" },
      { "id": "c2", "name": "nova" }
    ]);
    let result = apply_stamp_change(&empty_sync_index(), "courses", &prev, &next, 200);
    assert_eq!(result.changed_records, 2);
    assert_eq!(result.index.records["courses"]["c1"], 200);
    assert_eq!(result.index.records["courses"]["c2"], 200);
  }

  #[test]
  fn nao_carimba_registro_identico() {
    let item = json!({ "id": "c1", "name": "x" });
    let empty = empty_sync_index();
    let first = apply_stamp_change(&empty, "courses", &json!([]), &json!([item.clone()]), 300);
    assert_eq!(first.changed_records, 1);
    let second =
      apply_stamp_change(&first.index, "courses", &json!([item.clone()]), &json!([item]), 400);
    assert_eq!(second.changed_records, 0);
    assert_eq!(second.index.records["courses"]["c1"], 300);
  }

  #[test]
  fn gera_tombstone_para_registros_removidos_e_limpa_stamp() {
    let prev = json!([{ "id": "t1" }, { "id": "t2" }]);
    let next = json!([{ "id": "t1" }]);
    let result = apply_stamp_change(&empty_sync_index(), "tasks", &prev, &next, 500);
    assert_eq!(result.removed_ids, vec!["t2".to_owned()]);
    assert_eq!(result.index.tombstones["tasks"]["t2"], 500);
    assert!(!result.index.records.get("tasks").is_some_and(|m| m.contains_key("t2")));
  }

  #[test]
  fn colecoes_fora_da_lista_de_registros_so_bumpam_stamp() {
    let result = apply_stamp_change(
      &empty_sync_index(),
      "readingProgress",
      &json!({}),
      &json!({ "b1": 10 }),
      600,
    );
    assert_eq!(result.index.stamps.get("readingProgress"), Some(&600));
    assert!(!result.index.records.contains_key("readingProgress"));
  }

  #[test]
  fn merge_indexes_mantem_maximo_simetrico() {
    let mut a = empty_sync_index();
    a.stamps.insert("profile".to_owned(), 10);
    a.records.insert("courses".to_owned(), BTreeMap::from([("c1".to_owned(), 5)]));
    let mut b = empty_sync_index();
    b.stamps.insert("profile".to_owned(), 20);
    b.tombstones.insert("tasks".to_owned(), BTreeMap::from([("t9".to_owned(), 7)]));

    let ab = merge_indexes(&a, &b);
    let ba = merge_indexes(&b, &a);
    assert_eq!(ab, ba);
    assert_eq!(ab.stamps.get("profile"), Some(&20));
    assert_eq!(ab.records["courses"]["c1"], 5);
    assert_eq!(ab.tombstones["tasks"]["t9"], 7);
  }

  #[test]
  fn tie_break_e_simetrico_e_deterministico() {
    let x = json!({ "v": 1 });
    let y = json!({ "v": 2 });
    assert_eq!(tie_break(&x, &y), tie_break(&y, &x));
    assert_eq!(tie_break(&x, &x), x);
  }
}
