import React, { useCallback, useEffect, useRef } from 'react';
import {
  motion,
  useAnimation,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion';
import {
  edgeOverscroll,
  isHorizontalPan,
  resolveSwipe,
  shouldIgnorePanTarget,
} from '../../lib/swipe';
import { iOS_SPRING } from '../../lib/motion';

interface SwipeTabPagerProps {
  /** ids das abas na ordem do trilho */
  tabs: readonly string[];
  activeIndex: number;
  onChange: (index: number) => void;
  /** renderiza o conteúdo de cada aba */
  children: (id: string, index: number) => React.ReactNode;
  /** false desativa o gesto (ex.: telas auxiliares empurradas na pilha) */
  enabled?: boolean;
  /**
   * 'top' → abas principais: cada coluna é um scroll próprio (`data-pager-scroll`).
   * 'nested' → sub-abas: seções compartilham o scroll da coluna pai e propagam
   * overscroll nas bordas (`onEdgeOverscroll`).
   */
  mode?: 'top' | 'nested';
  /** usado em mode='nested': troca a aba principal ao passar das bordas */
  onEdgeOverscroll?: (direction: 1 | -1) => void;
}

/**
 * Pager horizontal estilo Instagram. O trilho é arrastado com `onPan*` (manual,
 * ignorando alvos travados) e o `x` é animado por spring ao trocar de aba.
 */
export const SwipeTabPager: React.FC<SwipeTabPagerProps> = ({
  tabs,
  activeIndex,
  onChange,
  children,
  enabled = true,
  mode = 'top',
  onEdgeOverscroll,
}) => {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const controls = useAnimation();
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(activeIndex);
  indexRef.current = activeIndex;
  const panRef = useRef({ active: false, startX: 0 });

  const snapTo = useCallback(
    (index: number) => {
      const target = { x: `-${index * 100}%` };
      if (reducedMotion) {
        controls.set(target);
        return;
      }
      void controls.start({ ...target, transition: iOS_SPRING });
    },
    [controls, reducedMotion],
  );

  useEffect(() => {
    snapTo(activeIndex);
  }, [activeIndex, snapTo]);

  // ao trocar sub-aba, a coluna pai (pager 'top') volta ao topo
  useEffect(() => {
    if (mode !== 'nested') return;
    const scrollable = trackRef.current?.closest('[data-pager-scroll]');
    scrollable?.scrollTo?.({ top: 0 });
  }, [activeIndex, mode]);

  const handlePanStart = useCallback(
    (event: PointerEvent, _info: PanInfo) => {
      const extra = mode === 'top' ? ['[data-subpager]'] : [];
      if (!enabled || reducedMotion || shouldIgnorePanTarget(event.target, extra)) {
        panRef.current.active = false;
        return;
      }
      panRef.current = { active: true, startX: x.get() };
    },
    [enabled, reducedMotion, mode, x],
  );

  const handlePan = useCallback(
    (_event: PointerEvent, info: PanInfo) => {
      if (!panRef.current.active) return;
      if (!isHorizontalPan(info.offset)) return;
      x.set(panRef.current.startX + info.offset.x);
    },
    [x],
  );

  const handlePanEnd = useCallback(
    (_event: PointerEvent, info: PanInfo) => {
      if (!panRef.current.active) return;
      panRef.current.active = false;
      const current = indexRef.current;
      if (mode === 'nested' && onEdgeOverscroll) {
        const dir = edgeOverscroll(current, tabs.length, info.offset.x, info.velocity.x);
        if (dir !== 0) {
          onEdgeOverscroll(dir);
          snapTo(current);
          return;
        }
      }
      const target = resolveSwipe(current, tabs.length, info.offset.x, info.velocity.x);
      if (target !== current) onChange(target);
      else snapTo(current);
    },
    [mode, onEdgeOverscroll, onChange, snapTo, tabs.length],
  );

  return (
    <div className={`relative overflow-hidden ${mode === 'top' ? 'h-full' : ''}`}>
      <motion.div
        ref={trackRef}
        data-subpager={mode === 'nested' ? '' : undefined}
        className={mode === 'top' ? 'flex h-full' : 'flex'}
        style={{ x, touchAction: 'pan-y' }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={controls}
      >
        {tabs.map((id, i) => (
          <div
            key={id}
            className={mode === 'top' ? 'w-full shrink-0 h-full overflow-y-auto' : 'w-full shrink-0 min-h-full'}
            data-pager-scroll={mode === 'top' ? '' : undefined}
          >
            {children(id, i)}
          </div>
        ))}
      </motion.div>
    </div>
  );
};