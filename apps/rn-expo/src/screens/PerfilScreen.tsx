/**
 * PerfilScreen — eu sou, eu estou, eu construi, eu cuido.
 *
 * A web conta essa historia em quatro atos numa tela de 12 colunas. Aqui a
 * ordem e a mesma, mas cada ato virou um bloco de largura cheia — num celular
 * a coluna de 5/12 (o "cuidado") fica com 150px e nenhum item de configuracao
 * cabe.
 *
 * Diferenca de fundo: o Perfil **nao e uma aba**. No web ele e alcancavel pelo
 * avatar do header; aqui e uma tela cheia com botao de fechar, porque um
 * destino que some da barra e volta a cada dois toques parece quebrado.
 */
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { DashedDivider, MetricTile, ProgressBar, StatusChip } from '../components/Feedback';
import { Card } from '../components/HeroCard';
import { Mascote } from '../components/Mascote';
import { Section } from '../components/Section';
import { Tappable } from '../components/Tappable';
import { Button } from '../components/Button';
import { achievements, dataTools, journey, preferences, profile, profileMetrics } from '../mocks';
import { border, ceci, radius, shadow, surface } from '../tokens';

interface PerfilScreenProps {
  onClose: () => void;
  topInset: number;
  bottomInset: number;
}

export function PerfilScreen({ onClose, topInset, bottomInset }: PerfilScreenProps) {
  const initials = profile.name.trim().charAt(0).toUpperCase() || 'C';

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 32, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* eu sou */}
      <Section index={0}>
        <View style={[styles.hero, shadow.sm]}>
          <View className="flex-row items-start justify-between">
            <View style={styles.avatar}>
              <Text className="font-display font-bold text-[26px] text-ceci-primary">{initials}</Text>
            </View>
            <Tappable onPress={onClose} scaleTo={0.9} accessibilityRole="button" accessibilityLabel="fechar">
              <View style={styles.closeBtn}>
                <Text style={{ fontSize: 15, color: ceci.tertiary }}>✕</Text>
              </View>
            </Tappable>
          </View>

          <Text className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-[1.4px] mt-4">perfil</Text>
          <Text className="font-serif text-[30px] leading-[36px] text-ceci-primary mt-0.5">{profile.displayName}</Text>

          <View className="flex-row items-center gap-2 mt-2.5">
            <View style={styles.levelChip}>
              <Text className="text-[10px] font-bold text-ceci-brand-strong uppercase tracking-[0.8px]">
                nível {profile.level} · {profile.levelTitle}
              </Text>
            </View>
            <Text className="text-[11px] text-ceci-muted">desde {profile.joinedAt}</Text>
          </View>

          <Text className="font-serif text-[14px] leading-[20px] text-ceci-secondary italic mt-4">
            “{profile.dailyQuote}”
          </Text>

          <View className="mt-5">
            <Button label="editar perfil" variant="secondary" size="sm" onPress={() => {}} leadingIcon={<Text style={{ fontSize: 13 }}>✏️</Text>} />
          </View>
        </View>
      </Section>

      {/* eu estou */}
      <Section index={1} label="onde eu estou" accent="brand">
        <Card padded={false} className="p-4">
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="font-display font-bold text-[24px] leading-[28px] text-ceci-primary">
                {journey.ordinal}º <Text className="text-[15px] text-ceci-tertiary">de {journey.total}</Text>
              </Text>
              <Text className="text-[12px] text-ceci-tertiary mt-1">
                {journey.termsDone} semestres concluídos · faltam {journey.total - journey.ordinal}
              </Text>
            </View>
            <StatusChip label={`${Math.round((journey.ordinal / journey.total) * 100)}%`} tone="success" />
          </View>

          <View className="mt-3.5">
            <ProgressBar value={journey.ordinal / journey.total} tone="brand" height={7} />
          </View>

          <View className="flex-row items-center gap-2 mt-4">
            <Button label="virar o semestre" variant="primary" size="sm" onPress={() => {}} className="flex-1" />
            <Button label="histórico" variant="secondary" size="sm" onPress={() => {}} />
          </View>
        </Card>
      </Section>

      {/* eu construi */}
      <Section index={2} label="o que eu construí" accent="academic">
        <Card padded={false} className="flex-row py-1">
          {profileMetrics.map((m) => (
            <MetricTile key={m.key} value={m.value} label={m.label} tone={m.tone} />
          ))}
        </Card>

        <View className="flex-row gap-2 mt-2.5 flex-wrap">
          {achievements.map((a) => (
            <Tappable key={a.id} onPress={() => {}} accessibilityRole="button" accessibilityLabel={a.label} className="flex-1">
              <View
                className="items-center py-3 px-2 rounded-2xl"
                style={[
                  { backgroundColor: a.done ? surface.rose : surface.muted, borderWidth: 1, borderColor: a.done ? border.brand : border.subtle },
                ]}
              >
                <Text style={{ fontSize: 19, opacity: a.done ? 1 : 0.35 }}>{a.icon}</Text>
                <Text
                  className="text-[10px] font-semibold text-center mt-1.5 leading-[14px]"
                  style={{ color: a.done ? ceci.secondary : ceci.faded }}
                >
                  {a.label}
                </Text>
              </View>
            </Tappable>
          ))}
        </View>
      </Section>

      {/* eu cuido */}
      <Section index={3} label="eu cuido do meu cantinho" accent="brand">
        <Card padded={false}>
          {preferences.map((p, i) => (
            <View
              key={p.id}
              className="flex-row items-center gap-3 px-4 py-3.5"
              style={i > 0 ? { borderTopWidth: 1, borderTopColor: border.subtle } : undefined}
            >
              <Text className="text-[16px]">{p.icon}</Text>
              <Text className="text-[14px] text-ceci-primary flex-1">{p.label}</Text>
              <Text className="text-[12px] font-semibold text-ceci-tertiary">{p.value}</Text>
            </View>
          ))}
        </Card>
      </Section>

      {/* dados */}
      <Section index={4} label="meus dados" accent="neutral">
        <Card padded={false}>
          {dataTools.map((d, i) => (
            <Tappable key={d.id} onPress={() => {}} accessibilityRole="button">
              <View
                className="flex-row items-center gap-3 px-4 py-3.5"
                style={i > 0 ? { borderTopWidth: 1, borderTopColor: border.subtle } : undefined}
              >
                <View className="flex-1">
                  <Text className="text-[14px] text-ceci-primary">{d.label}</Text>
                  <Text className="text-[11px] text-ceci-tertiary mt-0.5">{d.hint}</Text>
                </View>
                <Text style={{ fontSize: 14, color: ceci.faded }}>→</Text>
              </View>
            </Tappable>
          ))}
        </Card>
      </Section>

      {/* rodape: o cecinho */}
      <Section index={5}>
        <DashedDivider label="fim" />
        <View className="items-center py-7 mt-1">
          <Mascote expression="done-calm" size="lg" />
          <Text className="text-[11px] text-ceci-tertiary text-center mt-3 px-6">
            tudo aqui nasce do que você anota, com carinho ♡
          </Text>
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = {
  hero: {
    backgroundColor: surface.glassStrong,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    padding: 20,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 23,
    backgroundColor: surface.rose,
    borderWidth: 2,
    borderColor: border.brand,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: surface.muted,
    borderWidth: 1,
    borderColor: border.subtle,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  levelChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: surface.rose,
    borderWidth: 1,
    borderColor: border.brand,
  },
};

export default PerfilScreen;