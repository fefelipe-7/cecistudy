import type { Course } from '../types';

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

/** Horário (HH:MM) extraído de um schedule livre como "Segundas, 08:00 - 11:30". */
export function extractScheduleTime(schedule?: string): string | null {
  if (!schedule) return null;
  const match = schedule.match(/([01]?\d|2[0-3]):[0-5]\d/);
  return match ? match[1] : null;
}

/** Disciplinas que têm aula no dia da semana informado. */
export function getCoursesOnWeekday(courses: Course[], date: Date): Course[] {
  const target = weekdayIndex(date);
  return courses.filter((c) => {
    if (!c.schedule) return false;
    const lower = c.schedule.toLowerCase();
    return Object.entries(WEEKDAY_MAP).some(
      ([name, idx]) => idx === target && new RegExp(`\\b${name}s?\\b`).test(lower)
    );
  });
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
  tasks: { id: string; title: string; dueDate?: string; completed: boolean }[],
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
      add({ id: t.id, title: t.title, date: t.dueDate, kind: 'tarefa', completed: t.completed });
    }
  });
  return byDay;
}

/** Próximos eventos (ordenados por data, a partir de hoje), com limite. */
export function upcomingEvents(
  exams: { id: string; title: string; date: string; courseId: string }[],
  tasks: { id: string; title: string; dueDate?: string; courseId?: string }[],
  internshipLogs: { id: string; date: string; activity: string }[],
  limit = 5
): CalendarEvent[] {
  const todayKey = new Date().toISOString().slice(0, 10);
  const all: CalendarEvent[] = [
    ...exams.map((e) => ({ id: e.id, title: e.title, date: e.date, kind: 'prova' as const, courseId: e.courseId, completed: false })),
    ...tasks
      .filter((t) => t.dueDate)
      .map((t) => ({ id: t.id, title: t.title, date: t.dueDate as string, kind: 'tarefa' as const, courseId: t.courseId, completed: false })),
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
