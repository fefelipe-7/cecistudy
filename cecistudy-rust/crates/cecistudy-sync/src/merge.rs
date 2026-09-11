//! Merge bidirecional determinístico entre dois bancos sincronizados (porta de
//! `packages/sync/src/merge.ts` — 1.18).
//!
//! Regras (Fase Sync S1):
//! - Coleções de registros → LWW por registro usando `SyncIndex.records`,
//!   com tombstones vencendo registros mais antigos que a deleção.
//! - Coleções de valor único → LWW pelo `stamps` da coleção.
//! - Coleções-set (ids salvos/favoritos) e dias de streak → união.
//! - Empates de timestamp → desempate simétrico por serialização
//!   ([`tie_break`]) — ambos os dispositivos chegam ao MESMO resultado.
//!
//! Os bancos estáticos (`approaches`/`questions`-catálogo) não participam: são
//! re-semeados sob demanda em cada dispositivo (`approaches` só é repassado do
//! lado local). `syncIndex` do resultado é a união [`merge_indexes`].
//!
//! Entrada/saída: banco no formato do payload do backup v2 (`Value` objeto:
//! coleções por chave + `syncIndex`). Funções PURAS — não tocam em banco.

use std::collections::{BTreeMap, BTreeSet};

use serde_json::{Map, Value};

use cecistudy_common::canonicalize;

use crate::stamp::{
  RECORD_COLLECTION_KEYS, SET_COLLECTION_KEYS, SINGLE_COLLECTION_KEYS, SyncIndex, merge_indexes,
  record_ts, tie_break, tombstone_ts,
};

/// Banco sincronizável = payload do backup (coleções + `syncIndex`).
pub type SyncableDatabase = Value;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct MergeStatsSide {
  pub added: usize,
  pub updated: usize,
  pub removed: usize,
}

impl std::ops::AddAssign for MergeStatsSide {
  fn add_assign(&mut self, other: Self) {
    self.added += other.added;
    self.updated += other.updated;
    self.removed += other.removed;
  }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MergeResult {
  pub merged: Value,
  /// Mudanças do ponto de vista do banco local (o que ele vai ganhar/perder).
  pub local: MergeStatsSide,
  /// Mudanças do ponto de vista do banco remoto (o que o outro lado vai receber).
  pub remote: MergeStatsSide,
}

fn id_of(item: &Value) -> Option<&str> {
  item.get("id").and_then(Value::as_str)
}

/// Stats `added/updated/removed` entre dois arrays de registros (espelho do
/// `diffStats` TS; comparação de conteúdo via JSON canônico v1).
fn diff_stats(before: &[Value], after: &[Value]) -> MergeStatsSide {
  let mut stats = MergeStatsSide::default();
  let mut before_map: BTreeMap<&str, &Value> = BTreeMap::new();
  for item in before {
    if let Some(id) = id_of(item) {
      before_map.insert(id, item);
    }
  }
  for item in after {
    let Some(id) = id_of(item) else { continue };
    match before_map.get(id) {
      None => stats.added += 1,
      Some(prev) if canonicalize(prev) != canonicalize(item) => stats.updated += 1,
      Some(_) => {}
    }
  }
  for id in before_map.keys() {
    if !after.iter().any(|i| id_of(i) == Some(*id)) {
      stats.removed += 1;
    }
  }
  stats
}

/// LWW de valores únicos (inclui `undefined` — chave ausente no Value).
fn pick_lww(
  local_value: Option<&Value>,
  remote_value: Option<&Value>,
  local_ts: u64,
  remote_ts: u64,
) -> Option<Value> {
  match (local_value, remote_value) {
    (None, None) => None,
    (Some(l), None) => Some(l.clone()),
    (None, Some(r)) => Some(r.clone()),
    (Some(l), Some(r)) => {
      if remote_ts > local_ts {
        Some(r.clone())
      } else if local_ts > remote_ts {
        Some(l.clone())
      } else {
        Some(tie_break(l, r))
      }
    }
  }
}

/// Registros por id (idente ao `Map(localItems.map(...))` TS).
fn index_by_id(items: &[Value]) -> BTreeMap<&str, &Value> {
  let mut map: BTreeMap<&str, &Value> = BTreeMap::new();
  for item in items {
    if let Some(id) = id_of(item) {
      map.insert(id, item);
    }
  }
  map
}

/// Merge LWW de uma coleção de registros.
fn merge_record_collection(
  key: &str,
  local_items: &[Value],
  remote_items: &[Value],
  local_index: &SyncIndex,
  remote_index: &SyncIndex,
) -> Vec<Value> {
  let local_by_id = index_by_id(local_items);
  let remote_by_id = index_by_id(remote_items);

  let mut ids: BTreeSet<&str> = BTreeSet::new();
  ids.extend(local_by_id.keys().copied());
  ids.extend(remote_by_id.keys().copied());

  let mut merged: Vec<Value> = Vec::new();

  for id in &ids {
    let l = local_by_id.get(*id).copied();
    let r = remote_by_id.get(*id).copied();

    // Tombstone mais recente que o registro vivo → deleção vence.
    let t_ts = tombstone_ts(local_index, key, id).max(tombstone_ts(remote_index, key, id));

    let winner: Option<Value> = match (l, r) {
      (Some(l), Some(r)) => {
        let l_ts = record_ts(local_index, key, id);
        let r_ts = record_ts(remote_index, key, id);
        if r_ts > l_ts {
          Some(r.clone())
        } else if l_ts > r_ts {
          Some(l.clone())
        } else {
          Some(tie_break(l, r))
        }
      }
      (Some(l), None) => Some(l.clone()),
      (None, Some(r)) => Some(r.clone()),
      _ => None,
    };

    // O vencedor só entra se nenhum tombstone for mais recente que a última
    // edição viva do registro.
    if let Some(winner) = winner {
      let max_alive_ts = record_ts(local_index, key, id).max(record_ts(remote_index, key, id));
      if t_ts <= max_alive_ts {
        merged.push(winner);
      }
    }
  }

  // Ordenação estável por id — mesma saída nos dois dispositivos.
  merged.sort_by(|a, b| {
    let a_id = a.get("id").and_then(Value::as_str).unwrap_or("");
    let b_id = b.get("id").and_then(Value::as_str).unwrap_or("");
    a_id.cmp(b_id)
  });
  merged
}

fn sync_index_of(db: &Value) -> SyncIndex {
  db.get("syncIndex")
    .and_then(Value::as_object)
    .and_then(|m| serde_json::from_value(Value::Object(m.clone())).ok())
    .unwrap_or_default()
}

/// União ordenada de uma coleção-set.
fn union_set(local_db: &Value, remote_db: &Value, key: &str) -> Vec<String> {
  let mut set: BTreeSet<String> = BTreeSet::new();
  for db in [local_db, remote_db] {
    if let Some(arr) = db.get(key).and_then(Value::as_array) {
      for v in arr {
        if let Some(s) = v.as_str() {
          set.insert(s.to_owned());
        }
      }
    }
  }
  set.into_iter().collect()
}

/// Dias ativos de streak (união).
fn streak_active_days(local_db: &Value, remote_db: &Value) -> Vec<String> {
  let mut set: BTreeSet<String> = BTreeSet::new();
  for db in [local_db, remote_db] {
    if let Some(days) = db
      .get("streakData")
      .and_then(Value::as_object)
      .and_then(|m| m.get("activeDays"))
      .and_then(Value::as_array)
    {
      for v in days {
        if let Some(s) = v.as_str() {
          set.insert(s.to_owned());
        }
      }
    }
  }
  set.into_iter().collect()
}

fn array_value(db: &Value, key: &str) -> Vec<Value> {
  db.get(key).and_then(Value::as_array).cloned().unwrap_or_default()
}

/**
 * Calcula o merge dos dois bancos. Puro e determinístico: chamado
 * independentemente nos dois dispositivos, produz o mesmo `merged`.
 */
pub fn merge_synced_databases(local_db: &Value, remote_db: &Value) -> MergeResult {
  let local_index = sync_index_of(local_db);
  let remote_index = sync_index_of(remote_db);

  let mut merged_map: Map<String, Value> = Map::new();
  let mut stats_local = MergeStatsSide::default();
  let mut stats_remote = MergeStatsSide::default();

  for key in RECORD_COLLECTION_KEYS {
    let l = array_value(local_db, key);
    let r = array_value(remote_db, key);
    let m = merge_record_collection(key, &l, &r, &local_index, &remote_index);
    merged_map.insert((*key).to_owned(), Value::Array(m.clone()));
    stats_local += diff_stats(&l, &m);
    stats_remote += diff_stats(&r, &m);
  }

  // Coleções de valor único (LWW pela coleção).
  for key in SINGLE_COLLECTION_KEYS {
    let l = local_db.get(key);
    let r = remote_db.get(key);
    let l_ts = local_index.stamps.get(key).copied().unwrap_or(0);
    let r_ts = remote_index.stamps.get(key).copied().unwrap_or(0);
    if let Some(winner) = pick_lww(l, r, l_ts, r_ts) {
      merged_map.insert(key.to_owned(), winner);
    }
  }

  // Coleções-set (união).
  for key in SET_COLLECTION_KEYS {
    let union = union_set(local_db, remote_db, key);
    merged_map.insert(key.to_owned(), Value::Array(union.into_iter().map(Value::String).collect()));
  }

  // Dias de streak (união).
  let days = streak_active_days(local_db, remote_db);
  merged_map.insert("streakData".to_owned(), serde_json::json!({ "activeDays": days }));

  // Bancos estáticos ficam de fora do merge (re-semeados sob demanda).
  if let Some(approaches) = local_db.get("approaches") {
    merged_map.insert("approaches".to_owned(), approaches.clone());
  }
  merged_map.insert(
    "syncIndex".to_owned(),
    serde_json::to_value(merge_indexes(&local_index, &remote_index))
      .expect("SyncIndex serializa sempre"),
  );

  MergeResult { merged: Value::Object(merged_map), local: stats_local, remote: stats_remote }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::stamp::{apply_stamp_change, empty_sync_index};
  use serde_json::json;

  /// Banco de teste com o índice zerado (mesmo shape do `makeDb` TS).
  fn make_db() -> Map<String, Value> {
    let mut db = Map::new();
    db.insert("syncIndex".to_owned(), serde_json::to_value(empty_sync_index()).unwrap());
    db
  }

  fn set<'a>(
    db: &'a mut Map<String, Value>,
    key: &str,
    value: Value,
  ) -> &'a mut Map<String, Value> {
    db.insert(key.to_owned(), value);
    db
  }

  #[test]
  fn uniao_de_registros_criados_em_lados_diferentes() {
    let mut local = make_db();
    set(&mut local, "courses", json!([{ "id": "c1", "name": "local" }]));
    let mut remote = make_db();
    set(&mut remote, "courses", json!([{ "id": "c2", "name": "remota" }]));

    let result = merge_synced_databases(&Value::Object(local), &Value::Object(remote));
    let mut ids: Vec<&str> = result.merged["courses"]
      .as_array()
      .unwrap()
      .iter()
      .map(|c| c["id"].as_str().unwrap())
      .collect();
    ids.sort();
    assert_eq!(ids, vec!["c1", "c2"]);
  }

  #[test]
  fn lww_por_registro_edicao_mais_recente_vence_nos_dois_lados() {
    let old = json!([{ "id": "c1", "name": "v1" }]);
    let new_local = json!([{ "id": "c1", "name": "editada no local" }]);
    let new_remote = json!([{ "id": "c1", "name": "editada no remoto" }]);

    let idx_local = apply_stamp_change(&empty_sync_index(), "courses", &old, &new_local, 100).index;
    let idx_remote =
      apply_stamp_change(&empty_sync_index(), "courses", &old, &new_remote, 50).index;

    let mut local = make_db();
    set(&mut local, "courses", new_local);
    local.insert("syncIndex".to_owned(), serde_json::to_value(idx_local).unwrap());
    let mut remote = make_db();
    set(&mut remote, "courses", new_remote);
    remote.insert("syncIndex".to_owned(), serde_json::to_value(idx_remote).unwrap());

    let local_v = Value::Object(local);
    let remote_v = Value::Object(remote);
    let ab = merge_synced_databases(&local_v, &remote_v);
    let ba = merge_synced_databases(&remote_v, &local_v);
    assert_eq!(ab.merged, ba.merged, "determinístico/simétrico");
    assert_eq!(ab.merged["courses"][0]["name"], "editada no local");
  }

  #[test]
  fn tombstone_mais_recente_impede_ressurreicao() {
    let created = json!([{ "id": "t1", "title": "x" }]);
    let idx_local =
      apply_stamp_change(&empty_sync_index(), "tasks", &json!([]), &created, 100).index;
    let idx_remote = apply_stamp_change(
      &apply_stamp_change(&empty_sync_index(), "tasks", &json!([]), &created, 100).index,
      "tasks",
      &created,
      &json!([]),
      200,
    )
    .index;

    let mut local = make_db();
    set(&mut local, "tasks", created);
    local.insert("syncIndex".to_owned(), serde_json::to_value(idx_local).unwrap());
    let mut remote = make_db();
    set(&mut remote, "tasks", json!([]));
    remote.insert("syncIndex".to_owned(), serde_json::to_value(idx_remote).unwrap());

    let result = merge_synced_databases(&Value::Object(local), &Value::Object(remote));
    assert_eq!(result.merged["tasks"].as_array().map(Vec::len), Some(0));
  }

  #[test]
  fn registro_editado_depois_da_delecao_do_outro_lado_sobrevive() {
    let created = json!([{ "id": "t1", "title": "x" }]);
    let idx_local = apply_stamp_change(
      &apply_stamp_change(&empty_sync_index(), "tasks", &json!([]), &created, 50).index,
      "tasks",
      &created,
      &json!([]),
      100,
    )
    .index;

    let old = json!([{ "id": "t1", "title": "antiga" }]);
    let new_remote = json!([{ "id": "t1", "title": "nova" }]);
    let idx_remote = apply_stamp_change(
      &apply_stamp_change(&empty_sync_index(), "tasks", &json!([]), &old, 50).index,
      "tasks",
      &old,
      &new_remote,
      300,
    )
    .index;

    let mut local = make_db();
    set(&mut local, "tasks", json!([]));
    local.insert("syncIndex".to_owned(), serde_json::to_value(idx_local).unwrap());
    let mut remote = make_db();
    set(&mut remote, "tasks", new_remote);
    remote.insert("syncIndex".to_owned(), serde_json::to_value(idx_remote).unwrap());

    let result = merge_synced_databases(&Value::Object(local), &Value::Object(remote));
    let titles: Vec<&str> = result.merged["tasks"]
      .as_array()
      .unwrap()
      .iter()
      .map(|t| t["title"].as_str().unwrap())
      .collect();
    assert_eq!(titles, vec!["nova"]);
  }

  #[test]
  fn colecao_unica_profile_vai_pelo_stamp_da_colecao() {
    let mut local = make_db();
    set(&mut local, "profile", json!({ "name": "local" }));
    let mut remote = make_db();
    set(&mut remote, "profile", json!({ "name": "remoto" }));
    let mut idx_remote = empty_sync_index();
    idx_remote.stamps.insert("profile".to_owned(), 999);
    remote.insert("syncIndex".to_owned(), serde_json::to_value(idx_remote).unwrap());

    let result = merge_synced_databases(&Value::Object(local), &Value::Object(remote));
    assert_eq!(result.merged["profile"]["name"], "remoto");
  }

  #[test]
  fn sets_e_streak_fazem_uniao() {
    let mut local = make_db();
    set(&mut local, "savedBookIds", json!(["bk-1"]));
    set(&mut local, "bookmarkedCourseIds", json!(["c1"]));
    set(&mut local, "streakData", json!({ "activeDays": ["2026-08-01"] }));
    let mut remote = make_db();
    set(&mut remote, "savedBookIds", json!(["bk-2"]));
    set(&mut remote, "bookmarkedCourseIds", json!(["c2"]));
    set(&mut remote, "streakData", json!({ "activeDays": ["2026-08-02"] }));

    let result = merge_synced_databases(&Value::Object(local), &Value::Object(remote));
    assert_eq!(result.merged["savedBookIds"], json!(["bk-1", "bk-2"]));
    assert_eq!(result.merged["bookmarkedCourseIds"], json!(["c1", "c2"]));
    assert_eq!(result.merged["streakData"]["activeDays"], json!(["2026-08-01", "2026-08-02"]));
  }

  #[test]
  fn stats_descrevem_o_delta_de_cada_lado() {
    let mut local = make_db();
    set(&mut local, "tasks", json!([{ "id": "t1", "title": "só local" }]));
    let mut remote = make_db();
    set(&mut remote, "exams", json!([{ "id": "e9", "title": "só remota" }]));

    let result = merge_synced_databases(&Value::Object(local), &Value::Object(remote));
    assert_eq!(result.local.added, 1); // ganha a prova do remoto
    assert_eq!(result.remote.added, 1); // remoto ganha a tarefa local
  }

  #[test]
  fn merge_de_bancos_vazios_e_vazio_e_simetrico() {
    let a = make_db();
    let b = make_db();
    let ab = merge_synced_databases(&Value::Object(a), &Value::Object(b));
    let ba = merge_synced_databases(&Value::Object(Map::new()), &Value::Object(Map::new()));
    assert_eq!(ab.merged, ba.merged);
    assert_eq!(ab.merged["courses"].as_array().map(Vec::len), Some(0));
  }

  #[test]
  fn merge_ignora_bancos_estaticos_da_base() {
    // approaches não participa; o resultado preserva o do local (re-semear).
    let mut local = make_db();
    set(&mut local, "approaches", json!([{ "id": "app-1" }]));
    let mut remote = make_db();
    set(&mut remote, "courses", json!([{ "id": "c1" }]));

    let result = merge_synced_databases(&Value::Object(local), &Value::Object(remote));
    assert_eq!(result.merged["approaches"], json!([{ "id": "app-1" }]));
  }
}
