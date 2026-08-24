import type { Course, CourseScheduleSlot } from '../types';
import { WEEKDAY_LABELS } from '../data/constants';

const WEEKDAY_MAP: Record<string, number> = {
  domingo: 0, dom: 0,
  segunda: 1, segundas: 1, seg: 1,
  terça: 2, terças: 2, terca: 2, tercas: 2, ter: 2,
  quarta: 3, quartas: 3, qua: 3,
  quinta: 4, quintas: 4, qui: 4,
  sexta: 5, sextas: 5, sex: 5,
  sábado: 6, sáb: 6, sabado: 6, sab: 6,
};

/** Dia da semana (0=domingo) de uma data. */
export function weekdayIndex(date: Date): number {
  return date.getDay();
}

/**
 * Converte um `schedule` legado (texto livre) em slots estruturados.
 * Aceita formatos como "Segundas, 08:00 - 11:30", "seg 9h", "seg e qua 9h".
 * Usado pela migração de dados (v8 → v9). Textos sem dia reconhecível viram [].
 */
export function parseLegacySchedule(text?: string): CourseScheduleSlot[] {
  if (!text) return [];
  const slots: CourseScheduleSlot[] = [];
  const segments = text
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .split(/[;\n]+| e (?=\w)/);
  for (const seg of segments) {
    const days = Object.entries(WEEKDAY_MAP)
      .filter(([name]) => new RegExp(`\\b${name}s?\\b`).test(seg))
      .map(([, idx]) => idx);
    if (days.length === 0) continue;
    const colonTimes = [...seg.matchAll(/(\d{1,2}):(\d{2})/g)].map((m) => `${m[1].padStart(2, '0')}:${m[2]}`);
    let start = colonTimes[0];
    let end = colonTimes[1];
    if (!start) {
      const hMatch = seg.match(/(\d{1,2})\s*h/);
      start = hMatch ? `${hMatch[1].padStart(2, '0')}:00` : '00:00';
    }
    for (const day of [...new Set(days)]) {
      slots.push({ day, start, end: end ?? undefined });
    }
  }
  return slots;
}

/** Normaliza `schedule` (string legado OU array) em slots estruturados. */
function slotsOf(schedule: string | CourseScheduleSlot[] | undefined): CourseScheduleSlot[] {
  if (Array.isArray(schedule)) return schedule;
  return parseLegacySchedule(schedule);
}

/** Disciplinas que têm aula no dia da semana informado. */
export function getCoursesOnWeekday(courses: Course[], date: Date): Course[] {
  const target = weekdayIndex(date);
  return courses.filter((c) => slotsOf(c.schedule).some((s) => s.day === target));
}

/** Aula recorrente de um dia (disciplina + slot do horário). */
export interface ScheduledClass {
  course: Course;
  slot: CourseScheduleSlot;
}

/** Aulas do dia, ordenadas por horário de início. */
export function getTodaySchedule(
  courses: Course[],
  date: Date
): ScheduledClass[] {
  const target = weekdayIndex(date);
  const out: ScheduledClass[] = [];
  courses.forEach((c) =>
    slotsOf(c.schedule).forEach((slot) => {
      if (slot.day === target) out.push({ course: c, slot });
    })
  );
  return out.sort((a, b) => a.slot.start.localeCompare(b.slot.start));
}

/** Data (sem hora) de um dia do mês: new Date(year, month-1, day). */
function dateOfDay(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

/**
 * Aulas recorrentes por dia de um mês inteiro (grade semanal projetada no mês).
 * Chave = dia do mês (1-based).
 */
export function classesForMonth(
  courses: Course[],
  year: number,
  month: number
): Map<number, ScheduledClass[]> {
  const byDay = new Map<number, ScheduledClass[]>();
  for (let day = 1; day <= daysInMonth(year, month); day++) {
    const list = getTodaySchedule(courses, dateOfDay(year, month, day));
    if (list.length > 0) byDay.set(day, list);
  }
  return byDay;
}

/** Domingo da semana da data informada (00:00). */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/** Os 7 dias da semana (domingo…sábado) que contém a data informada. */
export function weekDates(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function formatSlot(slot: CourseScheduleSlot): string {
  const label = WEEKDAY_LABELS[slot.day] ?? '?';
  const time = slot.end ? `${slot.start}–${slot.end}` : slot.start;
  return `${label} ${time}`;
}

/** Texto amigável do horário da disciplina: "seg 08:00–11:30 · quar 09:00". */
export function formatCourseSchedule(slots: string | CourseScheduleSlot[] | undefined): string {
  const arr = slotsOf(slots);
  if (!arr.length) return '';
  return arr
    .slice()
    .sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))
    .map(formatSlot)
    .join(' · ');
}

/** Primeira hora de início (HH:MM) ou null se não houver horário. */
export function extractScheduleTime(slots?: string | CourseScheduleSlot[] | undefined): string | null {
  const arr = slotsOf(slots);
  if (!arr.length) return null;
  return arr[0].start;
}

/** Eventos de uma data (YYYY-MM-DD) derivados de provas e tarefas com prazo. */
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  kind: 'prova' | 'tarefa';
  courseId?: string;
  completed: boolean;
}

export function eventsForMonth(
  exams: { id: string; title: string; date: string; courseId: string; completed: boolean }[],
  tasks: { id: string; title: string; dueDate?: string; disciplineId?: string; completed: boolean }[],
  month: number,
  year: number
): Map<number, CalendarEvent[]> {
  const pad = (n: number) => String(n).padStart(2, '0');
  const byDay = new Map<number, CalendarEvent[]>();
  const add = (ev: CalendarEvent) => {
    const day = Number(ev.date.slice(8, 10));
    if (Number.isNaN(day)) return;
    const list = byDay.get(day) ?? [];
    list.push(ev);
    byDay.set(day, list);
  };
  exams.forEach((e) => {
    if (e.date.startsWith(`${year}-${pad(month)}`)) {
      add({ id: e.id, title: e.title, date: e.date, kind: 'prova', courseId: e.courseId, completed: e.completed });
    }
  });
  tasks.forEach((t) => {
    if (t.dueDate && t.dueDate.startsWith(`${year}-${pad(month)}`)) {
      add({ id: t.id, title: t.title, date: t.dueDate, kind: 'tarefa', courseId: t.disciplineId, completed: t.completed });
    }
  });
  return byDay;
}

/** Próximos eventos (ordenados por data, a partir de hoje), com limite. */
export function upcomingEvents(
  exams: { id: string; title: string; date: string; courseId: string }[],
  tasks: { id: string; title: string; dueDate?: string; disciplineId?: string }[],
  internshipLogs: { id: string; date: string; activity: string }[],
  limit = 5
): CalendarEvent[] {
  const todayKey = new Date().toISOString().slice(0, 10);
  const all: CalendarEvent[] = [
    ...exams.map((e) => ({ id: e.id, title: e.title, date: e.date, kind: 'prova' as const, courseId: e.courseId, completed: false })),
    ...tasks
      .filter((t) => t.dueDate)
      .map((t) => ({ id: t.id, title: t.title, date: t.dueDate as string, kind: 'tarefa' as const, courseId: t.disciplineId, completed: false })),
    ...internshipLogs.map((l) => ({ id: l.id, title: l.activity, date: l.date, kind: 'tarefa' as const, completed: false })),
  ];
  return all
    .filter((e) => e.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

/** Formata "2026-08-11" → "11/08". */
export function formatShortDate(date: string): string {
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return date;
  return `${d}/${m}`;
}

/** Nome do mês em pt-BR minúsculo (ex.: "agosto"). */
export function monthName(year: number, month: number): string {
  return new Date(year, month - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long' })
    .toLowerCase();
}

/** Dias de um mês (1..28-31). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
