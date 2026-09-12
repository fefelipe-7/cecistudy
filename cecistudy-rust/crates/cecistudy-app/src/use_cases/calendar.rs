//! Caso de uso: calendário derivado (read-only) do banco do usuário.
//!
//! Porta de `src/lib/schedule.ts` (web): eventos `prova`/`tarefa` do `eventsForMonth`
//! mais aulas recorrentes projetadas da grade semanal (`classesForMonth`). Nenhuma
//! regra de negócio nova — derivação determinística a partir de `courses`/`exams`/`tasks`.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use cecistudy_common::Result;
use cecistudy_data::load_collection;

use crate::App;

/// Estilo/tipo do evento no calendário.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CalendarEventKind {
  /// Aula recorrente da disciplina (grade semanal projetada no mês).
  Aula,
  /// Prova anotada.
  Prova,
  /// Tarefa com prazo.
  Tarefa,
}

/// Um evento de calendário de um dia (`YYYY-MM-DD`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
  pub id: String,
  pub title: String,
  pub date: String,
  pub kind: CalendarEventKind,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub course_id: Option<String>,
  pub completed: bool,
}

impl App {
  /// Deriva os eventos de `year/month` (aulas da grade + provas + tarefas com
  /// prazo no mês), ordenados por `date` e depois `title`. Porta de
  /// `classesForMonth` + `eventsForMonth` (TS).
  pub fn get_calendar_events(&self, year: u32, month: u32) -> Result<Vec<CalendarEvent>> {
    let courses = list_collection(self, "courses");
    let exams = list_collection(self, "exams");
    let tasks = list_collection(self, "tasks");

    let mut events: Vec<CalendarEvent> = Vec::new();
    let prefix = format!("{year:04}-{month:02}");

    // Aulas recorrentes: cada slot (day 0..6 / start) do `course.schedule`
    // vira um evento por dia do mês que cai naquele dia da semana.
    for course in &courses {
      let Some(id) = course.get("id").and_then(Value::as_str) else { continue };
      let Some(schedule) = course.get("schedule").and_then(Value::as_array) else { continue };
      let Some(name) = course.get("name").and_then(Value::as_str) else { continue };
      for slot in schedule {
        let Some(day) = slot.get("day").and_then(Value::as_u64) else { continue };
        for day_of_month in 1..=days_in_month(year, month) {
          if weekday_index(year, month, day_of_month) == day {
            events.push(CalendarEvent {
              id: format!("aula-{id}-{day_of_month}"),
              title: name.to_owned(),
              date: format!("{year:04}-{month:02}-{day_of_month:02}"),
              kind: CalendarEventKind::Aula,
              course_id: Some(id.to_owned()),
              completed: false,
            });
          }
        }
      }
    }

    // Provas do mês.
    for exam in &exams {
      let date = exam.get("date").and_then(Value::as_str).unwrap_or_default();
      if !date.starts_with(&prefix) {
        continue;
      }
      events.push(CalendarEvent {
        id: exam.get("id").and_then(Value::as_str).unwrap_or_default().to_owned(),
        title: exam.get("title").and_then(Value::as_str).unwrap_or_default().to_owned(),
        date: date.to_owned(),
        kind: CalendarEventKind::Prova,
        course_id: exam.get("courseId").and_then(Value::as_str).map(str::to_owned),
        completed: exam.get("completed").and_then(Value::as_bool).unwrap_or(false),
      });
    }

    // Tarefas com `dueDate` no mês.
    for task in &tasks {
      let due = task.get("dueDate").and_then(Value::as_str).unwrap_or_default();
      if !due.starts_with(&prefix) {
        continue;
      }
      events.push(CalendarEvent {
        id: task.get("id").and_then(Value::as_str).unwrap_or_default().to_owned(),
        title: task.get("title").and_then(Value::as_str).unwrap_or_default().to_owned(),
        date: due.to_owned(),
        kind: CalendarEventKind::Tarefa,
        course_id: task.get("disciplineId").and_then(Value::as_str).map(str::to_owned),
        completed: task.get("completed").and_then(Value::as_bool).unwrap_or(false),
      });
    }

    events.sort_by(|a, b| a.date.cmp(&b.date).then_with(|| a.title.cmp(&b.title)));
    Ok(events)
  }
}

/// Lê uma coleção como lista de valores (vazia quando ausente).
fn list_collection(app: &App, key: &str) -> Vec<Value> {
  load_collection(app.db.connection(), key)
    .ok()
    .flatten()
    .map(|v| v.as_array().cloned().unwrap_or_default())
    .unwrap_or_default()
}

/// Dias de um mês (mesma semântica do `daysInMonth` TS `new Date(y, m, 0)`).
pub fn days_in_month(year: u32, month: u32) -> u32 {
  match month {
    1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
    4 | 6 | 9 | 11 => 30,
    2 if is_leap_year(year) => 29,
    2 => 28,
    _ => 30,
  }
}

fn is_leap_year(year: u32) -> bool {
  year.is_multiple_of(4) && !year.is_multiple_of(100) || year.is_multiple_of(400)
}

/// Dia da semana (0=domingo, como `Date.getDay()`).
fn weekday_index(year: u32, month: u32, day: u32) -> u64 {
  let (y, m) =
    if month <= 2 { (year as i64 - 1, month as i64 + 12) } else { (year as i64, month as i64) };
  let era = if y >= 0 { y / 400 } else { (y - 399) / 400 };
  let yoe = y - era * 400;
  let doy = (153 * (if m > 2 { m - 3 } else { m + 9 }) + 2) / 5 + day as i64 - 1;
  let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
  let days = era * 146_097 + doe - 719_468;
  (days + 4).rem_euclid(7) as u64
}

#[cfg(test)]
mod tests {
  use super::*;
  use cecistudy_data::save_collection;

  #[test]
  fn dias_no_mes() {
    assert_eq!(days_in_month(2026, 2), 28);
    assert_eq!(days_in_month(2024, 2), 29);
    assert_eq!(days_in_month(2026, 9), 30);
    assert_eq!(days_in_month(2026, 12), 31);
  }

  #[test]
  fn dia_da_semana_epoca_e_setembro_2026() {
    assert_eq!(weekday_index(1970, 1, 1), 4); // quinta
    assert_eq!(weekday_index(2026, 9, 1), 2); // terça
    assert_eq!(weekday_index(2026, 9, 7), 1); // segunda
  }

  #[test]
  fn projeta_aulas_recorrentes_do_mes() {
    let app = App::in_memory().unwrap();
    save_collection(
      app.db.connection(),
      "courses",
      &serde_json::json!([
        {
          "id": "c1",
          "name": "Teorias da Personalidade",
          "professor": "Helena",
          "semester": "6º",
          "color": "#D85F79",
          "icon": "Brain",
          "schedule": [{ "day": 1, "start": "08:00" }, { "day": 2, "start": "10:00" }]
        }
      ]),
    )
    .unwrap();

    let events = app.get_calendar_events(2026, 9).unwrap();
    let aulas: Vec<_> = events.iter().filter(|e| e.kind == CalendarEventKind::Aula).collect();
    // segundas (day=1): 7,14,21,28 · terças (day=2): 1,8,15,22,29
    assert_eq!(aulas.len(), 9);
    for e in &aulas {
      assert!(e.date.starts_with("2026-09-"));
      assert_eq!(e.course_id.as_deref(), Some("c1"));
      assert_eq!(e.title, "Teorias da Personalidade");
      assert!(!e.completed);
    }
  }

  #[test]
  fn inclui_prova_e_tarefa_do_mes_apenas() {
    let app = App::in_memory().unwrap();
    save_collection(
      app.db.connection(),
      "exams",
      &serde_json::json!([
        { "id": "e1", "courseId": "c1", "title": "P1", "date": "2026-09-15", "weight": "P1", "topics": [], "completed": false },
        { "id": "e2", "courseId": "c1", "title": "P2", "date": "2026-10-02", "weight": "P2", "topics": [], "completed": false }
      ]),
    )
    .unwrap();
    save_collection(
      app.db.connection(),
      "tasks",
      &serde_json::json!([
        { "id": "t1", "title": "ler cap. 3", "completed": true, "priority": "alta", "category": "leitura", "dueDate": "2026-09-10", "disciplineId": "c1" },
        { "id": "t2", "title": "resumo tcc", "completed": false, "priority": "baixa", "category": "trabalho", "dueDate": "2026-10-01" }
      ]),
    )
    .unwrap();

    let events = app.get_calendar_events(2026, 9).unwrap();
    let prova = events.iter().find(|e| e.kind == CalendarEventKind::Prova).unwrap();
    assert_eq!(prova.date, "2026-09-15");
    assert_eq!(prova.title, "P1");

    let tarefa = events.iter().find(|e| e.kind == CalendarEventKind::Tarefa).unwrap();
    assert_eq!(tarefa.date, "2026-09-10");
    assert!(tarefa.completed);

    let fora_do_mes = events.iter().any(|e| e.date.starts_with("2026-10"));
    assert!(!fora_do_mes);
  }

  #[test]
  fn eventos_ficam_ordenados_por_data() {
    let app = App::in_memory().unwrap();
    save_collection(
      app.db.connection(),
      "exams",
      &serde_json::json!([
        { "id": "e1", "courseId": "c1", "title": "P2", "date": "2026-09-20", "weight": "P2", "topics": [], "completed": false },
        { "id": "e2", "courseId": "c1", "title": "P1", "date": "2026-09-03", "weight": "P1", "topics": [], "completed": false }
      ]),
    )
    .unwrap();
    let events = app.get_calendar_events(2026, 9).unwrap();
    let dates: Vec<_> = events.iter().map(|e| e.date.as_str()).collect();
    assert_eq!(dates, ["2026-09-03", "2026-09-20"]);
  }
}
