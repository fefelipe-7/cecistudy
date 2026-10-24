import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './storage';
import {
  planThesisReminders,
  type ThesisReminderKind,
  type ThesisReminderPrefs,
  type ThesisReminderState,
} from '../../packages/domain/src/core/domain/thesis';
import {
  minutesBefore,
  planDailySummaries,
  planExamReminders,
  planInternshipReminders,
  planTaskReminders,
  NOTIFICATION_RANGES,
  type NotificationFamily,
  type PlannedNotification,
  type SummaryItem,
  type SummarySnapshot,
} from '../../packages/domain/src/core/domain/notifications';
import { NOTIFICACAO, frase as vozFrase } from './voice';

export const REMINDER_CHANNEL = 'study-reminder';

/** teto de notificações locais pendentes no iOS (D13) */
const IOS_PENDING_BUDGET = 64;
/** famílias que o orçamento preserva antes de cortar por data */
const RESERVED_FAMILIES: NotificationFamily[] = ['daily', 'class'];

/** lembrete agendado: nativo (Capacitor) agenda via plugin; sem suporte na web. */
export function isReminderSupported(): boolean {
  return isNativePlatform;
}

/** pede (e devolve) permissão para notificações */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform) return false;
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display === 'granted') return true;
  if (perm.display === 'prompt') {
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  }
  return false;
}

export type ExactAlarmStatus = 'granted' | 'denied' | 'unknown';

/** A confirmação de D9 só faz sentido no Android nativo. */
export function supportsExactAlarmPrompt(): boolean {
  return isNativePlatform && Capacitor.getPlatform() === 'android';
}

/** D6: consulta o estado — nunca abre a tela do sistema sozinha. */
export async function checkExactAlarmStatus(): Promise<ExactAlarmStatus> {
  if (!supportsExactAlarmPrompt()) return 'unknown';
  try {
    const status = await LocalNotifications.checkExactNotificationSetting();
    return status.exact_alarm === 'granted' ? 'granted' : 'denied';
  } catch {
    // versões antigas do plugin não têm o método
    return 'unknown';
  }
}

/** D9: abre "Alarmes e lembretes". Só a UI chama, depois da confirmação. */
export async function openExactAlarmSettings(): Promise<boolean> {
  if (!supportsExactAlarmPrompt()) return false;
  try {
    await LocalNotifications.changeExactNotificationSetting();
    return (await checkExactAlarmStatus()) === 'granted';
  } catch {
    return false;
  }
}

/** O sync registra o warning; promover a tela é decisão da usuária (D9). */
async function warnIfInexactAlarm(): Promise<void> {
  if ((await checkExactAlarmStatus()) === 'denied') {
    console.warn('Lembrete agendado sem permissão de alarme exato no Android.');
  }
}

function rangeIds(family: NotificationFamily): { id: number }[] {
  const { base, range } = NOTIFICATION_RANGES[family];
  return Array.from({ length: range }, (_, i) => ({ id: base + i }));
}

function familyOf(id: number): NotificationFamily | null {
  for (const [family, { base, range }] of Object.entries(NOTIFICATION_RANGES)) {
    if (id >= base && id < base + range) return family as NotificationFamily;
  }
  return null;
}

async function cancelFamily(family: NotificationFamily): Promise<void> {
  if (!isNativePlatform) return;
  try {
    await LocalNotifications.cancel({ notifications: rangeIds(family) });
  } catch (e) {
    console.error(`Cancel ${family} reminders error`, e);
  }
}

// ---------------------------------------------------------------------------
// Aulas (D3) — semanal, com `on` (não há data absoluta)
// ---------------------------------------------------------------------------

interface ClassReminderInput {
  name: string;
  room?: string;
  schedule: { day: number; start: string; end?: string }[];
}

export async function syncClassReminders(courses: ClassReminderInput[]): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    await cancelFamily('class');
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    await warnIfInexactAlarm();

    const { base, range } = NOTIFICATION_RANGES.class;
    const notifications = [];
    let idx = 0;
    for (const c of courses) {
      for (const slot of c.schedule) {
        if (idx >= range) break;
        const { hour, minute } = minutesBefore(slot.start, 10);
        notifications.push({
          id: base + idx,
          title: `${vozFrase(NOTIFICACAO, 'marca')} ${vozFrase(NOTIFICACAO, 'aula', { nome: c.name })}`,
          body: vozFrase(NOTIFICACAO, 'aulaHorario', {
            inicio: slot.start,
            fim: slot.end ?? '',
            sala: c.room ?? '',
          }),
          schedule: {
            on: { weekday: slot.day + 1, hour, minute },
            allowWhileIdle: true,
          },
          smallIcon: 'ic_stat_cecistudy',
          extra: { family: 'class', target: { tab: 'faculdade' } },
        });
        idx++;
      }
    }
    if (notifications.length) await LocalNotifications.schedule({ notifications });
    return true;
  } catch (e) {
    console.error('Class reminder schedule error', e);
    return false;
  }
}

export async function cancelClassReminders(): Promise<void> {
  await cancelFamily('class');
}

// ---------------------------------------------------------------------------
// TCC — o plano puro continua em `thesis.ts` (dono do domínio)
// ---------------------------------------------------------------------------

export async function syncThesisReminders(
  state: ThesisReminderState,
  today: string,
  prefs: ThesisReminderPrefs,
): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    await cancelFamily('thesis');
    if (!prefs.enabled) return true;
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    await warnIfInexactAlarm();
    const plan = planThesisReminders(state, today, prefs);
    if (plan.length === 0) return true;
    const CHAVE_POR_KIND: Record<ThesisReminderKind, string> = {
      capitulo: 'tccCapitulo',
      pendencia: 'tccPendencia',
      reuniao: 'tccReuniao',
      entrega: 'tccEntrega',
      banca: 'tccBanca',
    };
    const transformed: PlannedNotification[] = plan.map((p) => ({
      family: 'thesis',
      id: p.id,
      when: p.at,
      titleKey: 'tccTitulo',
      bodyKey: CHAVE_POR_KIND[p.kind],
      meta: { referencia: p.referencia, dias: p.dias, hora: p.hora },
      target: p.target,
    }));
    return schedulePlannedFamily('thesis', transformed, {});
  } catch (e) {
    console.error('Thesis reminder schedule error', e);
    return false;
  }
}

export async function cancelThesisReminders(): Promise<void> {
  await cancelFamily('thesis');
}

// ---------------------------------------------------------------------------
// Provas (D4)
// ---------------------------------------------------------------------------

export async function syncExamReminders(
  exams: { id: string; title: string; date: string; time?: string; completed?: boolean }[],
  prefs: { enabled: boolean; time: string },
  today: string,
): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    await cancelFamily('exam');
    if (!prefs.enabled) return true;
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    await warnIfInexactAlarm();
    const plan = planExamReminders(exams, prefs, today);
    if (plan.length === 0) return true;
    return schedulePlannedFamily('exam', plan);
  } catch (e) {
    console.error('Exam reminder schedule error', e);
    return false;
  }
}

export async function cancelExamReminders(): Promise<void> {
  await cancelFamily('exam');
}

// ---------------------------------------------------------------------------
// Estágio (D5)
// ---------------------------------------------------------------------------

export async function syncInternshipReminders(
  logs: { date: string }[],
  prefs: { enabled: boolean; time: string },
  today: string,
): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    await cancelFamily('internship');
    if (!prefs.enabled) return true;
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    await warnIfInexactAlarm();
    const plan = planInternshipReminders(logs, prefs, today);
    if (plan.length === 0) return true;
    return schedulePlannedFamily('internship', plan);
  } catch (e) {
    console.error('Internship reminder schedule error', e);
    return false;
  }
}

export async function cancelInternshipReminders(): Promise<void> {
  await cancelFamily('internship');
}

// ---------------------------------------------------------------------------
// Tarefas (D10)
// ---------------------------------------------------------------------------

export async function syncTaskReminders(
  tasks: { id: string; title: string; dueDate?: string; completed?: boolean }[],
  prefs: { enabled: boolean; time: string },
  today: string,
): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    await cancelFamily('task');
    if (!prefs.enabled) return true;
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    await warnIfInexactAlarm();
    const plan = planTaskReminders(tasks, prefs, today);
    if (plan.length === 0) return true;
    return schedulePlannedFamily('task', plan);
  } catch (e) {
    console.error('Task reminder schedule error', e);
    return false;
  }
}

export async function cancelTaskReminders(): Promise<void> {
  await cancelFamily('task');
}

// ---------------------------------------------------------------------------
// Resumo diário (D11) — 14 dias materializados, um por dia
// ---------------------------------------------------------------------------

export async function syncDailySummary(
  snapshot: SummarySnapshot,
  prefs: { enabled: boolean; time: string },
  today: string,
): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    await cancelFamily('daily');
    if (!prefs.enabled) return true;
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    await warnIfInexactAlarm();
    const plan = planDailySummaries(snapshot, prefs, today);
    if (plan.length === 0) return true;
    return schedulePlannedFamily('daily', plan);
  } catch (e) {
    console.error('Daily summary schedule error', e);
    return false;
  }
}

export async function cancelDailyReminder(): Promise<void> {
  await cancelFamily('daily');
}

// ---------------------------------------------------------------------------
// Adaptador genérico
// ---------------------------------------------------------------------------

function summaryLines(meta: Record<string, unknown> | undefined): string[] {
  const itens = (meta?.itens ?? []) as SummaryItem[];
  return itens.map((item) => {
    if (item.kind === 'aula') {
      return vozFrase(NOTIFICACAO, 'resumoAula', { nome: item.nome, inicio: item.inicio });
    }
    if (item.kind === 'prova') return vozFrase(NOTIFICACAO, 'resumoProva', { titulo: item.titulo });
    if (item.kind === 'tarefa') return vozFrase(NOTIFICACAO, 'resumoTarefa', { titulo: item.titulo });
    return vozFrase(NOTIFICACAO, 'resumoTcc', { titulo: item.titulo });
  });
}

/** Uma passada por família: o cancelamento já foi feito no sync de origem. */
async function schedulePlannedFamily(
  family: NotificationFamily,
  plan: PlannedNotification[],
  titleArgs: Record<string, string | number | string[]> = {},
): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    const notifications = plan.map((p) => {
      const params = { ...titleArgs, ...(p.meta ?? {}) } as Record<
        string,
        string | number | string[]
      >;
      const body =
        family === 'daily'
          ? vozFrase(NOTIFICACAO, p.bodyKey, {
              linhas: summaryLines(p.meta),
              restantes: Number(p.meta?.restantes ?? 0),
              turno: String(p.meta?.turno ?? 'tarde'),
            })
          : vozFrase(NOTIFICACAO, p.bodyKey, params);
      return {
        id: p.id,
        title: vozFrase(NOTIFICACAO, p.titleKey, titleArgs),
        body,
        schedule: { at: p.when, allowWhileIdle: true },
        smallIcon: 'ic_stat_cecistudy',
        extra: { family, target: p.target },
      };
    });
    await LocalNotifications.schedule({ notifications });
    return true;
  } catch (e) {
    console.error(`Schedule ${family} error`, e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Orçamento do iOS (D13)
// ---------------------------------------------------------------------------

let lastDropped: number[] = [];
let budgetTimer: ReturnType<typeof setTimeout> | null = null;

function atOf(n: { schedule?: { at?: Date } }): number {
  const at = n.schedule?.at;
  return at instanceof Date ? at.getTime() : Number.MAX_SAFE_INTEGER;
}

/**
 * D13: mantém no máximo 64 pendentes no iOS. Resumo e aulas ficam; o resto é
 * cortado pelo `when` mais distante e reportado em `lastDropped`.
 *
 * shortcut: se aulas + resumo passarem de 64, o iOS ainda descarta; a grade
 * real fica bem abaixo disso. Revisar se um dia a grade passar de ~50 aulas.
 */
export async function enforcePendingBudget(): Promise<number[]> {
  if (!isNativePlatform || Capacitor.getPlatform() !== 'ios') return [];
  try {
    const { notifications } = await LocalNotifications.getPending();
    if (notifications.length <= IOS_PENDING_BUDGET) return [];
    const reserved = notifications.filter((n) => {
      const family = familyOf(n.id);
      return family !== null && RESERVED_FAMILIES.includes(family);
    });
    const reservedIds = new Set(reserved.map((n) => n.id));
    const cuttable = notifications
      .filter((n) => !reservedIds.has(n.id))
      .sort((a, b) => atOf(a) - atOf(b));
    const room = Math.max(0, IOS_PENDING_BUDGET - reserved.length);
    const cut = cuttable.slice(room);
    if (!cut.length) return [];
    await LocalNotifications.cancel({ notifications: cut.map((n) => ({ id: n.id })) });
    lastDropped = cut.map((n) => n.id);
    console.warn(`Orçamento iOS: ${cut.length} lembrete(s) distante(s) cancelado(s).`);
    return lastDropped;
  } catch (e) {
    console.error('Pending budget error', e);
    return [];
  }
}

/** Agrupa mudanças próximas numa passada só (cada sync pode estourar o teto). */
function queueBudgetPass(): void {
  if (!isNativePlatform || Capacitor.getPlatform() !== 'ios') return;
  if (budgetTimer) clearTimeout(budgetTimer);
  budgetTimer = setTimeout(() => {
    budgetTimer = null;
    void enforcePendingBudget();
  }, 300);
}

export function getDroppedNotifications(): number[] {
  return lastDropped;
}

// ---------------------------------------------------------------------------
// Auditoria (D7)
// ---------------------------------------------------------------------------

export async function auditPendingNotifications(): Promise<{
  total: number;
  byFamily: Record<string, number>;
  unknown: number[];
  dropped: number[];
  /** D9/T5.2: `denied` é o alarme inexato; o sync não abre a tela sozinho. */
  exactAlarm: ExactAlarmStatus;
}> {
  if (!isNativePlatform) {
    return { total: 0, byFamily: {}, unknown: [], dropped: [], exactAlarm: 'unknown' };
  }
  try {
    const { notifications } = await LocalNotifications.getPending();
    const byFamily: Record<string, number> = {};
    const unknown: number[] = [];
    for (const n of notifications) {
      const family = familyOf(n.id);
      if (family === null) {
        unknown.push(n.id);
      } else {
        byFamily[family] = (byFamily[family] ?? 0) + 1;
      }
    }
    return {
      total: notifications.length,
      byFamily,
      unknown,
      dropped: lastDropped,
      exactAlarm: await checkExactAlarmStatus(),
    };
  } catch (e) {
    console.error('Audit notifications error', e);
    return { total: 0, byFamily: {}, unknown: [], dropped: [], exactAlarm: 'unknown' };
  }
}

// ---------------------------------------------------------------------------
// Despachador (D1): o único caminho de sync
// ---------------------------------------------------------------------------

export async function syncFamily(family: NotificationFamily, params: any): Promise<boolean> {
  let ok = false;
  switch (family) {
    case 'daily':
      ok = await syncDailySummary(params.snapshot, params.prefs, params.today);
      break;
    case 'thesis':
      ok = await syncThesisReminders(params.state, params.today, params.prefs);
      break;
    case 'exam':
      ok = await syncExamReminders(params.exams, params.prefs, params.today);
      break;
    case 'internship':
      ok = await syncInternshipReminders(params.logs, params.prefs, params.today);
      break;
    case 'task':
      ok = await syncTaskReminders(params.tasks, params.prefs, params.today);
      break;
    case 'class':
      ok = await syncClassReminders(params.courses);
      break;
    default:
      console.warn('syncFamily: família desconhecida', family);
      return false;
  }
  if (ok) queueBudgetPass();
  return ok;
}
