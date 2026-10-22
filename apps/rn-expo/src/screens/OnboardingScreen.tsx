/**
 * OnboardingScreen — os seis passos, em RN.
 *
 * O web usa `step` de `useState` e `motion.div` para a entrada. Aqui os dois
 * viram o que o celular pede de verdade: entrada com **direcao** (avancar vai
 * para a esquerda, voltar vai para a direita) e um progresso que anda com
 * mola, nao com `transition-[width]`.
 *
 * O que subiu de nivel, e por que:
 *
 * 1. **Fundo por passo.** Passos "de mim" (nome, foto) usam aurora rosa;
 *    passos "de saber" (jornada, contexto) usam azul. O usuario sente a
 *    virada de assunto antes de ler o texto.
 * 2. **Cartao de conteudo.** No web cada passo flutua direto no canvas. Aqui o
 *    passo mora num cartao de vidro, com o icone-tile encostando na borda
 *    superior. Isso da ao texto um chao e cria um unico ponto de atencao.
 * 3. **Progresso com mola.** No web a barra cresce em 300ms linear. Com mola,
 *    o "quanto falta" fica legivel — e da a sensacao de estar avancando.
 * 4. **Campo de texto com foco real.** `focus` no web muda a borda para a
 *    marca. No RN muda a borda, a sombra e a cor do placeholder, e levanta o
 *    teclado com `KeyboardAvoidingView`.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aurora } from '../components/Aurora';
import { Button } from '../components/Button';
import { Tappable } from '../components/Tappable';
import { Tag } from '../components/PillGroup';
import { EASE, useReducedMotion } from '../lib/motion';
import { success } from '../lib/haptics';
import { border, ceci, radius, shadow, surface } from '../tokens';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: String(n), label: `${n}º` }));

/**
 * `academic` e nao `blue`: o nome do token de tela e `Aurora`'s, e um passo de
 * "saber" (jornada, contexto, permissoes) usa a mesma familia do hero azul.
 */
type Tone = 'rose' | 'academic';

interface StepDef {
  tone: Tone;
  /** emoji do tile — o web usa icone lucide; emoji aguenta o peso do RN. */
  icon: string;
  eyebrow: string;
  title: string;
  hint?: string;
}

const PERMISSIONS = [
  { key: 'files', icon: '🗂️', label: 'arquivos', desc: 'para salvar suas notas e backup', on: false },
  { key: 'photos', icon: '🖼️', label: 'fotos e mídias', desc: 'para a foto do perfil e anexos', on: false },
  { key: 'calendar', icon: '📅', label: 'agenda', desc: 'para ler suas aulas e provas', on: true },
  { key: 'notifications', icon: '🔔', label: 'notificações', desc: 'para o lembrete diário de estudo', on: true },
] as const;

const STEPS: StepDef[] = [
  { tone: 'rose', icon: '🌷', eyebrow: 'cecistudy ♡', title: 'oi! eu sou o cecinho', hint: 'seu cantinho pra organizar a faculdade com carinho. bora?' },
  { tone: 'rose', icon: '💗', eyebrow: 'passo 1 de 5', title: 'como eu te chamo?', hint: 'é só um nome. muda quando quiser.' },
  { tone: 'academic', icon: '🎓', eyebrow: 'passo 2 de 5', title: 'em que ponto da jornada você está?', hint: 'me ajuda a calcular o que vem pela frente.' },
  { tone: 'academic', icon: '✨', eyebrow: 'passo 3 de 5', title: 'me conta onde você estuda', hint: 'tudo opcional — o cantinho funciona sem isso.' },
  { tone: 'rose', icon: '📸', eyebrow: 'passo 4 de 5', title: 'uma sua foto, se quiser', hint: 'fica no perfil. dá pra trocar ou remover depois.' },
  { tone: 'academic', icon: '🔓', eyebrow: 'passo 5 de 5', title: 'o que o cecinho pode acessar', hint: 'você decide cada uma. dá pra mudar no perfil.' },
];

export interface OnboardingScreenProps {
  onFinish: () => void;
}

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);

  // estado do formulario — local, nada de contexto
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('5');
  const [total, setTotal] = useState('10');
  const [university, setUniversity] = useState('');
  const [career, setCareer] = useState('');
  const [perms, setPerms] = useState<Record<string, boolean>>({
    files: false, photos: false, calendar: true, notifications: true,
  });

  // O efeito (e nao o render) e quem mexe em shared value: escrever durante o
  // render quebra a atualizacao do worklet do Reanimated.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSpring(step / (STEPS.length - 1), EASE.spring);
  }, [step, progress]);

  const progressStyle = useAnimatedStyle(() => ({ width: `${Math.max(0.05, progress.value) * 100}%` }));

  const go = useCallback(
    (next: number) => {
      setStep(next);
    },
    [],
  );

  const canContinue = step !== 1 || name.trim().length > 0;
  const def = STEPS[step];

  const finish = useCallback(() => {
    success();
    onFinish();
  }, [onFinish]);

  return (
    <Aurora tone={def.tone}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* topo: marca + progresso */}
        <View className="px-6 pt-10 pb-4" style={{ paddingTop: insets.top + 24 }}>
          <View className="flex-row items-center justify-center gap-2 mb-7">
            <View style={styles.brandMark}>
              <Text className="font-display font-bold text-ceci-brand-strong text-[17px]">C</Text>
            </View>
            <Text className="font-display font-bold text-[17px] text-ceci-primary">
              cecistudy <Text className="text-ceci-brand-strong">♡</Text>
            </Text>
          </View>

          {/* trilho: o web usa 5 pontos; aqui um trilho que anda com mola */}
          <View style={styles.track}>
            <Animated.View style={[styles.trackFill, progressStyle]} />
          </View>
        </View>

        {/* conteudo */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            key={step}
            entering={reduced ? FadeIn.duration(1) : FadeIn.duration(260)}
            exiting={reduced ? undefined : FadeOut.duration(120)}
          >
            <View style={styles.card}>
              <View style={[styles.tile, def.tone === 'rose' ? styles.tileRose : styles.tileBlue]}>
                <Text className="text-[22px]">{def.icon}</Text>
              </View>

              <Text className="text-[10px] font-bold text-ceci-tertiary uppercase tracking-[1.6px] mt-4">{def.eyebrow}</Text>
              <Text className="font-serif text-[26px] leading-[32px] text-ceci-primary mt-1">{def.title}</Text>
              {def.hint ? (
                <Text className="text-[13px] leading-[19px] text-ceci-secondary mt-2">{def.hint}</Text>
              ) : null}

              <View className="mt-5">
                {step === 1 ? (
                  <Field label="seu nome" placeholder="ex.: marina" value={name} onChangeText={setName} autoFocus />
                ) : null}
                {step === 2 ? <SemesterStep semester={semester} total={total} onSemester={setSemester} onTotal={setTotal} /> : null}
                {step === 3 ? (
                  <View className="gap-3">
                    <Field label="universidade" placeholder="opcional" value={university} onChangeText={setUniversity} />
                    <Field label="objetivo profissional" placeholder="opcional" value={career} onChangeText={setCareer} />
                  </View>
                ) : null}
                {step === 4 ? <PhotoStep name={name} /> : null}
                {step === 5 ? <PermissionStep perms={perms} onToggle={(k) => setPerms((p) => ({ ...p, [k]: !p[k] }))} /> : null}
              </View>
            </View>
          </Animated.View>

          <Text className="text-center text-[11px] text-ceci-tertiary mt-6">
            tudo fica guardado aqui no seu aparelho, com carinho ♡
          </Text>
        </ScrollView>

        {/* pe fixo: as duas acoes, sempre no mesmo lugar */}
        <View className="flex-row gap-2 px-5 pb-3" style={{ paddingBottom: insets.bottom + 12 }}>
          {step > 0 ? (
            <Button label="voltar" variant="secondary" size="lg" onPress={() => go(step - 1)} className="shrink-0" leadingIcon={<Text style={{ fontSize: 14 }}>←</Text>} />
          ) : null}
          <Button
            label={step === STEPS.length - 1 ? 'montar meu cantinho' : 'continuar'}
            variant={step === STEPS.length - 1 ? 'primary' : 'brand'}
            size="lg"
            full
            disabled={!canContinue}
            onPress={() => (step === STEPS.length - 1 ? finish() : go(step + 1))}
            icon={<Text style={{ fontSize: 14 }}>{step === STEPS.length - 1 ? '♡' : '→'}</Text>}
          />
        </View>
      </KeyboardAvoidingView>
    </Aurora>
  );
}

/* ── passos ──────────────────────────────────────────────────────────────── */

function Field({ label, ...input }: { label: string } & TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Text className="text-[11px] font-semibold text-ceci-tertiary mb-2 uppercase tracking-[1.2px]">{label}</Text>
      <TextInput
        {...input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={ceci.faded}
        className="text-[15px] text-ceci-primary"
        style={[
          styles.input,
          focused ? { borderColor: ceci.brand, borderWidth: 1.5 } : null,
          focused ? shadow.sm : null,
        ]}
      />
    </View>
  );
}

function SemesterStep({
  semester,
  total,
  onSemester,
  onTotal,
}: {
  semester: string;
  total: string;
  onSemester: (v: string) => void;
  onTotal: (v: string) => void;
}) {
  return (
    <View className="gap-5">
      <View>
        <Text className="text-[11px] font-semibold text-ceci-tertiary mb-2 uppercase tracking-[1.2px]">semestre atual</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {SEMESTERS.map((s) => (
            <SemesterPill key={s.value} label={s.label} active={s.value === semester} onPress={() => onSemester(s.value)} />
          ))}
        </ScrollView>
      </View>
      <View>
        <Text className="text-[11px] font-semibold text-ceci-tertiary mb-2 uppercase tracking-[1.2px]">total do curso</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {SEMESTERS.map((s) => (
            <SemesterPill key={s.value} label={s.label} active={s.value === total} onPress={() => onTotal(s.value)} tone="blue" />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function SemesterPill({ label, active, onPress, tone = 'rose' }: { label: string; active: boolean; onPress: () => void; tone?: 'rose' | 'blue' }) {
  return (
    <Tappable onPress={onPress} scaleTo={0.9} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <View
        className="min-w-[46px] items-center py-2.5 px-3 rounded-pill"
        style={[
          { borderWidth: 1 },
          active
            ? tone === 'rose'
              ? { backgroundColor: ceci.primary, borderColor: ceci.primary }
              : { backgroundColor: ceci.academic, borderColor: ceci.academic }
            : { backgroundColor: surface.DEFAULT, borderColor: border.DEFAULT },
          active ? shadow.xs : null,
        ]}
      >
        <Text className="text-[13px] font-bold" style={{ color: active ? ceci['on-primary'] : ceci.secondary }}>
          {label}
        </Text>
      </View>
    </Tappable>
  );
}

/**
 * Foto — mock sem camera. O padrao visual importa: o tile grande com a inicial
 * e a borda dupla; os botoes ficam embaixo, centralizados.
 */
function PhotoStep({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || 'C';
  return (
    <View className="items-center gap-4 py-2">
      <View style={styles.photoFrame}>
        <Text className="font-display font-bold text-[44px] text-ceci-primary">{initial}</Text>
      </View>
      <View className="flex-row gap-2">
        <Button label="escolher foto" variant="primary" size="sm" leadingIcon={<Text style={{ fontSize: 13 }}>📷</Text>} onPress={() => {}} />
        <Button label="depois" variant="secondary" size="sm" onPress={() => {}} />
      </View>
    </View>
  );
}

/** Permissoes — o unico passo com lista. O web usa `ToggleRow` + switch de vidro. */
function PermissionStep({
  perms,
  onToggle,
}: {
  perms: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <View className="gap-2.5">
      {PERMISSIONS.map((p) => {
        const on = perms[p.key];
        return (
          <Tappable
            key={p.key}
            onPress={() => onToggle(p.key)}
            scaleTo={0.985}
            accessibilityRole="switch"
            accessibilityState={{ checked: on }}
            accessibilityLabel={p.label}
          >
            <View
              className="flex-row items-center gap-3 p-3.5 rounded-2xl"
              style={[
                { borderWidth: 1, backgroundColor: on ? surface.rose : surface.DEFAULT },
                on ? { borderColor: border.brand } : { borderColor: border.DEFAULT },
                on ? shadow.xs : null,
              ]}
            >
              <View style={[styles.permIcon, on ? { backgroundColor: surface.rose, borderColor: border.brand } : null]}>
                <Text className="text-[15px]">{p.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-ceci-primary">{p.label}</Text>
                <Text className="text-[12px] text-ceci-tertiary mt-0.5">{p.desc}</Text>
              </View>
              <View style={[styles.switchTrack, on ? styles.switchOn : null]}>
                <Animated.View
                  style={[
                    styles.switchKnob,
                    { transform: [{ translateX: withSpring(on ? 20 : 2, EASE.spring) }] },
                  ]}
                />
              </View>
            </View>
          </Tappable>
        );
      })}
      <View className="flex-row items-center gap-1.5 mt-1 px-1">
        <Tag label="tudo opcional" tone="neutral" />
        <Text className="text-[11px] text-ceci-faded flex-1">nada sai do seu aparelho sem você pedir</Text>
      </View>
    </View>
  );
}

/* ── estilos ─────────────────────────────────────────────────────────────── */

const styles = {
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: surface.rose,
    borderWidth: 1,
    borderColor: border.brand,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  track: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: surface.muted,
    overflow: 'hidden' as const,
  },
  trackFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: ceci.brand,
  },
  node: {
    position: 'absolute' as const,
    top: -2.5,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginLeft: -4.5,
    backgroundColor: surface.muted,
  },
  card: {
    // A folga no topo faz o icone-tile (top: -22) caber dentro da faixa de
    // scroll sem brigar com o progresso acima.
    marginTop: 26,
    backgroundColor: surface.glassStrong,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    padding: 22,
    ...shadow.md,
  },
  tile: {
    position: 'absolute' as const,
    top: -22,
    left: 22,
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    ...shadow.xs,
  },
  tileRose: { backgroundColor: surface.rose, borderColor: border.brand },
  tileBlue: { backgroundColor: surface.blue, borderColor: border.academic },
  input: {
    backgroundColor: surface.DEFAULT,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: border.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  photoFrame: {
    width: 112,
    height: 112,
    borderRadius: 32,
    backgroundColor: surface.rose,
    borderWidth: 2,
    borderColor: border.brand,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    ...shadow.sm,
  },
  permIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: surface.muted,
    borderWidth: 1,
    borderColor: border.DEFAULT,
  },
  switchTrack: {
    width: 46,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: border.DEFAULT,
    padding: 3,
    justifyContent: 'center' as const,
  },
  switchOn: { backgroundColor: ceci.brand },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ceci['on-primary'],
    ...shadow.xs,
  },
};

export default OnboardingScreen;