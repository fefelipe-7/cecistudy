import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './storage';
import {
  THESIS_REMINDER_BASE,
  THESIS_REMINDER_RANGE,
  planThesisReminders,
  type ThesisReminderKind,
  type ThesisReminderPrefs,
  type ThesisReminderState,
} from '../../packages/domain/src/core/domain/thesis';
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

export interface ReminderTime {
  hour: number;
  minute: number;
}

/** agenda (ou substitui) o lembrete diário de estudo */
export async function scheduleDailyReminder(time: string): Promise<boolean> {
  if (!isNativePlatform) return false;
  const granted = await ensureNotificationPermission();
  if (!granted) return false;

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
const CLASS_REMINDER_BASE = 2000;
const CLASS_REMINDER_RANGE = 200;

interface ClassReminderInput {
  name: string;
  room?: string;
  schedule: { day: number; start: string; end?: string }[];
}

function classReminderIds(): { id: number }[] {
  return Array.from({ length: CLASS_REMINDER_RANGE }, (_, i) => ({ id: CLASS_REMINDER_BASE + i }));
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
  try {
    await LocalNotifications.cancel({ notifications: classReminderIds() });
    let idx = 0;
    for (const c of courses) {
      for (const slot of c.schedule) {
        if (idx >= CLASS_REMINDER_RANGE) break;
        const [h, m] = slot.start.split(':').map(Number);
        const label = vozFrase(NOTIFICACAO, 'aula', { nome: c.name });
        await LocalNotifications.schedule({
          notifications: [
            {
              id: CLASS_REMINDER_BASE + idx,
              title: `${vozFrase(NOTIFICACAO, 'marca')} ${label}`,
              body: vozFrase(NOTIFICACAO, 'aulaHorario', {
                inicio: slot.start,
                fim: slot.end,
                sala: c.room,
              }),
              schedule: { on: { weekday: slot.day + 1 }, allowWhileIdle: true },
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
  return Array.from({ length: THESIS_REMINDER_RANGE }, (_, i) => ({ id: THESIS_REMINDER_BASE + i }));
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
    await LocalNotifications.cancel({ notifications: thesisReminderIds() });
    if (!prefs.enabled) return true;
    const granted = await ensureNotificationPermission();
    if (!granted) return false;
    const plan = planThesisReminders(state, today, prefs);
    if (plan.length === 0) return true;
    // `SPEC-M-018 D17/D18`: o plano é puro e devolve **fato**; a frase é da voz,
    // montada aqui — no agendamento, que é quando o perfil está carregado.
    const titulo = vozFrase(NOTIFICACAO, 'tccTitulo');
    // `Record<ThesisReminderKind, string>` de propósito: se um `kind` novo
    // nascer no domínio, o TypeScript **quebra a compilação** aqui. É mais forte
    // que um `??` que cairia na frase errada em silêncio.
    const CHAVE_POR_KIND: Record<ThesisReminderKind, string> = {
      capitulo: 'tccCapitulo',
      pendencia: 'tccPendencia',
      reuniao: 'tccReuniao',
      entrega: 'tccEntrega',
      banca: 'tccBanca',
    };
    await LocalNotifications.schedule({
      notifications: plan.map((p) => ({
        id: p.id,
        title: titulo,
        body: vozFrase(NOTIFICACAO, CHAVE_POR_KIND[p.kind], {
          referencia: p.referencia,
          dias: p.dias,
          hora: p.hora,
        }),
        schedule: { at: p.at, allowWhileIdle: true },
        smallIcon: 'ic_stat_cecistudy',
        // Q10: o toque roteia para a aba certa via `routeFromNotificationExtra`
        // (domínio, puro e defensivo). `[V]` conferir no aparelho que o
        // `extra` sobrevive ao agendamento nativo (fallback: abre a visão geral).
        extra: { thesis: p.target },
      })),
    });
    return true;
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
