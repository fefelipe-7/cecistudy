/**
 * Glue de plataforma da captura de link (SPEC-012 §8.4/§8.8, F8).
 *
 * Toda a branchagem por plataforma vive **aqui** (`src/lib`), nunca em
 * `src/components` — a regra do `check-boundaries.mjs` ("shared UI não brancha
 * por plataforma"). A UI chama estas funções e não sabe se está no iOS, no
 * Android ou no web.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { parseCaptureDeepLink, type CaptureDeepLink } from '../types';

/** True quando roda dentro do app nativo (Capacitor). */
export const isCaptureNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Assina o `appUrlOpen` e entrega o link `cecistudy://captura?…` já validado
 * (camada 2, §8.4). Devolve a função de cancelamento.
 */
export const subscribeCaptureDeepLink = (
  handler: (link: CaptureDeepLink) => void,
): (() => void) => {
  if (!Capacitor.isNativePlatform()) return () => {};
  const sub = CapacitorApp.addListener('appUrlOpen', (event) => {
    const link = parseCaptureDeepLink(event.url);
    if (link) handler(link);
  });
  return () => {
    void sub.then((h) => h.remove());
  };
};

/**
 * Minimiza o app depois de guardar (Android, §8.8) — aproxima o "fecha tudo"
 * do iOS. No iOS é no-op (o app permanece aberto, §8.2 item 1).
 */
export const minimizeAfterCapture = async (): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await CapacitorApp.minimizeApp();
  } catch {
    // sem minimizar: o guardar já aconteceu, isso é só conforto
  }
};

interface ShareTargetPlugin {
  getPendingShare(): Promise<{ text?: string } | null>;
  addListener(
    event: 'shareReceived',
    cb: (data: { text?: string }) => void,
  ): Promise<{ remove(): void }>;
}

const ShareTarget = registerPlugin<ShareTargetPlugin>('ShareTarget');

/**
 * Plugin local `ShareTarget` (Android, §8.8). Devolve o texto compartilhado na
 * **partida a frio** (o app abriu por causa do share e o JS ainda não tinha o
 * listener). No web/iOS o plugin não existe → `null`.
 */
export const readPendingShare = async (): Promise<string | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const pending = await ShareTarget.getPendingShare();
    return pending?.text ?? null;
  } catch {
    return null;
  }
};

/** Assina o evento `shareReceived` do plugin local (app já aberto). */
export const subscribeShareTarget = (handler: (text: string) => void): (() => void) => {
  if (!Capacitor.isNativePlatform()) return () => {};
  const sub = ShareTarget.addListener('shareReceived', (data) => {
    if (data?.text) handler(data.text);
  });
  return () => {
    void sub.then((h) => h.remove());
  };
};
