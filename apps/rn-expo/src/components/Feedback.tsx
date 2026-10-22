/**
 * Feedback — estado vazio, barra de progresso, chip de status, avatar, ritmo.
 *
 * Agrupados num arquivo porque sao todos "mostrar um dado pequeno com
 *ivables". Separados em cinco arquivos de 30 linhas cada seria ruido.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Mascote } from './Mascote';
import type { MascoteExpression } from './Mascote';
import { Tappable } from './Tappable';
import { border, ceci, gradients, radius, shadow, status, surface } from '../tokens';
import type { Gradient2 } from '../tokens';

/* ── EmptyState ──────────────────────────────────────────────────────────── */

/**
 * Estado vazio.
 *
 * O web usa `bg-surface-muted` + mascote 64px + texto centralizado. A
 * melhoria: o texto da **voz** entra em serifa (o app ja reserva a serifa
 * para o afeto) e o bloco ganha borda tracejada de 12px — "aqui cabe coisa,
 * ainda nao tem" lê diferente de "erro".
 */
interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  mascote?: MascoteExpression;
  dashed?: boolean;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  mascote = 'listening-hello',
  dashed,
  compact,
}: EmptyStateProps) {
  return (
    <View
      className={`items-center ${compact ? 'py-5 px-4' : 'py-7 px-5'}`}
      style={{
        backgroundColor: surface.muted,
        borderRadius: radius.xl,
        borderWidth: dashed ? 1.5 : 1,
        borderColor: dashed ? border.DEFAULT : border.subtle,
        borderStyle: dashed ? 'dashed' : 'solid',
      }}
    >
      <Mascote expression={mascote} size={compact ? 'md' : 'lg'} />
      {title ? <Text className="font-display font-bold text-[15px] text-ceci-primary mt-3">{title}</Text> : null}
      <Text className="text-[13px] leading-[19px] text-ceci-secondary text-center mt-1">{description}</Text>
      {actionLabel && onAction ? (
        <Tappable onPress={onAction} className="mt-4" accessibilityRole="button">
          <View className="min-h-[40px] px-5 rounded-pill bg-surface-default border border-border-default flex-row items-center">
            <Text className="text-[13px] font-semibold text-ceci-primary">{actionLabel}</Text>
          </View>
        </Tappable>
      ) : null}
    </View>
  );
}

/* ── ProgressBar ─────────────────────────────────────────────────────────── */

/**
 * Barra de progresso.
 *
 * O web e um trilho de 6px com `bg-ceci-border-subtle`. Aqui o trilho ganha
 * um gradiente e a barra usa gradiente da marca — o "quanto" fica legivel de
 * relance, que e o objetivo de uma barra.
 */
interface ProgressBarProps {
  value: number;
  tone?: 'brand' | 'academic' | 'green';
  height?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const PROGRESS_TONES: Record<'brand' | 'academic' | 'green', Gradient2> = {
  brand: gradients.brand,
  academic: gradients.academic,
  green: gradients.green,
};

export function ProgressBar({ value, tone = 'brand', height = 6, className = '', style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      className={`overflow-hidden rounded-pill ${className}`}
      style={[{ height, backgroundColor: surface.muted }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(pct * 100), min: 0, max: 100 }}
    >
      <LinearGradient
        colors={PROGRESS_TONES[tone]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${pct * 100}%`, height: '100%', borderRadius: radius.pill }}
      />
    </View>
  );
}

/* ── StatusChip ──────────────────────────────────────────────────────────── */

/**
 * Estado nunca por cor sozinha — sempre icone + texto (regra do app).
 * Sem icone, o chip viraAccessiblemente invisivel para quem nao distingue cor.
 */
interface StatusChipProps {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'muted';
  icon?: React.ReactNode;
  className?: string;
}

export function StatusChip({ label, tone = 'muted', icon, className = '' }: StatusChipProps) {
  const tones = {
    success: { bg: status['success-surface'], fg: status['success-strong'], bd: status['success-border'] },
    warning: { bg: status['warning-surface'], fg: status['warning-strong'], bd: status['warning-border'] },
    danger: { bg: status['danger-surface'], fg: status['danger-strong'], bd: status['danger-border'] },
    info: { bg: status['info-surface'], fg: status['info-strong'], bd: status['info-border'] },
    brand: { bg: surface.rose, fg: ceci['brand-strong'], bd: border.brand },
    muted: { bg: surface.muted, fg: ceci.tertiary, bd: border.subtle },
  }[tone];

  return (
    <View
      className={`flex-row items-center gap-1 self-start px-2 py-1 rounded-pill ${className}`}
      style={{ backgroundColor: tones.bg, borderWidth: 1, borderColor: tones.bd }}
    >
      {icon}
      <Text className="text-[10px] font-bold uppercase tracking-[0.6px]" style={{ color: tones.fg }}>
        {label}
      </Text>
    </View>
  );
}

/* ── MetricTile ──────────────────────────────────────────────────────────── */

/**
 * Numero grande com rotulo. Usado no Perfil e no ritmo.
 * O numero e tabular (`fontVariant: ['tabular-nums']`) para a coluna nao
 * "pular" quando o valor muda de 99 para 100.
 */
interface MetricTileProps {
  value: string;
  label: string;
  hint?: string;
  tone?: 'brand' | 'academic' | 'green';
  className?: string;
}

const METRIC_TONES = {
  brand: ceci['brand-strong'],
  academic: ceci['academic-strong'],
  green: status['success-strong'],
} as const;

export function MetricTile({ value, label, hint, tone = 'brand', className = '' }: MetricTileProps) {
  return (
    <View className={`flex-1 items-center py-3 px-1 ${className}`}>
      <Text
        className="font-display font-bold text-[22px] leading-[26px]"
        style={{ color: METRIC_TONES[tone], fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
      <Text className="text-[10px] font-semibold text-ceci-tertiary uppercase tracking-[0.8px] text-center mt-1">
        {label}
      </Text>
      {hint ? <Text className="text-[10px] text-ceci-muted text-center mt-0.5">{hint}</Text> : null}
    </View>
  );
}

/* ── WeekRhythm ──────────────────────────────────────────────────────────── */

/**
 * Os sete dias da semana.
 *
 * O web usa uma grade com borda e fundo `surface-muted`. Aqui cada dia e uma
 * **barra vertical** que cresce de baixo para cima: o olho le o ritmo como
 * silhueta, e nao como tabela. Dia de hoje recebe um anel; dia com estudo
 * recebe o gradiente da marca; dia vazio fica um ponto.
 */
interface WeekRhythmProps {
  /** 7 entradas, domingo primeiro. `minutes` = quanto de foco houve. */
  days: { label: string; minutes: number; isToday?: boolean; isFuture?: boolean }[];
  streak?: number;
  className?: string;
}

export function WeekRhythm({ days, streak, className = '' }: WeekRhythmProps) {
  const peak = Math.max(30, ...days.map((d) => d.minutes));

  return (
    <View className={className}>
      {streak ? (
        <View className="flex-row items-center gap-1.5 mb-3">
          <Text className="text-sm">🔥</Text>
          <Text className="text-[13px] font-semibold text-ceci-primary">
            {streak} {streak === 1 ? 'dia' : 'dias'} seguidos
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-end justify-between" style={{ height: 84 }}>
        {days.map((d) => {
          const ratio = d.minutes / peak;
          const h = Math.max(6, Math.round(ratio * 64));
          const studied = d.minutes > 0;

          return (
            <View key={d.label} className="flex-1 items-center gap-1.5">
              <View className="h-16 w-full max-w-[26px] justify-end">
                {studied ? (
                  <LinearGradient
                    colors={d.isFuture ? gradients.future : gradients.brand}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={{ height: h, borderRadius: radius.pill }}
                  />
                ) : (
                  <View
                    style={{
                      height: 6,
                      borderRadius: radius.pill,
                      backgroundColor: d.isFuture ? surface.muted : border.DEFAULT,
                    }}
                  />
                )}
              </View>
              <Text
                className="text-[10px] font-semibold"
                style={{
                  color: d.isToday ? ceci['brand-strong'] : ceci.muted,
                  fontWeight: d.isToday ? '700' : '600',
                }}
              >
                {d.label}
              </Text>
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: d.isToday ? ceci.brand : 'transparent',
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ── DashedDivider ───────────────────────────────────────────────────────── */

/** Divisor tracejado — separa blocos sem fechar a tela. */
export function DashedDivider({ label, className = '' }: { label?: string; className?: string }) {
  if (!label) {
    return <View className={`h-px ${className}`} style={{ backgroundColor: border.subtle }} />;
  }
  return (
    <View className={`flex-row items-center gap-2 ${className}`}>
      <View className="flex-1 h-px" style={{ backgroundColor: border.subtle }} />
      <Text className="text-[10px] font-semibold text-ceci-faded uppercase tracking-[1.2px]">{label}</Text>
      <View className="flex-1 h-px" style={{ backgroundColor: border.subtle }} />
    </View>
  );
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */

/**
 * Avatar com inicial.
 *
 * No header, o avatar **e** a entrada para o Perfil (o Perfil nao esta na tab
 * bar). Entao ele precisa parecer clicavel sem virar um botao com borda — a
 * pista e o anel de marca.
 */
export function AvatarTile({
  name,
  size = 40,
  onPress,
  tone = 'rose',
}: {
  name: string;
  size?: number;
  onPress?: () => void;
  tone?: 'rose' | 'blue';
}) {
  const initial = name.trim().charAt(0).toUpperCase() || 'C';
  const body = (
    <View
      className="items-center justify-center"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.34,
          backgroundColor: tone === 'rose' ? surface.rose : surface.blue,
          borderWidth: 1.5,
          borderColor: tone === 'rose' ? border.brand : border.academic,
        },
        shadow.xs,
      ]}
    >
      <Text
        className="font-display font-bold text-ceci-primary"
        style={{ fontSize: size * 0.42 }}
      >
        {initial}
      </Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <Tappable onPress={onPress} scaleTo={0.92} accessibilityRole="button" accessibilityLabel="abrir perfil">
      {body}
    </Tappable>
  );
}

export default EmptyState;