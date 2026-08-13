import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativePlatform } from './storage';

/** id fixo do lembrete diário (para cancelar/substituir com segurança) */
const DAILY_REMINDER_ID = 1001;

export const REMINDER_CHANNEL = 'study-reminder';

/** o app nativo é o único que suporta lembrete agendado (web vira no-op) */
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

export interface ReminderTime {
  hour: number;
  minute: number;
}

function parseTime(time: string): ReminderTime {
  const [hour, minute] = time.split(':').map(Number);
  return { hour: hour || 19, minute: minute || 0 };
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
