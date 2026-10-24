import { describe, expect, it } from 'vitest';
import {
  buildCalendarEntries,
  type BuildCalendarEntriesArgs,
  type CalendarEntry,
} from '../schedule';
import type {
  Course,
  Exam,
  InternshipLog,
  StudySession,
  Task,
  ThesisChapter,
  ThesisMeeting,
  ThesisProject,
  ThesisTask,
} from '../../types';

// Janela: 2026-10-05 (segunda) a 2026-10-11 (domingo).
const FROM = '2026-10-05';
const TO = '2026-10-11';

const course = {
  id: 'c-1',
  name: 'psicologia do desenvolvimento',
  schedule: [{ day: 1, start: '08:00', end: '10:00' }],
} as Course;

const exam = {
  id: 'e-1',
  title: 'prova de estatística',
  date: '2026-10-06',
  courseId: 'c-1',
} as Exam;
const task = { id: 't-1', title: 'entregar fichamento', dueDate: '2026-10-07' } as Task;
const chapter = {
  id: 'ch-1',
  title: 'revisão de literatura',
  stage: 'escrevendo',
  dueDate: '2026-10-08',
} as ThesisChapter;
const thesisTask = {
  id: 'tt-1',
  title: 'enviar pré-projeto',
  status: 'aberta',
  dueDate: '2026-10-09',
} as ThesisTask;
const meeting = { id: 'mt-1', date: '2026-10-10', status: 'agendada' } as ThesisMeeting;
const thesis = {
  id: 'tcc-main',
  title: 'meu tcc',
  advisor: 'mariana',
  deliveryDate: '2026-10-11',
} as ThesisProject;
const internshipLog = {
  id: 'il-1',
  date: '2026-10-06',
  activity: 'plantão na clínica',
} as InternshipLog;
const studySession = { id: 'ss-1', date: '2026-10-07', topic: 'ler capítulo 2' } as StudySession;

const args = (over: Partial<BuildCalendarEntriesArgs> = {}): BuildCalendarEntriesArgs => ({
  courses: [course],
  exams: [exam],
  tasks: [task],
  thesis,
  chapters: [chapter],
  thesisTasks: [thesisTask],
  meetings: [meeting],
  internshipLogs: [internshipLog],
  studySessions: [studySession],
  from: FROM,
  to: TO,
  ...over,
});

const ids = (kind: CalendarEntry['ref']['kind'], entries: CalendarEntry[]): Set<string> =>
  new Set(entries.filter((e) => e.ref.kind === kind).map((e) => e.ref.id));

describe('buildCalendarEntries (SPEC-024 D4/D6)', () => {
  it('I1 — mesma entrada, mesma saída (nenhum relógio)', () => {
    expect(buildCalendarEntries(args())).toEqual(buildCalendarEntries(args()));
  });

  it('I2 — todo item tem dono: o ref resolve para uma entidade da entrada', () => {
    const entries = buildCalendarEntries(args());
    expect(entries).toHaveLength(9);
    expect(ids('class', entries)).toEqual(new Set([course.id]));
    expect(ids('exam', entries)).toEqual(new Set([exam.id]));
    expect(ids('task', entries)).toEqual(new Set([task.id]));
    expect(ids('chapter', entries)).toEqual(new Set([chapter.id]));
    expect(ids('thesisTask', entries)).toEqual(new Set([thesisTask.id]));
    expect(ids('meeting', entries)).toEqual(new Set([meeting.id]));
    expect(ids('milestone', entries)).toEqual(new Set(['delivery']));
    expect(ids('internship', entries)).toEqual(new Set([internshipLog.id]));
    expect(ids('session', entries)).toEqual(new Set([studySession.id]));
  });

  it('as 9 origens produzem um item cada', () => {
    const kinds = buildCalendarEntries(args())
      .map((e) => e.kind)
      .sort();
    expect(kinds).toEqual([
      'aula',
      'estagio',
      'estudo',
      'prova',
      'tarefa',
      'tcc',
      'tcc',
      'tcc',
      'tcc',
    ]);
    const layers = new Set(buildCalendarEntries(args()).map((e) => e.layer));
    expect(layers).toEqual(new Set(['faculdade', 'tcc', 'estagio', 'estudos']));
  });

  it('ordena por (date, start ?? 99:99, title)', () => {
    const entries = buildCalendarEntries(
      args({
        courses: [],
        exams: [
          { id: 'e-2', title: 'b', date: '2026-10-06', time: '14:00' } as Exam,
          { id: 'e-1', title: 'a', date: '2026-10-06', time: '09:00' } as Exam,
          { id: 'e-3', title: 'sem hora', date: '2026-10-06' } as Exam,
        ],
        tasks: [],
        chapters: [],
        thesisTasks: [],
        meetings: [],
        thesis: undefined,
        internshipLogs: [],
        studySessions: [],
      }),
    );
    expect(entries.map((e) => e.id)).toEqual(['prova-e-1', 'prova-e-2', 'prova-e-3']);
  });

  it('janela é fechada: item fora de from/to não entra', () => {
    const entries = buildCalendarEntries(
      args({
        courses: [],
        tasks: [
          { id: 't-antes', title: 'antes', dueDate: '2026-10-04' } as Task,
          { id: 't-depois', title: 'depois', dueDate: '2026-10-12' } as Task,
          { id: 't-dentro', title: 'dentro', dueDate: '2026-10-05' } as Task,
        ],
        exams: [],
        chapters: [],
        thesisTasks: [],
        meetings: [],
        thesis: undefined,
        internshipLogs: [],
        studySessions: [],
      }),
    );
    expect(entries.map((e) => e.ref.id)).toEqual(['t-dentro']);
  });

  it('I3 — capítulo pronto, pendência resolvida e reunião cancelada não entram', () => {
    const entries = buildCalendarEntries(
      args({
        chapters: [{ ...chapter, stage: 'pronto' } as ThesisChapter],
        thesisTasks: [{ ...thesisTask, status: 'resolvida' } as ThesisTask],
        meetings: [{ ...meeting, status: 'cancelada' } as ThesisMeeting],
      }),
    );
    expect(
      entries.filter(
        (e) => e.ref.kind === 'chapter' || e.ref.kind === 'thesisTask' || e.ref.kind === 'meeting',
      ),
    ).toEqual([]);
  });
});
