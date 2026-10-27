/**
 * Tokens de movimento do cecistudy (SPEC-007 §5.1).
 *
 * Módulo **puro**: sem React, sem DOM, sem efeitos. Tudo aqui é dado — o que
 * torna o slice inteiro testável sem renderizar nada (ver `src/lib/motion/__tests__`).
 *
 * Fonte: https://motion.dev/docs/react-animate-presence ·
 * https://developer.apple.com/design/human-interface-guidelines/motion
 */

import type { Transition } from 'framer-motion';

/**
 * Razão de parallax de uma camada coberta, como fração da largura do palco.
 *
 * Uma camada `depth` níveis abaixo do topo descansa em `x = -depth * PARALLAX * W`.
 * É isso que dá o parallax de "empilhar" sem a tela-base ter enter/exit próprios.
 */
export const PARALLAX = 0.28;

/** Opacidade máxima do dim sobre a camada coberta.
 *
 * Orçamento de contraste (WCAG 1.4.3): a tela de baixo é legível mesmo
 * enquanto coberta — quem está lendo com leitor de tela não perde contraste.
 */
export const SHADE_MAX_OPACITY = 0.14;

/**
 * Curvas de easing que **não** cabiam em `EASE` porque não são a curva padrão de
 * entrada/saída do sistema.
 *
 * `IOS_EASE` e `IOS_EASE_OUT` viviam em `src/lib/motion.ts` (shim) e a curva do
 * `IOS_EASE` estava **duplicada como literal** em `bottom-nav-bar.tsx` — dois
 * donos para a mesma curva. Movidas para cá: o shim não ganha símbolo novo.
 *
 * ⚠️ São aproximações de sensação, não curvas oficiais da Apple. Ver
 * `research_basis.value_status` da especificação de motion.
 */

/** Curva de timing "iOS-like" (push, pílula da bottom-nav): suave, sem overshoot. */
export const IOS_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

/** Ease de saída curto (desaceleração). */
export const IOS_EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Durações-base (segundos). `resolveProfile` escala isso em `0.75` no perfil reduzido. */
export const BASE_D = {
  /** Camada do topo entrando em push/pop. */
  screenEnter: 0.26,
  /** Camada do topo saindo — deliberadamente **mais curto** que a entrada.
   *  Entrada é o que a usuária pediu; saída é limpeza que ela quer longe. Bônus
   *  técnico: encurta a janela em que a camada que sai fica montada, que é
   *  exatamente onde mora a família de bugs "filhos presos no DOM" do
   *  `AnimatePresence` quando a `key` troca rápido demais. */
  screenExit: 0.18,
  /** Assentando no parallax frente/trás. */
  screenRest: 0.3,
  /** Container transform: o card virando a tela (SPEC-M-028 D46). Um valor só
   *  para os dez pares — o ritmo é a assinatura do gesto. */
  morph: 0.32,
  /** Dim subindo/descendo sobre a camada coberta. */
  shade: 0.26,
  /** Troca no mesmo nível (curso → outro curso) ou passo curto. */
  replace: 0.16,
  /** Troca de aba (pares). Sem movimento, só fade. */
  tab: 0.14,
  /** Scrim + painel de overlay (compose/wizards). */
  overlay: 0.18,
  /** Painel de modal/sheet. */
  sheet: 0.28,
  /** Sub-tab de curso, passo de wizard, questão de quiz. */
  step: 0.24,
  stepExit: 0.16,
  /** Item de lista entrando/saindo. */
  listItem: 0.18,
  /** Passo do stagger de lista (ver `revealVariants` — o stagger é capado). */
  listStagger: 0.03,
  /** Teto do índice que ainda recebe delay no stagger. Acima disso entra tudo junto. */
  listStaggerCap: 6,
  /** Bottom-nav, header, FAB. */
  navBar: 0.24,
  fab: 0.22,
  fabStagger: 0.02,
  /** Toast. */
  toast: 0.2,
  /** Micro-interação (toggle, checkbox) — o que a usuária repete o dia inteiro. */
  micro: 0.12,
  /* --- Barra contextual (barra inferior de tela auxiliar) ---------------- */
  /** Entrada no estado pressionado — tem de parecer instantânea (≤100ms). */
  pressIn: 0.08,
  /** Saída do estado pressionado — um fio mais longa que a entrada. */
  pressOut: 0.12,
  /** Rótulo/ícone que entra ou sai junto com a geometria da barra. */
  contentFade: 0.14,
  /** Troca do ícone da ação principal (entra/sai, sem morphing). */
  iconSwap: 0.18,
  /** Confirmação visual de uma seleção no menu. */
  selection: 0.18,
  /** Expandir ↔ compactar a barra (geometria). */
  contextBar: 0.28,
  /** Menu contextual: abrir. */
  contextMenu: 0.24,
  /** Menu contextual: fechar (sempre mais curto que a abertura). */
  contextMenuClose: 0.18,
  /** Passo de stagger entre itens do menu (o teto é `listStaggerCap`). */
  contextStagger: 0.03,
  /** Ciclo de um movimento decorativo (respiração, deriva). Não é transição:
   *  não tem entrada nem saída. F8 ajusta em aparelho antes de aumentar. */
  ambient: 12,
} as const;

/** Nomes das durações. */
export type DurationKey = keyof typeof BASE_D;

/**
 * As durações como `number` (sem os literais do `as const`) — é o tipo que o
 * perfil expõe, porque o perfil reduzido as **reescreve** em runtime.
 */
export type Durations = Readonly<Record<DurationKey, number>>;

/** Curvas de easing. `enter` desacelera ao chegar; `exit` é o espelho (acelera ao sair). */
export const EASE = {
  /** Desacelera forte ao chegar — espelha a física de um objeto entrando em repouso. */
  enter: [0.16, 1, 0.3, 1],
  /** Acelera ao sair — o mesmo objeto saindo. Espelhar entrada/saída é o que faz
   *  "a mesma coisa saindo" em vez de "duas animações". */
  exit: [0.4, 0, 1, 1],
  /** Material 3 "standard" — a curva da casa. */
  standard: [0.4, 0, 0.2, 1],
  emphasized: [0.2, 0, 0, 1],
} as const;

/**
 * Springs de **física** (stiffness/damping/mass) — que herdam a velocidade do gesto.
 *
 * Regra (SPEC-007 §D5): push/pop, tab, step e overlay são **tween**. Um spring
 * baseado em duração ignora a velocidade herdada por design (o Motion zera
 * `velocity` em `spring.ts`) e um toque no meio do push reinicia visivelmente.
 * Spring fica só onde há gesto ou acoplamento físico:
 * https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/animation/generators/spring.ts
 */
export const BASE_T = {
  /** Gesto de borda (back) e drag-to-dismiss. É o único lugar onde a velocidade
   *  do dedo importa de verdade. */
  gesture: { type: 'spring', stiffness: 700, damping: 50, mass: 0.8 },
  navBar: { type: 'spring', stiffness: 600, damping: 40, mass: 0.8 },
  fab: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
  sheet: { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 },
} as const;

/** Tolerância para comparar "está parado" — usada no dev-assert de camada travada. */
export const STUCK_EPSILON_PX = 1;

/**
 * Fade do fundo por trás de um modal (`Modal.tsx`).
 *
 * Fica **depois** de `BASE_D`/`EASE` de propósito: um `const` que lê outro `const`
 * do mesmo módulo tem de vir depois dele, senão o `const` de baixo lê um binding
 * ainda no TDZ no primeiro import.
 */
export const OVERLAY_FADE: Transition = { duration: BASE_D.overlay, ease: EASE.standard };

/** Os quatro springs de física — o que o perfil troca por tween quando reduzido. */
export type SpringTokens = {
  gesture: Transition;
  navBar: Transition;
  fab: Transition;
  sheet: Transition;
};

/**
 * As seis famílias de movimento (SPEC-M-027 D2).
 *
 * Construtor **único**: `TOKENS` é o perfil completo e `resolveProfile` monta a
 * versão reduzida com as durações já escalonadas. Um mapeamento, duas saídas —
 * nenhuma família tem número próprio.
 *
 * - `micro` responde a um toque (toggle, press) — curto, sem deslocamento;
 * - `enterExit` é algo aparecendo/sumindo, com entrada e saída espelhadas;
 * - `navigation` é mudança de contexto: aba, passo, overlay, lista;
 * - `sharedElement` é o mesmo objeto viajando entre duas telas;
 * - `spring` é física que herda a velocidade do gesto — só onde há dedo;
 * - `ambient` é movimento decorativo, sem começo nem fim percebido.
 *
 * ⚠️ `duration` aqui é a **do perfil**. Componente não lê `BASE_D` para animar:
 * `BASE_D` é o valor do perfil completo e não escala.
 */
export const buildTokens = (d: Durations, t: SpringTokens) => ({
  micro: { duration: d.micro, ease: EASE.standard },
  enterExit: {
    enter: d.screenEnter,
    exit: d.screenExit,
    rest: d.screenRest,
    shade: d.shade,
    easeEnter: EASE.enter,
    easeExit: EASE.exit,
    parallax: PARALLAX,
    shadeMaxOpacity: SHADE_MAX_OPACITY,
  },
  navigation: {
    tab: d.tab,
    replace: d.replace,
    step: d.step,
    stepExit: d.stepExit,
    overlay: d.overlay,
    sheet: d.sheet,
    toast: d.toast,
    listItem: d.listItem,
    listStagger: d.listStagger,
    listStaggerCap: d.listStaggerCap,
    ease: EASE.standard,
  },
  sharedElement: { duration: d.morph, ease: EASE.emphasized },
  spring: { gesture: t.gesture, navBar: t.navBar, fab: t.fab, sheet: t.sheet },
  ambient: { duration: d.ambient, ease: 'linear' as const },
});

export type MotionTokens = ReturnType<typeof buildTokens>;

/** Taxonomia do perfil completo. O reduzido vem de `resolveProfile(true)`. */
export const TOKENS: MotionTokens = buildTokens(BASE_D, BASE_T);
