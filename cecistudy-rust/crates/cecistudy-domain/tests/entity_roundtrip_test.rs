//! Round-trip typed ↔ canonical JSON v1 (R1a): cada entidade tipada de
//! `cecistudy_domain::entity` deve deserializar os snapshots `sample`/`empty` do
//! golden e re-serializar para exatamente o mesmo canonical JSON v1 (paridade
//! TS ↔ Rust, via `cecistudy_common::canonicalize`). Nunca editar um golden à
//! mão — regenerar com
//! `GOLDEN_WRITE=1 npm run test -- src/lib/__tests__/goldenFixtures.test.ts`.

use std::fs;
use std::path::Path;

use cecistudy_common::canonicalize;
use cecistudy_domain::entity::*;
use serde::Serialize;
use serde::de::DeserializeOwned;
use serde_json::Value;

const GOLDEN_DIR: &str = "../../contracts/golden/collections";

fn raw(label: &str, name: &str) -> Value {
  let path = Path::new(GOLDEN_DIR).join(label).join(format!("{name}.json"));
  let text = fs::read_to_string(&path).unwrap_or_else(|e| panic!("lendo golden {:?}: {e}", path));
  serde_json::from_str(&text).unwrap_or_else(|e| panic!("parse golden {name}: {e}"))
}

fn assert_roundtrip<T: Serialize + DeserializeOwned>(label: &str, name: &str) {
  let raw = raw(label, name);
  let typed: T =
    serde_json::from_value(raw.clone()).unwrap_or_else(|e| panic!("deserialize {name}: {e}"));
  let typed_value =
    serde_json::to_value(&typed).unwrap_or_else(|e| panic!("serialize {name}: {e}"));
  assert_eq!(
    canonicalize(&typed_value),
    canonicalize(&raw),
    "round-trip {name} divergiu do canonical JSON v1"
  );
}

#[test]
fn colecoes_em_array_roundtrip_sample() {
  assert_roundtrip::<Vec<Course>>("sample", "courses");
  assert_roundtrip::<Vec<ClassNote>>("sample", "classes");
  assert_roundtrip::<Vec<Task>>("sample", "tasks");
  assert_roundtrip::<Vec<Assessment>>("sample", "exams");
  assert_roundtrip::<Vec<StudySession>>("sample", "sessions");
  assert_roundtrip::<Vec<ReadingItem>>("sample", "readings");
  assert_roundtrip::<Vec<Flashcard>>("sample", "flashcards");
  assert_roundtrip::<Vec<Author>>("sample", "authors");
  assert_roundtrip::<Vec<Concept>>("sample", "concepts");
  assert_roundtrip::<Vec<MaterialItem>>("sample", "materials");
  assert_roundtrip::<Vec<Technique>>("sample", "techniques");
  assert_roundtrip::<Vec<InternshipLog>>("sample", "internshipLogs");
  assert_roundtrip::<Vec<LooseNote>>("sample", "looseNotes");
  assert_roundtrip::<Vec<Sticker>>("sample", "stickers");
  assert_roundtrip::<Vec<QuizSession>>("sample", "quizSessions");
  assert_roundtrip::<SavedBookIds>("sample", "savedBookIds");
  assert_roundtrip::<BookmarkedCourseIds>("sample", "bookmarkedCourseIds");
}

#[test]
fn colecoes_em_objeto_roundtrip_sample() {
  assert_roundtrip::<Profile>("sample", "profile");
  assert_roundtrip::<TccData>("sample", "tcc");
  assert_roundtrip::<StreakData>("sample", "streakData");
  assert_roundtrip::<ReadingProgress>("sample", "readingProgress");
  assert_roundtrip::<Reminder>("sample", "reminder");
  assert_roundtrip::<Onboarding>("sample", "onboarding");
}

#[test]
fn snapshots_vazios_deserializam() {
  assert_roundtrip::<Vec<Course>>("empty", "courses");
  assert_roundtrip::<Profile>("empty", "profile");
  assert_roundtrip::<TccData>("empty", "tcc");
  assert_roundtrip::<StreakData>("empty", "streakData");
  assert_roundtrip::<ReadingProgress>("empty", "readingProgress");
}

#[test]
fn campos_opcionais_preservam_ausencia() {
  // c2 não tem `minGrade`/`room`; o round-trip deve manter a chave ausente.
  let courses: Vec<Course> =
    serde_json::from_value(raw("sample", "courses")).expect("courses tipado");
  let c2 = &courses[1];
  assert!(c2.min_grade.is_none());
  assert!(c2.room.is_none());
  let first = &courses[0];
  assert!(first.attendance.is_none());
}
