/**
 * Central de notificações — domínio puro (SPEC-M-025 D1, D2)
 *
 * Este módulo não importa React, Capacitor ou Tauri. Ele contém apenas
 * disciplina: faixas de id, tipos e planejamento.
 */

export type NotificationFamily =
  | 'daily'
  | 'class'
  | 'thesis'
  | 'exam'
  | 'internship'
  | 'task';

export const NOTIFICATION_RANGES = {
  daily: { base: 1000, range: 100 },
  class: { base: 2000, range: 200 },
  thesis: { base: 3000, range: 200 },
  exam: { base: 4000, range: 200 },
  internship: { base: 5000, range: 100 },
  task: { base: 6000, range: 100 },
} as const;

/** `tab` é a intenção de tela; o shell traduz (SPEC-M-025 D8). */
export type NotificationTarget = {
  tab: string;
  entityId?: string;
  /** Dia civil (`YYYY-MM-DD`) que a tela deve abrir, quando houver. */
  day?: string;
};

export type PlannedNotification = {
  family: NotificationFamily;
  id: number;
  when: Date;
  titleKey: string;
  bodyKey: string;
  meta?: Record<string, unknown>;
  target?: NotificationTarget;
};

const parseHHMM = (time: string): { hour: number; minute: number } => {
  const [h, m] = time.split(':').map(Number);
  return { hour: Number.isFinite(h) ? h : 9, minute: Number.isFinite(m) ? m : 0 };
};

const at = (key: string, time: string): Date => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return new Date(NaN);
  const { hour, minute } = parseHHMM(time);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hour, minute);
};

const addDays = (key: string, days: number): string => {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
};

const weekdayOf = (key: string): number => new Date(key + 'T00:00:00').getDay();

const isWeekday = (key: string): boolean => {
  const wd = weekdayOf(key);
  return wd !== 0 && wd !== 6;
};

/**
 * D3: horário do lembrete `minutes` antes de `start`.
 * O wrap é de um dia só — aula de 00:05 avisa às 23:55.
 */
export function minutesBefore(start: string, minutes: number): { hour: number; minute: number } {
  const { hour: h, minute: m } = parseHHMM(start);
  let hour = h;
  let minute = m - minutes;
  if (minute < 0) {
    minute += 60;
    hour -= 1;
  }
  if (hour < 0) hour = 23;
  return { hour, minute };
}

const idInRange = (family: NotificationFamily, index: number): number =>
  NOTIFICATION_RANGES[family].base + index;

const finish = (
  family: NotificationFamily,
  out: PlannedNotification[],
): PlannedNotification[] => {
  const range = NOTIFICATION_RANGES[family].range;
  return out
    .sort((a, b) => a.when.getTime() - b.when.getTime())
    .slice(0, range)
    .map((n, i) => ({ ...n, id: idInRange(family, i) }));
};

// ---------------------------------------------------------------------------
// Provas (D4)
// ---------------------------------------------------------------------------

export type ExamItem = { id: string; title: string; date: string; time?: string; completed?: boolean };
export type ExamPrefs = { enabled: boolean; time: string };

/** D4: lembretes de prova 7/1/0 dias antes */
export function planExamReminders(
  exams: ExamItem[],
  prefs: ExamPrefs,
  today: string,
  now: Date = new Date(),
): PlannedNotification[] {
  if (!prefs.enabled || !exams.length) return [];
  const out: PlannedNotification[] = [];
  const days = [7, 1, 0];
  for (const ex of exams) {
    if (ex.completed) continue;
    for (const d of days) {
      const key = addDays(ex.date, -d);
      if (key < today) continue;
      let when: Date;
      if (d === 0 && ex.time) {
        const { hour, minute } = parseHHMM(ex.time);
        const examAt = at(ex.date, `${hour}:${minute}`);
        when = new Date(examAt.getTime() - 60 * 60 * 1000); // 1h antes
      } else {
        when = at(key, prefs.time);
      }
      if (Number.isNaN(when.getTime()) || when.getTime() <= now.getTime()) continue;
      out.push({
        family: 'exam',
        id: 0,
        when,
        titleKey: 'provaTitulo',
        bodyKey: 'provaPrazo',
        meta: { referencia: ex.title, dias: d },
        target: { tab: 'calendario', entityId: ex.id, day: ex.date },
      });
    }
  }
  return finish('exam', out);
}

// ---------------------------------------------------------------------------
// Estágio (D5)
// ---------------------------------------------------------------------------

export type InternshipLogItem = { date: string };
export type InternshipPrefs = { enabled: boolean; time: string };

/** D5: lembrete de registro de estágio diário em dias úteis */
export function planInternshipReminders(
  logs: InternshipLogItem[],
  prefs: InternshipPrefs,
  today: string,
  now: Date = new Date(),
): PlannedNotification[] {
  if (!prefs.enabled) return [];
  if (!isWeekday(today)) return [];
  const hasLog = logs.some((l) => l.date === today);
  if (hasLog) return [];
  const when = at(today, prefs.time);
  if (Number.isNaN(when.getTime()) || when.getTime() <= now.getTime()) return [];
  return [
    {
      family: 'internship',
      id: idInRange('internship', 0),
      when,
      titleKey: 'estagioTitulo',
      bodyKey: 'estagioRegistrar',
      target: { tab: 'estagio' },
    },
  ];
}

// ---------------------------------------------------------------------------
// Tarefas (D10)
// ---------------------------------------------------------------------------

export type TaskItem = { id: string; title: string; dueDate?: string; completed?: boolean };
export type TaskPrefs = { enabled: boolean; time: string };

/** D10: véspera e dia do prazo, no horário configurado */
export function planTaskReminders(
  tasks: TaskItem[],
  prefs: TaskPrefs,
  today: string,
  now: Date = new Date(),
): PlannedNotification[] {
  if (!prefs.enabled || !tasks.length) return [];
  const out: PlannedNotification[] = [];
  for (const task of tasks) {
    if (task.completed || !task.dueDate) continue;
    for (const d of [1, 0]) {
      const key = addDays(task.dueDate, -d);
      if (key < today) continue;
      const when = at(key, prefs.time);
      if (Number.isNaN(when.getTime()) || when.getTime() <= now.getTime()) continue;
      out.push({
        family: 'task',
        id: 0,
        when,
        titleKey: d === 1 ? 'tarefaVesperaTitulo' : 'tarefaTitulo',
        bodyKey: 'tarefaPrazo',
        meta: { referencia: task.title, dias: d },
        target: { tab: 'home', entityId: task.id },
      });
    }
  }
  return finish('task', out);
}

// ---------------------------------------------------------------------------
// Resumo diário (D11)
// ---------------------------------------------------------------------------

export type SummarySnapshot = {
  courses: { name: string; schedule: { day: number; start: string }[] }[];
  exams: { title: string; date: string }[];
  tasks: { title: string; dueDate?: string; completed?: boolean }[];
  thesis?: {
    chapters: { title: string; dueDate?: string; stage?: string }[];
    tasks: { title: string; dueDate?: string; completed?: boolean }[];
  };
};

export type SummaryItem =
  | { kind: 'aula'; nome: string; inicio: string }
  | { kind: 'prova'; titulo: string }
  | { kind: 'tarefa'; titulo: string }
  | { kind: 'tcc'; titulo: string };

export type SummaryPrefs = { enabled: boolean; time: string };

const summaryItemsFor = (snapshot: SummarySnapshot, dayKey: string): SummaryItem[] => {
  const items: SummaryItem[] = [];
  const weekday = weekdayOf(dayKey);
  for (const course of snapshot.courses) {
    for (const slot of course.schedule) {
      if (slot.day === weekday) items.push({ kind: 'aula', nome: course.name, inicio: slot.start });
    }
  }
  for (const exam of snapshot.exams) {
    if (exam.date === dayKey) items.push({ kind: 'prova', titulo: exam.title });
  }
  for (const task of snapshot.tasks) {
    if (task.dueDate === dayKey && !task.completed) items.push({ kind: 'tarefa', titulo: task.title });
  }
  for (const chapter of snapshot.thesis?.chapters ?? []) {
    if (chapter.dueDate === dayKey && chapter.stage !== 'pronto') {
      items.push({ kind: 'tcc', titulo: chapter.title });
    }
  }
  for (const task of snapshot.thesis?.tasks ?? []) {
    if (task.dueDate === dayKey && !task.completed) items.push({ kind: 'tcc', titulo: task.title });
  }
  return items;
};

/**
 * D11: uma notificação por dia, materializada por `horizon` dias.
 *
 * Materializar evita repetir o resumo de hoje amanhã: cada dia carrega o
 * conteúdo dele. Dia sem nada cai na frase genérica da voz (`resumoCorpo`).
 */
export function planDailySummaries(
  snapshot: SummarySnapshot,
  prefs: SummaryPrefs,
  today: string,
  now: Date = new Date(),
  horizon = 14,
): PlannedNotification[] {
  if (!prefs.enabled) return [];
  const out: PlannedNotification[] = [];
  for (let offset = 0; offset < horizon; offset++) {
    const key = addDays(today, offset);
    const when = at(key, prefs.time);
    if (Number.isNaN(when.getTime()) || when.getTime() <= now.getTime()) continue;
    const items = summaryItemsFor(snapshot, key);
    out.push({
      family: 'daily',
      id: 0,
      when,
      titleKey: 'resumoTitulo',
      bodyKey: 'resumoCorpo',
      meta: {
        itens: items.slice(0, 4),
        restantes: Math.max(0, items.length - 4),
        turno: when.getHours() < 12 ? 'manha' : 'tarde',
      },
      target: { tab: 'home' },
    });
  }
  return finish('daily', out);
}
