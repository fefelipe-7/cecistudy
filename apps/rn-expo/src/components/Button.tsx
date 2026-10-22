/**
 * Button — as duas acoes que o usuario pode tomar.
 *
 * O web nao tem um botao unico: ha o `button.tsx` do shadcn (variantes
 * default/outline/ghost) e meia duzia de botao escrito a mao com
 * `rounded-full px-7 py-3.5`. Isso e a razao pela qual a tela parece "quase
 * certa" e nao certa: cada botao tem um peso diferente.
 *
 * Aqui ha **um** botao com quatro variacoes, e o peso e nomeado:
 *   `primary`   — a acao da tela. Uma por tela, ever.
 *   `secondary` — o mesmo peso, outline.
 *   `quiet`     — terciaria, texto.
 */
import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { border, ceci, radius, shadow, surface } from '../tokens';
import { Tappable } from './Tappable';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'brand';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  /** Icone a esquerda do texto — o "escolher foto" do onboarding usa. */
  leadingIcon?: React.ReactNode;
  full?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const SIZES = {
  sm: { px: 16, py: 8, text: 12, min: 36 },
  md: { px: 20, py: 11, text: 13, min: 44 },
  lg: { px: 28, py: 14, text: 14, min: 52 },
} as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  leadingIcon,
  full,
  disabled,
  size = 'md',
  className = '',
  style,
  accessibilityLabel,
}: ButtonProps) {
  const s = SIZES[size];

  const skin = {
    primary: { bg: ceci.primary, fg: ceci['on-primary'], bd: ceci.primary, elevate: true },
    brand: { bg: ceci.brand, fg: ceci['on-brand'], bd: ceci.brand, elevate: true },
    secondary: { bg: surface.DEFAULT, fg: ceci.secondary, bd: border.DEFAULT, elevate: false },
    quiet: { bg: 'transparent', fg: ceci.tertiary, bd: 'transparent', elevate: false },
  }[variant];

  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      strong
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      className={full ? 'flex-1' : ''}
    >
      <View
        className={`flex-row items-center justify-center gap-2 rounded-pill ${className}`}
        style={[
          {
            backgroundColor: skin.bg,
            paddingHorizontal: s.px,
            paddingVertical: s.py,
            minHeight: s.min,
            borderRadius: radius.pill,
            borderWidth: variant === 'quiet' ? 0 : 1,
            borderColor: skin.bd,
          },
          skin.elevate ? shadow.sm : null,
          style,
        ]}
      >
        {leadingIcon}
        <Text className="font-semibold" style={{ color: skin.fg, fontSize: s.text }}>
          {label}
        </Text>
        {icon}
      </View>
    </Tappable>
  );
}

export default Button;