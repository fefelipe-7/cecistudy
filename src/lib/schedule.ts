import type { Course, CourseScheduleSlot, Exam, Task, StudySession, TccData } from '../types';
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

/* ================================================================ */
/*  Calendário desktop — camadas (Faculdade / TCC / Estudos / GCal) */
/* ================================================================ */

/** Categoria visual de um evento no calendário desktop. */
export type CalendarLayer = 'faculdade' | 'tcc' | 'estudos' | 'gcal';

/** Subtipo de evento (define ícone + semantics). */
export type CalendarSubtype = 'aula' | 'prova' | 'tarefa' | 'tcc' | 'estudo' | 'externo';

/** Origem do dado real (para write-back ao arrastar/redimensionar). */
export type CalendarEntryRef = 'class' | 'exam' | 'task' | 'tccChapter' | 'session' | 'gcal';

export interface CalendarStage {
  id: string;
  label: string;
  done: boolean;
}

export interface CalendarLink {
  label: string;
}

export interface CalendarEntry {
  id: string;
  layer: CalendarLayer;
  subtype: CalendarSubtype;
  title: string;
  subtitle: string;
  date: string; // YYYY-MM-DD
  courseId?: string;
  courseName?: string;
  completed?: boolean;
  importance?: string;
  status?: string;
  stages?: CalendarStage[];
  links?: CalendarLink[];
  notes?: string;
  plannedStart?: string;
  plannedEnd?: string;
  start?: string; // HH:MM (quando temporizado)
  end?: string; // HH:MM
  /** Referência ao dado real para write-back (arrasto/redimensionar). */
  entryRef?: CalendarEntryRef;
  /** Id da entidade real (índice do capítulo do TCC quando entryRef='tccChapter'). */
  dataId?: string;
}

export interface TimedEntry extends CalendarEntry {
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface DayCalendarEntries {
  timed: TimedEntry[];
  allDay: CalendarEntry[];
}

export interface BuildCalendarWeekArgs {
  weekDays: Date[];
  courses: Course[];
  exams: Exam[];
  tasks: Task[];
  sessions: StudySession[];
  tcc?: TccData;
  gcal?: CalendarEntry[];
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addHoursHHMM(start: string, hours: number): string {
  const [h, m] = start.split(':').map(Number);
  const total = Math.min(23, h + hours);
  return `${pad2(total)}:${pad2(m)}`;
}

function addMinutesHHMM(start: string, mins: number): string {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + Math.max(0, mins);
  const eh = Math.min(23, Math.floor(total / 60));
  const em = total % 60;
  return `${pad2(eh)}:${pad2(em)}`;
}

const STUDY_STARTS = ['09:00', '11:00', '14:00', '16:00', '19:00'];

/**
 * Deriva os eventos de uma semana acadêmica (Seg…Sex por padrão) a partir do
 * estado real do app, agrupados por camada. Início das sessões de estudo é
 * estimado para o layout (StudySession armazena só data + duração).
 */
export function buildCalendarWeek(args: BuildCalendarWeekArgs): Record<number, DayCalendarEntries> {
  const result: Record<number, DayCalendarEntries> = {};

  args.weekDays.forEach((day, idx) => {
    const dayEntries: DayCalendarEntries = { timed: [], allDay: [] };
    const key = toDateKey(day);

    // aulas recorrentes (horário estruturado da disciplina)
    getTodaySchedule(args.courses, day).forEach(({ course, slot }) => {
      dayEntries.timed.push({
        id: `aula-${course.id}-${slot.start}-${key}`,
        layer: 'faculdade',
        subtype: 'aula',
        title: course.name,
        subtitle: 'aula',
        date: key,
        courseId: course.id,
        courseName: course.name,
        start: slot.start,
        end: slot.end ?? addHoursHHMM(slot.start, 1),
        entryRef: 'class',
        dataId: course.id,
      });
    });

    // provas (bloco de 2h; usa o horário real quando informado)
    args.exams
      .filter((e) => e.date === key)
      .forEach((e) => {
        const course = args.courses.find((c) => c.id === e.courseId);
        const start = e.time ?? '14:00';
        dayEntries.timed.push({
          id: e.id,
          layer: 'faculdade',
          subtype: 'prova',
          title: e.title,
          subtitle: 'prova',
          date: key,
          courseId: e.courseId,
          courseName: course?.name,
          completed: e.completed,
          start,
          end: addHoursHHMM(start, 2),
          entryRef: 'exam',
          dataId: e.id,
        });
      });

    // tarefas com prazo → faixa "dia inteiro" (estilo "entrega: …")
    args.tasks
      .filter((t) => t.dueDate && t.dueDate === key)
      .forEach((t) => {
        const course = args.courses.find((c) => c.id === t.disciplineId);
        dayEntries.allDay.push({
          id: t.id,
          layer: 'faculdade',
          subtype: 'tarefa',
          title: `entrega: ${t.title}`,
          subtitle: 'tarefa',
          date: key,
          courseId: t.disciplineId,
          courseName: course?.name,
          completed: t.completed,
          entryRef: 'task',
          dataId: t.id,
        });
      });

    // TCC: capítulos com prazo viram bloco tcc; etapas = capítulos do tcc
    if (args.tcc) {
      const tcc = args.tcc;
      const stages: CalendarStage[] = tcc.chapters.map((c, ci) => ({
        id: `tcc-ch-${ci}`,
        label: c.title,
        done: c.completed,
      }));
      tcc.chapters.forEach((ch, i) => {
        if (ch.dueDate && ch.dueDate === key) {
          dayEntries.timed.push({
            id: `tcc-${i}-${key}`,
            layer: 'tcc',
            subtype: 'tcc',
            title: `${tcc.title} — ${ch.title}`,
            subtitle: 'bloco tcc',
            date: key,
            importance: ch.completed ? undefined : 'importante',
            status: ch.completed ? 'concluído' : undefined,
            stages,
            links: tcc.references.slice(0, 3).map((r) => ({ label: r })),
            notes: tcc.problemStatement,
            start: '16:00',
            end: '18:00',
            entryRef: 'tccChapter',
            dataId: String(i),
          });
        }
      });
    }

    // sessões de estudo (timed; início real quando informado, senão estimado)
    const daySessions = args.sessions.filter((s) => s.date === key);
    daySessions.forEach((s, i) => {
      const start = s.startTime ?? STUDY_STARTS[i % STUDY_STARTS.length];
      const course = s.courseId ? args.courses.find((c) => c.id === s.courseId) : undefined;
      dayEntries.timed.push({
        id: s.id,
        layer: 'estudos',
        subtype: 'estudo',
        title: `bloco: ${s.topic}`,
        subtitle: 'estudo',
        date: key,
        courseId: s.courseId,
        courseName: course?.name,
        start,
        end: addMinutesHHMM(start, s.durationMinutes),
        entryRef: 'session',
        dataId: s.id,
      });
    });

    // google calendar (placeholder — ainda sem integração)
    (args.gcal ?? []).forEach((g) => {
      if (g.date === key) dayEntries.allDay.push({ ...g, entryRef: 'gcal', dataId: g.id });
    });

    result[idx] = dayEntries;
  });

  return result;
}

/** Limites e altura da grade de horas (7h–20h, 56px/h). */
export const CAL_GRID_START_HOUR = 7;
export const CAL_GRID_END_HOUR = 20;
export const CAL_HOUR_HEIGHT = 56;

/** Posição (top/height em px) de um evento temporizado dentro da grade. */
export function layoutTimedEntry(start: string, end: string): { top: number; height: number } {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const top = Math.max(0, toMin(start) - CAL_GRID_START_HOUR * 60) / 60 * CAL_HOUR_HEIGHT;
  const rawH = Math.max(CAL_HOUR_HEIGHT / 2, (toMin(end) - toMin(start)) / 60 * CAL_HOUR_HEIGHT);
  const maxH = (CAL_GRID_END_HOUR - CAL_GRID_START_HOUR) * CAL_HOUR_HEIGHT - top;
  return { top, height: Math.min(rawH, Math.max(0, maxH)) };
}

/* ================================================================ */
/*  Layout de sobreposição (estilo Google Calendar) + snap de grade  */
/* ================================================================ */

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, total));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

/** Arredonda um horário para o múltiplo de 30min mais próximo. */
export function snapTo30Minutes(time: string): string {
  const mins = timeToMinutes(time);
  const snapped = Math.round(mins / 30) * 30;
  return minutesToTime(snapped);
}

export interface TimedLayoutEntry extends TimedEntry {
  column: number; // 0-based
  columns: number; // total de colunas naquele cluster
}

/**
 * Calcula colunas lado-a-lado para eventos que se sobrepõem no tempo
 * (mesmo algoritmo do app de referência). Eventos que não colidem
 * dividem a largura total; os que colidem ficam em colunas adjacentes.
 */
export function computeOverlappingEventLayout(entries: TimedEntry[]): TimedLayoutEntry[] {
  const sorted = [...entries].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const result: TimedLayoutEntry[] = [];
  let cluster: TimedEntry[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const cols = new Map<number, number>();
    let maxCol = 0;
    cluster.forEach((entry) => {
      let col = 0;
      while (cols.get(col) !== undefined && cols.get(col)! > timeToMinutes(entry.start)) col++;
      cols.set(col, timeToMinutes(entry.end));
      result.push({ ...entry, column: col, columns: 1 });
      maxCol = Math.max(maxCol, col + 1);
    });
    result.forEach((r) => {
      if (cluster.some((c) => c.id === r.id)) r.columns = maxCol;
    });
    cluster = [];
    clusterEnd = -1;
  };

  sorted.forEach((entry) => {
    const start = timeToMinutes(entry.start);
    const end = timeToMinutes(entry.end);
    if (cluster.length > 0 && start >= clusterEnd) flush();
    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, end);
  });
  if (cluster.length > 0) flush();

  return result;
}
