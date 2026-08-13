---
name: cecistudy-data-model
description: Use when adding, changing, or inspecting data in the cecistudy project — TypeScript types, seed data (initialData.ts, libraryData.ts), relationships between entities, localStorage persistence, or entity IDs. Reference types.ts as the source of truth and follow existing id prefixes and relation conventions.
---

# cecistudy Data Model

Guide for working with cecistudy data. Full reference: `.context/data-model.md`.

## Source of truth
- **Types:** `src/types.ts` (interfaces for Course, ClassNote, Task, Exam, StudySession,
  ReadingItem, Flashcard, PsychologyConcept, PsychologyAuthor, PsychologyApproach,
  MaterialItem, InternshipLog, TccData, Sticker, UserProfile, DailyMoodData).
- **Seeds:** `src/data/initialData.ts` (domain entities) and `src/data/libraryData.ts`
  (library catalog — own types `CollectionBook`, `ContextCollection`).

## Relationships (FK-style fields)
- `ClassNote.courseId`, `Task.disciplineId`/`classId`, `Exam.courseId`,
  `StudySession.courseId`, `ReadingItem.courseId`, `Flashcard.conceptId`/`courseId`,
  `MaterialItem.courseId` → `Course.id`
- `PsychologyConcept.approachId`/`authorIds[]`/`courseIds[]`
- `PsychologyAuthor.approachId`, `InternshipLog.conceptIds[]`

## ID prefixes (seeds)
`c` Course · `cl-` ClassNote · `t`/`task_` Task · `e` Exam · `ss-` StudySession ·
`r` ReadingItem · `f` Flashcard · `con-` Concept · `aut-` Author · `app-` Approach ·
`m` Material · `ilog-` InternshipLog · `st-` Sticker · `bk-` CollectionBook ·
`tr-` TrendingBook · `col-` ContextCollection.

QuickAdd-created ids use `Date.now()` with a prefix (`t-`, `cl-`, `r-`, `f-`, `con-`, `ilog-`).

## Persistence
- Global state in `App.tsx` via `usePersistentState(key, initial)` → localStorage key
  `cecistudy_<key>`.
- **Not persisted** (local view state): `savedBookIds`, `looseNotes` (BibliotecaView),
  dummy data in HomeView and MoodCalendarWidget. Flag this if you touch these.

## Rules
1. New global entity → add interface in `types.ts`, seed in `initialData.ts`, and
   a `usePersistentState` entry in `App.tsx`.
2. Respect existing id prefixes and relation keys.
3. Do not duplicate data between `ReadingItem` and `CollectionBook` without documenting intent.
