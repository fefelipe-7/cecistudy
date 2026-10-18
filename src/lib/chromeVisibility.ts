/**
 * Visibilidade do chrome — **reducer puro** (SPEC-M-019 D4/§5).
 *
 * Nenhum listener, nenhum DOM, nenhum React. A máquina inteira cabe numa função
 * de `(estado, evento) => estado`, e é por isso que ela é testável sem navegador
 * e sem esperar tempo real.
 *
 * ## Por que as durações vivem aqui e não em `src/lib/motion/tokens.ts`
 *
 * `tokens.ts` é o gramático de **navegação e overlay** (`screenEnter`, `overlay`,
 * `sheet`…). O sumiço de chrome é outra coisa: não navega e não abre nada, é
 * decoração de superfície. Polluir `BASE_D` com `chromeHide` faria o token de
 * 240 ms competing com um `screenEnter` de 260 ms no mesmo vocabulário, e as duas
 * coisas nunca seriam comparáveis na leitura.
 *
 * E não quebra o gate: `noInlineTokens.test.ts` reprova `duration:` **seguido de
 * literal numérico** (`:64`). `duration: CHROME_FADE_OUT` não casa — o ratchet
 * fica sem exceção nova.
 *
 * ## Assimetria entrada/saída
 *
 * `CHROME_FADE_OUT < CHROME_FADE_IN`, pelo motivo que o app já escreveu para
 * `screenExit` (`src/lib/motion/tokens.ts:30-35`): *"entrada é o que a usuária
 * pediu; saída é limpeza que ela quer longe"*.
 */

/** Inatividade até o sumiço automático (A5). */
export const IDLE_HIDE_MS = 3000;

/** Até este `scrollY` a barra está **sempre** visível (invariante J3). */
export const TOP_PX = 20;

/**
 * Zona morta da rolagem. Abaixo disso não é gesto, é tremor — e tremor não pode
 * piscar a barra (D4). 4 px é o mesma ordem da tolerância do recognizer
 * (`src/lib/useLongPress.ts:31`), de propósito: é a menor diferença que o dedo
 * não produz por acidente.
 */
export const SCROLL_DEAD_ZONE_PX = 4;

/** Fade de entrada, em segundos. */
export const CHROME_FADE_IN = 0.24;

/** Fade de saída, em segundos. */
export const CHROME_FADE_OUT = 0.16;

export interface ChromeState {
  /** As barras estão no DOM com opacidade > 0? */
  readonly visivel: boolean;
  /** A rolagem está no topo (ou tão perto que a usuária não scrollou)? */
  readonly noTopo: boolean;
  /** Há um menu aberto: as barras não somem de forma alguma. */
  readonly preso: boolean;
  /**
   * O foco está **dentro** das barras (A8, J6).
   *
   * Quem tabula até um botão da barra não pode vê-la sumir embaixo do foco: o
   * controle desapareceria com o foco dentro dele e o próximo `Tab` cairia no
   * vazio. É a mesma classe de problema que `prefers-reduced-motion`, resolvida
   * pelo mesmo caminho: prender.
   */
  readonly foco: boolean;
}

export type ChromeEvent =
  /** Rolagem do usuário. `delta` positivo = conteúdo subindo = para baixo. */
  | { readonly type: 'rolou'; readonly delta: number; readonly scrollY: number }
  /** Ociosidade: quantos ms sem rolagem. O hook é quem agenda. */
  | { readonly type: 'parou'; readonly aposMs: number }
  /** Troca de tela: começa no topo, porque `scrollToTop` já rodou (D1). */
  | { readonly type: 'navegou' }
  /** O menu `⋯` abriu: prender, senão o painel boia sem barra embaixo (D8). */
  | { readonly type: 'menu-abriu' }
  /** O menu fechou: volta a valer o sumiço por inatividade. */
  | { readonly type: 'menu-fechou' }
  /** O foco entrou ou saiu das barras (A8). */
  | { readonly type: 'focou'; readonly dentro: boolean };

/** Tela nova: visível e no topo. */
export const ESTADO_INICIAL: ChromeState = {
  visivel: true,
  noTopo: true,
  preso: false,
  foco: false,
};

/**
 * `preso` **ou** `foco` implicam visível.
 *
 * As duas coisas são "não pode sumir agora": o painel aberto precisa da barra
 * embaixo dele (D8) e o foco precisa da barra em volta dele (J6).
 */
function consolida(estado: ChromeState): ChromeState {
  return estado.preso || estado.foco ? { ...estado, visivel: true } : estado;
}

/**
 * A máquina. **Total**: qualquer estado com qualquer evento devolve um estado,
 * e nenhum evento lança.
 */
export function chromeReducer(estado: ChromeState, evento: ChromeEvent): ChromeState {
  const proximo = proximoEstado(estado, evento);
  // Atalho de identidade **só** quando o estado já é coerente: é o caminho da
  // zona morta, que é o mais quente. Se a entrada já era inconsistente
  // (`preso`/`foco` com `visivel: false`), ela passa pela consolidação e sai
  // consertada.
  if (proximo === estado && (estado.visivel || (!estado.preso && !estado.foco))) return estado;
  return consolida(proximo);
}

function proximoEstado(estado: ChromeState, evento: ChromeEvent): ChromeState {
  switch (evento.type) {
    case 'rolou': {
      // O topo vence a direção: chegar em 0 é o sinal mais forte que existe.
      if (evento.scrollY <= TOP_PX) {
        return { ...estado, visivel: true, noTopo: true };
      }
      // Zona morta: tremor. Devolve o estado **mesmo**, sem alocar.
      if (Math.abs(evento.delta) <= SCROLL_DEAD_ZONE_PX) return estado;
      // delta negativo = a usuária está subindo o conteúdo = quer o de volta.
      if (evento.delta < 0) return { ...estado, visivel: true, noTopo: false };
      // `consolida` cobre o resto: com o menu aberto ou o foco dentro, rolar
      // para baixo **não** pode esconder a barra.
      return { ...estado, visivel: false, noTopo: false };
    }

    case 'parou': {
      if (evento.aposMs < IDLE_HIDE_MS) return estado;
      if (!estado.visivel || estado.noTopo || estado.preso || estado.foco) return estado;
      return { ...estado, visivel: false };
    }

    case 'navegou':
      return { ...estado, visivel: true, noTopo: true };

    case 'menu-abriu':
      return { ...estado, visivel: true, preso: true };

    case 'menu-fechou':
      return { ...estado, preso: false };

    case 'focou':
      return { ...estado, foco: evento.dentro, visivel: evento.dentro ? true : estado.visivel };

    default:
      return estado;
  }
}

/**
 * A barra deve receber `inert`? (D2)
 *
 * Opacidade zero **sozinha** deixa o botão no percurso de foco e na árvore de
 * acessibilidade — o original proíbe os dois (§10.2) e também proíbe elemento
 * invisível interceptando toque (§8.4). `inert` resolve de uma vez.
 */
export function precisaDeInert(estado: ChromeState): boolean {
  return !estado.visivel;
}