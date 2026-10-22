/**
 * AppShell — as cinco telas, uma por vez.
 *
 * O web mantem as cinco montadas e troca o conteudo (`SharedScreenLayers`
 * faz o switch de `NavScreen`). Aqui as telas **nao ficam montadas**: cada
 * `ScrollView` RN carregaria imagem de mascotote, gradiente e lista junto, e
 * a memoria de um aparelho nao perdoa isso. Uma tela por vez e a escolha certa
 * para o toque.
 *
 * Consequencia: trocar de aba nao tem animacao de "pilha" (o web desliza). No
 * RN a transicao de aba e um cross-fade curto, que e o que o iOS faz com
 * `UITabBarController` de qualquer jeito.
 *
 * O perfil nao e uma quinta aba — e o alvo do avatar no header, como no web.
 * Aqui ele e uma "quinta tela" presentations sobre a barra, porque um destino
 * que some e volta a cada 2 toques parece quebrado.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aurora } from '../components/Aurora';
import { useReducedMotion } from '../lib/motion';
import { canvas, ceci } from '../tokens';
import { BottomNav, type TabKey } from './BottomNav';
import { HeaderNav } from './HeaderNav';
import { BibliotecaScreen } from '../screens/BibliotecaScreen';
import { EstudosScreen } from '../screens/EstudosScreen';
import { FaculdadeScreen } from '../screens/FaculdadeScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PerfilScreen } from '../screens/PerfilScreen';

const DATE_LABEL = 'quinta-feira, 17 de outubro';

export function AppShell() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<TabKey>('home');
  const [perfilOpen, setPerfilOpen] = useState(false);

  // enquanto o perfil estiver aberto, a barra some: ele e uma tela cheia
  const openProfile = useCallback(() => setPerfilOpen(true), []);
  const closeProfile = useCallback(() => setPerfilOpen(false), []);

  const fade = reduced ? { duration: 1 } : { duration: 180 };

  return (
    <Aurora tone="rose">
      <View className="flex-1" style={{ backgroundColor: canvas }}>
        {perfilOpen ? (
          <Animated.View className="flex-1" entering={FadeIn.duration(fade.duration)} exiting={FadeOut.duration(fade.duration)}>
            <PerfilScreen onClose={closeProfile} topInset={insets.top} bottomInset={insets.bottom} />
          </Animated.View>
        ) : (
          <>
            <HeaderNav
              tab={tab}
              semester={5}
              dateLabel={DATE_LABEL}
              onOpenProfile={openProfile}
              onOpenSearch={() => {}}
            />

            {/* fade no rodape: o conteudo "some" embaixo da barra em vez de
                ser cortado por ela */}
            <Animated.View key={tab} className="flex-1" entering={FadeIn.duration(fade.duration)}>
              <ScreenFor tab={tab} topInset={insets.top} bottomInset={insets.bottom} />
            </Animated.View>

            <BottomNav active={tab} onChange={setTab} />
          </>
        )}
      </View>
    </Aurora>
  );
}

/**
 * Espaço útil de cada tela.
 *
 * O `topInset` soma a altura do header (topo seguro + 62px de conteúdo) e o
 * `bottomInset` soma a barra. O padding horizontal de 20px existe porque a
 * ScrollView NÃO herda margem do shell — sem ele o conteúdo encosta na borda
 * do aparelho, e foi a segunda metade do desastre visual desta revisão.
 */
function ScreenFor({ tab, topInset, bottomInset }: { tab: TabKey; topInset: number; bottomInset: number }) {
  const pad = {
    paddingTop: topInset + 74,
    paddingBottom: bottomInset + 108,
    paddingHorizontal: 20,
  };

  switch (tab) {
    case 'home':
      return (
        <ScreenScroll pad={pad}>
          <HomeScreen />
        </ScreenScroll>
      );
    case 'faculdade':
      return (
        <ScreenScroll pad={pad}>
          <FaculdadeScreen />
        </ScreenScroll>
      );
    case 'estudos':
      return (
        <ScreenScroll pad={pad}>
          <EstudosScreen />
        </ScreenScroll>
      );
    case 'biblioteca':
      return (
        <ScreenScroll pad={pad}>
          <BibliotecaScreen />
        </ScreenScroll>
      );
  }
}

function ScreenScroll({ children, pad }: { children: React.ReactNode; pad: ViewStyle }) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={pad}
      showsVerticalScrollIndicator={false}
      // o conteudo rola sob o vidro; a rolagem comeca no primeiro toque util
      scrollEventThrottle={16}
    >
      {children}
    </ScrollView>
  );
}

type ViewStyle = { paddingTop: number; paddingBottom: number; paddingHorizontal: number };

const styles = StyleSheet.create({
  scroll: { flex: 1 },
});

export default AppShell;