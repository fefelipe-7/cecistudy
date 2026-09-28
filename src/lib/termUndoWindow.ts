/**
 * Janela de desfazer da virada de semestre (SPEC-006 D8).
 *
 * A virada oferece "desfazer" por **8 segundos** — o mesmo relógio do toast com
 * ação. A janela precisa de **um** dono, senão os dois relógios divergem: o toast
 * some aos 8s e deixa `canUndoRollover` verdadeiro para sempre, ou o estado
 * expira antes do toast e o botão fica morto na tela. Por isso a duração mora
 * aqui e é lida pelos dois lados (`dataActions` para expirar o plano,
 * `DataClientProvider` para a duração do toast).
 *
 * A janela é ancorada no **commit** (`appliedAt`), não na renderização: um
 * re-render tardio do toast não rouba milissegundos da decisão.
 */
export const ROLLOVER_UNDO_WINDOW_MS = 8000;

/** Duração do toast simples, sem ação (o "guardado ♡" de sempre). */
export const TOAST_DEFAULT_MS = 2600;

/**
 * Quanto da janela ainda resta, em ms (0 quando já fechou).
 *
 * `now` é parâmetro para o cálculo ser puro e testável — o efeito do React
 * passa o `Date.now()` real.
 */
export function remainingUndoWindowMs(appliedAt: number, now: number = Date.now()): number {
  return Math.max(0, ROLLOVER_UNDO_WINDOW_MS - (now - appliedAt));
}
