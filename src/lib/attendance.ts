/**
 * Frequência (spec-frequencia.md) — núcleo puro e testável.
 *
 * Modelo: `Course.attendance` = `{ total, minPct, baseAttended, records[] }`.
 * - `total` (manual/ajustável): total de aulas previstas.
 * - `minPct` (default 75): percentual mínimo de presença da disciplina.
 * - `baseAttended`: presenças herdadas do par legado `{attended,total}`.
 * - `records[]`: histórico por aula (presente/falta/cancelada, com hora e nota).
 *
 * Margem de faltas: `maxAbsences = floor(total * (100 - minPct) / 100)`;
 * `margin = maxAbsences - faltas`.
 */
import type {
  AttendanceRecord,
  AttendanceStatus,
  Course,
  CourseAttendance,
  CourseScheduleSlot,
} from '../types';

export const DEFAULT_MIN_ATTENDANCE_PCT = 75;
/** Duração padrão de uma aula quando o slot não tem término (spec §3). */
export const DEFAULT_CLASS_HOURS = 2;

export type AttendanceMarginStatus = 'ok' | 'atencao' | 'limite' | 'estourou';

/** Métricas derivadas da frequência. `null` quando não há total configurado. */
export interface AttendanceStats {
  attended: number;
  absences: number;
  cancelled: number;
  realized: number;
  total: number;
  minPct: number;
  pct: number;
  maxAbsences: number;
  margin: number;
  status: AttendanceMarginStatus;
}

function iso(): string {
  return new Date().toISOString();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizeAttendance(
  course: Course
): Pick<CourseAttendance, 'total' | 'minPct' | 'records'> & { baseAttended?: number } {
  const a = course.attendance;
  return {
    total: a?.total ?? 0,
    minPct: a?.minPct ?? DEFAULT_MIN_ATTENDANCE_PCT,
    baseAttended: a?.baseAttended,
    records: a?.records ?? [],
  };
}

function withAttendance(course: Course, records: AttendanceRecord[]): Course {
  const base = normalizeAttendance(course);
  return {
    ...course,
    attendance: {
      total: base.total,
      minPct: base.minPct,
      baseAttended: base.baseAttended,
      records,
      totalHours: course.attendance?.totalHours,
      baseHoursDone: course.attendance?.baseHoursDone,
    },
  };
}

/** Duração da aula do dia `date` derivada do slot (0=término faltando → default). */
export function recordHoursForCourse(course: Course, date: string): number | undefined {
  const day = new Date(date + 'T00:00:00').getDay();
  const slot = (course.schedule ?? []).find((s) => s.day === day);
  if (!slot || !slot.end) return DEFAULT_CLASS_HOURS;
  const [sh, sm] = slot.start.split(':').map(Number);
  const [eh, em] = slot.end.split(':').map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return minutes > 0 ? round2(minutes / 60) : DEFAULT_CLASS_HOURS;
}

// ---------------------------------------------------------------------------
// Frequência em horas (SPEC-004): a UI pede carga horária; as aulas são derivadas.
// ---------------------------------------------------------------------------

/** Duração (h) de um slot; só conta quando `end` existe, senão default. */
function slotHours(start: string, end?: string): number {
  if (!end) return DEFAULT_CLASS_HOURS;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return minutes > 0 ? minutes / 60 : DEFAULT_CLASS_HOURS;
}

/**
 * Duração média das aulas a partir dos slots do horário. Slot sem término conta
 * como `DEFAULT_CLASS_HOURS`; horário vazio também. Resultado em horas (float).
 */
export function hoursPerClassFromSchedule(schedule?: CourseScheduleSlot[]): number {
  const slots = Array.isArray(schedule) ? schedule : [];
  if (!slots.length) return DEFAULT_CLASS_HOURS;
  const total = slots.reduce(
    (acc, s) => acc + slotHours(String(s.start), s.end ? String(s.end) : undefined),
    0
  );
  return total > 0 ? round2(total / slots.length) : DEFAULT_CLASS_HOURS;
}

/**
 * Aulas derivadas da carga horária: `round(totalHours / duração média)`,
 * mínimo 1 quando `totalHours > 0` (nunca "0 aulas" para matéria com carga).
 */
export function classesFromHours(totalHours: number, schedule?: CourseScheduleSlot[]): number {
  if (!totalHours || totalHours <= 0) return 0;
  const hpc = hoursPerClassFromSchedule(schedule);
  return Math.max(1, Math.round(totalHours / hpc));
}

/** Reverso (migração/editar legado): horas ≈ aulas × duração média, 1 casa decimal. */
export function hoursFromClasses(totalClasses: number, schedule?: CourseScheduleSlot[]): number {
  if (!totalClasses || totalClasses <= 0) return 0;
  return Math.round(totalClasses * hoursPerClassFromSchedule(schedule) * 10) / 10;
}

/** Constrói o `attendance` completo a partir de horas — ou `undefined` se sem carga. */
export function buildAttendanceFromHours(opts: {
  totalHours?: number;
  hoursDone?: number;
  minPct?: number;
  schedule?: CourseScheduleSlot[];
}): CourseAttendance | undefined {
  if (!opts.totalHours || opts.totalHours <= 0) return undefined;
  const total = classesFromHours(opts.totalHours, opts.schedule);
  const done = opts.hoursDone && opts.hoursDone > 0 ? opts.hoursDone : 0;
  return {
    total,
    minPct: opts.minPct ?? DEFAULT_MIN_ATTENDANCE_PCT,
    baseAttended: Math.min(classesFromHours(done, opts.schedule), total),
    records: [],
    totalHours: Math.round(opts.totalHours * 10) / 10,
    baseHoursDone: done > 0 ? Math.round(done * 10) / 10 : undefined,
  };
}

export function attendanceStats(attendance?: CourseAttendance): AttendanceStats | null {
  if (!attendance || !attendance.total || attendance.total <= 0) return null;
  const records = attendance.records ?? [];
  const presentCount = records.filter((r) => r.status === 'presente').length;
  const absenceCount = records.filter((r) => r.status === 'falta').length;
  const cancelledCount = records.filter((r) => r.status === 'cancelada').length;
  const attended = (attendance.baseAttended ?? 0) + presentCount;
  const absences = absenceCount;
  const cancelled = cancelledCount;
  const realized = attended + absences;
  const total = attendance.total;
  const minPct = attendance.minPct ?? DEFAULT_MIN_ATTENDANCE_PCT;
  const pct = realized > 0 ? Math.round((attended / realized) * 100) : 0;
  const maxAbsences = Math.floor((total * (100 - minPct)) / 100);
  const margin = maxAbsences - absences;

  let status: AttendanceMarginStatus;
  if (margin < 0) status = 'estourou';
  else if (margin === 0) status = 'limite';
  else if (realized > 0 && pct < minPct) status = 'atencao';
  else status = 'ok';

  return { attended, absences, cancelled, realized, total, minPct, pct, maxAbsences, margin, status };
}

export interface AttendanceActionInput {
  status: AttendanceStatus;
  /** Note id vinculado (só relevante em "presente", ex.: anotação de aula). */
  noteId?: string;
}

/** Marca a participação da aula da data (upsert por data; mais recente na frente). */
export function applyAttendanceAction(
  course: Course,
  action: AttendanceActionInput,
  date: string
): Course {
  const records = (course.attendance?.records ?? []).slice();
  const idx = records.findIndex((r) => r.date === date);
  const hours = recordHoursForCourse(course, date) ?? DEFAULT_CLASS_HOURS;

  if (idx >= 0) {
    const existing = records[idx];
    const next: AttendanceRecord = {
      ...existing,
      status: action.status,
      hours: existing.hours ?? hours,
      updatedAt: iso(),
    };
    if (action.noteId) next.noteId = action.noteId;
    else if (action.status !== 'presente') delete next.noteId;
    records[idx] = next;
    return withAttendance(course, records);
  }

  const record: AttendanceRecord = {
    id: 'ar-' + Date.now(),
    date,
    status: action.status,
    hours,
    updatedAt: iso(),
  };
  if (action.noteId) record.noteId = action.noteId;
  records.unshift(record);
  return withAttendance(course, records);
}

/** Edita um registro específico (ex.: carga horária, status). */
export function updateAttendanceRecord(
  course: Course,
  recordId: string,
  patch: Partial<Omit<AttendanceRecord, 'id' | 'date'>>
): Course {
  const records = (course.attendance?.records ?? []).map((r) =>
    r.id === recordId ? { ...r, ...patch, updatedAt: iso() } : r
  );
  return withAttendance(course, records);
}

/** Remove um registro do histórico (ex.: marcado por engano). */
export function removeAttendanceRecord(course: Course, recordId: string): Course {
  const records = (course.attendance?.records ?? []).filter((r) => r.id !== recordId);
  return withAttendance(course, records);
}

/** Vincula presença à anotação de aula (anotou = esteve presente, spec §5). */
export function upsertPresenceForClassNote(
  course: Course,
  note: { id: string; date: string }
): Course {
  if (!note.date) return course;
  const records = (course.attendance?.records ?? []).slice();
  const idx = records.findIndex((r) => r.date === note.date);
  const hours = recordHoursForCourse(course, note.date) ?? DEFAULT_CLASS_HOURS;

  if (idx >= 0) {
    records[idx] = { ...records[idx], noteId: note.id, updatedAt: iso() };
  } else {
    const record: AttendanceRecord = {
      id: 'ar-' + Date.now(),
      date: note.date,
      status: 'presente',
      noteId: note.id,
      hours,
      updatedAt: iso(),
    };
    records.unshift(record);
  }
  return withAttendance(course, records);
}

/** Registros ordenados do mais recente para o mais antigo (estável). */
export function sortAttendanceRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  return [...records].sort((a, b) =>
    a.date === b.date ? 0 : a.date > b.date ? -1 : 1
  );
}

/** Converte registros legados {attended,total} para o novo shape. */
export function migrateLegacyAttendance(
  legacy: { attended?: number; total?: number } | undefined
): CourseAttendance | undefined {
  if (!legacy || !legacy.total) return undefined;
  return {
    total: legacy.total,
    minPct: DEFAULT_MIN_ATTENDANCE_PCT,
    baseAttended: legacy.attended,
    records: [],
  };
}