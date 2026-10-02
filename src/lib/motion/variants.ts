/**
 * Fábrica de variantes de tela (SPEC-007 §5.3).
 *
 * Uma única função decide para onde **cada** camada da pilha vai, a partir de
 * uma única verdade (`NavIntent`). A regra que resolve o problema difícil — "a
 * tela que sai vai para onde?" — é que a direção de saída é a **mesma** `dir`
 * da entrada, com o sinal trocado:
 *
 * ```
 * entering.x = +dir * W        exiting.x = -dir * W
 * ```
 *
 * |          | quem entra (topo) | quem sai (topo)  |
 * |----------|-------------------|-------------------|
 * | push (+1)| de `+W` (direita) | para `-W` (esquerda) |
 * | pop (-1) | de `-W` (esquerda) | para `+W` (direita) |
 *
 * E a **posição de descanso é função da profundidade** (§D3): uma camada `depth`
 * níveis abaixo do topo fica em `x = -depth * PARALLAX * W`. Consequência: a
 * tela-base não tem enter/exit próprios em push/pop — ela só anima
 * `frente → atrás` e `atrás → frente`, e pilha de 3 funciona sem caso especial.
 */

import type { TargetAndTransition, Variants } from 'framer-motion';
import { consumeMotionIntent, type NavIntent } from './intent';
import type { MotionProfile } from './profile';
import { BASE_D, EASE, PARALLAX, SHADE_MAX_OPACITY } from './tokens';

export interface ScreenTargets {
  front: TargetAndTransition;
  behind: (depth: number) => TargetAndTransition;
  enter: (intent: NavIntent) => TargetAndTransition;
  exit: (intent: NavIntent) => TargetAndTransition;
  shade: (intent: NavIntent) => TargetAndTransition;
}

/** Distância mínima que a tela percorre ao sair depois de um gesto de borda. */
const GESTURE_EXIT_TRAVEL_PX = 90;

/**
 * Alvos de uma camada da pilha.
 *
 * @param width  largura de referência do palco (px). Fato de layout, medido pelo wrapper.
 * @param profile perfil de movimento (cheio ou reduzido).
 */
export function createScreenTargets(width: number, profile: MotionProfile): ScreenTargets {
  const { d, reduced } = profile;

  // Sob movimento reduzido, TODO alvo horizontal é 0 — e é escrito **explícito**,
  // não omitido: se a tela parou a meio caminho em x=400 e o perfil virou
  // reduzido, omitir `x` deixaria o transform travado onde estava.
  if (reduced) {
    const fadeIn: TargetAndTransition = {
      x: 0,
      opacity: 1,
      transition: { duration: d.replace, ease: EASE.standard },
    };
    const fadeOut: TargetAndTransition = {
      x: 0,
      opacity: 0,
      transition: { duration: d.replace, ease: EASE.exit },
    };
    return {
      front: fadeIn,
      behind: () => fadeIn,
      enter: () => fadeIn,
      exit: () => fadeOut,
      // Sem dim: o conteúdo de baixo segue legível, sem escurecer nada.
      shade: () => ({ opacity: 0, transition: { duration: 0 } }),
    };
  }

  return {
    /** No topo, em repouso. */
    // `opacity: 1` explícito pelo mesmo motivo do perfil reduzido: `animate`
    // escreve só as chaves presentes no alvo. Como `enter` de tab/replace nasce
    // em `opacity: 0`, omitir aqui deixaria a tela montada **permanentemente
    // invisível** — o sintoma era "troco de aba e só o fundo aparece".
    front: { x: 0, opacity: 1, transition: { duration: d.screenRest, ease: EASE.standard } },

    /** `depth` níveis abaixo do topo. */
  behind: (depth: number) => ({
    // `-0` vira `translateX(-0px)` e quebra igualdade por `Object.is`; depth 0 é
    // a própria frente, então devolvemos `0` limpo.
    x: depth === 0 ? 0 : -depth * PARALLAX * width,
    // Mesmo motivo de `front`: camada coberta fica visível, nunca apagada.
    opacity: 1,
    transition: { duration: d.screenRest, ease: EASE.standard },
  }),

    // `opacity: 1` explícito: um push **não pode fazer fade**. Sumir enquanto
    // desliza é o maior sinal de "web app fingindo ser nativo".
    enter: (intent: NavIntent) =>
      intent.kind === 'push' || intent.kind === 'pop'
        ? {
            x: intent.dir * width,
            opacity: 1,
            transition: { duration: d.screenEnter, ease: EASE.enter },
          }
        : { x: 0, opacity: 0, transition: { duration: d.replace, ease: EASE.standard } },

    exit: (intent: NavIntent) => {
      // Pop vindo do gesto de borda: parte do ponto onde o dedo soltou.
      if (intent.kind === 'pop' && intent.fromGesture) {
        return {
          x: [intent.gestureX, intent.gestureX + Math.max(GESTURE_EXIT_TRAVEL_PX, width * 0.4)],
          opacity: [1, 0],
          transition: { duration: d.screenExit, ease: EASE.exit },
        };
      }
      if (intent.kind === 'push' || intent.kind === 'pop') {
        return {
          x: -intent.dir * width,
          opacity: 1,
          transition: { duration: d.screenExit, ease: EASE.exit },
        };
      }
      return { x: 0, opacity: 0, transition: { duration: d.replace, ease: EASE.exit } };
    },

    shade: (intent: NavIntent) =>
      intent.kind === 'push' || intent.kind === 'pop'
        ? { opacity: 1, transition: { duration: d.shade, ease: EASE.standard } }
        : { opacity: 0, transition: { duration: d.replace, ease: EASE.standard } },
  };
}

/**
 * `Variants` para o wrapper declarativo (`SlideScreen`), mantendo a API de
 * rótulos (`initial`/`animate`/`exit`) já usada hoje.
 *
 * A largura é fixada na criação; `custom` carrega o `NavIntent` **completo**
 * (não um escalar) para a variante `exit` ler a direção fresca — a instância que
 * sai tem props congeladas do último render (ver §5.4).
 */
export function createScreenVariants(width: number, profile: MotionProfile): Variants {
  const targets = createScreenTargets(width, profile);
  return {
    initial: (intent: NavIntent) => targets.enter(intent),
    animate: (intent: NavIntent) =>
      intent.kind === 'push' || intent.kind === 'pop'
        ? { ...targets.front, transition: { duration: profile.d.screenRest, ease: EASE.standard } }
        : { ...targets.front },
    exit: () => targets.exit(consumeMotionIntent()),
  };
}

/** Rótulo do alvo de repouso de uma camada pela profundidade. */
export const screenDepthLabel = (depth: number): 'front' | 'behind' =>
  depth > 0 ? 'behind' : 'front';

// ---------------------------------------------------------------------------
// Presets nomeados (SPEC-007 §D6)
// ---------------------------------------------------------------------------

/**
 * `step` — deslocamento curto e local: sub-tab de curso, passo de wizard,
 * questão de quiz. Não é o mesmo que `screen` porque é curto e local (passo é
 * curto; tela é longa e espacial). Consolidar as 3 físicas locais que existiam
 * (48px / 48px / 40px) em um preset só.
 */
export const stepVariants: Variants = {
  initial: (dir: number = 1) => ({ x: dir * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: BASE_D.step, ease: EASE.standard } },
  exit: (dir: number = 1) => ({
    x: dir * -40,
    opacity: 0,
    transition: { duration: BASE_D.stepExit, ease: EASE.exit },
  }),
};

/**
 * `tab` — troca de aba (pares). Sem slide: a usuária não pode ver a outra aba
 * saindo, e um wrap de `AnimatePresence` aqui custaria um render de subárvore
 * inteira a cada toque.
 */
export const tabContent: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: BASE_D.tab, ease: EASE.standard } },
  exit: { opacity: 0, transition: { duration: BASE_D.tab, ease: EASE.exit } },
};

/**
 * `overlay` — compose / wizards / detalhe e transformação de nota.
 * Fade + scale curto. Substitui `overlayVariants` do `motion.ts` legado, que era
 * idêntico e será re-exportado daqui.
 */
export const overlayVariants: Variants = {
  initial: { opacity: 0, scale: 0.985, y: 6 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: BASE_D.overlay, ease: EASE.standard },
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    y: 4,
    transition: { duration: BASE_D.overlay, ease: EASE.exit },
  },
};

/** `chrome` — header, bottom-nav, FAB. Preset compartilhado de opacidade. */
export const chromeFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: BASE_D.navBar, ease: EASE.standard } },
  exit: { opacity: 0, transition: { duration: BASE_D.navBar, ease: EASE.exit } },
};

/** Toast — fade + slide curto, entra por baixo e sai por cima. */
export const toastVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: BASE_D.toast, ease: EASE.standard } },
  exit: { opacity: 0, y: -8, transition: { duration: BASE_D.micro, ease: EASE.exit } },
};

/**
 * `listItem` — item de lista entrando/saindo. **Nunca** `height: 0` (força
 * reflow de todos os irmãos seguintes durante toda a animação); o irmão fecha a
 * lacuna por `layout="position"`.
 */
export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: BASE_D.listItem, ease: EASE.standard },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: BASE_D.listItem, ease: EASE.exit },
  },
};

/**
 * Delay de entrada de um item de lista, com o **stagger capado**.
 * `0.03 × 20 itens` = 600ms de cauda, que é exatamente o "esperar uma animação"
 * que a HIG da Apple desaconselha. Acima do teto, tudo entra junto.
 */
export const staggerFor = (index: number): { delayChildren: number } => ({
  delayChildren: Math.min(index, BASE_D.listStaggerCap) * BASE_D.listStagger,
});

/** Opacidade do dim sobre a camada coberta (orçamento de contraste WCAG 1.4.3). */
export const SHADE_OPACITY = SHADE_MAX_OPACITY;
