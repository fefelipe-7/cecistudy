import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './storage';
import {
  planThesisReminders,
  type ThesisReminderKind,
  type ThesisReminderPrefs,
  type ThesisReminderState,
} from '../../packages/domain/src/core/domain/thesis';
import { planExamReminders, planInternshipReminders, NOTIFICATION_RANGES, type NotificationFamily } from '../../packages/domain/src/core/domain/notifications';
import { NOTIFICACAO, frase as vozFrase } from './voice';

/** id fixo do lembrete diário (para cancelar/substituir com segurança) */
const DAILY_REMINDER_ID = 1001;

export const REMINDER_CHANNEL = 'study-reminder';

/** lembrete agendado: nativo (Capacitor) agenda via plugin; sem suporte na web. */
export function isReminderSupported(): boolean {
  return isNativePlatform;
}

function parseTime(time: string): ReminderTime {
  const [hour, minute] = time.split(':').map(Number);
  return { hour: hour || 19, minute: minute || 0 };
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

/** D6: garante permissão de alarmes exatos no Android */
export async function ensureExactAlarmPermission(): Promise<boolean> {
  if (!isNativePlatform) return true;
  try {
    const status = await LocalNotifications.checkExactNotificationSetting();
    if (status.exact_alarm === 'granted') return true;
    // abre as configurações de "Alarmes e lembretes"
    await LocalNotifications.changeExactNotificationSetting();
    // verifica novamente
    const after = await LocalNotifications.checkExactNotificationSetting();
    return after.exact_alarm === 'granted';
  } catch {
    // em versões antigas do plugin o método não existe
    return true;
  }
}

export interface ReminderTime {
  hour: number;
  minute: number;
}

/** agenda (ou substitui) o lembrete diário de estudo */
export async function scheduleDailyReminder(time: string): Promise<boolean> {
  if (!isNativePlatform) return false;
  const granted = await ensureNotificationPermission();
  if (!granted) return false;
  await ensureExactAlarmPermission();

  const { hour, minute } = parseTime(time);
  const now = new Date();
  // `SPEC-M-018 D18`: o turno é decidido **no agendamento** — é aqui que o
  // perfil está carregado, e é aqui que o tratamento por nome pode entrar.
  const body = vozFrase(NOTIFICACAO, 'diario', { turno: now.getHours() < 12 ? 'manha' : 'tarde' });

  try {
    // cancela a versão antiga (se houver) para não duplicar
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: DAILY_REMINDER_ID,
          title: vozFrase(NOTIFICACAO, 'diarioTitulo'),
          body,
          schedule: { on: { hour, minute } },
          smallIcon: 'ic_stat_cecistudy',
        },
      ],
    });
    return true;
  } catch (e) {
    console.error('Reminder schedule error', e);
    return false;
  }
}

/** remove o lembrete diário */
export async function cancelDailyReminder(): Promise<void> {
  if (!isNativePlatform) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
  } catch (e) {
    console.error('Reminder cancel error', e);
  }
}

/** ids reservados para lembretes de aula (espaço para até 200 slots). */
interface ClassReminderInput {
  name: string;
  room?: string;
  schedule: { day: number; start: string; end?: string }[];
}

function classReminderIds(): { id: number }[] {
  const base = NOTIFICATION_RANGES.class.base;
  const range = NOTIFICATION_RANGES.class.range;
  return Array.from({ length: range }, (_, i) => ({ id: base + i }));
}

/**
 * Agenda lembretes semanais para os horários das matérias (nativo only).
 * `weekday` do plugin segue 1=domingo…7=sábado, então usamos `slot.day + 1`
 * (onde slot.day é 0=domingo). Reagenda tudo a cada mudança de horário.
 */
export async function syncClassReminders(courses: ClassReminderInput[]): Promise<boolean> {
  if (!isNativePlatform) return false;
  const granted = await ensureNotificationPermission();
  if (!granted) return false;
  await ensureExactAlarmPermission();
  try {
    await LocalNotifications.cancel({ notifications: classReminderIds() });
    let idx = 0;
    const classRange = NOTIFICATION_RANGES.class;
    for (const c of courses) {
      for (const slot of c.schedule) {
        if (idx >= classRange.range) break;
        const [h, m] = slot.start.split(':').map(Number);
        // D3: lembrete 10 min antes da aula
        let hour = Number.isFinite(h) ? h : 9;
        let minute = Number.isFinite(m) ? m : 0;
        minute -= 10;
        if (minute < 0) { minute += 60; hour -= 1; }
        if (hour < 0) hour = 23;
        const label = vozFrase(NOTIFICACAO, 'aula', { nome: c.name });
        await LocalNotifications.schedule({
          notifications: [
            {
              id: classRange.base + idx,
              title: `${vozFrase(NOTIFICACAO, 'marca')} ${label}`,
              body: vozFrase(NOTIFICACAO, 'aulaHorario', {
                inicio: slot.start,
                fim: slot.end,
                sala: c.room,
              }),
              schedule: { on: { weekday: slot.day + 1, hour, minute }, allowWhileIdle: true },
              smallIcon: 'ic_stat_cecistudy',
            },
          ],
        });
        idx++;
      }
    }
    return true;
  } catch (e) {
    console.error('Class reminder schedule error', e);
    return false;
  }
}

/** cancela todos os lembretes de aula. */
export async function cancelClassReminders(): Promise<void> {
  if (!isNativePlatform) return;
  try {
    await LocalNotifications.cancel({ notifications: classReminderIds() });
  } catch (e) {
    console.error('Cancel class reminders error', e);
  }
}

// ---------------------------------------------------------------------------
// TCC (SPEC-012 §6.3) — faixa própria 3000-3199, sem colidir com a de aulas.
// O PLANO é puro (`planThesisReminders`, domínio); este é só o adaptador
// nativo: cancela a faixa inteira e reagenda, no padrão de `syncClassReminders`.
// ---------------------------------------------------------------------------

function thesisReminderIds(): { id: number }[] {
  const base = NOTIFICATION_RANGES.thesis.base;
  const range = NOTIFICATION_RANGES.thesis.range;
  return Array.from({ length: range }, (_, i) => ({ id: base + i }));
}

/**
 * Reagenda os lembretes do TCC a partir do plano puro. Reagendar em: abrir o
 * app, e salvar/editar/remover qualquer entidade com data (o chamador é um
 * efeito sobre as coleções — `DataClientProvider`).
 *
 * Desligado ou sem permissão: só cancela (fica limpo, nunca órfão).
 */
export async function syncThesisReminders(
  state: ThesisReminderState,
  today: string,
  prefs: ThesisReminderPrefs,
): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    const ids = thesisReminderIds();
    await LocalNotifications.cancel({ notifications: ids });
    if (!prefs.enabled) return true;
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    await ensureExactAlarmPermission();
    const plan = planThesisReminders(state, today, prefs);
    if (plan.length === 0) return true;
    const CHAVE_POR_KIND: Record<ThesisReminderKind, string> = {
      capitulo: 'tccCapitulo',
      pendencia: 'tccPendencia',
      reuniao: 'tccReuniao',
      entrega: 'tccEntrega',
      banca: 'tccBanca',
    };
    const transformed = plan.map(p => ({
      id: p.id,
      when: p.at,
      titleKey: 'tccTitulo',
      bodyKey: CHAVE_POR_KIND[p.kind],
      meta: { referencia: p.referencia, dias: p.dias, hora: p.hora },
      target: p.target,
    }));
    return schedulePlannedFamily('thesis', ids, transformed, {});
  } catch (e) {
    console.error('Thesis reminder schedule error', e);
    return false;
  }
}

/** cancela todos os lembretes do TCC (reset, ou prefs desligadas). */
export async function cancelThesisReminders(): Promise<void> {
  if (!isNativePlatform) return;
  try {
    await LocalNotifications.cancel({ notifications: thesisReminderIds() });
  } catch (e) {
    console.error('Cancel thesis reminders error', e);
  }
}

/** ids de prova */
function examReminderIds(): { id: number }[] {
  const base = NOTIFICATION_RANGES.exam.base;
  const range = NOTIFICATION_RANGES.exam.range;
  return Array.from({ length: range }, (_, i) => ({ id: base + i }));
}

/** D4: sincroniza lembretes de prova */
export async function syncExamReminders(exams: { id: string; title: string; date: string; time?: string; completed?: boolean }[], prefs: { enabled: boolean; time: string }, today: string): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    const ids = examReminderIds();
    await LocalNotifications.cancel({ notifications: ids });
    if (!prefs.enabled) return true;
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    await ensureExactAlarmPermission();
    const plan = planExamReminders(exams, prefs, today);
    if (plan.length === 0) return true;
    return schedulePlannedFamily('exam', ids, plan, {});
  } catch (e) {
    console.error('Exam reminder schedule error', e);
    return false;
  }
}

/** cancela lembretes de prova */
export async function cancelExamReminders(): Promise<void> {
  if (!isNativePlatform) return;
  try {
    await LocalNotifications.cancel({ notifications: examReminderIds() });
  } catch (e) {
    console.error('Cancel exam reminders error', e);
  }
}

/** ids de estágio */
function internshipReminderIds(): { id: number }[] {
  const base = NOTIFICATION_RANGES.internship.base;
  const range = NOTIFICATION_RANGES.internship.range;
  return Array.from({ length: range }, (_, i) => ({ id: base + i }));
}

/** D5: sincroniza lembretes de estágio (registro diário) */
export async function syncInternshipReminders(logs: { date: string }[], prefs: { enabled: boolean; time: string }, today: string): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    const ids = internshipReminderIds();
    await LocalNotifications.cancel({ notifications: ids });
    if (!prefs.enabled) return true;
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    await ensureExactAlarmPermission();
    const plan = planInternshipReminders(logs, prefs, today);
    if (plan.length === 0) return true;
    return schedulePlannedFamily('internship', ids, plan);
  } catch (e) {
    console.error('Internship reminder schedule error', e);
    return false;
  }
}

/** cancela lembretes de estágio */
export async function cancelInternshipReminders(): Promise<void> {
  if (!isNativePlatform) return;
  try {
    await LocalNotifications.cancel({ notifications: internshipReminderIds() });
  } catch (e) {
    console.error('Cancel internship reminders error', e);
  }
}

/** auditoria de notificações pendentes por faixa (SPEC-M-025 D7) */
export async function auditPendingNotifications(): Promise<{
  total: number;
  byFamily: Record<string, number>;
  unknown: number[];
}> {
  if (!isNativePlatform) return { total: 0, byFamily: {}, unknown: [] };
  try {
    const { notifications } = await LocalNotifications.getPending();
    const byFamily: Record<string, number> = {};
    const unknown: number[] = [];
    for (const n of notifications) {
      const id = n.id;
      let family = 'unknown';
      for (const [fam, range] of Object.entries(NOTIFICATION_RANGES)) {
        if (id >= range.base && id < range.base + range.range) {
          family = fam;
          break;
        }
      }
      if (id === 1001) family = 'daily';
      if (family === 'unknown') {
        unknown.push(id);
      } else {
        byFamily[family] = (byFamily[family] ?? 0) + 1;
      }
    }
    return { total: notifications.length, byFamily, unknown };
  } catch (e) {
    console.error('Audit notifications error', e);
    return { total: 0, byFamily: {}, unknown: [] };
  }
}

/** despachador unificado por família (SPEC-M-025 D8) */
export async function syncFamily(
  family: NotificationFamily,
  params: any,
): Promise<boolean> {
  switch (family) {
    case 'thesis':
      return syncThesisReminders(params.state, params.today, params.prefs);
    case 'exam':
      return syncExamReminders(params.exams, params.prefs, params.today);
    case 'internship':
      return syncInternshipReminders(params.logs, params.prefs, params.today);
    case 'class':
      return syncClassReminders(params.courses);
    case 'daily':
      return scheduleDailyReminder(params.time);
    default:
      console.warn('syncFamily: família desconhecida', family);
      return false;
  }
}

/** helper central para famílias planejadas com `when` (at) */
async function schedulePlannedFamily(
  family: NotificationFamily,
  ids: { id: number }[],
  plan: { id: number; when: Date; titleKey: string; bodyKey: string; meta?: Record<string, unknown>; target?: { tab: string; entityId?: string } }[],
  titleArgs?: Record<string, unknown>,
): Promise<boolean> {
  if (!isNativePlatform) return false;
  try {
    await LocalNotifications.cancel({ notifications: ids });
    if (plan.length === 0) return true;
    await LocalNotifications.schedule({
      notifications: plan.map(p => ({
        id: p.id,
        title: vozFrase(NOTIFICACAO, p.titleKey, titleArgs ?? {} as any),
        body: vozFrase(NOTIFICACAO, p.bodyKey, { referencia: p.meta?.referencia, dias: p.meta?.dias, ...titleArgs } as any),
        schedule: { at: p.when, allowWhileIdle: true },
        smallIcon: 'ic_stat_cecistudy',
        extra: { family, target: p.target },
      })),
    });
    return true;
  } catch (e) {
    console.error(`Schedule ${family} error`, e);
    return false;
  }
}


