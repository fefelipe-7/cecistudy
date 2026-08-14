/**
 * Lógica pura dos gestos de navegação (pager horizontal + swipe-back).
 * Mantida fora dos componentes para ser testável (vitest).
 */

export const SWIPE_THRESHOLD = 72;
export const SWIPE_VELOCITY = 450;
/** Largura (px) da borda da tela que ativa o swipe-back (estilo iOS). */
export const EDGE_WIDTH = 40;

/** True quando o gesto é predominantemente horizontal (não rouba o scroll vertical). */
export function isHorizontalPan(offset: { x: number; y: number }): boolean {
  return Math.abs(offset.x) > Math.abs(offset.y);
}

/**
 * Índice alvo após soltar um arrasto, limitado a [0, count-1].
 * Usa velocidade se forte, senão o deslocamento em relação ao limiar.
 */
export function resolveSwipe(
  current: number,
  count: number,
  offsetX: number,
  velocityX: number,
  threshold = SWIPE_THRESHOLD,
  velocity = SWIPE_VELOCITY,
): number {
  if (count <= 1) return current;
  let delta = 0;
  if (velocityX <= -velocity) delta = 1;
  else if (velocityX >= velocity) delta = -1;
  else if (offsetX <= -threshold) delta = 1;
  else if (offsetX >= threshold) delta = -1;
  return Math.max(0, Math.min(count - 1, current + delta));
}

/**
 * Overscroll na borda do pager aninhado: retorna a direção a propagar para o
 * pager pai quando o gesto "escaparia" do sub-pager (1 = ir p/ próxima aba pai,
 * -1 = ir p/ aba anterior, 0 = sem propagação).
 * Só propaga quando está na primeira/última sub-aba E o gesto aponta para fora.
 */
export function edgeOverscroll(
  current: number,
  count: number,
  offsetX: number,
  velocityX: number,
  threshold = SWIPE_THRESHOLD,
  velocity = SWIPE_VELOCITY,
): 1 | -1 | 0 {
  if (count <= 1) return 0;
  const dragOut = velocityX >= velocity ? -1 : velocityX <= -velocity ? 1 : offsetX >= threshold ? -1 : offsetX <= -threshold ? 1 : 0;
  if (current === 0 && dragOut === -1) return -1;
  if (current === count - 1 && dragOut === 1) return 1;
  return 0;
}

/**
 * True quando o gesto deve ser ignorado porque começou em um alvo "travado":
 * faixas com scroll horizontal (`[data-swipe-lock]`), pager aninhado
 * (`[data-subpager]`, só quando passado em `extra`), campos de texto e botões.
 */
export function shouldIgnorePanTarget(
  target: EventTarget | null,
  extraSelectors: string[] = [],
): boolean {
  if (!(target instanceof Element)) return false;
  const selectors = ['[data-swipe-lock]', 'input', 'textarea', 'select', '[contenteditable="true"]', 'button', '[role="button"]', 'a'].concat(
    extraSelectors,
  );
  return target.closest(selectors.join(',')) !== null;
}
