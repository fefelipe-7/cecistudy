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

/* ==================================================================== */
/* Pager de tabs (arrasto horizontal entre sub-tabs do detalhe)         */
/* ==================================================================== */

/** Deslocamento (px) para commitar a troca de tab ao soltar o dedo. */
export const SWIPE_TAB_THRESHOLD = 64;
/** Velocidade (px/s) que também commita a troca (flick rápido). */
export const SWIPE_TAB_VELOCITY = 500;
/** Margem além da borda onde o edge swipe-back tem precedência. */
export const TAB_SWIPE_EDGE_MARGIN = 8;

/** Elementos que nunca iniciam o arrasto de tabs (botões/cards podem). */
const TAB_PAN_IGNORED_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [data-no-swipe]';

/**
 * True se o movimento é predominantemente horizontal e passou o limiar
 * de engajamento (mesma sensação do gesto de borda).
 */
export function isHorizontalPan(dx: number, dy: number): boolean {
  return Math.abs(dx) >= ENGAGE_THRESHOLD && Math.abs(dx) > Math.abs(dy);
}

/**
 * Alvos que nunca iniciam o arrasto de tabs: campos de texto, áreas com
 * scroll horizontal próprio (ex.: barras de pills) e marcas data-no-swipe.
 * Botões/cards NÃO ignoram — o gesto vence o tap após movimento (como iOS).
 */
export function shouldIgnorePanTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  let el: Element | null = target;
  for (let depth = 0; el && depth < 6; depth += 1) {
    if (el instanceof HTMLElement) {
      if (el.isContentEditable) return true;
      const overflowX = getComputedStyle(el).overflowX;
      if (overflowX === 'scroll' || overflowX === 'auto') return true;
    }
    if (el.matches(TAB_PAN_IGNORED_SELECTOR)) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Precedência com o edge swipe-back: toques na faixa da borda esquerda
 * pertencem ao gesto de voltar — o pager de tabs não engaja ali.
 */
export function canStartTabSwipe(startX: number): boolean {
  return startX > EDGE_WIDTH + TAB_SWIPE_EDGE_MARGIN;
}

/**
 * Delta de tab a partir do offset/velocidade final do arrasto:
 * arrastar p/ esquerda (dx negativo) avança (+1); p/ direita volta (−1).
 * Commita por distância OU flick rápido.
 */
export function swipeTabDelta(dx: number, velocityX = 0): -1 | 0 | 1 {
  const byDistance = Math.abs(dx) >= SWIPE_TAB_THRESHOLD;
  const byFlick = Math.abs(velocityX) >= SWIPE_TAB_VELOCITY && Math.abs(dx) > ENGAGE_THRESHOLD;
  if (!byDistance && !byFlick) return 0;
  return dx < 0 ? 1 : -1;
}
