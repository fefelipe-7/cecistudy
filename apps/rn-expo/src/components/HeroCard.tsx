/**
 * HeroCard — a abertura de toda superficie.
 *
 * No web existem tres heroes quase iguais (HomeView, FaculdadeView,
 * EstudosView) e um molde canonico (HeroCard do Estagio/TCC). Aqui os quatro
 * viram **um** componente, com o padrao elevado:
 *
 *   1. gradiente diagonal + borda de 1px (a "luz" na borda, nao no centro)
 *   2. *sheen* especular no topo — a faixa clara que faz o card parecer vidro
 *   3. sombra cocoa dupla (rasa + profunda), nunca sombra preta
 *   4. mascote espiando no canto, com rotacao leve e opacidade 0.95
 *   5. eyebrow em micro-caps com tracking (o web usa `lowercase`, que no RN
 *      fica com ar de texto solto)
 *
 * Regra de ouro: o hero tem UM objeto em serifa grande. Dois numeros grandes
 * no mesmo hero competem e nenhum lê.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { border, ceci, gradients, radius, shadow, surface } from '../tokens';
import type { Gradient2 } from '../tokens';
import { Mascote } from './Mascote';
import type { MascoteExpression } from './Mascote';
import { Tappable } from './Tappable';

export type Accent = 'rose' | 'blue' | 'warm';

const ACCENTS: Record<Accent, { colors: Gradient2; border: string }> = {
  rose: { colors: gradients.heroRose, border: border.subtle },
  blue: { colors: gradients.heroBlue, border: border.academic },
  warm: { colors: gradients.heroWarm, border: border.subtle },
};

interface HeroCardProps {
  /** micro-caps: "estágio", "hoje na facul", "perfil". */
  eyebrow?: string;
  /** O objeto unico em serifa. */
  title: string;
  /** Frase de resumo, uma ou duas linhas. */
  summary?: string;
  /** Conteudo do pe (progresso, contador, legenda). */
  footer?: React.ReactNode;
  /** Botao no canto superior direito. */
  action?: { label: string; onPress: () => void; accessibilityLabel?: string };
  /** Chip no canto superior direito, quando nao ha acao. */
  badge?: React.ReactNode;
  expression?: MascoteExpression;
  accent?: Accent;
  /** Some a mascote — para hero de tela curta. */
  bare?: boolean;
  className?: string;
}

export function HeroCard({
  eyebrow,
  title,
  summary,
  footer,
  action,
  badge,
  expression = 'welcome-wave',
  accent = 'rose',
  bare,
  className = '',
}: HeroCardProps) {
  const tone = ACCENTS[accent];

  return (
    <View className={`overflow-hidden ${className}`} style={[styles.shell, shadow.sm]}>
      <LinearGradient colors={tone.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        {/* sheen: a luz que entra pelo topo — o que separa "card" de "vidro" */}
        <LinearGradient
          colors={gradients.sheen}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={styles.sheen}
          pointerEvents="none"
        />

        <View className="p-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              {eyebrow ? <Text className="text-[11px] font-semibold text-ceci-tertiary uppercase tracking-[1.4px]">{eyebrow}</Text> : null}
              <Text className="font-serif text-[30px] leading-[36px] text-ceci-primary mt-0.5" numberOfLines={2}>
                {title}
              </Text>
            </View>

            {action ? (
              <Tappable
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel ?? action.label}
                scaleTo={0.94}
                className="shrink-0"
              >
                <View className="min-h-[36px] px-3.5 rounded-pill bg-surface-default border border-border-default flex-row items-center">
                  <Text className="text-xs font-semibold text-ceci-secondary">{action.label}</Text>
                </View>
              </Tappable>
            ) : (
              badge ?? null
            )}
          </View>

          {summary ? (
            <Text className="text-[13px] leading-[19px] text-ceci-secondary mt-2.5" style={styles.summary}>
              {summary}
            </Text>
          ) : null}

          {footer ? <View className="mt-3">{footer}</View> : null}
        </View>

        {bare ? null : (
          <View style={styles.mascotSlot} pointerEvents="none">
            <Mascote expression={expression} width={64} dimmed />
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

/**
 * Card — a superficie base de tudo que nao e hero.
 *
 * O web usa `Card.tsx` com `bg-surface-default border border-ceci-border-default
 * shadow-sm` e `p-6`. Aqui o `p-6` (24px) e grande demais para o espaco real de
 * um celular: vira `p-4` e ganha um `shadow.xs` para nao brigar com o hero.
 */
interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  tone?: 'default' | 'muted' | 'rose' | 'blue' | 'outline';
  padded?: boolean;
  radiusToken?: number;
  className?: string;
}

const CARD_TONES = {
  default: { bg: surface.DEFAULT, bd: border.DEFAULT },
  muted: { bg: surface.muted, bd: border.subtle },
  rose: { bg: surface.rose, bd: border.brand },
  blue: { bg: surface.blue, bd: border.academic },
  outline: { bg: 'transparent', bd: border.DEFAULT },
} as const;

export function Card({
  children,
  onPress,
  tone = 'default',
  padded = true,
  radiusToken = radius.xl,
  className = '',
}: CardProps) {
  const t = CARD_TONES[tone];
  const body = (
    <View
      className={`p-4 ${className}`}
      style={[
        { backgroundColor: t.bg, borderRadius: radiusToken, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: t.bd },
        shadow.xs,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return body;
  return (
    <Tappable onPress={onPress} accessibilityRole="button">
      {body}
    </Tappable>
  );
}

/**
 * SectionTitle — o divisor de assunto.
 *
 * O web e um `border-b` seco com uppercase. Aqui ganha: um ponto de cor da
 * familia antes do texto (rosa = eu, azul = saber), e um gradiente fino na linha
 * em vez de `border-bottom` uniforme — a linha "some" no fim, o que tira a
 * aspecto de tabela.
 */
interface SectionTitleProps {
  children: string;
  icon?: React.ReactNode;
  accent?: 'brand' | 'academic' | 'neutral';
  action?: React.ReactNode;
}

const ACCENT_DOT = { brand: ceci.brand, academic: ceci.academic, neutral: ceci.faded } as const;

export function SectionTitle({ children, icon, accent = 'brand', action }: SectionTitleProps) {
  return (
    <View className="pb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <View style={[styles.dot, { backgroundColor: ACCENT_DOT[accent] }]} />
          {icon}
          <Text className="text-[11px] font-display font-bold text-ceci-primary uppercase tracking-[1.2px] flex-1">
            {children}
          </Text>
          {action}
        </View>
      </View>
      <LinearGradient
        colors={['rgba(231,218,207,0.9)', 'rgba(231,218,207,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: radius.hero, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: border.subtle },
  fill: { flex: 1 },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%' },
  summary: { maxWidth: '92%' },
  mascotSlot: { position: 'absolute', bottom: 10, right: 10, transform: [{ rotate: '-3deg' }] },
  dot: { width: 6, height: 6, borderRadius: 3 },
  rule: { height: StyleSheet.hairlineWidth * 2, marginTop: 8 },
});

export default HeroCard;