/**
 * Rótulo acessível da tela atual (SPEC-007 §E — Slice E).
 *
 * Módulo **puro**: sem React, sem DOM. É o que permite testar o texto anunciado
 * sem renderizar nada — o mesmo critério de `tokens.ts`/`intent.ts`.
 *
 * **Por que isto existe.** A troca de tela era 100% visual: a pilha desliza, e
 * quem navega por TalkBack/VoiceOver não recebia nenhuma palavra — o foco
 * continuava onde estava, muitas vezes num botão que já tinha saído do DOM. O
 * sintoma é "a tela mudou e eu não sei para onde fui".
 *
 * A fonte do rótulo é o que a interface **já mostra**: o `title` do header
 * dinâmico (`headerConfig`, montado centralmente em `navigationEngine.ts`). Não
 * há segunda tabela de nomes: se o header não tem título, cai no nome da aba.
 */

/**
 * Rótulos das abas raiz — **fonte única**.
 *
 * O `BottomNav` consome este mapa (`src/components/BottomNav.tsx`) em vez de
 * declarar os rótulos literalmente, para que o nome falado e o botão desenhado
 * não possam divergir.
 */
export const TAB_LABELS = {
  home: 'home',
  faculdade: 'faculdade',
  estudos: 'estudos',
  biblioteca: 'biblioteca',
} as const;

/** Nome falado de uma aba; devolve o próprio id se for uma aba nova. */
export const tabLabel = (tab: string): string =>
  (TAB_LABELS as Record<string, string>)[tab] ?? tab;

/**
 * Frase anunciada quando a tela muda.
 *
 * - Com título de header: é o nome que a pessoa está lendo na tela — é o melhor
 *   rótulo possível e o mais honesto.
 * - Sem título (raiz de aba): o nome da aba.
 * - Sem nenhum dos dois: `null`, e o chamador **não renderiza** a região viva —
 *   anunciar string vazia faz o leitor falar uma tela em branco.
 *
 * ⚠️ Só o texto muda o que é anunciado: a região viva precisa ser a mesma no DOM
 * (daí o `role="status"` fixo no shell). É por isso que isto devolve só a string.
 */
export const screenAnnouncement = (
  tab: string,
  headerTitle: string | undefined,
): string | null => {
  const title = headerTitle?.trim();
  if (title) return title;
  const label = tabLabel(tab);
  return label || null;
};