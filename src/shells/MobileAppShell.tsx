import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { setupNativeShell } from '../lib/native';
import { overlayVariants, PUSH_DURATION, PUSH_EXIT_DURATION } from '../lib/motion';
import { isDesktop } from '../lib/platform';
import { nativeNavigation } from '../navigation/native-navigation';

import { HeaderNav } from '../components/HeaderNav';
import { BottomNav } from '../components/BottomNav';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { EdgeSwipeBack } from '../components/ui/EdgeSwipeBack';
import { OnboardingScreen } from '../components/views/OnboardingScreen';
import { GlobalOverlays } from './GlobalOverlays';
import { SlideScreen } from './SlideScreen';
import { SlideContent, OverlayContent } from './ScreenLayers';

const HeaderNavMemo = memo(HeaderNav);
const BottomNavMemo = memo(BottomNav);
const DesktopSidebarMemo = memo(DesktopSidebar);

/**
 * Casca mobile/web: header dinâmico + barra inferior + pilha com slide
 * horizontal e overlays em tela cheia. Efeitos nativos (Capacitor) vivem aqui.
 */
export const MobileAppShell: React.FC = () => {
  const app = useApp();

  useEffect(() => {
    setupNativeShell();
  }, []);

  // Inicializa plugin de swipe-back nativo (iOS)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    // Habilita o plugin
    nativeNavigation.enable();
    // Escuta evento de conclusão do gesto para navegar logicamente
    const handleSwipeBackCompleted = () => {
      app.handleSystemBack();
    };
    window.addEventListener('swipeBackCompleted', handleSwipeBackCompleted);
    return () => {
      window.removeEventListener('swipeBackCompleted', handleSwipeBackCompleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mantém o estado de canGoBack sincronizado com o nativo
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    nativeNavigation.setCanGoBack(app.canGoBack);
  }, [app.canGoBack]);

  // Gesto de "voltar pela borda" (iOS): transform da camada de slide acompanha o dedo
  const swipeX = useMotionValue(0);

  // Android back button: fecha modais → pop de telas → sai do app na raiz
  const appRef = useRef(app);
  appRef.current = app;
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handler = CapacitorApp.addListener('backButton', () => {
      const a = appRef.current;
      const handled = a.handleSystemBack();
      if (!handled) {
        void CapacitorApp.exitApp();
      }
    });
    return () => {
      void handler.then((h) => h.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    profile,
    headerConfig,
    activeTab,
    handleNavigate,
    openCompose,
  } = app;

  const onNavigateToPerfil = useCallback(() => handleNavigate('perfil'), [handleNavigate]);

  const isAuxFlow =
    app.isComposeScreenOpen ||
    app.isComposeDetailsOpen ||
    app.isWizardOpen ||
    app.isNoteDetailOpen ||
    app.isNoteTransformOpen;

  // Primeiro acesso → onboarding em tela cheia (sem header/nav)
  if (!app.onboarding.completed) {
    return <OnboardingScreen />;
  }

  return (
    <div className="min-h-screen text-ceci-primary flex flex-col font-sans antialiased selection:bg-rose-100 selection:text-ceci-brand-strong lg:pl-60">

      {/* Gesto de "voltar pela borda" (iOS): desliza a camada de slide e volta um nível.
          No desktop o gesto não existe — a shell própria cuida da navegação. */}
      {!Capacitor.isNativePlatform() && !isDesktop && (
        <EdgeSwipeBack swipeX={swipeX} onBack={app.handleSystemBack} canGoBack={app.canGoBack} />
      )}

      {/* Sidebar desktop-web (≥ lg) — espelha a visibilidade da barra inferior */}
      {app.isBottomNavVisible && (
        <DesktopSidebarMemo
          activeTab={activeTab}
          onChangeTab={handleNavigate}
          onOpenWizard={app.openWizard}
          onOpenTaskExamWizard={app.openTaskExamWizard}
          onOpenCompose={openCompose}
        />
      )}

      {/* Top Header — entra/sai com fade nos fluxos auxiliares (compose/wizards)
          em vez de desmontar seco; o sticky é preservado pois o motion está no
          próprio elemento header. */}
      <AnimatePresence initial={false}>
        {!isAuxFlow && (
          <HeaderNavMemo
            key="header"
            profile={profile}
            headerConfig={headerConfig}
            direction={app.navDirection}
            onOpenSearch={app.openSearch}
            onNavigateToPerfil={onNavigateToPerfil}
          />
        )}
      </AnimatePresence>

      {/* Main Screen Content (Mobile First App Frame Container) */}
      <main
        className={`flex-1 max-w-md sm:max-w-xl lg:max-w-3xl xl:max-w-4xl w-full mx-auto px-3.5 py-4 sm:px-5 lg:px-8 relative transition-[padding] duration-[220ms] ease-out ${
          app.hasTabBase
            ? 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-10'
            : 'pb-6'
        }`}
      >
        {/* === Camada 1: slide horizontal (base + auxiliares de 1º nível) ===
            A tela que sai congela onde está (SlideScreen vira fixed) e esvanece
            por baixo — o reset de scroll do handler não a arrasta mais. */}
        <motion.div style={{ x: swipeX }}>
          <AnimatePresence initial={false} custom={app.navDirection}>
            <SlideScreen key={app.slideKey} direction={app.navDirection}>
              <SlideContent shell="mobile" />
            </SlideScreen>
          </AnimatePresence>
        </motion.div>

        {/* === Camada 2: overlay (fade+scale) — compose/wizard não disputam o slide === */}
        <AnimatePresence initial={false}>
          {app.overlayKey && (
            <motion.div
              key={app.overlayKey}
              variants={overlayVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-0 z-40 overflow-y-auto px-3.5 py-4 sm:px-5 bg-canvas"
            >
              {/* Desktop (≥ lg): formulários centrados numa coluna em vez de tela cheia */}
              <div className="w-full max-w-md sm:max-w-xl lg:max-w-3xl mx-auto">
                <OverlayContent />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Navigation Bar — some com fade sincronizado ao push/pop
          (mesmos durações/easings do slide). Só opacity: transform em ancestral
          viraria containing block do `fixed` interno. */}
      <AnimatePresence initial={false}>
        {app.isBottomNavVisible && (
          <motion.div
            key="bottom-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: PUSH_DURATION, ease: 'easeOut' } }}
            exit={{ opacity: 0, transition: { duration: PUSH_EXIT_DURATION, ease: 'easeIn' } }}
            className="lg:hidden"
          >
            <BottomNavMemo
              activeTab={activeTab}
              onChangeTab={handleNavigate}
              onOpenWizard={app.openWizard}
              onOpenTaskExamWizard={app.openTaskExamWizard}
              onOpenCompose={openCompose}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modais/toasts globais (compartilhados com a shell desktop) */}
      <GlobalOverlays />

    </div>
  );
};
