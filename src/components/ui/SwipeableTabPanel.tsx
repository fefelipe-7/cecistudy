/**
 * SwipeableTabPanel — o dono único do gesto de trocar de aba (SPEC-015).
 *
 * A regra nasceu no detalhe da disciplina (`CourseDetailView.tsx`) e estava
 * **repetida**: cada tela com tabs reescreveria os mesmos trinta elementos
 * (limiar, direção, arrasto, mola, reduced-motion). Cinco cópias divergem em
 * silêncio. Aqui a regra tem um dono; a tela só diz **quais** abas tem.
 *
 * A **decisão** (quando o arrasto vira troca) continua morando em
 * `src/lib/swipe.ts`, pura e testada. Este arquivo é só a casca de movimento —
 * nenhuma aritmética de gesto mora aqui.
 *
 * Uso:
 *
 * ```tsx
 * const pager = useTabPager({ tabIds: SUBTABS, active: subTab, onChange: setSubTab });
 *
 * <UnderlineTabBar tabs={TABS} active={subTab} onChange={(id) => pager.goTo(id as SubTab)} />
 *
 * <SwipeableTabPanel active={subTab} pager={pager} label="disciplinas">
 *   {subTab === 'disciplinas' && <DisciplinasGrid />}
 * </SwipeableTabPanel>
 * ```
 */
import React, { useCallback, useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { prefersReducedMotion, stepVariants } from '@/lib/motion';
import { BASE_D, BASE_T, EASE } from '@/lib/motion/tokens';
import { canStartTabSwipe, shouldIgnorePanTarget, swipeTabDelta } from '@/lib/swipe';

/** Abstração da mola de volta do arrasto: casa com o dedo e não arremessa. */
const ELASTICIDADE = 0.18;

/**
 * Mola do painel. A de `BASE_T.gesture` é a do gesto de borda (mais rápida,
 * `mass: 0.8`): o arrasto de aba é o mesmo gesto — segue o dedo, assenta curto.
 */
const MOLA_PAINEL = BASE_T.gesture;

/** Perfil reduzido: crossfade curtíssimo em vez de slide + mola. */
const TRANSIÇÃO_REDUZIDA = { duration: BASE_D.micro, ease: EASE.standard };

export interface TabPager<T extends string> {
  /** `+1` quando a troca foi para a frente, `-1` para trás — manda no slide. */
  direction: number;
  /** Troca de aba pelo gesto (ou pelo limite da lista). */
  goTo: (id: T, dir?: number) => void;
  /** Engata o arrasto quando o toque é válido. Vai no `onPointerDownCapture`. */
  onPointerDownCapture: (e: React.PointerEvent) => void;
  /** Fim do arrasto: distância OU flick rápido viram troca de aba. */
  onDragEnd: (e: unknown, info: { offset: { x: number }; velocity: { x: number } }) => void;
  /** O arrasto só faz sentido com duas abas ou mais. */
  enabled: boolean;
  /** Quando false (reduced-motion), o painel não arrasta. */
  draggable: boolean;
  /** Controles do framer: o arrasto só engata por `dragControls.start(e)`. */
  dragControls: ReturnType<typeof useDragControls>;
}

/**
 * Estado do pager: direção da última troca e os dois handlers do gesto.
 *
 * `active` **entra por prop** e não é estado interno: a tela é dona da aba
 * (às vezes ela é um `useState` do motor de navegação), e um estado paralelo
 * aqui seria uma segunda verdade que dessincroniza no primeiro deep link.
 */
export function useTabPager<T extends string>({
  tabIds,
  active,
  onChange,
}: {
  tabIds: readonly T[];
  active: T;
  onChange: (id: T) => void;
}): TabPager<T> {
  const [direction, setDirection] = useState(1);
  const dragControls = useDragControls();
  const enabled = tabIds.length > 1;
  const draggable = enabled && !prefersReducedMotion();

  const goTo = useCallback(
    (next: T, dir?: number) => {
      if (next === active) return;
      const from = tabIds.indexOf(active);
      const to = tabIds.indexOf(next);
      setDirection(dir ?? (to > from ? 1 : -1));
      onChange(next);
    },
    [active, onChange, tabIds],
  );

  const onPointerDownCapture = useCallback(
    (e: React.PointerEvent) => {
      // Mouse não arrasta: no desktop o arrasto briga com seleção de texto.
      if (e.pointerType === 'mouse') return;
      if (!draggable) return;
      // A faixa da borda esquerda pertence ao gesto de voltar (SPEC-007).
      if (!canStartTabSwipe(e.clientX)) return;
      // Campos, scroll horizontal próprio e `data-no-swipe` seguem com o dedo.
      if (shouldIgnorePanTarget(e.target)) return;
      dragControls.start(e);
    },
    [draggable, dragControls],
  );

  const onDragEnd = useCallback(
    (_e: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const delta = swipeTabDelta(info.offset.x, info.velocity.x);
      if (delta === 0) return;
      const next = tabIds[tabIds.indexOf(active) + delta];
      if (next === undefined) return;
      goTo(next, delta);
    },
    [active, goTo, tabIds],
  );

  return { direction, goTo, onPointerDownCapture, onDragEnd, enabled, draggable, dragControls };
}

interface SwipeableTabPanelProps {
  /** Aba visível — também é a `key` que dispara entrar/sair. */
  active: string;
  pager: TabPager<string>;
  /** Nome da aba para o leitor de tela; a região é `role="tabpanel"`. */
  label: string;
  children: React.ReactNode;
}

/**
 * O painel que acompanha o dedo: arrasta, solta com mola e troca de aba.
 *
 * `touchAction: 'pan-y'` é o que mantém o scroll vertical da tela vivo enquanto
 * o gesto horizontal é capturado — sem ele, a página inteira trava no toque.
 */
export const SwipeableTabPanel: React.FC<SwipeableTabPanelProps> = ({
  active,
  pager,
  label,
  children,
}) => (
  <motion.div onPointerDownCapture={pager.onPointerDownCapture} style={{ touchAction: 'pan-y' }}>
    <AnimatePresence mode="popLayout" custom={pager.direction} initial={false}>
      <motion.div
        key={active}
        custom={pager.direction}
        variants={stepVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pager.draggable ? MOLA_PAINEL : TRANSIÇÃO_REDUZIDA}
        drag={pager.draggable ? 'x' : false}
        dragListener={false}
        dragControls={pager.dragControls}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={pager.draggable ? ELASTICIDADE : 0}
        // Sem arremesso: soltar devolve o painel pelo mesmo spring. O gesto já
        // decidiu a aba no `onDragEnd`; deixar o conteúdo voar também faz a
        // troca parecer instável em tela rápida.
        dragMomentum={false}
        onDragEnd={pager.onDragEnd}
        role="tabpanel"
        aria-label={`aba ${label}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  </motion.div>
);

export default SwipeableTabPanel;
