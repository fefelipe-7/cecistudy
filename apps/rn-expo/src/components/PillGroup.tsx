/**
 * Pill / PillGroup — a unica forma de "escolher uma coisa" do cecistudy.
 *
 * O web resolve com `PillGroup` (botao + `aria-pressed`). No RN, tres ajustes
 * sao obrigatorios e melhoram o toque:
 *
 *   1. **O pill selecionado tem massa.** No web o selecionado so muda de cor;
 *      no toque, cor sozinha nao se le. Aqui o selecionado ganha um anel
 *      interno (elevacao) e o texto ganha peso.
 *   2. **O grupo rola, nao quebra.** Dez semestres quebram em tres linhas e
 *      empurram o resto da tela. Com `ScrollView horizontal` fica uma faixa.
 *   3. **O toque tem escala propria** (0.90) — um pill e pequeno demais para
 *      0.97 sem parecer que "afundou".
 */
import React, { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { border, ceci, radius, shadow, status, surface } from '../tokens';
import { Tappable } from './Tappable';

export type PillVariant = 'primary' | 'academic' | 'brand' | 'rose' | 'ghost';

interface PillVariantStyle {
  selected: { bg: string; fg: string; bd: string };
  idle: { bg: string; fg: string; bd: string };
}

export const PILL_VARIANTS: Record<PillVariant, PillVariantStyle> = {
  primary: {
    selected: { bg: ceci.primary, fg: ceci['on-primary'], bd: ceci.primary },
    idle: { bg: surface.DEFAULT, fg: ceci.secondary, bd: border.DEFAULT },
  },
  academic: {
    selected: { bg: ceci.academic, fg: ceci['on-academic'], bd: ceci.academic },
    idle: { bg: surface.DEFAULT, fg: ceci.secondary, bd: border.DEFAULT },
  },
  brand: {
    selected: { bg: ceci['brand-strong'], fg: ceci['on-brand'], bd: ceci['brand-strong'] },
    idle: { bg: surface.DEFAULT, fg: ceci.secondary, bd: border.DEFAULT },
  },
  rose: {
    selected: { bg: surface.rose, fg: ceci['brand-strong'], bd: border.brand },
    idle: { bg: surface.DEFAULT, fg: ceci.secondary, bd: border.DEFAULT },
  },
  ghost: {
    selected: { bg: ceci.faded, fg: ceci['on-primary'], bd: ceci.faded },
    idle: { bg: 'transparent', fg: ceci.secondary, bd: border.DEFAULT },
  },
};

export interface PillOption<T extends string> {
  value: T;
  label: string;
  emoji?: string;
}

interface PillProps<T extends string> {
  option: PillOption<T>;
  selected: boolean;
  variant?: PillVariant;
  size?: 'sm' | 'md';
  onPress: () => void;
}

export function Pill<T extends string>({ option, selected, variant = 'brand', size = 'md', onPress }: PillProps<T>) {
  const v = PILL_VARIANTS[variant];
  const tone = selected ? v.selected : v.idle;
  const compact = size === 'sm';

  return (
    <Tappable
      onPress={onPress}
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
    >
      <View
        className={compact ? 'px-2.5 py-1 rounded-pill' : 'px-3.5 py-1.5 rounded-pill'}
        style={[
          {
            backgroundColor: tone.bg,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: tone.bd,
          },
          selected ? shadow.xs : null,
        ]}
      >
        <Text
          className={compact ? 'text-[11px]' : 'text-xs'}
          style={{ color: tone.fg, fontWeight: selected ? '700' : '600' }}
        >
          {option.emoji ? `${option.emoji} ` : ''}
          {option.label}
        </Text>
      </View>
    </Tappable>
  );
}

interface PillGroupProps<T extends string> {
  label?: string;
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: PillVariant;
  size?: 'sm' | 'md';
  /** `true` quando os pills devem caber numa faixa (default) ou quebrar (wrap). */
  scroll?: boolean;
  className?: string;
}

export function PillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  variant = 'brand',
  size = 'md',
  scroll = true,
  className = '',
}: PillGroupProps<T>) {
  const render = useCallback(
    (o: PillOption<T>) => (
      <Pill
        key={o.value}
        option={o}
        selected={o.value === value}
        variant={variant}
        size={size}
        onPress={() => onChange(o.value)}
      />
    ),
    [onChange, value, variant, size],
  );

  return (
    <View className={className}>
      {label ? (
        <Text className="text-[11px] font-semibold text-ceci-tertiary mb-2 uppercase tracking-[1.2px]">{label}</Text>
      ) : null}
      {scroll ? (
        // `showsHorizontalScrollIndicator={false}` + `contentContainerStyle` sem
        // padding: o espaco entre pills vem do gap do item.
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
          style={{ marginHorizontal: -20 }}
        >
          {options.map(render)}
        </ScrollView>
      ) : (
        <View className="flex-row flex-wrap gap-1.5">{options.map(render)}</View>
      )}
    </View>
  );
}

/**
 * Tag — o chip de leitura (materia, categoria, status).
 *
 * Diferente do Pill, a Tag **nao** e interativa por padrao: erotulo. Por isso
 * e mais baixa e sem sombra.
 */
interface TagProps {
  label: string;
  tone?: 'neutral' | 'rose' | 'blue' | 'green' | 'amber' | 'red';
  icon?: React.ReactNode;
  solid?: boolean;
}

const TAG_TONES = {
  neutral: { bg: surface.muted, fg: ceci.secondary, bd: border.subtle },
  rose: { bg: surface.rose, fg: ceci['brand-strong'], bd: border.brand },
  blue: { bg: surface.blue, fg: ceci['academic-strong'], bd: border.academic },
  green: { bg: status['success-surface'], fg: status['success-strong'], bd: status['success-border'] },
  amber: { bg: status['warning-surface'], fg: status['warning-strong'], bd: status['warning-border'] },
  red: { bg: status['danger-surface'], fg: status['danger-strong'], bd: status['danger-border'] },
} as const;

export function Tag({ label, tone = 'neutral', icon, solid }: TagProps) {
  const t = TAG_TONES[tone];
  return (
    <View
      className="flex-row items-center gap-1 self-start px-2 py-1 rounded-pill"
      style={{ backgroundColor: solid ? t.fg : t.bg, borderWidth: 1, borderColor: solid ? t.fg : t.bd }}
    >
      {icon}
      <Text className="text-[10px] font-bold uppercase tracking-[0.6px]" style={{ color: solid ? ceci['on-primary'] : t.fg }}>
        {label}
      </Text>
    </View>
  );
}

export default PillGroup;