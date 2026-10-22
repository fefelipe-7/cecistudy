/**
 * HeaderNav — o cabecalho fixo.
 *
 * No web ele encolhe ao rolar (`scrolled = window.scrollY > 20`) e tem dois
 * modos (marca / detalhe). Aqui fica so o modo de marca, porque o mock so tem
 * as cinco telas de raiz.
 *
 * Melhoria: o web deixa o cabecalho *solto* e a barra *solta*. No celular as
 * duas grudam no topo e viram uma coluna de vidro unica — e por isso o
 * conteudo rola **por baixo** delas (fading), nao entre elas.
 */
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tappable } from '../components/Tappable';
import { AvatarTile } from '../components/Feedback';
import { border, ceci, radius, shadow, surface } from '../tokens';
import { TAB_ITEMS, type TabKey } from './BottomNav';

/** Lupa desenhada a mao (o `lucide-react-native` fica para as telas). */
function SearchIcon() {
  return (
    <View style={styles.searchIcon}>
      <View style={styles.lens} />
      <View style={styles.handle} />
    </View>
  );
}

interface HeaderNavProps {
  tab: TabKey;
  semester: number;
  dateLabel: string;
  /** `true` quando ha algo a dizer (usada em "biblioteca", que tem eyebrow). */
  showSearch?: boolean;
  onOpenProfile: () => void;
  onOpenSearch?: () => void;
}

export function HeaderNav({ tab, semester, dateLabel, showSearch = true, onOpenProfile, onOpenSearch }: HeaderNavProps) {
  const insets = useSafeAreaInsets();
  const label = TAB_ITEMS.find((t) => t.key === tab)?.label ?? tab;

  return (
    <View className="absolute left-0 right-0 top-0" pointerEvents="box-none">
      <View style={[styles.glass, shadow.sm, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />

        <View className="flex-row items-center gap-3 px-4 pb-2.5">
          <AvatarTile name="marina" size={40} onPress={onOpenProfile} />

          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[10px] font-semibold text-ceci-tertiary uppercase tracking-[1.4px]">{label}</Text>
              <View style={styles.semBadge}>
                <Text className="text-[10px] font-bold text-ceci-brand-strong">{semester}º sem</Text>
              </View>
            </View>
            <Text className="text-[12px] text-ceci-muted mt-0.5">{dateLabel}</Text>
          </View>

          {showSearch ? (
            <Tappable onPress={() => onOpenSearch?.()} scaleTo={0.9} accessibilityRole="button" accessibilityLabel="buscar">
              <View style={styles.iconBtn}>
                <SearchIcon />
              </View>
            </Tappable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: 'rgba(255,250,243,0.9)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: border.subtle,
  },
  semBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: surface.rose,
    borderWidth: 1,
    borderColor: border.brand,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.glassStrong,
    borderWidth: 1,
    borderColor: border.subtle,
  },
  searchIcon: { width: 17, height: 17, alignItems: 'center', justifyContent: 'center' },
  lens: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.9,
    borderColor: ceci.secondary,
    marginTop: -2.5,
    marginLeft: -2.5,
  },
  handle: {
    position: 'absolute',
    width: 7,
    height: 1.9,
    borderRadius: 1,
    backgroundColor: ceci.secondary,
    transform: [{ rotate: '45deg' }],
    right: 0,
    bottom: 2,
  },
});

export default HeaderNav;