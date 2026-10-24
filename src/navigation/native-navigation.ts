import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/**
 * Bridge to NativeNavigation plugin (iOS) for the edge swipe-back gesture.
 *
 * ## Por que o listener vive aqui e não em `window` (SPEC-007 D7)
 *
 * O Swift emite por `notifyListeners(...)` (`ios/App/App/NativeNavigation/
 * NativeNavigationPlugin.swift`). No iOS isso **não** é um evento de DOM: ele
 * atravessa a ponte do plugin e só chega a um listener registrado via
 * `Plugin.addListener(...)`. A versão anterior usava
 * `window.addEventListener('swipeBackCompleted', …)` em `MobileAppShell`, que é
 * um sistema de eventos diferente — o gesto arrastava a webView, o `notifyListeners`
 * era descartado (`retainUntilConsumed: false`) e **nenhum pop acontecia**: a tela
 * voltava sozinha para a posição inicial. Bug de produção no iOS.
 */

/** Payload emitido pelo gesto nativo. Espelha o `data:` do `notifyListeners`. */
export interface SwipeBackPayload {
  /** `clamp(deltaX / larguraDaWebView, 0, 1)`. */
  progress: number;
  /** Velocidade horizontal em pt/s no momento do evento. */
  velocity: number;
  /** Só em `swipeBackChanged`: deslocamento já limitado a 42% da largura. */
  translation?: number;
}

export type SwipeBackEvent =
  | 'swipeBackStarted'
  | 'swipeBackChanged'
  | 'swipeBackCompleted'
  | 'swipeBackCancelled';

export interface NativeNavigationPlugin {
  enableSwipeBack(): Promise<void>;
  setCanGoBack(value: { value: boolean }): Promise<void>;
  getCanGoBack(): Promise<{ value: boolean }>;
  addListener(
    eventName: SwipeBackEvent,
    listenerFunc: (data: SwipeBackPayload) => void,
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

const NativeNavigation = registerPlugin<NativeNavigationPlugin>('NativeNavigation');

export const nativeNavigation = {
  enable: () => NativeNavigation.enableSwipeBack(),
  setCanGoBack: (value: boolean) => NativeNavigation.setCanGoBack({ value }),
  getCanGoBack: () => NativeNavigation.getCanGoBack(),

  /**
   * Assina um evento do gesto nativo. Devolve a função de remoção, já pronta
   * para o `cleanup` do `useEffect` — inclusive em ambiente web, onde o
   * `registerPlugin` resolve para um no-op e o handle nunca chega.
   *
   * Por que devolver função e não o `Promise<PluginListenerHandle>` cru: o
   * `cleanup` de um efeito não pode ser assíncrono, e o padrão do resto do shell
   * é `void handler.then(h => h.remove())`. Embrulhar aqui mantém esse detalhe
   * num lugar só.
   */
  onSwipeBack: (
    event: SwipeBackEvent,
    listener: (data: SwipeBackPayload) => void,
  ): (() => void) => {
    let cancelled = false;
    let handle: PluginListenerHandle | null = null;
    void NativeNavigation.addListener(event, listener).then((h) => {
      // Corrida do cleanup: se o efeito desmontou antes de a promessa resolver,
      // o handle precisa ser removido assim que chegar — senão vaza listener.
      if (cancelled) {
        void h.remove();
        return;
      }
      handle = h;
    });
    return () => {
      cancelled = true;
      void handle?.remove();
      handle = null;
    };
  },
};
