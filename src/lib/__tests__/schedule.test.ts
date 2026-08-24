import { describe, it, expect } from 'vitest';
import {
  parseLegacySchedule,
  formatCourseSchedule,
  getTodaySchedule,
  classesForMonth,
  weekDates,
  startOfWeek,
} from '../schedule';
import type { Course } from '../../types';
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
    progress: 0,
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
