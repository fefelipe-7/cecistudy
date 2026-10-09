import { describe, it, expect } from 'vitest';
import {
  parseLegacySchedule,
  formatCourseSchedule,
  getTodaySchedule,
  classesForMonth,
  weekDates,
  startOfWeek,
  thesisEventsForMonth,
} from '../schedule';
import type {
  Course,
  ThesisProject,
  ThesisChapter,
  ThesisMeeting,
  ThesisTask,
} from '../../types';
import { MIGRATIONS, SCHEMA_VERSION } from '../../data/schema';

const mkCourse = (id: string, schedule: Course['schedule']): Course =>
  ({
    id,
    name: id,
    code: '',
    professor: '',
    semester: '1',
    color: '#E97891',
    icon: 'Brain',
    category: 'obrigatoria',
    schedule,
  }) as Course;

describe('parseLegacySchedule', () => {
  it('converte horário com intervalo', () => {
    expect(parseLegacySchedule('Segundas, 08:00 - 11:30')).toEqual([
      { day: 1, start: '08:00', end: '11:30' },
    ]);
  });

  it('converte horário curto "9h"', () => {
    expect(parseLegacySchedule('seg 9h')).toEqual([
      { day: 1, start: '09:00', end: undefined },
    ]);
  });

  it('converte múltiplos dias separados por "e"', () => {
    const slots = parseLegacySchedule('seg e qua 9h');
    expect(slots).toHaveLength(2);
    expect(slots.map((s) => s.day)).toEqual([1, 3]);
  });

  it('retorna [] para texto sem dia', () => {
    expect(parseLegacySchedule('horário a definir')).toEqual([]);
  });
});

describe('formatCourseSchedule', () => {
  it('monta texto amigável', () => {
    expect(
      formatCourseSchedule([
        { day: 1, start: '08:00', end: '11:30' },
        { day: 3, start: '09:00' },
      ])
    ).toBe('seg 08:00–11:30 · qua 09:00');
  });
});

describe('getTodaySchedule', () => {
  const courses = [
    mkCourse('c1', [{ day: 1, start: '08:00', end: '11:30' }]),
    mkCourse('c2', [
      { day: 1, start: '14:00' },
      { day: 3, start: '09:00' },
    ]),
  ];

  it('retorna aulas do dia ordenadas por horário', () => {
    // 2026-08-24 é segunda-feira
    const monday = new Date(2026, 7, 24);
    const list = getTodaySchedule(courses, monday);
    expect(list.map((c) => c.course.id)).toEqual(['c1', 'c2']);
    expect(list[0].slot.start).toBe('08:00');
  });

  it('não retorna nada em dia sem aula', () => {
    const sunday = new Date(2026, 7, 23);
    expect(getTodaySchedule(courses, sunday)).toEqual([]);
  });
});

describe('classesForMonth', () => {
  it('projeta aulas recorrentes em todos os dias do mês', () => {
    const courses = [mkCourse('c1', [{ day: 1, start: '08:00' }])]; // segundas
    const byDay = classesForMonth(courses, 2026, 8); // agosto/2026
    // 3, 10, 17, 24 e 31 de agosto de 2026 são segundas
    expect([...byDay.keys()].sort((a, b) => a - b)).toEqual([3, 10, 17, 24, 31]);
    expect(byDay.get(24)?.[0].course.id).toBe('c1');
  });

  it('mês sem aula retorna mapa vazio', () => {
    const byDay = classesForMonth([], 2026, 8);
    expect(byDay.size).toBe(0);
  });
});

describe('weekDates / startOfWeek', () => {
  it('começa no domingo e cobre os 7 dias', () => {
    const wednesday = new Date(2026, 7, 26); // quarta-feira
    const days = weekDates(wednesday);
    expect(days).toHaveLength(7);
    expect(days.every((d) => d.getHours() === 0 && d.getMinutes() === 0)).toBe(true);
    days.forEach((d) => {
      expect(d.getDay()).toBe(days.indexOf(d));
    });
    expect(startOfWeek(wednesday).getDate()).toBe(23); // domingo 23/08
  });
});

describe('thesisEventsForMonth (SPEC-012 F4.5)', () => {
  const thesis = {
    id: 'tcc-main',
    title: 'meu tcc',
    advisor: 'mariana',
    field: 'tcc',
    problemStatement: '',
    objectives: [],
    status: 'em_andamento',
    deliveryDate: '2026-08-20',
    defenseDate: '2026-09-10',
    reminderPrefs: {
      enabled: false,
      chapterDaysBefore: [],
      milestoneDaysBefore: [],
      time: '09:00',
      meetingEve: false,
      meetingMinutesBefore: [],
    },
  } as ThesisProject;
  const thesisNoDates = { ...thesis, deliveryDate: undefined, defenseDate: undefined } as ThesisProject;
  const chapter = {
    id: 'ch-1',
    thesisId: 'tcc-main',
    position: 1,
    title: 'revisão de literatura',
    kind: 'capitulo',
    requiredness: 'obrigatorio',
    stage: 'escrevendo',
    dueDate: '2026-08-05',
    createdAt: '',
    updatedAt: '',
  } as ThesisChapter;
  const doneChapter = { ...chapter, id: 'ch-2', stage: 'pronto', dueDate: '2026-08-06' } as ThesisChapter;
  const task = {
    id: 'tt-1',
    thesisId: 'tcc-main',
    title: 'enviar pré-projeto',
    origin: 'minha',
    status: 'aberta',
    dueDate: '2026-08-10',
    createdAt: '',
    updatedAt: '',
  } as ThesisTask;
  const doneTask = { ...task, id: 'tt-2', status: 'resolvida' } as ThesisTask;
  const meeting = {
    id: 'mt-1',
    thesisId: 'tcc-main',
    date: '2026-08-12',
    mode: 'online',
    status: 'agendada',
    decisions: [],
    createdAt: '',
    updatedAt: '',
  } as ThesisMeeting;
  const cancelledMeeting = { ...meeting, id: 'mt-2', status: 'cancelada' } as ThesisMeeting;

  it('projeta capítulo, pendência, reunião e marcos no mês', () => {
    const byDay = thesisEventsForMonth(
      thesis,
      [chapter, doneChapter],
      [meeting, cancelledMeeting],
      [task, doneTask],
      8,
      2026
    );
    // capítulo em 05, pendência em 10, reunião agendada em 12, entrega em 20
    expect([...byDay.keys()].sort((a, b) => a - b)).toEqual([5, 10, 12, 20]);
    // marcos: entrega em agosto, banca em setembro
    expect(thesisEventsForMonth(thesis, [], [], [], 8, 2026).get(20)?.[0].tccTab).toBe('visao');
    expect(thesisEventsForMonth(thesis, [], [], [], 9, 2026).get(10)?.[0].id).toBe('tcc-milestone-defense');
  });

  it('todo evento tem kind tcc e destino (aba + foco por entityId)', () => {
    const byDay = thesisEventsForMonth(thesis, [chapter], [meeting], [task], 8, 2026);
    const events = [...byDay.values()].flat();
    expect(events.every((e) => e.kind === 'tcc')).toBe(true);
    const ch = events.find((e) => e.id === 'tcc-chapter-ch-1');
    expect(ch).toMatchObject({ tccTab: 'capitulos', tccFocusId: 'ch-1', completed: false });
    const tt = events.find((e) => e.id === 'tcc-task-tt-1');
    expect(tt).toMatchObject({ tccTab: 'orientacao', tccFocusId: 'tt-1' });
  });

  it('não projeta pendência resolvida, reunião cancelada nem capítulo pronto', () => {
    const byDay = thesisEventsForMonth(
      thesisNoDates,
      [doneChapter],
      [cancelledMeeting],
      [doneTask],
      8,
      2026
    );
    expect(byDay.size).toBe(0);
  });

  it('id do evento é por entityId, não por índice', () => {
    const other = { ...chapter, id: 'ch-9', dueDate: '2026-08-07' } as ThesisChapter;
    const ids = (m: Map<number, { id: string }[]>) =>
      [...m.values()].flat().map((e) => e.id).sort();
    const a = thesisEventsForMonth(thesisNoDates, [chapter, other], [], [], 8, 2026);
    const b = thesisEventsForMonth(thesisNoDates, [other, chapter], [], [], 8, 2026);
    expect(ids(a)).toEqual(ids(b));
    expect(ids(a)).toEqual(['tcc-chapter-ch-1', 'tcc-chapter-ch-9']);
  });
});

describe('migração v9 (schedule estruturado)', () => {
  it('converte courses[].schedule string em slots', () => {
    const data = {
      courses: [{ id: 'c1', schedule: 'Segundas, 08:00 - 11:30' }],
      profile: {},
    };
    let next = data;
    for (let v = 9; v <= SCHEMA_VERSION; v++) {
      const m = MIGRATIONS[v];
      if (m) next = m(next) as typeof data;
    }
    expect((next.courses as any[])[0].schedule).toEqual([
      { day: 1, start: '08:00', end: '11:30' },
    ]);
  });
});
