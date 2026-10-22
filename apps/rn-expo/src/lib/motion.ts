/**
 * motion.ts — o unico lugar que decide como algo se move.
 *
 * Espelha `src/lib/motion` do app web (`MotionProfileProvider` +
 * `EASE`/`IOS_EASE`). No RN nao existe `prefers-reduced-motion` de CSS: o
 * valor vem de `AccessibilityInfo.isReduceMotionEnabled()`, e **toda** animacao
 * do app passa por `useReducedMotion()` antes de rodar (SPEC-015 D7).
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

/** Curvas do app: iOS usa bezier suave, web usa cubic-bezier padrao. */
export const EASE = {
  /** Entrada padrao — rapida, sem bounce. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** Saida — accelerate para frente. */
  in: Easing.bezier(0.4, 0, 1, 1),
  /** Entrada + saida. */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** Molde de layout (`layoutId` da pílula ativa da tab bar). */
  spring: { stiffness: 400, damping: 34, mass: 0.7 } satisfies WithSpringConfig,
  /** Numeros e barras — mola curta, sem oscilacao. */
  snappy: { stiffness: 380, damping: 30, mass: 0.6 } satisfies WithSpringConfig,
  /** Botao pressionado. */
  press: { stiffness: 500, damping: 30, mass: 0.5 } satisfies WithSpringConfig,
};

export const DURATION = {
  micro: 140,
  fast: 220,
  base: 300,
  slow: 460,
} satisfies Record<string, number>;

/** Config de `withTiming` ja pronta, para nao repetir objeto na tela. */
export const timing = (duration = DURATION.base): WithTimingConfig => ({
  duration,
  easing: EASE.out,
});

/** Le a preferencia do sistema uma vez e reage a mudanca. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (active) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      setReduced(v);
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

/** Spring que respeita o modo reduzido (cai para `withTiming` sem mola). */
export function useSpringValue(initial: number, config: WithSpringConfig) {
  const reduced = useReducedMotion();
  const value = useSharedValue(initial);
  const spring = (to: number, opts?: WithSpringConfig) => {
    'worklet';
    if (reduced) {
      value.value = withTiming(to, { duration: 1 });
    } else {
      value.value = withSpring(to, opts ?? config);
    }
  };
  return { value, spring, reduced };
}

/**
 * Entrada de tela: fade + subida, com stagger por filho.
 *
 * `index` e a posicao no grupo — passar o mesmo `index` em siblings produz o
 * cascata. Com movimento reduzido, o conteudo aparece sem transladar (a
 * informacao nao pode depender da animacao para ser lida).
 */
export function useEnter(index = 0, { distance = 14, delayStep = 55 } = {}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    const delay = reduced ? 0 : index * delayStep;
    progress.value = withDelay(delay, withTiming(1, timing(DURATION.base)));
  }, [index, progress, reduced]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));
}

/** Pulso lento — usado no ponto vivo do hero e no mascotote do streak. */
export function usePulse(active = true, { min = 1, max = 1.35, period = 1900 } = {}) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!active) return;
    t.value = withSequence(
      withTiming(max, { duration: period / 2, easing: EASE.inOut }),
      withTiming(min, { duration: period / 2, easing: EASE.inOut }),
    );
  }, [active, min, max, period, t]);

  useEffect(() => {
    if (!active) {
      cancelAnimation(t);
      t.value = min;
    }
  }, [active, min, t]);

  return useAnimatedStyle(() => ({ transform: [{ scale: t.value }] }));
}

/** Tremor curto de "guardado" — celebracao sem poluir. */
export function useNudge() {
  const t = useSharedValue(0);
  const shake = () => {
    'worklet';
    t.value = withSequence(
      withTiming(-1, { duration: 60 }),
      withTiming(1, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  };
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: t.value * 3 }],
  }));
  return { shake, style };
}

export { Animated, cancelAnimation, useAnimatedStyle, useSharedValue, withSpring, withTiming, withDelay, withSequence };