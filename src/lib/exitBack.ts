/**
 * Lógica pura do "voltar duas vezes para sair" (double back to exit).
 * Primeiro back na raiz → mostra toast; segundo back dentro da janela → sai do app.
 * Testável sem timers: o caller injeta o `now`.
 */

export const EXIT_BACK_WINDOW_MS = 2000;

export const EXIT_BACK_TOAST = 'toque em voltar de novo para sair ♡';

export interface BackExitState {
  lastBackAt: number | null;
}

export type BackExitAction = 'exit' | 'toast';

export function initialBackExitState(): BackExitState {
  return { lastBackAt: null };
}

export function resolveBackExit(
  state: BackExitState,
  now: number,
  windowMs: number = EXIT_BACK_WINDOW_MS,
): { state: BackExitState; action: BackExitAction } {
  if (state.lastBackAt !== null && now - state.lastBackAt <= windowMs) {
    return { state: initialBackExitState(), action: 'exit' };
  }
  return { state: { lastBackAt: now }, action: 'toast' };
}