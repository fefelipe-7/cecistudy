import { Camera, CameraPermissionState } from '@capacitor/camera';
import { Calendar } from '@capacitor/calendar';
import { Filesystem } from '@capacitor/filesystem';
import { LocalNotifications, PermissionStatus as NotificationsPermissionStatus } from '@capacitor/local-notifications';
import { isNativePlatform } from './storage';

export type AppPermissionKind = 'files' | 'photos' | 'calendar' | 'notifications';

export type AppPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

const toState = (state: CameraPermissionState | NotificationsPermissionStatus['display']): AppPermissionState =>
  state === 'granted' || state === 'limited' ? 'granted' : state === 'denied' ? 'denied' : 'prompt';

/** Checa o estado atual de uma permissão (no web retorna 'unsupported'). */
export async function checkPermission(kind: AppPermissionKind): Promise<AppPermissionState> {
  if (!isNativePlatform) return 'unsupported';

  try {
    if (kind === 'files') {
      const status = await Filesystem.checkPermissions();
      const s = status.publicStorage;
      return s === 'granted' ? 'granted' : s === 'denied' ? 'denied' : 'prompt';
    }
    if (kind === 'photos') {
      const status = await Camera.checkPermissions();
      return toState(status.photos);
    }
    if (kind === 'calendar') {
      const status = await Calendar.checkPermissions();
      const any = status.readCalendar === 'granted' || status.writeCalendar === 'granted';
      const denied = status.readCalendar === 'denied' && status.writeCalendar === 'denied';
      return any ? 'granted' : denied ? 'denied' : 'prompt';
    }
    // notifications
    const status = await LocalNotifications.checkPermissions();
    return toState(status.display);
  } catch {
    return 'prompt';
  }
}

/** Solicita uma permissão (no web retorna 'unsupported'). */
export async function requestPermission(kind: AppPermissionKind): Promise<AppPermissionState> {
  if (!isNativePlatform) return 'unsupported';

  try {
    if (kind === 'files') {
      await Filesystem.requestPermissions();
      return checkPermission('files');
    }
    if (kind === 'photos') {
      await Camera.requestPermissions();
      return checkPermission('photos');
    }
    if (kind === 'calendar') {
      await Calendar.requestPermissions();
      return checkPermission('calendar');
    }
    await LocalNotifications.requestPermissions();
    return checkPermission('notifications');
  } catch {
    return 'denied';
  }
}
