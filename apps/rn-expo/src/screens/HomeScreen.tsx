/**
 * HomeScreen — "oi, marina. hoje tem isso aqui."
 *
 * A tela do web resolve assim: hero + "hoje na facul" + "sua atenção hoje" +
 * ritmo + ações rapidas + dica. Mesma ordem, porque a ordem **e** a
 * hierarquia: quem sou -> o que acontece -> o que me exige -> o que posso
 * fazer -> um descanso.
 *
 * O que mudou para RN:
 *
 * 1. **Ações rápidas viraram um par de blocos grandes**, empilhados em coluna
 *    cheia. No web sao uma grade 2-colunas lado a lado; num celular de 390px
 *    cada bloco ficaria com 170px e o texto "bora focar?" quebraria em duas
 *    linhas. Coluna cheia deixa cada acao ser um alvo de verdade.
 * 2. **O item de atencao ganhou uma "fita" colorida** a esquerda (rosa =
 *    tarefa, azul = prova) em vez de so um icone solto. O olho acha o que
 *    vence sem ler.
 * 3. **A entrada e escalonada** por secao: a tela se "monta" em 0,4s em vez de
 *    aparecer inteira. Em movimento reduzido, aparece sem cascata.
 */
import React from 'react';
import { Text, View } from 'react-native';

import { StatusChip, WeekRhythm } from '../components/Feedback';
import { Card, HeroCard } from '../components/HeroCard';
import { Mascote } from '../components/Mascote';
import { Section } from '../components/Section';
import { Tappable } from '../components/Tappable';
import {
  attentionItems,
  cecinhoTip,
  study,
  todayClasses,
  weekRhythm,
} from '../mocks';
import { border, ceci, gradients, radius, shadow, status, surface } from '../tokens';

export function HomeScreen() {
  return (
    <View className="gap-5">
      {/* 1. quem eu sou */}
      <Section index={0}>
        <HeroCard
          eyebrow="quinta-feira, 17 de outubro"
          title="oi, marina ✨"
          summary="hoje é dia de aula e uma prova chegando. 12 minutos de foco ja resolvem a maior parte — bora?"
          expression="welcome-wave"
          accent="rose"
        />
      </Section>

      {/* 2. o que acontece hoje */}
      <Section index={1} label="hoje na facul" accent="academic">
        <View className="gap-2">
          {todayClasses.map((c) => (
            <ClassRow key={c.id} {...c} />
          ))}
        </View>
      </Section>

      {/* 3. o que me exige */}
      <Section index={2} label="sua atenção hoje" accent="brand" action={<Text className="text-[11px] font-semibold text-ceci-brand-strong">ver todas</Text>}>
        <View className="gap-2">
          {attentionItems.map((item) => (
            <AttentionRow key={item.id} {...item} />
          ))}
        </View>
      </Section>

      {/* 4. meu ritmo */}
      <Section index={3} label="seu ritmo" accent="brand">
        <Card padded={false} className="p-4">
          <WeekRhythm days={weekRhythm} streak={study.streakDays} />
          <Text className="text-[11px] text-ceci-muted mt-3">
            melhor semana: 4h15 em uma terça. o cecinho ta torcendo por outra igual.
          </Text>
        </Card>
      </Section>

      {/* 5. o que posso fazer agora */}
      <Section index={4} label="bora cuidar disso?" accent="brand">
        <View className="gap-2.5">
          <QuickAction
            tone="solid"
            title="bora focar?"
            subtitle="sessão de 25 min, sem barulho"
            emoji="⏳"
            onPress={() => {}}
          />
          <QuickAction
            tone="soft"
            title="revisar"
            subtitle={`${study.dueCards} cartões esperando você`}
            badge={`${study.dueCards}`}
            emoji="🗂️"
            onPress={() => {}}
          />
        </View>
      </Section>

      {/* 6. descanso */}
      <Section index={5}>
        <View className="flex-row items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: surface.rose, borderWidth: 1, borderColor: border.brand }}>
          <Mascote expression={cecinhoTip.expression} size="md" />
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-ceci-brand-strong uppercase tracking-[1.2px]">dica do cecinho ✨</Text>
            <Text className="text-[13px] leading-[19px] text-ceci-secondary mt-1">{cecinhoTip.text}</Text>
          </View>
        </View>
      </Section>
    </View>
  );
}

/* ── pecas ───────────────────────────────────────────────────────────────── */

const CLASS_STATUS = {
  done: { label: 'feito', tone: 'success' as const, bar: gradients.green[0] },
  now: { label: 'agora', tone: 'brand' as const, bar: ceci.brand },
  next: { label: 'depois', tone: 'muted' as const, bar: border.DEFAULT },
} as const;

function ClassRow({ subject, time, room, status }: (typeof todayClasses)[number]) {
  const s = CLASS_STATUS[status];
  return (
    <Tappable onPress={() => {}} accessibilityRole="button" accessibilityLabel={subject}>
      <View
        className="flex-row items-center overflow-hidden"
        style={[
          {
            backgroundColor: surface.DEFAULT,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: border.subtle,
          },
          shadow.xs,
        ]}
      >
        {/* fita: a barra de cor a esquerda substitui o icone solto */}
        <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: s.bar }} />
        <View className="flex-1 py-3 pl-3.5 pr-3">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-[14px] font-semibold text-ceci-primary flex-1" numberOfLines={1}>
              {subject}
            </Text>
            <StatusChip label={s.label} tone={s.tone} />
          </View>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-[12px] text-ceci-tertiary">{time}</Text>
            <View style={styles.dotSep} />
            <Text className="text-[12px] text-ceci-tertiary">{room}</Text>
          </View>
        </View>
      </View>
    </Tappable>
  );
}

function AttentionRow({ title, due, course, overdue, kind }: (typeof attentionItems)[number]) {
  const tint = kind === 'exam' ? ceci.academic : ceci.brand;
  return (
    <Tappable onPress={() => {}} accessibilityRole="button" accessibilityLabel={title}>
      <View
        className="flex-row items-center gap-3 p-3.5 overflow-hidden"
        style={[
          { backgroundColor: surface.DEFAULT, borderRadius: radius.lg, borderWidth: 1, borderColor: border.subtle },
          shadow.xs,
        ]}
      >
        <View style={[styles.kindIcon, { backgroundColor: kind === 'exam' ? surface.blue : surface.rose, borderColor: kind === 'exam' ? border.academic : border.brand }]}>
          <Text className="text-[15px]">{kind === 'exam' ? '📝' : '✏️'}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-[14px] font-semibold text-ceci-primary" numberOfLines={1}>
            {title}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-[11px] text-ceci-muted">{course}</Text>
          </View>
        </View>

        <Text
          className="text-[11px] font-bold"
          style={{ color: overdue ? status['danger-strong'] : tint }}
        >
          {due}
        </Text>
      </View>
    </Tappable>
  );
}

/**
 * Acao rapida — um bloco, dois estados de peso.
 *
 * `solid` e a acao principal (fundo cocoa, texto claro). `soft` e a secundaria
 * (papel, texto tinta). No web as duas ficam com o mesmo peso visual, o que
 * faz o olho nao saber qual e a principal.
 */
function QuickAction({
  tone,
  title,
  subtitle,
  emoji,
  badge,
  onPress,
}: {
  tone: 'solid' | 'soft';
  title: string;
  subtitle: string;
  emoji: string;
  badge?: string;
  onPress: () => void;
}) {
  const solid = tone === 'solid';
  return (
    <Tappable onPress={onPress} strong={solid} scaleTo={0.975} accessibilityRole="button" accessibilityLabel={title}>
      <View
        className="flex-row items-center gap-3 p-4 overflow-hidden"
        style={[
          { backgroundColor: solid ? ceci.primary : surface.DEFAULT, borderRadius: radius.xl, borderWidth: 1, borderColor: solid ? ceci.primary : border.subtle },
          solid ? shadow.md : shadow.xs,
        ]}
      >
        <Text className="text-[20px]">{emoji}</Text>
        <View className="flex-1">
          <Text className="text-[15px] font-bold" style={{ color: solid ? ceci['on-primary'] : ceci.primary }}>
            {title}
          </Text>
          <Text className="text-[12px] mt-0.5" style={{ color: solid ? 'rgba(255,255,255,0.72)' : ceci.tertiary }}>
            {subtitle}
          </Text>
        </View>
        {badge ? (
          <View style={[styles.countBadge, solid ? { backgroundColor: 'rgba(255,255,255,0.18)' } : { backgroundColor: surface.rose }]}>
            <Text className="text-[12px] font-bold" style={{ color: solid ? ceci['on-brand'] : ceci['brand-strong'] }}>
              {badge}
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize: 15, color: solid ? 'rgba(255,255,255,0.7)' : ceci.faded }}>→</Text>
        )}
      </View>
    </Tappable>
  );
}

const styles = {
  dotSep: { width: 3, height: 3, borderRadius: 2, backgroundColor: ceci.faded },
  kindIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

export default HomeScreen;