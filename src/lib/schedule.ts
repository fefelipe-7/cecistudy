import type {
  Course,
  CourseScheduleSlot,
  Exam,
  Task,
  StudySession,
  ThesisProject,
  ThesisChapter,
  ThesisMeeting,
  ThesisTask,
} from '../types';
import { isChapterDone } from '../types';
import { WEEKDAY_LABELS } from '../data/constants';
import { formatDateShortBR, addDaysKey } from './dateBR';
import type { InternshipLog, DateKey } from '../types';

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

/** Formata "2026-08-11" → "11/08". */
export function formatShortDate(date: string): string {
  return formatDateShortBR(date);
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

/* ================================================================ */
/*  Calendário — um agregador só (SPEC-024 D4/D6)                    */
/* ================================================================ */

export type CalendarLayer = 'faculdade' | 'tcc' | 'estudos' | 'estagio';

export type CalendarEntryKind = 'aula' | 'prova' | 'tarefa' | 'tcc' | 'estagio' | 'estudo';

export interface CalendarEntryRef {
  kind:
    | 'class'
    | 'exam'
    | 'task'
    | 'chapter'
    | 'thesisTask'
    | 'meeting'
    | 'milestone'
    | 'internship'
    | 'session';
  id: string;
}

/**
 * Item de leitura do calendário. `date` é `DateKey` (`YYYY-MM-DD`), nunca o dia
 * do mês: a chave numérica perdia mês e ano (D6).
 */
export interface CalendarEntry {
  id: string;
  date: DateKey;
  kind: CalendarEntryKind;
  layer: CalendarLayer;
  title: string;
  start?: string;
  end?: string;
  ref: CalendarEntryRef;
}

export interface BuildCalendarEntriesArgs {
  courses: Course[];
  exams: Exam[];
  tasks: Task[];
  thesis?: ThesisProject;
  chapters: ThesisChapter[];
  thesisTasks: ThesisTask[];
  meetings: ThesisMeeting[];
  internshipLogs: InternshipLog[];
  studySessions: StudySession[];
  /** Janela fechada: `from <= date <= to`. */
  from: DateKey;
  to: DateKey;
}

/**
 * A única fonte de eventos do mobile (D4). Puro: nenhum relógio — a janela
 * chega por `from`/`to`. Ordenado por `(date, start ?? '99:99', title)`.
 *
 * Capítulo pronto, pendência resolvida/arquivada e reunião cancelada não
 * entram (I3); todo item aponta para a entidade que o originou (I2).
 */
export function buildCalendarEntries(args: BuildCalendarEntriesArgs): CalendarEntry[] {
  const { from, to, thesis } = args;
  const out: CalendarEntry[] = [];
  if (to < from) return out;

  const inWindow = (date?: string): date is DateKey => !!date && date >= from && date <= to;

  // aulas recorrentes: o slot da disciplina projetado em cada dia da janela
  for (let key = from; key <= to; key = addDaysKey(key, 1)) {
    const [y, m, d] = keyParts(key);
    getTodaySchedule(args.courses, new Date(y, m, d)).forEach(({ course, slot }) => {
      out.push({
        id: `aula-${course.id}-${slot.start}-${key}`,
        date: key,
        kind: 'aula',
        layer: 'faculdade',
        title: course.name,
        start: slot.start,
        end: slot.end,
        ref: { kind: 'class', id: course.id },
      });
    });
  }

  args.exams.forEach((e) => {
    if (!inWindow(e.date)) return;
    out.push({
      id: `prova-${e.id}`,
      date: e.date,
      kind: 'prova',
      layer: 'faculdade',
      title: e.title,
      start: e.time,
      ref: { kind: 'exam', id: e.id },
    });
  });

  args.tasks.forEach((t) => {
    if (!inWindow(t.dueDate)) return;
    out.push({
      id: `tarefa-${t.id}`,
      date: t.dueDate,
      kind: 'tarefa',
      layer: 'faculdade',
      title: t.title,
      ref: { kind: 'task', id: t.id },
    });
  });

  args.chapters.forEach((ch) => {
    if (isChapterDone(ch) || !inWindow(ch.dueDate)) return;
    out.push({
      id: `tcc-chapter-${ch.id}`,
      date: ch.dueDate,
      kind: 'tcc',
      layer: 'tcc',
      title: ch.title,
      ref: { kind: 'chapter', id: ch.id },
    });
  });

  args.thesisTasks.forEach((t) => {
    if (t.status === 'resolvida' || t.status === 'arquivada' || !inWindow(t.dueDate)) return;
    out.push({
      id: `tcc-task-${t.id}`,
      date: t.dueDate,
      kind: 'tcc',
      layer: 'tcc',
      title: t.title,
      ref: { kind: 'thesisTask', id: t.id },
    });
  });

  args.meetings.forEach((m) => {
    if (m.status !== 'agendada' || !inWindow(m.date)) return;
    out.push({
      id: `tcc-meeting-${m.id}`,
      date: m.date,
      kind: 'tcc',
      layer: 'tcc',
      title: `reunião com ${thesis?.advisor || 'a orientação'}`,
      ref: { kind: 'meeting', id: m.id },
    });
  });

  const milestone = (date: string | undefined, id: string, title: string) => {
    if (!inWindow(date)) return;
    out.push({
      id: `tcc-milestone-${id}`,
      date,
      kind: 'tcc',
      layer: 'tcc',
      title,
      ref: { kind: 'milestone', id },
    });
  };
  milestone(thesis?.deliveryDate, 'delivery', 'entrega final do tcc');
  milestone(thesis?.defenseDate, 'defense', 'banca do tcc');

  args.internshipLogs.forEach((l) => {
    if (!inWindow(l.date)) return;
    out.push({
      id: `estagio-${l.id}`,
      date: l.date,
      kind: 'estagio',
      layer: 'estagio',
      title: l.activity,
      ref: { kind: 'internship', id: l.id },
    });
  });

  args.studySessions.forEach((s) => {
    if (!inWindow(s.date)) return;
    out.push({
      id: `estudo-${s.id}`,
      date: s.date,
      kind: 'estudo',
      layer: 'estudos',
      title: s.topic,
      start: s.startTime,
      ref: { kind: 'session', id: s.id },
    });
  });

  return out.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.start ?? '99:99').localeCompare(b.start ?? '99:99') ||
      a.title.localeCompare(b.title, 'pt-BR'),
  );
}

/** `[ano, mês-1, dia]` de uma `DateKey`, para o construtor local. */
function keyParts(key: DateKey): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m - 1, d];
}


