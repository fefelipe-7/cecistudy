/**
 * Mascote — 24 expressoes, uma por situacao.
 *
 * No web sao `<img>` de webp. No RN o webp nao e renderizado nativamente pelo
 * iOS, entao a imagem passa por `expo-image` (SDWebImage no iOS, Glide no
 * Android) — que tambem Damask o filtro por `tintColor`, util para deixar a
 * mascote "acorde" com a superficie.
 *
 * A mascote e parte da identidade: ela **nao** e um emoji decorativo e nunca
 * entra em espaco apertado sem ser pensada.
 */
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MASCOTE_EXPRESSIONS } from '../tokens';
import type { MascoteExpression } from '../tokens';

// Reexportado porque meia tela importa `{ Mascote, type MascoteExpression }` de
// um lugar so — e porque o nome do tipo pertence ao componente, nao a paleta.
export type { MascoteExpression };

type Size = 'sm' | 'md' | 'lg' | 'hero';

const SIZES: Record<Size, number> = { sm: 40, md: 56, lg: 64, hero: 72 };

interface MascoteProps {
  expression: MascoteExpression;
  size?: Size;
  /** Lado em px, quando o tamanho da escala nao serve. */
  width?: number;
  className?: string;
  /** Reduz a opacidade — herois usam `opacity-95` no web. */
  dimmed?: boolean;
  accessibilityLabel?: string;
}

export function Mascote({
  expression,
  size = 'lg',
  width,
  className = '',
  dimmed,
  accessibilityLabel,
}: MascoteProps) {
  const side = width ?? SIZES[size];
  const source = MASCOTE_EXPRESSIONS[expression];

  return (
    <View
      className={className}
      // A mascote e sempre decorativa quando o texto ja diz o que acontece.
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole={accessibilityLabel ? 'image' : 'none'}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    >
      <Image
        source={source as number}
        style={{ width: side, height: side, opacity: dimmed ? 0.95 : 1 }}
        contentFit="contain"
        transition={160}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

export const mascotStyles = StyleSheet.create({
  peeking: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
});

export default Mascote;