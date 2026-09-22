import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { useMobileApp } from '@/context/mobileApp';
import { useNavValue } from '@/context/shellNavContexts';
import { setupNativeShell } from '../lib/native';
import { overlayVariants, PUSH_DURATION, PUSH_EXIT_DURATION } from '../lib/motion';
import { nativeNavigation } from '../navigation/native-navigation';

import { HeaderNav } from '../components/HeaderNav';
import { BottomNav } from '../components/BottomNav';
import { EdgeSwipeBack } from '../components/ui/EdgeSwipeBack';
import { OnboardingScreen } from '../components/views/OnboardingScreen';

import { SlideScreen } from './SlideScreen';
import { SlideContent, OverlayContent } from './SharedScreenLayers';
import { focusController } from '../lib/focusController';
import {
  BackExitState,
  EXIT_BACK_TOAST,
  initialBackExitState,
  resolveBackExit,
} from '../lib/exitBack';

const HeaderNavMemo = memo(HeaderNav);
const BottomNavMemo = memo(BottomNav);

/**
 * Casca mobile/web: header dinâmico + barra inferior + pilha com slide
 * horizontal e overlays em tela cheia. Efeitos nativos (Capacitor) vivem aqui.
 */
export const MobileAppShell: React.FC = () => {
  const app = useMobileApp();
  // Campos de navegação via NavValueContext (identidade estável entre mudanças de
  // dados) — o BottomNavMemo só re-renderiza quando a NAVEGAÇÃO muda de fato.
  const nav = useNavValue();
  const { activeTab, handleNavigate, openCompose, openWizard, openTaskExamWizard } = nav;

  useEffect(() => {
    setupNativeShell();
  }, []);

  // Guarda central do back: enquanto a sessão de foco imersiva estiver RODANDO,
  // volta NÃO navega — emite para a view abrir a confirmação de saída (EST-002).
  // Vale para Android (backButton), gesto iOS (swipeBackCompleted) e borda web.
  const handleBackWithFocusGuard = useCallback(() => {
    if (focusController.isActive() && focusController.isRunning()) {
      focusController.emitBackRequested();
      return true;
    }
    return app.handleSystemBack();
  }, [app]);

  // "Voltar duas vezes para sair": na raiz (sem nada para fechar) o 1º back
  // mostra um toast de aviso; o 2º dentro da janela fecha o app (Android).
  const backExitRef = useRef<BackExitState>(initialBackExitState());
  const handleBackAtRoot = useCallback(() => {
    const { state, action } = resolveBackExit(backExitRef.current, Date.now());
    backExitRef.current = state;
    if (action !== 'exit') {
      app.showToast(EXIT_BACK_TOAST);
      return;
    }
    // iOS não sair por API (App.exitApp é Android-only); só toca o aviso.
    if (Capacitor.getPlatform() === 'android') {
      void CapacitorApp.exitApp();
    }
  }, [app]);

  // Cadeia de volta única: foco imersivo → pop/modal → raiz (toast → sair).
  const performBack = useCallback((): boolean => {
    const handled = handleBackWithFocusGuard();
    if (handled) {
      // Qualquer back real (pop de tela/modal) reinicia a contagem do "sair".
      backExitRef.current = initialBackExitState();
    } else {
      handleBackAtRoot();
    }
    return handled;
  }, [handleBackWithFocusGuard, handleBackAtRoot]);

  const focusBackRef = useRef(performBack);
  focusBackRef.current = performBack;

  // Navegar para outro lugar (tab ou push) reinicia a contagem do "sair".
  useEffect(() => {
    backExitRef.current = initialBackExitState();
  }, [app.canGoBack, activeTab]);

  // Inicializa plugin de swipe-back nativo (iOS) — sempre habilitado
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    nativeNavigation.enable();
    const handleSwipeBackCompleted = () => {
      focusBackRef.current();
    };
    window.addEventListener('swipeBackCompleted', handleSwipeBackCompleted);
    return () => {
      window.removeEventListener('swipeBackCompleted', handleSwipeBackCompleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Informa ao plugin se existem telas para voltar (apenas informativo).
  // O gesto permanece ativo na raiz para o double-back-to-exit.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    nativeNavigation.setCanGoBack(app.canGoBack);
  }, [app.canGoBack]);

  // Gesto de "voltar pela borda": o `swipeX` é aplicado na própria camada de
  // slide (abaixo), então a tela de cima acompanha o dedo — no web e no nativo.
  const swipeX = useMotionValue(0);
  // Sombra de borda revelada sob a tela de cima durante o drag — reforça a
  // elevação enquanto a tela desliza p/ a direita.
  const shadowAlpha = useTransform(swipeX, [0, 120], [0, 0.14]);

  // Android back button: foco imersivo → pop de modais/telas → na raiz,
  // 1º back mostra toast de aviso e o 2º (na janela) fecha o app.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handler = CapacitorApp.addListener('backButton', () => {
      focusBackRef.current();
    });
    return () => {
      void handler.then((h) => h.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    profile,
    headerConfig,
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
    <div className="min-h-screen text-ceci-primary flex flex-col font-sans antialiased selection:bg-surface-rose selection:text-ceci-brand-strong">

      {/* Gesto de "voltar pela borda" (iOS): desliza a camada de slide e volta um nível. */}
      {Capacitor.isNativePlatform() ? (
        null // iOS gesto nativo sempre ativo; slide controlado pelo plugin.
      ) : (
        <EdgeSwipeBack
          swipeX={swipeX}
          onBack={performBack}
          canGoBack={app.canGoBack}
        />
      )}

      {/* Top Header — entra/sai com fade nos fluxos auxiliares (compose/wizards)
          em vez de desmontar seco; o sticky é preservado pois o motion está no
          próprio elemento header. Some também na sessão de foco imersiva. */}
      <AnimatePresence initial={false}>
        {!isAuxFlow && !app.isFocusImmersiveOpen && (
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
        className={`flex-1 max-w-md sm:max-w-xl lg:max-w-3xl xl:max-w-4xl w-full mx-auto px-3.5 py-4 sm:px-5 lg:px-8 relative ${
          app.isBottomNavVisible
            ? 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-10'
            : 'pb-6'
        }`}
      >
        {/* === Camada 0 (só web): sombra de elevação durante o gesto de voltar ===
            O swipeX é aplicado na camada 1, então a tela de cima segue o dedo;
            esta sombra na borda reforça a elevação da área revelada. */}
        {!Capacitor.isNativePlatform() && (
          <motion.div
            aria-hidden
            style={{ opacity: shadowAlpha }}
            className="pointer-events-none fixed inset-y-0 left-0 z-[5] w-4 bg-gradient-to-r from-ceci-primary/15 to-transparent"
          />
        )}
        {/* === Camada 1: slide horizontal (base + auxiliares de 1º nível) ===
            A tela que sai congela onde está (SlideScreen vira fixed) e esvanece
            por baixo — o reset de scroll do handler não a arrasta mais. */}
        <motion.div
          style={{ x: swipeX }}
          className="relative z-10"
        >
          <AnimatePresence initial={false} custom={app.navDirection}>
            <SlideScreen key={app.slideKey} direction={app.navDirection}>
              <SlideContent />
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
              onOpenWizard={openWizard}
              onOpenTaskExamWizard={openTaskExamWizard}
              onOpenCompose={openCompose}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modais/toasts globais */}


    </div>
  );
};
