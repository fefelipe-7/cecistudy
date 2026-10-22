/**
 * App — a raiz do laboratorio.
 *
 * Tres responsabilidades:
 *   1. fontes (Expo carrega antes de pintar; sem isso o texto "pula" na
 *      primeira render e a serifa some)
 *   2. o gate do onboarding (igual ao web: `if (!onboarding.completed) return
 *      <OnboardingScreen/>` — sem chrome, sem barra, sem header)
 *   3. o shell das cinco telas
 *
 * Nota de estado: aqui o onboarding e um `useState` em memoria. Nao ha
 * persistencia porque nesta fase nao ha regra (SPEC-015 D9) — o que se avalia
 * e a **aparencia**; persistencia vem na fase seguinte.
 */
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from './shell/AppShell';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { canvas } from './tokens';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // ja escondido (web): seguir em frente
});

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(false);

  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  const onFinish = useCallback(() => setOnboardingDone(true), []);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: canvas }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {onboardingDone ? <AppShell /> : <OnboardingScreen onFinish={onFinish} />}
    </SafeAreaProvider>
  );
}