/**
 * Central de notificações — domínio puro (SPEC-M-025 D1, D2)
 *
 * Este módulo não importa React, Capacitor ou Tauri. Ele contém apenas
 * disciplina: faixas de id, tipos e assinatura de planejamento.
 */

export type NotificationFamily = 'daily' | 'class' | 'thesis' | 'exam' | 'internship';

export const NOTIFICATION_RANGES = {
  daily: { base: 1000, range: 100 },
  class: { base: 2000, range: 200 },
  thesis: { base: 3000, range: 200 },
  exam: { base: 4000, range: 200 },
  internship: { base: 5000, range: 100 },
} as const;

export type PlannedNotification = {
  family: NotificationFamily;
  id: number;
  when: Date;
  titleKey: string;
  bodyKey: string;
  meta?: Record<string, unknown>;
  target?: { tab: string; entityId?: string };
};

/** Assinatura do planejador por família — puro, sem efeitos colaterais. */
export type NotificationPlanner = (
  state: unknown,
  prefs: unknown,
  today: string,
  now?: Date,
) => PlannedNotification[];

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

const isWeekday = (key: string): boolean => {
  const d = new Date(key + 'T00:00:00');
  const wd = d.getDay();
  return wd !== 0 && wd !== 6;
};

/** D4: lembretes de prova 7/1/0 dias antes */
export type ExamItem = { id: string; title: string; date: string; time?: string; completed?: boolean };
export type ExamPrefs = { enabled: boolean; time: string };
export function planExamReminders(exams: ExamItem[], prefs: ExamPrefs, today: string, now: Date = new Date()): PlannedNotification[] {
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
        titleKey: 'notificacao.provaTitulo',
        bodyKey: 'notificacao.provaPrazo',
        meta: { referencia: ex.title, dias: d },
        target: { tab: 'calendario', entityId: ex.id },
      });
    }
  }
  out.sort((a, b) => a.when.getTime() - b.when.getTime());
  const base = NOTIFICATION_RANGES.exam.base;
  return out.slice(0, NOTIFICATION_RANGES.exam.range).map((n, i) => ({ ...n, id: base + i }));
}

/** D5: lembrete de registro de estágio diário em dias úteis */
export type InternshipLogItem = { date: string };
export type InternshipPrefs = { enabled: boolean; time: string };
export function planInternshipReminders(logs: InternshipLogItem[], prefs: InternshipPrefs, today: string, now: Date = new Date()): PlannedNotification[] {
  if (!prefs.enabled) return [];
  if (!isWeekday(today)) return [];
  const hasLog = logs.some(l => l.date === today);
  if (hasLog) return [];
  const when = at(today, prefs.time);
  if (Number.isNaN(when.getTime()) || when.getTime() <= now.getTime()) return [];
  const base = NOTIFICATION_RANGES.internship.base;
  return [{
    family: 'internship',
    id: base,
    when,
    titleKey: 'notificacao.estagioTitulo',
    bodyKey: 'notificacao.estagioRegistrar',
    target: { tab: 'estagio' },
  }];
}

