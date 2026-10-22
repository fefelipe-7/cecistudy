/**
 * EstudosScreen — focar, revisar, ler, treinar, concluir.
 *
 * O web abre com dois cards de acao lado a lado ("bora focar?" / "revisar") e
 * depois distribui o resto numa grade de 12 colunas que so existe em tela
 * grande. Em 390px, essa grade vira uma coluna — e a coluna loses a ordem de
 * importacao (focar > revisar > ler).
 *
 * Aqui a tela tem **três niveis**:
 *   - agora      (focar, revisar) — o que se faz nos proximos 10 minutos
 *   - depois     (leitura, treino) — o que se planeja
 *   - sempre     (ritmo, dicas) — o que se olha
 *
 * O card de leitura ganhou a capa real (cor do livro como dado) em vez de um
 * icone generico: e o unico objeto do app que voce "pega" e vira as paginas.
 */
import React from 'react';
import { Text, View } from 'react-native';

import { MetricTile, ProgressBar, StatusChip, WeekRhythm } from '../components/Feedback';
import { Card, HeroCard } from '../components/HeroCard';
import { Mascote } from '../components/Mascote';
import { Section } from '../components/Section';
import { Tappable } from '../components/Tappable';
import { reading, study, studyRhythm } from '../mocks';
import { border, ceci, cover, radius, shadow, status, surface } from '../tokens';

export function EstudosScreen() {
  return (
    <View className="gap-5">
      {/* 1. meu estudo corner */}
      <Section index={0}>
        <HeroCard
          eyebrow="estudos"
          title="seu study corner"
          summary={`hoje: ${study.minutesToday} min de foco · ${study.dueCards} cartões pra revisar. bora continuar? ♡`}
          expression="focus-ready"
          accent="rose"
          badge={
            <View style={styles.streakChip}>
              <Text className="text-[12px]">🔥</Text>
              <Text className="text-[12px] font-bold text-ceci-brand-strong">{study.streakDays}d</Text>
            </View>
          }
        />
      </Section>

      {/* 2. AGORA — as duas acoes que cabem na sua mao */}
      <Section index={1} label="pra agora" accent="brand">
        <View className="gap-2.5">
          <FocusCard title="bora focar?" subtitle="25 min · sem barulho · o cecinho conta" emoji="⏳" solid />
          <FocusCard title="revisar" subtitle={`${study.dueCards} cartões · ~6 min`} emoji="🗂️" badge={`${study.dueCards}`} />
        </View>
      </Section>

      {/* 3. DEPOIS — a leitura em andamento */}
      <Section index={2} label="leitura" accent="academic">
        <Tappable onPress={() => {}} accessibilityRole="button" accessibilityLabel={reading.title}>
          <Card padded={false} className="p-4">
            <View className="flex-row items-center gap-3.5">
              {/* capa: cor do livro como DADO, nunca como token */}
              <View style={[styles.cover, { backgroundColor: reading.coverColor }]}>
                <View style={styles.coverSpine} />
                <Text numberOfLines={3} style={{ color: cover.ink, fontSize: 9, fontWeight: '700', lineHeight: 12 }}>
                  {reading.title}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-ceci-primary" numberOfLines={1}>
                  {reading.title}
                </Text>
                <Text className="text-[12px] text-ceci-tertiary mt-0.5">{reading.author}</Text>
                <View className="flex-row items-center gap-2 mt-2.5">
                  <View className="flex-1">
                    <ProgressBar value={reading.progress} tone="academic" height={5} />
                  </View>
                  <Text className="text-[11px] font-bold text-ceci-academic-strong" style={{ fontVariant: ['tabular-nums'] }}>
                    {Math.round(reading.progress * 100)}%
                  </Text>
                </View>
                <Text className="text-[11px] text-ceci-muted mt-1.5">
                  página {reading.pagesCurrent} de {reading.pagesTotal}
                </Text>
              </View>
            </View>
          </Card>
        </Tappable>
      </Section>

      {/* 4. SEMPRE — o ritmo */}
      <Section index={3} label="seu ritmo" accent="brand">
        <Card padded={false} className="p-4">
          <WeekRhythm days={studyRhythm} />
          <View className="flex-row items-center gap-2 mt-4 pt-3" style={{ borderTopWidth: 1, borderTopColor: border.subtle }}>
            <Text className="text-[12px] text-ceci-secondary flex-1">sequência mais longa</Text>
            <Text className="text-[13px] font-bold text-ceci-primary">16 dias</Text>
          </View>
        </Card>
      </Section>

      {/* 5. treinar e concluir */}
      <Section index={4} label="treinar & concluir" accent="brand">
        <View className="flex-row gap-2.5">
          <GoalTile
            title="quiz de questões"
            meta={`${study.quizQuestions} questões no acervo`}
            emoji="🎯"
            tone="blue"
            progress={0.22}
          />
          <GoalTile
            title="meu tcc"
            meta={`${study.tccProgress}% dos capítulos`}
            emoji="🌿"
            tone="green"
            progress={study.tccProgress / 100}
          />
        </View>

        <Tappable onPress={() => {}} accessibilityRole="button" className="mt-2.5">
          <View style={styles.dashedAdd}>
            <Text className="text-[13px] font-semibold text-ceci-brand-strong">+ novo flashcard</Text>
          </View>
        </Tappable>
      </Section>

      {/* 6. descanso */}
      <Section index={5}>
        <View
          className="flex-row items-center gap-3 p-4 rounded-2xl"
          style={{ backgroundColor: surface.rose, borderWidth: 1, borderColor: border.brand }}
        >
          <Mascote expression="celebrate-small" size="md" />
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-ceci-brand-strong uppercase tracking-[1.2px]">dica do cecinho ✨</Text>
            <Text className="text-[13px] leading-[19px] text-ceci-secondary mt-1">
              revisar 12 cartões hoje quebra sua sequência só amanhã, não hoje.
            </Text>
          </View>
        </View>
      </Section>

      {/* 7. numeros do mes */}
      <Section index={6}>
        <Card padded={false} className="flex-row py-1">
          <MetricTile value="46h" label="foco" tone="brand" />
          <MetricTile value="12" label="sessões" tone="academic" />
          <MetricTile value="180" label="cartões" tone="green" />
          <MetricTile value="86%" label="acerto" tone="brand" />
        </Card>
      </Section>
    </View>
  );
}

/* ── pecas ───────────────────────────────────────────────────────────────── */

function FocusCard({
  title,
  subtitle,
  emoji,
  badge,
  solid,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  badge?: string;
  solid?: boolean;
}) {
  return (
    <Tappable onPress={() => {}} strong={solid} scaleTo={0.975} accessibilityRole="button" accessibilityLabel={title}>
      <View
        className="flex-row items-center gap-3 p-4 overflow-hidden"
        style={[
          {
            backgroundColor: solid ? ceci.primary : surface.DEFAULT,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: solid ? ceci.primary : border.subtle,
          },
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
          <View style={[styles.badge, solid ? { backgroundColor: 'rgba(255,255,255,0.18)' } : { backgroundColor: surface.rose }]}>
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

/** Metas com progresso — quiz e tcc. Cores distintas porque sao familias distintas. */
function GoalTile({
  title,
  meta,
  emoji,
  tone,
  progress,
}: {
  title: string;
  meta: string;
  emoji: string;
  tone: 'blue' | 'green';
  progress: number;
}) {
  return (
    <Tappable onPress={() => {}} accessibilityRole="button" accessibilityLabel={title} className="flex-1">
      <View
        className="p-4 overflow-hidden"
        style={[
          {
            backgroundColor: tone === 'blue' ? surface.blue : status['success-surface'],
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: tone === 'blue' ? border.academic : status['success-border'],
          },
          shadow.xs,
        ]}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-[17px]">{emoji}</Text>
          <StatusChip label={`${Math.round(progress * 100)}%`} tone={tone === 'blue' ? 'info' : 'success'} />
        </View>
        <Text className="text-[13px] font-semibold text-ceci-primary mt-3">{title}</Text>
        <Text className="text-[11px] text-ceci-tertiary mt-0.5">{meta}</Text>
        <View className="mt-3">
          <ProgressBar value={progress} tone={tone === 'blue' ? 'academic' : 'green'} height={4} />
        </View>
      </View>
    </Tappable>
  );
}

const styles = {
  streakChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: surface.glassStrong,
    borderWidth: 1,
    borderColor: border.brand,
  },
  cover: {
    width: 72,
    height: 98,
    borderRadius: radius.md,
    padding: 9,
    paddingLeft: 13,
    justifyContent: 'flex-end' as const,
    overflow: 'hidden' as const,
  },
  coverSpine: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 7,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  badge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dashedAdd: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: border.brand,
    backgroundColor: surface.rose,
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

export default EstudosScreen;