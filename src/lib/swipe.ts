/**
 * Helpers puros do gesto de "voltar pela borda" (edge swipe-back).
 *
 * Lógica livre de DOM para ser testada: faixa de borda, limiar de engajamento,
 * limiar de commit e alvos que devem ignorar o gesto.
 */

/** Largura (px) da faixa da borda esquerda que inicia o gesto. */
export const EDGE_WIDTH = 24;
/** Movimento horizontal mínimo (px) para "engajar" o gesto (vira drag). */
export const ENGAGE_THRESHOLD = 12;
/** Distância (px) do commit: soltar acima disso volta; abaixo volta ao lugar. */
export const COMMIT_THRESHOLD = 72;
/** Fração máxima da largura da tela que o conteúdo desliza durante o drag. */
export const MAX_DRAG_FRACTION = 0.42;

/** Elementos interativos que nunca devem iniciar o gesto de borda. */
const IGNORED_SELECTOR =
  'button, a, input, textarea, select, [contenteditable="true"], [data-no-swipe]';

/**
 * True se o alvo (ou um ancestral próximo) deve ignorar o gesto: controles
 * interativos de verdade (botão, link, campo), áreas com scroll horizontal
 * próprio ou faixas marcadas com `data-no-swipe`. Cards clicáveis (role=button)
 * NÃO ignoram — o gesto vence o tap após movimento horizontal, como no iOS.
 */
export function shouldIgnoreTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  let el: Element | null = target;
  for (let depth = 0; el && depth < 6; depth += 1) {
    if (el instanceof HTMLElement) {
      if (el.isContentEditable) return true;
      const overflowX = getComputedStyle(el).overflowX;
      if (overflowX === 'scroll' || overflowX === 'auto') return true;
    }
    if (el.matches(IGNORED_SELECTOR)) return true;
    el = el.parentElement;
  }
  return false;
}

/** Distância máxima de drag (px) para a largura da viewport dada. */
export function maxDragDistance(viewportWidth: number): number {
  return Math.round(viewportWidth * MAX_DRAG_FRACTION);
}

/**
 * Decisão de engajamento: o dedo já se moveu para a direita o bastante
 * (e mais que vertical) para virar um drag de voltar.
 */
export function isEngaged(startX: number, startY: number, x: number, y: number): boolean {
  const dx = x - startX;
  const dy = y - startY;
  return dx >= ENGAGE_THRESHOLD && Math.abs(dx) > Math.abs(dy);
}

/** Decisão de commit no release do dedo. */
export function shouldCommit(dx: number): boolean {
  return dx >= COMMIT_THRESHOLD;
}

/** Valor "suavizado" do drag: nunca negativo, respeitando o máximo. */
export function clampDrag(dx: number, viewportWidth: number): number {
  return Math.max(0, Math.min(dx, maxDragDistance(viewportWidth)));
}

/** True se a largura da tela permite o gesto (telas muito estreitas usam botão). */
export function supportsEdgeSwipe(viewportWidth: number): boolean {
  return viewportWidth >= 320;
}
