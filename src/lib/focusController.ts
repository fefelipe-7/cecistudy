// Mini store estável do modo foco imersivo (pub/sub, sem React).
// Usada pelo shell (guarda de back) e pela view (modal de confirmação). Mantém a
// camada visual fora de Capacitor (regra shared — não brancha por plataforma aqui).
type Listener = () => void;

let active = false;
let running = false;
let backListeners: Listener[] = [];

export const focusController = {
  setActive(value: boolean): void {
    active = value;
  },

  isActive(): boolean {
    return active;
  },

  /** Sincroniza o estado do timer no store (para a guarda de back). */
  setRunning(value: boolean): void {
    running = value;
  },

  isRunning(): boolean {
    return running;
  },

  /** Assina o evento "usuario pediu voltar". Retorna função de unsubscribe. */
  onBackRequested(listener: Listener): () => void {
    backListeners.push(listener);
    return () => {
      backListeners = backListeners.filter((l) => l !== listener);
    };
  },

  /** Emite "voltar pedido" para a view (a navegação em si é barrada no shell). */
  emitBackRequested(): void {
    for (const l of backListeners) l();
  },
};

/** Reseta o store (tests / safety). */
export function resetFocusController(): void {
  active = false;
  running = false;
  backListeners = [];
}