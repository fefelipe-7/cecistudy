/**
 * Tappable — o unico botao do laboratorio.
 *
 * No web o feedback e `active:scale(0.97)` (`.press-card`). No RN o `Pressable`
 * sozinho nao da textura nenhuma, e `AnimatedPressable` sozinho da textura sem
 * hierarquia. Aqui os dois moram juntos: escala + haptico.
 *
 * Ate agora o app web so tem *cor* de realce no estado pressionado
 * (`.tap-interactive`, 150ms). No RN o realce relevante e o **movimento** — e
 * por isso `scaleTo` e explicito: 0.97 para superficie, 0.90 para icone.
 */
import React, { useCallback } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { press, tap } from '../lib/haptics';
import { EASE, useReducedMotion } from '../lib/motion';

interface TappableProps extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Quanto o elemento encolhe no pressionar. 0.97 = card, 0.90 = icone. */
  scaleTo?: number;
  /** `true` quando o toque e acao primaria (haptico firme, escala maior). */
  strong?: boolean;
  disabled?: boolean;
}

export function Tappable({
  children,
  style,
  scaleTo = 0.97,
  strong = false,
  disabled,
  onPress,
  ...rest
}: TappableProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const pressIn = useCallback(() => {
    if (reduced) return;
    scale.value = withSpring(strong ? 0.94 : scaleTo, EASE.press);
  }, [reduced, scale, scaleTo, strong]);

  const pressOut = useCallback(() => {
    if (reduced) return;
    scale.value = withSpring(1, EASE.spring);
  }, [reduced, scale]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={(e) => {
        if (strong) press();
        else tap();
        onPress?.(e);
      }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      {...rest}
    >
      <Animated.View style={[style, animated, disabled ? { opacity: 0.45 } : null]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default Tappable;