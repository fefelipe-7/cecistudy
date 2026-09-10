//! Migrações de payload JSON (F1.13) — paridade com `MIGRATIONS` de
//! `packages/data/src/schema.ts` e com o `parseLegacySchedule` de
//! `src/lib/schedule.ts` (usado pela migração 8→9).
//!
//! Os dados são tratados como `serde_json::Value`/`Map` (não tipados): é o que a
//! cadeia de migração precisa (mesma opacidade do `Record<string, unknown>` do TS).
//!
//! ⚠️ **Paridade sobre intenção:** as migrações reproduzem os *quirks* do TS
//! (ex.: a v4 mapeia `type:'estagio'` mas o spread `...data` descarta o mapa
//! quando `internshipLogs` existe — resultado: se a chave existe, nada muda).
//! A prova é o replay arquivo-a-arquivo contra `contracts/golden/migrations/`
//! (`tests/migration_parity_test.rs`). Nunca "consertar" um quirk sem regenerar
//! fixtures nos DOIS lados e documentar o motivo.

use regex::Regex;
use serde_json::{Map, Value, json};

use cecistudy_common::Error;

/// Espelho de `SCHEMA_VERSION` (packages/data/src/schema.ts).
pub const SCHEMA_VERSION: i32 = 13;

/// Workspace padrão (Fase 3) — espelho de `DEFAULT_WORKSPACE_ID`.
pub const DEFAULT_WORKSPACE_ID: &str = "ws-academico";

type JsonMap = Map<String, Value>;

/// Aplica a cadeia de migrações `from+1..=13` no payload, in-place.
/// Erro: versão de origem desconhecida ou payload não-objeto.
pub fn migrate(payload: &mut Value, from_version: i32) -> Result<i32, Error> {
  if from_version > SCHEMA_VERSION {
    return Err(Error::Validation(format!(
      "payload da versão {from_version} é mais nova que a suportada ({SCHEMA_VERSION})"
    )));
  }
  if from_version < 1 {
    return Err(Error::Validation("versão de origem abaixo de 1 não existe".into()));
  }
  let obj = require_object(payload)?;
  for step in (from_version + 1)..=SCHEMA_VERSION {
    run_migration(obj, step)?;
  }
  Ok(SCHEMA_VERSION)
}

/// Aplica UMA migração (`step`, o mesmo passo que `MIGRATIONS[step]` do TS).
/// Em cadeia: `v{n} = step{2}(v1)`, `v{n+1} = step{n+1}(v{n})`.
pub fn apply_step(payload: &mut Value, step: i32) -> Result<(), Error> {
  let obj = require_object(payload)?;
  run_migration(obj, step)
}

fn require_object(payload: &mut Value) -> Result<&mut JsonMap, Error> {
  payload
    .as_object_mut()
    .ok_or_else(|| Error::Validation("payload de migração não é um objeto JSON".into()))
}

fn run_migration(obj: &mut JsonMap, step: i32) -> Result<(), Error> {
  match step {
    2 => migrate_2(obj),
    3 => migrate_3(obj),
    4 => migrate_4(obj),
    5 => migrate_5(obj),
    6 => migrate_6(obj),
    7 => migrate_7(obj),
    8 => migrate_8(obj),
    9 => migrate_9(obj),
    10 => migrate_10(obj),
    11 => migrate_11(obj),
    12 => migrate_12(obj),
    13 => migrate_13(obj),
    other => {
      return Err(Error::Validation(format!(
        "migração {other} não registrada (TS pula números sem entrada)"
      )));
    }
  }
  Ok(())
}

fn insert_if_missing(map: &mut JsonMap, key: &str, value: Value) {
  if !map.contains_key(key) {
    map.insert(key.to_owned(), value);
  }
}

fn get_array(map: &JsonMap, key: &str) -> Vec<Value> {
  match map.get(key) {
    Some(Value::Array(arr)) => arr.clone(),
    _ => vec![],
  }
}

// 1 → 2 (TS: `{ questions: [], techniques: [], onboarding: {...}, savedBookIds: [], ...data }`)
fn migrate_2(obj: &mut JsonMap) {
  insert_if_missing(obj, "questions", Value::Array(vec![]));
  insert_if_missing(obj, "techniques", Value::Array(vec![]));
  insert_if_missing(obj, "onboarding", json!({ "completed": false }));
  insert_if_missing(obj, "savedBookIds", Value::Array(vec![]));
}

// 2 → 3 (TS: `{ profile: { photoUrl: '', ...profile }, ...data }` — no final o
// `profile` do data vence; logo: só insere se a chave não existir).
fn migrate_3(obj: &mut JsonMap) {
  insert_if_missing(obj, "profile", json!({ "photoUrl": "" }));
}

// 3 → 4 (TS: stagem `{ internshipLogs: mapped, ...data }` — o spread descarta o
// mapa se `internshipLogs` existe → quirk: com a chave presente nada muda;
// ausente, insere `[]`).
fn migrate_4(obj: &mut JsonMap) {
  if !obj.contains_key("internshipLogs") {
    obj.insert("internshipLogs".to_owned(), Value::Array(vec![]));
  }
}

// 4 → 5
fn migrate_5(obj: &mut JsonMap) {
  insert_if_missing(obj, "readingProgress", json!({}));
}

// 5 → 6 — remoção do recurso de humor.
fn migrate_6(obj: &mut JsonMap) {
  obj.remove("currentMood");
  obj.remove("moodHistory");
  if let Some(p) = obj.get_mut("profile").and_then(Value::as_object_mut) {
    p.remove("avatarMood");
  }
}

// 6 → 7
fn migrate_7(obj: &mut JsonMap) {
  insert_if_missing(obj, "quizSessions", Value::Array(vec![]));
}

// 7 → 8
fn migrate_8(obj: &mut JsonMap) {
  insert_if_missing(obj, "supervision", Value::Array(vec![]));
}

// 8 → 9 — `Course.schedule` string → slots.
fn migrate_9(obj: &mut JsonMap) {
  let mut courses = get_array(obj, "courses");
  for course in courses.iter_mut() {
    let Some(map) = course.as_object_mut() else { continue };
    let Some(schedule) = map.get("schedule") else { continue };
    if let Value::String(text) = schedule {
      map.insert("schedule".to_owned(), Value::Array(parse_legacy_schedule(text)));
    }
  }
  obj.insert("courses".to_owned(), Value::Array(courses));
}

// 9 → 10
fn migrate_10(obj: &mut JsonMap) {
  insert_if_missing(obj, "syncIndex", json!({ "stamps": {}, "records": {}, "tombstones": {} }));
}

// 10 → 11 — remove `progress`/`progressOverride` dos courses.
fn migrate_11(obj: &mut JsonMap) {
  let mut courses = get_array(obj, "courses");
  for course in courses.iter_mut() {
    let Some(map) = course.as_object_mut() else { continue };
    let touched = map.contains_key("progress") || map.contains_key("progressOverride");
    if touched {
      map.remove("progress");
      map.remove("progressOverride");
    }
  }
  obj.insert("courses".to_owned(), Value::Array(courses));
}

// 11 → 12 — `workspaceId` (default) em coleções sincronizáveis e profile/tcc.
fn migrate_12(obj: &mut JsonMap) {
  const COLLECTIONS: &[&str] = &[
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
    "stickers",
    "sessions",
    "techniques",
    "quizSessions",
    "looseNotes",
  ];
  for key in COLLECTIONS {
    let arr = match obj.get_mut(*key) {
      None => {
        obj.insert((*key).to_owned(), Value::Array(vec![]));
        continue;
      }
      Some(Value::Array(arr)) => std::mem::take(arr),
      Some(_) => continue,
    };
    let mapped: Vec<Value> = arr
      .into_iter()
      .map(|item| {
        let mut map = match item {
          Value::Object(m) => m,
          other => return other,
        };
        let has =
          map.get("workspaceId").and_then(Value::as_str).map(|s| !s.is_empty()).unwrap_or(false);
        if !has {
          map.insert("workspaceId".to_owned(), Value::String(DEFAULT_WORKSPACE_ID.into()));
        }
        Value::Object(map)
      })
      .collect();
    obj.insert((*key).to_owned(), Value::Array(mapped));
  }
  for key in ["profile", "tcc"] {
    let obj_value = match obj.get_mut(key) {
      None => {
        obj.insert((*key).to_owned(), json!({ "workspaceId": DEFAULT_WORKSPACE_ID }));
        continue;
      }
      Some(Value::Object(m)) => std::mem::take(m),
      Some(_) => continue,
    };
    let mut map = obj_value;
    let has =
      map.get("workspaceId").and_then(Value::as_str).map(|s| !s.is_empty()).unwrap_or(false);
    if !has {
      map.insert("workspaceId".to_owned(), Value::String(DEFAULT_WORKSPACE_ID.into()));
    }
    obj.insert((*key).to_owned(), Value::Object(map));
  }
}

// 12 → 13 — renomeia `internshipLogsLegacy` → `internshipLogs` (se ausente).
fn migrate_13(obj: &mut JsonMap) {
  if obj.contains_key("internshipLogsLegacy")
    && !obj.contains_key("internshipLogs")
    && let Some(legacy) = obj.remove("internshipLogsLegacy")
  {
    obj.insert("internshipLogs".to_owned(), legacy);
  }
  obj.remove("internshipLogsLegacy");
}

/// Dias da semana na MESMA ordem do literal `WEEKDAY_MAP` do TS (a ordem
/// importa: mantém a ordem de slots gerada por múltiplas correspondências de
/// sinônimos antes do `new Set`).
const WEEKDAY_ORDER: &[(&str, i64)] = &[
  ("domingo", 0),
  ("dom", 0),
  ("segunda", 1),
  ("segundas", 1),
  ("seg", 1),
  ("terça", 2),
  ("terças", 2),
  ("terca", 2),
  ("tercas", 2),
  ("ter", 2),
  ("quarta", 3),
  ("quartas", 3),
  ("qua", 3),
  ("quinta", 4),
  ("quintas", 4),
  ("qui", 4),
  ("sexta", 5),
  ("sextas", 5),
  ("sex", 5),
  ("sábado", 6),
  ("sáb", 6),
  ("sabado", 6),
  ("sab", 6),
];

/// Porta de `parseLegacySchedule` (TS): texto livre de horários → slots
/// `{day, start, end?}` na ordem de ocorrência.
pub fn parse_legacy_schedule(text: &str) -> Vec<Value> {
  if text.is_empty() {
    return vec![];
  }
  let normalized = text.to_lowercase().replace(['–', '—'], "-");

  // Espelha `/[;\n]+| e (?=\w)/` do TS (regex não tem look-ahead; split manual).
  let seg_re: Vec<&str> = split_segments(&normalized);
  let colon_re: Regex = Regex::new(r"(\d{1,2}):(\d{2})").expect("regex fixa");
  let hours_re: Regex = Regex::new(r"(\d{1,2})\s*h").expect("regex fixa");

  let mut slots: Vec<Value> = Vec::new();
  for seg in seg_re {
    let mut days: Vec<i64> = Vec::new();
    for (name, idx) in WEEKDAY_ORDER {
      let pat = format!(r"\b{}s?\b", name);
      let found = Regex::new(&pat).expect("regex de dia fixa").is_match(seg);
      if found && !days.contains(idx) {
        days.push(*idx);
      }
    }
    if days.is_empty() {
      continue;
    }
    let mut colon_times: Vec<String> =
      colon_re.captures_iter(seg).map(|c| format!("{:0>2}:{1}", &c[1], &c[2])).collect();
    let start = if !colon_times.is_empty() {
      Some(colon_times.remove(0))
    } else {
      hours_re.captures(seg).map(|m| format!("{:0>2}:00", &m[1]))
    };
    let end = if colon_times.is_empty() { None } else { Some(colon_times.remove(0)) };
    for day in days {
      let mut slot = Map::new();
      slot.insert("day".to_owned(), Value::from(day));
      slot.insert(
        "start".to_owned(),
        Value::String(start.clone().unwrap_or_else(|| "00:00".to_owned())),
      );
      if let Some(end) = end.clone() {
        slot.insert("end".to_owned(), Value::String(end));
      }
      slots.push(Value::Object(slot));
    }
  }
  slots
}

fn is_word_char(b: u8) -> bool {
  b.is_ascii_alphanumeric() || b == b'_'
}

/// Splits espelhando `/[;\n]+| e (?=\w)/` (separador `;`/newline em sequência
/// OU o literal `" e "` antes de um caractere de palavra).
fn split_segments(s: &str) -> Vec<&str> {
  let bytes = s.as_bytes();
  let mut segs = Vec::new();
  let mut start = 0;
  let mut i = 0;
  while i < bytes.len() {
    let b = bytes[i];
    if b == b';' || b == b'\n' {
      segs.push(&s[start..i]);
      while i < bytes.len() && (bytes[i] == b';' || bytes[i] == b'\n') {
        i += 1;
      }
      start = i;
      continue;
    }
    // " e " + palavra → corta e consome o separador.
    if b == b' '
      && i + 3 < bytes.len()
      && bytes[i + 1] == b'e'
      && bytes[i + 2] == b' '
      && is_word_char(bytes[i + 3])
    {
      segs.push(&s[start..i]);
      i += 3;
      start = i;
      continue;
    }
    i += 1;
  }
  segs.push(&s[start..]);
  segs
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parse_slots_basico() {
    let slots = parse_legacy_schedule("Segundas e quartas, 08:00 - 09:30");
    let obj = |d: i64, s: &str, e: Option<&str>| {
      let mut m = Map::new();
      m.insert("day".into(), Value::from(d));
      m.insert("start".into(), Value::from(s));
      if let Some(e) = e {
        m.insert("end".into(), Value::from(e));
      }
      Value::Object(m)
    };
    assert_eq!(slots, vec![obj(1, "00:00", None), obj(3, "08:00", Some("09:30"))]);
  }

  #[test]
  fn parse_slots_sem_dia_vira_vazio() {
    assert!(parse_legacy_schedule("quando der").is_empty());
    assert!(parse_legacy_schedule("").is_empty());
  }

  #[test]
  fn migra_versao_de_origem_avancada_recusa() {
    let mut v = json!({ "profile": {} });
    assert!(migrate(&mut v, 99).is_err());
    assert!(migrate(&mut v, 0).is_err());
  }

  #[test]
  fn migra_13_remove_humor_renomeia_e_adds_workspace() {
    let mut v = json!({
      "profile": { "name": "x", "avatarMood": "foco" },
      "currentMood": { "day": "x" }, "moodHistory": [],
      "courses": [ { "id": "c1", "schedule": "seg 9h", "progress": 5 } ],
      "internshipLogsLegacy": [ { "id": "ilog-9" } ],
    });
    migrate(&mut v, 1).unwrap();
    let obj = v.as_object().unwrap();
    assert!(!obj.contains_key("currentMood"));
    assert!(!obj.contains_key("moodHistory"));
    assert!(!obj.contains_key("internshipLogsLegacy"));
    let profile = obj["profile"].as_object().unwrap();
    assert!(!profile.contains_key("avatarMood"));
    assert_eq!(obj["profile"]["workspaceId"].as_str(), Some(DEFAULT_WORKSPACE_ID));
    // internshipLogs era ausente → v4 inseriu [] e v13 NÃO renomeia (quirk);
    // resultado: ilog-9 descartado.
    assert_eq!(obj["internshipLogs"], Value::Array(vec![]));
    let course = obj["courses"][0].as_object().unwrap();
    assert!(!course.contains_key("progress"));
    assert_eq!(course["schedule"][0]["start"].as_str(), Some("09:00"));
  }
}
