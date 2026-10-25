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

/**
 * Posição de scroll por tela (SPEC-M-027 D5). Vive na sessão: recarregar o app
 * começa no topo de cada tela. A chave é a da camada de slide
 * (`slideBaseKeyOf`), não a do topo cru — overlay não muda a tela de baixo.
 */
const positions = new Map<string, number>();

/** Troca de camada pendente: de onde sai, para onde vai, e se a entrada restaura. */
let pending: { from: string; to: string; restore: boolean } | null = null;

/**
 * O motor de navegação avisa a troca de camada; o próximo `scrollToTop` decide o
 * destino. Fica em duas chamadas porque as ~30 ações já chamam `scrollToTop()`
 * logo depois do `setStack` — uma fonte só para mexer no scroll da janela.
 */
export function planScroll(from: string, to: string, restore: boolean): void {
  pending = { from, to, restore };
}

export function scrollToTop(): void {
  frozenExitScrollY = window.scrollY;
  const nav = pending;
  pending = null;
  if (nav) positions.set(nav.from, window.scrollY);
  const top = nav?.restore ? (positions.get(nav.to) ?? 0) : 0;
  window.scrollTo({ top, behavior: 'auto' });
}

export function getFrozenExitScrollY(): number {
  return frozenExitScrollY;
}
