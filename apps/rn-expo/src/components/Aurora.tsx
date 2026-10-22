/**
 * Aurora — o fundo do app.
 *
 * O app web resolve isso com CSS radial-gradient. Não existe gradiente radial
 * nativo em RN: o brilho vira **círculos de cor sólida em baixa opacidade**,
 * sobrepostos com escala decrescente (o centro "acende" e a borda morre no
 * canvas). Sem `BlurView` de propósito: o blur nativo sobre um círculo colorido
 * na lateral da tela é a receita da mancha cinza no Android — e o custo de
 * duas blurs em toda troca de aba é o scroll travando em aparelho intermediário.
 *
 * A luz aqui é sutil DE PROPÓSITO: o canvas precisa ter algo para o card
 * projetar, e não competir com ele. Se o brilho chama mais atenção que o hero,
 * está errado.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { aurora, canvas } from '../tokens';

interface GlowProps {
  color: string;
  /** Diâmetro do maior círculo. Os anéis internos derivam daí. */
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  opacity?: number;
}

/**
 * Um brilho: dois anéis concêntricos — o interno mais baixo opacidade e
 * menor, o externo quase imperceptível. Dois degraus é o que o olho lê como
 * "luz difusa"; um só círculo sólido lê como estrela de SVG.
 */
function Glow({ color, size, top, left, right, bottom, opacity = 0.5 }: GlowProps) {
  const rings = useMemo(
    () => [
      { scale: 1, alpha: opacity },
      { scale: 0.68, alpha: opacity * 0.75 },
      { scale: 0.4, alpha: opacity * 0.6 },
    ],
    [opacity],
  );

  return (
    <View pointerEvents="none" style={[styles.glow, { top, left, right, bottom }]}>
      {rings.map((r, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: (size * (1 - r.scale)) / 2,
            left: (size * (1 - r.scale)) / 2,
            width: size * r.scale,
            height: size * r.scale,
            borderRadius: 9999,
            backgroundColor: color,
            opacity: r.alpha,
          }}
        />
      ))}
    </View>
  );
}

interface AuroraProps {
  children?: React.ReactNode;
  /** Rosa = identidade. Azul = sabe (fachada, onboarding de contexto). */
  tone?: 'rose' | 'academic' | 'warm';
}

const TONES = {
  rose: { a: aurora.rose, b: aurora.amber },
  academic: { a: aurora.blue, b: aurora.rose },
  warm: { a: aurora.amber, b: aurora.rose },
} as const;

export function Aurora({ children, tone = 'rose' }: AuroraProps) {
  const insets = useSafeAreaInsets();
  const { a, b } = TONES[tone];

  return (
    <View style={[styles.root, { backgroundColor: canvas }]}>
      <Glow color={a} size={340} top={-140 - insets.top * 0.3} left={-110} opacity={0.55} />
      <Glow color={b} size={280} top={200} right={-130} opacity={0.38} />
      <Glow color={a} size={220} bottom={-120} left={-60} opacity={0.3} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  glow: { position: 'absolute' },
});

export default Aurora;
