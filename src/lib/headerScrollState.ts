/**
 * Mapa de estados do header (longo ↔ curto) a partir da posição de rolagem.
 *
 * Por que histerese (dois limiares) e não um só: com um limiar único, a
 * usuária que para a rolagem em cima dele (ex.: `scrollY ≈ 20`) alterna o
 * estado a cada micro-ajuste — o momentum fracionário do iOS, o rubber-band
 * e o recolher da barra de URL do Android movem poucos pixels com a tela
 * parada, e o header "buga" entre longo e curto. Com uma zona morta entre
 * os dois limiares, parar em qualquer ponto é estável por construção.
 *
 * ────────────────────────────────────────────────────────────────
 *  scrollY < 8      → longo (expande; cobre overscroll negativo)
 *  8 ≤ scrollY < 20 → mantém o estado anterior (zona morta)
 *  scrollY ≥ 20     → curto (colapsa)
 * ────────────────────────────────────────────────────────────────
 */

/** Rolagem a partir da qual o header colapsa para o estado curto. */
export const HEADER_SCROLL_COLLAPSE_Y = 20;

/** Rolagem abaixo da qual o header volta ao estado longo. */
export const HEADER_SCROLL_EXPAND_Y = 8;

/**
 * Próximo estado do header dado o estado anterior e a rolagem atual.
 * Função pura: repetir a mesma rolagem nunca muda o estado — é isso que
 * impede o flap quando a usuária para a tela em qualquer ponto.
 */
export function resolveScrolledState(previous: boolean, scrollY: number): boolean {
  if (scrollY >= HEADER_SCROLL_COLLAPSE_Y) return true;
  if (scrollY < HEADER_SCROLL_EXPAND_Y) return false;
  return previous;
}
