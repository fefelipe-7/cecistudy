import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './storage';

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
  const body = now.getHours() < 12 ? 'uma pausinha para revisar o dia? com leveza e foco! ♡' : 'hora de fechar o dia com uma sessão leve de estudos ♡';

  try {
    // cancela a versão antiga (se houver) para não duplicar
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: DAILY_REMINDER_ID,
          title: 'cecistudy ♡ lembrete de estudo',
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
        const label = `aula de ${c.name}`;
        await LocalNotifications.schedule({
          notifications: [
            {
              id: CLASS_REMINDER_BASE + idx,
              title: `cecistudy ♡ ${label}`,
              body: `começa às ${slot.start}${slot.end ? `–${slot.end}` : ''}${c.room ? ` • ${c.room}` : ''}`,
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
