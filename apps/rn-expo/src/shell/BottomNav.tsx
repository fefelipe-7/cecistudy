/**
 * BottomNav — a tab bar de vidro.
 *
 * O web ja faz uma coisa boa aqui: a pílula ativa e um `layoutId` do
 * framer-motion que **desliza** entre as abas, e o rótulo da aba ativa se abre
 * por animacao de largura. E o detalhe que faz a barra parecer nativa e nao
 * "botoes em linha".
 *
 * No RN `layoutId` nao existe. A solucao e **medir**: cada aba reporta sua
 * posicao no `onLayout`, e uma unica pilula interpola para o alvo com mola.
 * Isso reproduz o efeito — e de graca ganha haptico no toque, que o web nao
 * tem.
 *
 * Medicao por `onLayout` (x relativo ao pai) e nao por `measureInWindow`: o
 * primeiro e estavel sob scroll e nao depende de a view estar montada ha um
 * quadro.
 *
 * O quinto destino (perfil) nao esta na barra: no web ele vive no avatar do
 * header. Aqui o mesmo contrato — 4 abas na barra, perfil pelo avatar.
 */
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tappable } from '../components/Tappable';
import { press } from '../lib/haptics';
import { EASE, useReducedMotion } from '../lib/motion';
import { ceci, radius, shadow, surface } from '../tokens';

export type TabKey = 'home' | 'faculdade' | 'estudos' | 'biblioteca';

export const TAB_ITEMS: { key: TabKey; label: string }[] = [
  { key: 'home', label: 'home' },
  { key: 'faculdade', label: 'faculdade' },
  { key: 'estudos', label: 'estudos' },
  { key: 'biblioteca', label: 'biblioteca' },
];

const BAR_H = 56;
const INSET = 6;

/* ── icones: desenhados a mao para o traco casar com o peso da pilula ────── */

function TabIcon({ tabKey, active }: { tabKey: TabKey; active: boolean }) {
  const stroke = active ? ceci['brand-strong'] : ceci.tertiary;
  const sw = active ? 2.4 : 1.9;
  const p = { stroke, strokeWidth: sw, fill: 'none' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

  return (
    <Svg width={21} height={21} viewBox="0 0 24 24">
      {tabKey === 'home' ? <Path d="M3.2 10.4 12 3.6l8.8 6.8V19a1.2 1.2 0 0 1-1.2 1.2h-4.4v-5.6H8.8v5.6H4.4A1.2 1.2 0 0 1 3.2 19z" {...p} /> : null}
      {tabKey === 'faculdade' ? (
        <>
          <Path d="M2.5 8.6 12 4.1l9.5 4.5L12 13.1z" {...p} />
          <Path d="M6.2 10.9v5.2c0 1.6 2.6 2.9 5.8 2.9s5.8-1.3 5.8-2.9v-5.2" {...p} />
        </>
      ) : null}
      {tabKey === 'estudos' ? (
        <>
          <Path d="M12 5.4a3.1 3.1 0 0 0-3.1-3.1 3.1 3.1 0 0 0-3 3.1 3 3 0 0 0-1.1 5.2V18a1.2 1.2 0 0 0 1.2 1.2h10a1.2 1.2 0 0 0 1.2-1.2v-7.4a3 3 0 0 0-1.1-5.2 3.1 3.1 0 0 0-3-3.1 3.1 3.1 0 0 0-3 3.1z" {...p} />
          <Path d="M12 5.4v13.8" {...p} />
        </>
      ) : null}
      {tabKey === 'biblioteca' ? (
        <>
          <Path d="M4.2 4.6h3.6v14.8H4.2zM10 4.6h3.6v14.8H10z" {...p} />
          <Path d="m16.3 5.4 3.4.9-2.9 12.9-3.4-.9z" {...p} />
        </>
      ) : null}
    </Svg>
  );
}

/* ── barra ───────────────────────────────────────────────────────────────── */

interface Slot {
  x: number;
  width: number;
}

const EMPTY_SLOT: Slot = { x: 0, width: 0 };

interface BottomNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const [slots, setSlots] = useState<Record<TabKey, Slot>>({
    home: EMPTY_SLOT,
    faculdade: EMPTY_SLOT,
    estudos: EMPTY_SLOT,
    biblioteca: EMPTY_SLOT,
  });

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  const target = slots[active];

  // O efeito (e nao o render) e quem mexe em shared value: escrever durante o
  // render quebra o worklet de atualizacao do Reanimated.
  useEffect(() => {
    if (target.width === 0) return;
    if (reduced) {
      pillX.value = target.x;
      pillW.value = target.width;
      return;
    }
    pillX.value = withSpring(target.x, EASE.spring);
    pillW.value = withSpring(target.width, EASE.spring);
  }, [target.x, target.width, reduced, pillX, pillW]);

  const onSlotLayout = useCallback((key: TabKey, x: number, width: number) => {
    setSlots((prev) => {
      const cur = prev[key];
      if (cur.x === x && cur.width === width) return prev;
      return { ...prev, [key]: { x, width } };
    });
  }, []);

  const pillStyle = useAnimatedStyle(() => ({
    width: pillW.value,
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View className="absolute left-0 right-0 bottom-0 items-center" pointerEvents="box-none">
      <View style={{ paddingBottom: Math.max(insets.bottom, 10) + 8 }} pointerEvents="box-none">
        <View style={[styles.bar, shadow.floating]}>
          <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />

          {/* a pilula: um elemento so, que desliza entre as abas */}
          <Animated.View pointerEvents="none" style={[styles.pill, shadow.xs, pillStyle]} />

          <View className="flex-1 flex-row items-center" style={{ paddingHorizontal: INSET }}>
            {TAB_ITEMS.map((item) => {
              const isActive = active === item.key;
              return (
                <View
                  key={item.key}
                  className="flex-1"
                  collapsable={false}
                  onLayout={(e) => onSlotLayout(item.key, e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
                >
                  <Tappable
                    onPress={() => {
                      if (!isActive) press();
                      onChange(item.key);
                    }}
                    scaleTo={0.92}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={item.label}
                  >
                    <View className="h-11 flex-row items-center justify-center gap-1.5 px-1">
                      <TabIcon tabKey={item.key} active={isActive} />
                      {isActive ? (
                        <Text numberOfLines={1} className="text-[12px] font-bold text-ceci-brand-strong" style={{ maxWidth: 76 }}>
                          {item.label}
                        </Text>
                      ) : null}
                    </View>
                  </Tappable>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: BAR_H,
    marginHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
    // Chão sólido ABAIXO do blur. O BlurView é temperamental no Android
    // (o método experimental nem sempre está ligado): sem esse chão, quando o
    // blur não renderiza a barra fica transparente e o texto flutua sobre o
    // conteúdo rolando. Com ele, o pior caso é perder o efeito de vidro —
    // nunca perder a leitura.
    backgroundColor: 'rgba(255,252,246,0.94)',
  },
  pill: {
    position: 'absolute',
    top: INSET,
    bottom: INSET,
    left: 0,
    borderRadius: radius.pill,
    backgroundColor: surface.glassStrong,
    borderWidth: 1,
    borderColor: 'rgba(255,208,219,0.9)',
  },
});

export default BottomNav;