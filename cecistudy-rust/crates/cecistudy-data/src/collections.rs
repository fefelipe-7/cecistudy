//! Fronteira tipada dos repositórios (R1b): cada coleção da base da usuária
//! passa a se mapear para a entidade tipada de `cecistudy_domain::entity`
//! (forma derivada de `contracts/schema.sql` + golden). `load_typed`/`save_typed`
//! desacoplam os chamadores (sync, backup, use cases) do `data_json` cru: o
//! schema do banco continua a gravar a entidade completa em `data_json` com as
//! colunas escalares/join-tables como projeção de consulta (engine genérico de
//! [`crate::repositories`] — não alterado nesta slice).
//!
//! `supervision` não tem oracle golden (nunca sai no payload); o valor é
//! preservado como JSON canônico da tabela `supervision_notebook`.
//!
//! Semânticas de carga espelham `normalize.ts`/`read.rs`: singletons nunca
//! gravados → `None`; arrays com tabela vazia → coleção vazia `Some`; pref sem
//! tabela (`reminder`/`onboarding`/`syncIndex`) → `None`.

use cecistudy_common::Error;
use cecistudy_domain::entity::*;
use rusqlite::Connection;
use serde::Serialize;
use serde::de::DeserializeOwned;
use serde_json::Value;

use crate::repositories::{load_collection, save_collection};

/// As 22 coleções tipadas da base da usuária.
#[derive(Clone, Debug, PartialEq)]
pub enum Collection {
  Profile(Profile),
  Courses(Vec<Course>),
  Classes(Vec<ClassNote>),
  Tasks(Vec<Task>),
  Exams(Vec<Assessment>),
  Authors(Vec<Author>),
  Concepts(Vec<Concept>),
  Readings(Vec<ReadingItem>),
  Flashcards(Vec<Flashcard>),
  Materials(Vec<MaterialItem>),
  Techniques(Vec<Technique>),
  InternshipLogs(Vec<InternshipLog>),
  Supervision(Vec<Value>),
  Tcc(TccData),
  Stickers(Vec<Sticker>),
  Sessions(Vec<StudySession>),
  StreakData(StreakData),
  LooseNotes(Vec<LooseNote>),
  SavedBookIds(SavedBookIds),
  BookmarkedCourseIds(BookmarkedCourseIds),
  ReadingProgress(ReadingProgress),
  QuizSessions(Vec<QuizSession>),
}

impl Collection {
  pub fn key(&self) -> &'static str {
    match self {
      Collection::Profile(_) => "profile",
      Collection::Courses(_) => "courses",
      Collection::Classes(_) => "classes",
      Collection::Tasks(_) => "tasks",
      Collection::Exams(_) => "exams",
      Collection::Authors(_) => "authors",
      Collection::Concepts(_) => "concepts",
      Collection::Readings(_) => "readings",
      Collection::Flashcards(_) => "flashcards",
      Collection::Materials(_) => "materials",
      Collection::Techniques(_) => "techniques",
      Collection::InternshipLogs(_) => "internshipLogs",
      Collection::Supervision(_) => "supervision",
      Collection::Tcc(_) => "tcc",
      Collection::Stickers(_) => "stickers",
      Collection::Sessions(_) => "sessions",
      Collection::StreakData(_) => "streakData",
      Collection::LooseNotes(_) => "looseNotes",
      Collection::SavedBookIds(_) => "savedBookIds",
      Collection::BookmarkedCourseIds(_) => "bookmarkedCourseIds",
      Collection::ReadingProgress(_) => "readingProgress",
      Collection::QuizSessions(_) => "quizSessions",
    }
  }

  /// Converte tipificado → `Value` (canonical JSON v1, chaves camelCase).
  pub fn to_value(&self) -> Value {
    match self {
      Collection::Profile(v) => sv(v),
      Collection::Courses(v) => sv(v),
      Collection::Classes(v) => sv(v),
      Collection::Tasks(v) => sv(v),
      Collection::Exams(v) => sv(v),
      Collection::Authors(v) => sv(v),
      Collection::Concepts(v) => sv(v),
      Collection::Readings(v) => sv(v),
      Collection::Flashcards(v) => sv(v),
      Collection::Materials(v) => sv(v),
      Collection::Techniques(v) => sv(v),
      Collection::InternshipLogs(v) => sv(v),
      Collection::Supervision(v) => Value::Array(v.clone()),
      Collection::Tcc(v) => sv(v),
      Collection::Stickers(v) => sv(v),
      Collection::Sessions(v) => sv(v),
      Collection::StreakData(v) => sv(v),
      Collection::LooseNotes(v) => sv(v),
      Collection::SavedBookIds(v) => sv(v),
      Collection::BookmarkedCourseIds(v) => sv(v),
      Collection::ReadingProgress(v) => sv(v),
      Collection::QuizSessions(v) => sv(v),
    }
  }

  /// Converte o `Value` do banco/payload → entidade tipada (verificação de
  /// forma no carregamento, espelho do Zod do backup TS).
  pub fn from_value(key: &str, value: Value) -> Result<Self, Error> {
    let c = match key {
      "profile" => Collection::Profile(de(key, value)?),
      "courses" => Collection::Courses(de(key, value)?),
      "classes" => Collection::Classes(de(key, value)?),
      "tasks" => Collection::Tasks(de(key, value)?),
      "exams" => Collection::Exams(de(key, value)?),
      "authors" => Collection::Authors(de(key, value)?),
      "concepts" => Collection::Concepts(de(key, value)?),
      "readings" => Collection::Readings(de(key, value)?),
      "flashcards" => Collection::Flashcards(de(key, value)?),
      "materials" => Collection::Materials(de(key, value)?),
      "techniques" => Collection::Techniques(de(key, value)?),
      "internshipLogs" => Collection::InternshipLogs(de(key, value)?),
      "supervision" => Collection::Supervision(value.as_array().cloned().unwrap_or_default()),
      "tcc" => Collection::Tcc(de(key, value)?),
      "stickers" => Collection::Stickers(de(key, value)?),
      "sessions" => Collection::Sessions(de(key, value)?),
      "streakData" => Collection::StreakData(de(key, value)?),
      "looseNotes" => Collection::LooseNotes(de(key, value)?),
      "savedBookIds" => Collection::SavedBookIds(de(key, value)?),
      "bookmarkedCourseIds" => Collection::BookmarkedCourseIds(de(key, value)?),
      "readingProgress" => Collection::ReadingProgress(de(key, value)?),
      "quizSessions" => Collection::QuizSessions(de(key, value)?),
      other => {
        return Err(Error::Validation(format!(
          "coleção desconhecida para leitura tipada: {other}"
        )));
      }
    };
    Ok(c)
  }

  /// Carrega uma coleção tipada. `None` = nunca gravada (singleton/pref).
  pub fn load(conn: &Connection, key: &str) -> Result<Option<Self>, Error> {
    match load_collection(conn, key)? {
      Some(value) => Ok(Some(Collection::from_value(key, value)?)),
      None => Ok(None),
    }
  }

  /// Regrava a coleção tipada inteira (mesma transação do engine genérico).
  pub fn save(&self, conn: &Connection) -> Result<(), Error> {
    save_collection(conn, self.key(), &self.to_value())
  }
}

/// Deserializa `Value` → entidade tipada com erro de forma explicado.
fn de<T: DeserializeOwned>(key: &str, value: Value) -> Result<T, Error> {
  serde_json::from_value(value)
    .map_err(|e| Error::Validation(format!("{key}: forma inválida: {e}")))
}

/// Serializa entidade tipada → `Value` (não falha com os tipos deste crate).
fn sv<T: Serialize>(value: &T) -> Value {
  serde_json::to_value(value).expect("serializar entidade tipada não falha")
}
