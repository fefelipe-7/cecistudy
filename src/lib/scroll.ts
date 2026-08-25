/**
 * Rola a janela ao topo, SEMPRE instantâneo: é chamado na troca de tela (push/pop),
 * e um scroll suave competiria com a transição de slide do framer-motion.
 */

/**
 * Offset de scroll capturado no último scrollToTop — usado pela camada de slide
 * para "congelar" a tela que está saindo exatamente onde a usuária a via
 * (o conteúdo sai de cena transladado por esse valor em vez de pular ao topo).
 */
let frozenExitScrollY = 0;

export function scrollToTop(): void {
  frozenExitScrollY = window.scrollY;
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function getFrozenExitScrollY(): number {
  return frozenExitScrollY;
}
