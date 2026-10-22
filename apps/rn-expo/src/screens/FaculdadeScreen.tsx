/**
 * FaculdadeScreen — o semestre, as materias, o campo, a agenda.
 *
 * A tela do web e a mais densa do app: hero + diario de estagio + week grid +
 * tres sub-tabs + lista lateral. Num celular de 390px, tudo isso nao cabe em
 * scrolagem util — o usuario passa o dia rolando e nao acha nada.
 *
 * Aqui a densidade foi reorganizada, nao reduzida:
 *
 * 1. **Sub-tabs viraram uma faixa de pílulas com rolagem** no topo, em vez de
 *    `UnderlineTabBar` + `SwipeableTabPanel`. No toque, o underline fica
 *    pequeno e swipe horizontal conflita com o gesto de "voltar".
 * 2. **O diario de estagio subiu para um cartao proprio**, com as horas em
 *    numero grande. No web ele compete com o hero pela atencao.
 * 3. **A grade da semana virou lista de dias**, com o dia de hoje em destaque.
 *    Grade de 7 colunas num celular = 48px por celula, insuficiente para texto.
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { StatusChip } from '../components/Feedback';
import { Card, HeroCard } from '../components/HeroCard';
import { Mascote } from '../components/Mascote';
import { PillGroup } from '../components/PillGroup';
import { Section } from '../components/Section';
import { Tappable } from '../components/Tappable';
import { Button } from '../components/Button';
import {
  courses,
  internshipPreviews,
  internshipSummary,
  profile,
  weekEvents,
} from '../mocks';
import { border, ceci, radius, shadow, status, surface } from '../tokens';

type Aba = 'disciplinas' | 'calendario' | 'estagio';

const ABAS: { value: Aba; label: string }[] = [
  { value: 'disciplinas', label: 'disciplinas' },
  { value: 'calendario', label: 'calendário' },
  { value: 'estagio', label: 'estágio' },
];

export function FaculdadeScreen() {
  const [aba, setAba] = useState<Aba>('disciplinas');

  return (
    <View className="gap-5">
      {/* 1. onde eu estou */}
      <Section index={0}>
        <HeroCard
          eyebrow="faculdade"
          title={`${profile.semester}º semestre`}
          summary={`${courses.length} disciplinas · 2 provas por vir · 5 tarefas pendentes. o termo fecha em 47 dias.`}
          expression="class-ready"
          accent="rose"
          action={{ label: 'agenda', onPress: () => setAba('calendario') }}
        />
      </Section>

      {/* 2. o campo */}
      <Section index={1}>
        <Tappable onPress={() => setAba('estagio')} accessibilityRole="button" accessibilityLabel="diário de estágio">
          <View style={[styles.stageCard, shadow.sm]}>
            <View style={styles.stageTile}>
              <Text className="text-[20px]">🫶</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-ceci-brand-strong uppercase tracking-[1.2px]">diário de estágio</Text>
              <View className="flex-row items-baseline gap-1.5 mt-1">
                <Text className="font-display font-bold text-[26px] leading-[30px] text-ceci-primary">{internshipSummary.hoursThisMonth}h</Text>
                <Text className="text-[13px] text-ceci-tertiary">em campo</Text>
              </View>
              <Text className="text-[12px] text-ceci-tertiary mt-0.5">
                {internshipSummary.records} registros · {internshipSummary.awaitingCare} pedindo carinho
              </Text>
            </View>
            <Mascote expression="field-prepare" width={52} />
          </View>
        </Tappable>
      </Section>

      {/* 3. a semana */}
      <Section index={2} label="esta semana" accent="academic">
        <Card padded={false} className="p-4">
          <View className="gap-3">
            {weekEvents.map((e) => (
              <View key={e.label} className="flex-row items-center gap-3">
                <View style={styles.dayBox}>
                  <Text className="text-[11px] font-bold text-ceci-academic-strong uppercase">{e.day}</Text>
                </View>
                <Text className="text-[13px] text-ceci-primary flex-1" numberOfLines={1}>
                  {e.label}
                </Text>
                <Text className="text-[10px] font-semibold text-ceci-faded uppercase tracking-[0.8px]">{e.kind}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Section>

      {/* 4. as abas */}
      <Section index={3}>
        <PillGroup<Aba> options={ABAS} value={aba} onChange={setAba} variant="rose" />
      </Section>

      {/* 5. o conteudo da aba */}
      <Section index={4}>
        {aba === 'disciplinas' ? <Disciplinas /> : null}
        {aba === 'calendario' ? <Calendario /> : null}
        {aba === 'estagio' ? <Estagio /> : null}
      </Section>
    </View>
  );
}

/* ── abas ────────────────────────────────────────────────────────────────── */

function Disciplinas() {
  return (
    <View className="gap-2.5">
      {courses.map((c) => (
        <Tappable key={c.id} onPress={() => {}} accessibilityRole="button" accessibilityLabel={c.name}>
          <View
            className="flex-row overflow-hidden"
            style={[{ backgroundColor: surface.DEFAULT, borderRadius: radius.lg, borderWidth: 1, borderColor: border.subtle }, shadow.xs]}
          >
            {/* a cor da materia e uma faixa de 4px — como no web */}
            <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: c.color }} />
            <View className="flex-1 p-3.5">
              <View className="flex-row items-center gap-3">
                <View style={[styles.courseIcon, { backgroundColor: c.color + '1A' }]}>
                  <Text className="text-[17px]">{c.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-semibold text-ceci-primary" numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text className="text-[11px] text-ceci-tertiary mt-0.5">
                    {c.code} · {c.professor}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-[10px] font-semibold text-ceci-muted">{c.freq}%</Text>
                  {c.freqWarning ? <StatusChip label="pouca" tone="warning" /> : null}
                </View>
              </View>

              <View className="flex-row items-center justify-between mt-3">
                <StatusChip label={c.kind} tone={c.kind === 'optativa' ? 'muted' : 'info'} />
                <Text className="text-[11px] font-semibold text-ceci-tertiary">{c.nextExam}</Text>
              </View>
            </View>
          </View>
        </Tappable>
      ))}

      <Tappable onPress={() => {}} accessibilityRole="button">
        <View style={styles.dashedAdd}>
          <Text className="text-[13px] font-semibold text-ceci-brand-strong">+ nova matéria</Text>
        </View>
      </Tappable>
    </View>
  );
}

function Calendario() {
  return (
    <View className="gap-3">
      <Card padded={false} className="p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-display font-bold text-[15px] text-ceci-primary">outubro</Text>
          <Text className="text-[11px] text-ceci-tertiary">47 dias até o termo</Text>
        </View>
        <View style={styles.monthGrid}>
          {['s', 't', 'q', 'q', 's', 's', 'd'].map((d, i) => (
            // Os dia-da-semana PRECISAM ter a mesma largura de célula da grade
            // (14.285%): Text sem largura encolhe para o glifo e quebra o
            // alinhamento das 7 colunas — o calendário ficava torto em T.
            <Text key={i} className="text-center" style={[styles.weekHead]}>
              {d}
            </Text>
          ))}
          {Array.from({ length: 35 }, (_, i) => {
            const day = i + 1;
            const has = [7, 11, 14, 17, 24, 28].includes(day);
            const today = day === 17;
            return (
              <View
                key={i}
                style={[
                  styles.dayCell,
                  today ? styles.dayToday : has ? styles.dayMarked : null,
                ]}
              >
                <Text
                  className="text-[12px]"
                  style={{ color: today ? ceci['on-brand'] : has ? ceci['brand-strong'] : ceci.muted, fontWeight: has || today ? '700' : '500' }}
                >
                  {day <= 31 ? day : ''}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      <View className="gap-2">
        <AgendaRow day="17" title="revisão de neuropsicologia" kind="prova" tone="blue" />
        <AgendaRow day="19" title="entrega do TER" kind="tarefa" tone="brand" />
        <AgendaRow day="21" title="reunião de orientação" kind="tcc" tone="green" />
      </View>
    </View>
  );
}

function AgendaRow({ day, title, kind, tone }: { day: string; title: string; kind: string; tone: 'blue' | 'brand' | 'green' }) {
  const colors = { blue: surface.blue, brand: surface.rose, green: status['success-surface'] }[tone];
  const bds = { blue: border.academic, brand: border.brand, green: status['success-border'] }[tone];
  return (
    <Tappable onPress={() => {}} accessibilityRole="button">
      <View
        className="flex-row items-center gap-3 p-3"
        style={[{ backgroundColor: colors, borderRadius: radius.lg, borderWidth: 1, borderColor: bds }]}
      >
        <Text className="text-[13px] font-bold text-ceci-primary w-6 text-center">{day}</Text>
        <Text className="text-[13px] text-ceci-primary flex-1" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-[10px] font-bold uppercase tracking-[0.8px] text-ceci-tertiary">{kind}</Text>
      </View>
    </Tappable>
  );
}

function Estagio() {
  return (
    <View className="gap-3">
      {internshipPreviews.map((r) => (
        <Tappable key={r.id} onPress={() => {}} accessibilityRole="button">
          <Card padded={false} className="p-3.5">
            <View className="flex-row items-center gap-3">
              {/* tile de iniciais a esquerda (SPEC-010 D5) */}
              <View style={[styles.initialsTile, r.mood === 'pending' ? { backgroundColor: surface.rose, borderColor: border.brand } : null]}>
                <Text className="text-[13px] font-bold text-ceci-primary">{r.patient.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-ceci-primary" numberOfLines={1}>
                  {r.note}
                </Text>
                <Text className="text-[11px] text-ceci-tertiary mt-0.5">
                  {r.date} · {r.hours}h
                </Text>
              </View>
              {r.mood === 'pending' ? <StatusChip label="carinho" tone="warning" /> : null}
            </View>
          </Card>
        </Tappable>
      ))}

      <Button label="anotar um estágio" variant="secondary" size="md" full onPress={() => {}} leadingIcon={<Text style={{ fontSize: 14 }}>🫶</Text>} />
    </View>
  );
}

const styles = {
  stageCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    padding: 16,
    backgroundColor: surface.rose,
    borderRadius: radius.hero,
    borderWidth: 1,
    borderColor: border.brand,
    overflow: 'hidden' as const,
  },
  stageTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: ceci['on-primary'],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: border.brand,
  },
  dayBox: {
    width: 34,
    height: 26,
    borderRadius: 8,
    backgroundColor: surface.blue,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: border.academic,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
  monthGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, rowGap: 6 },
  weekHead: {
    width: '14.285%',
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    color: ceci.faded,
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    maxWidth: 44,
    maxHeight: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 999,
  },
  dayToday: { backgroundColor: ceci.brand },
  dayMarked: { backgroundColor: surface.rose, borderWidth: 1, borderColor: border.brand },
  initialsTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: surface.muted,
    borderWidth: 1,
    borderColor: border.DEFAULT,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

export default FaculdadeScreen;