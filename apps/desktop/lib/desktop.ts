import { isDesktop, tauriGlobal } from '@/lib/platform';

/**
 * Ponte com recursos nativos do desktop (Tauri) via `window.__TAURI__`.
 * Todas as funções são no-op/seguras fora do desktop — o app web/mobile
 * nunca as executa.
 */

/* ===== notificações ===== */

export type DesktopPermission = 'granted' | 'denied' | 'prompt' | 'unknown';

function notificationApi(): any | null {
  return tauriGlobal()?.notification ?? null;
}

export function isDesktopNotificationSupported(): boolean {
  return !!notificationApi();
}

export async function desktopNotificationPermission(): Promise<DesktopPermission> {
  const api = notificationApi();
  if (!api) return 'unknown';
  try {
    return (await api.permissionState()) as DesktopPermission;
  } catch {
    return 'unknown';
  }
}

export async function desktopEnsureNotificationPermission(): Promise<boolean> {
  const api = notificationApi();
  if (!api) return false;
  try {
    let state = await api.permissionState();
    if (state === 'prompt') {
      state = await api.requestPermission();
    }
    return state === 'granted';
  } catch {
    return false;
  }
}

/** dispara uma notificação imediata do sistema */
export async function desktopNotify(title: string, body: string): Promise<boolean> {
  const api = notificationApi();
  if (!api) return false;
  try {
    const granted = await desktopEnsureNotificationPermission();
    if (!granted) return false;
    await api.notify({ title, body });
    return true;
  } catch (e) {
    console.error('desktop notify error', e);
    return false;
  }
}

/* ===== auto-update (tauri-plugin-updater + process) ===== */

export interface DesktopUpdateInfo {
  version: string;
  notes?: string;
}

interface DesktopUpdateProgress {
  event: string;
  data?: { total?: number; chunkLength?: number; contentLength?: number };
}

/**
 * Verifica atualização no GitHub Releases (`latest.json` assinado).
 * Retorna `null` quando não há atualização ou o updater não está disponível.
 */
export async function desktopCheckForUpdate(): Promise<DesktopUpdateInfo | null> {
  const updater = tauriGlobal()?.updater;
  if (!updater) return null;
  try {
    const update = await updater.check();
    if (!update?.available) return null;
    return { version: update.version, notes: update.body ?? undefined };
  } catch (e) {
    console.error('desktop update check error', e);
    throw e;
  }
}

/** baixa e instala a atualização (0–100). Requer reinício depois. */
export async function desktopDownloadAndInstallUpdate(
  onProgress?: (pct: number) => void
): Promise<void> {
  const updater = tauriGlobal()?.updater;
  if (!updater) throw new Error('updater indisponível');
  const update = await updater.check();
  if (!update?.available) return;

  let contentLength = 0;
  let downloaded = 0;
  await update.downloadAndInstall((event: DesktopUpdateProgress) => {
    if (event.event === 'started') {
      contentLength = event.data?.contentLength ?? 0;
      downloaded = 0;
      onProgress?.(0);
    } else if (event.event === 'progress') {
      downloaded += event.data?.chunkLength ?? 0;
      if (contentLength > 0) {
        onProgress?.(Math.min(99, Math.round((downloaded / contentLength) * 100)));
      }
    } else if (event.event === 'finished') {
      onProgress?.(100);
    }
  });
}

/** reinicia o app para aplicar a atualização instalada */
export async function desktopRelaunch(): Promise<void> {
  const process = tauriGlobal()?.process;
  if (!process) return;
  await process.relaunch();
}
