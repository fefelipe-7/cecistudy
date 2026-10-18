import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { useMobileApp } from '@/context/mobileApp';
import { useNavValue } from '@/context/shellNavContexts';
import { setupNativeShell } from '../lib/native';
import { mark } from '../lib/performance/perfMarks';
import { cancelQueuedPrefetches } from '../lib/performance/screenPrefetch';
import { EASE, overlayVariants, resolveProfile } from '../lib/motion';
import { nativeNavigation } from '../navigation/native-navigation';
import { routeFromNotificationExtra } from '../../packages/domain/src/core/domain/thesis';

import { HeaderNav } from '../components/HeaderNav';
import { BottomNav } from '../components/BottomNav';
import { EdgeSwipeBack } from '../components/ui/EdgeSwipeBack';
import { ContextualBars } from '../components/ui/ContextualBars';
import { OnboardingScreen } from '../components/views/OnboardingScreen';

import { SlideScreen } from './SlideScreen';
import { CaptureHost } from './CaptureHost';
import { MotionProfileProvider, useMotionProfile } from '../components/motion/MotionProfileProvider';
import { SlideContent, OverlayContent } from './SharedScreenLayers';
import { focusController } from '../lib/focusController';
import {
  buildContextualBarModel,
  contextualBarSignature,
  isBarModel,
} from '../lib/contextualBar';
import { precisaDeInert } from '../lib/chromeVisibility';
import { useChromeVisibility } from '../lib/useChromeVisibility';
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
export const MobileAppShell: React.FC = () => (
  // O perfil de movimento envolve **tudo**, inclusive o onboarding (que anima os
  // passos) — e fica aqui, dentro do shell, para que os dois clientes (web e
  // `apps/mobile`) o ganhem sem mexer nos entrypoints. Ele não ramifica por
  // plataforma: lê só o `prefers-reduced-motion` do sistema.
  <MotionProfileProvider>
    <MobileAppShellInner />
  </MotionProfileProvider>
);

const MobileAppShellInner: React.FC = () => {
  const app = useMobileApp();
  /** Perfil de movimento do chrome (bottom-nav). Lido fora do JSX para não
   *  reconstruir o objeto a cada render. */
  const chrome = useMotionProfile();
  // Campos de navegação via NavValueContext (identidade estável entre mudanças de
  // dados) — o BottomNavMemo só re-renderiza quando a NAVEGAÇÃO muda de fato.
  const nav = useNavValue();
  const { activeTab, handleNavigate, openCompose, openWizard, openTaskExamWizard } = nav;

  useEffect(() => {
    mark('first-screen-mounted');
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

  // Troca de rota descarta o prefetch oportunístico pendente (spec-performance
  // §3.3): o que já corre, corre — mas a fila não atrapalha a nova rota.
  useEffect(() => {
    cancelQueuedPrefetches();
  }, [activeTab]);

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

  // Gesto de "voltar pela borda" (iOS): transform da camada de slide acompanha o dedo
  const swipeX = useMotionValue(0);
  // Peek do gesto: a "tela anterior" (fundo parallax) revelada sob a tela
  // de cima enquanto ela desliza p/ a direita; sombra de borda no limite do slide.
  const peekX = useTransform(swipeX, (v) => -v * 0.16);
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

  // Toque na notificação do TCC → aba certa (SPEC-012 §6.5, Q10). Registrado
  // cedo no bootstrap: em partida a frio o iOS entrega o evento após o
  // `addListener` — e a navegação não depende de dado hidratado (o `focusId`
  // de item removido degrada na própria tela). `routeFromNotificationExtra`
  // é puro e defensivo: `extra` inválido simplesmente não navega.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handler = LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const route = routeFromNotificationExtra(
        (event.notification as { extra?: unknown }).extra,
      );
      if (route) app.openTccScreen(route.tab, route.focusId);
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

  /** O chrome existe nestas telas? Header e barra compartilham a resposta. */
  const chromeVisible = !isAuxFlow && !app.isFocusImmersiveOpen;

  // Modelo da barra contextual (SPEC-M-018 D1). Calculado **uma** vez por tela e
  // distribuído ao header e à barra — é isso que garante I11: os dois lados lêem
  // o mesmo predicado e não podem divergir.
  //
  // A memoização é por **assinatura**, não por referência: `headerConfig` é
  // reconstruído a cada render do engine, então comparar o objeto não memoizaria
  // nada e a barra remontaria a cada tecla digitada em um formulário.
  const barSignature = contextualBarSignature(headerConfig);
  const barModel = useMemo(
    () =>
      buildContextualBarModel({
        currentScreen: app.currentScreen,
        canGoBack: app.canGoBack,
        headerConfig,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [app.currentScreen.kind, app.canGoBack, barSignature],
  );
  const barActive = chromeVisible && isBarModel(barModel);

  // Executar uma ação do contexto é chamar o mesmo `onClick` que o `⋯` do header
  // chamava. A barra não sabe nada do domínio: ela entrega a `HeaderAction` e o
  // shell, que tem o app inteiro, executa (D9).
  const runBarAction = useCallback(
    (action: { onClick: () => void }) => {
      action.onClick();
    },
    [],
  );

  // D14: o piso do `<main>` ouve **qualquer** barra inferior. Antes só a pílula de
  // abas contava, e ela vive nas telas de aba — justamente onde a barra contextual
  // não aparece. Sem este termo, a barra cobriria o fim do conteúdo das telas de
  // detalhe.
  const bottomBarVisible = app.isBottomNavVisible || barActive;

  // Visibilidade das barras (SPEC-M-019). O hook é o dono do listener e do
  // temporizador; aqui só se lê o estado e se avisa as transições de tela.
  // Nome distinto de `chrome` (perfil de motion) para não colidir.
  const chromeVis = useChromeVisibility({ reduced: chrome.reduced });
  // Ajuste de estado **durante o render**, no padrão do React ("adjusting state
  // when a prop changes"): a visibilidade vive no hook, e o sinal de "trocou de
  // tela" é o `kind` do topo da pilha. O guarda de referência garante que o
  // aviso acontece uma vez por troca — sem laço e sem efeito que chega tarde.
  const lastScreenKindRef = useRef(app.currentScreen.kind);
  if (lastScreenKindRef.current !== app.currentScreen.kind) {
    lastScreenKindRef.current = app.currentScreen.kind;
    chromeVis.notificarNavegou();
  }

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
        {chromeVisible && (
          <HeaderNavMemo
            key="header"
            profile={profile}
            headerConfig={headerConfig}
            hideBarControls={barActive}
            direction={app.navDirection}
            onOpenSearch={app.openSearch}
            onNavigateToPerfil={onNavigateToPerfil}
          />
        )}
      </AnimatePresence>

      {/* Main Screen Content (Mobile First App Frame Container) */}
      <main
        className={`flex-1 max-w-md sm:max-w-xl lg:max-w-3xl xl:max-w-4xl w-full mx-auto px-3.5 py-4 sm:px-5 lg:px-8 relative transition-[padding] duration-[220ms] ease-out ${
          bottomBarVisible
            ? 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-10'
            : 'pb-6'
        }`}
      >
        {/* === Camada 0 (só web): peek do gesto de borda ===
            Durante o drag, a tela de cima desliza p/ a direita e este fundo
            parallax (canvas) é revelado por baixo —
            dá a sensação de "a tela anterior acompanha o dedo" sem remontar a
            view; no commit o pop direcional revela a anterior de verdade.
            A sombra de borda no limite do slide reforça a elevação. */}
        {!Capacitor.isNativePlatform() && (
          <>
            <motion.div
              aria-hidden
              style={{ x: peekX }}
              className="pointer-events-none fixed inset-0 z-0 bg-canvas lg:pl-60"
            />
            <motion.div
              aria-hidden
              style={{ opacity: shadowAlpha }}
              className="pointer-events-none fixed inset-y-0 left-0 z-0 w-4 bg-gradient-to-r from-ceci-primary/15 to-transparent lg:left-60"
            />
          </>
        )}
        {/* === Camada 1: slide horizontal (base + auxiliares de 1º nível) ===
            A tela que sai congela onde está (SlideScreen vira fixed) e esvanece
            por baixo — o reset de scroll do handler não a arrasta mais. */}
        <motion.div
          style={{ x: Capacitor.isNativePlatform() ? swipeX : 0 }}
          className="relative z-10"
        >
          <AnimatePresence initial={false} custom={app.navIntent}>
            <SlideScreen key={app.slideKey} intent={app.navIntent}>
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

      {/* Captura de link (F8.4/F8.5): deep link iOS e share Android caem aqui,
          fora das views — o host decide salvar direto ou abrir a sheet. */}
      <CaptureHost />

      {/* Fixed Bottom Navigation Bar — some junto com o push/pop, em tempo com o
          slide. **Só opacity, de propósito:** um `transform` neste wrapper viraria
          containing block do `fixed` interno (o `fixed` do nav deixaria de se
          posicionar na viewport). Fazer a barra "deslizar para fora" exigiria
          animar o `y` de dentro do elemento `fixed`, não do wrapper. */}
      <AnimatePresence initial={false}>
        {app.isBottomNavVisible && (
          <motion.div
            key="bottom-nav"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: chrome.d.navBar, ease: EASE.standard },
            }}
            exit={{
              opacity: 0,
              transition: { duration: chrome.d.navBar, ease: EASE.exit },
            }}
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

      {/* Barra contextual (SPEC-M-018). Esconde a pílula de abas onde aparece, e
          vice-versa — os dois conjuntos de tela são disjuntos por D13. O wrapper
          anima **só** `opacity`: um `transform` aqui viraria containing block do
          `fixed` interno (comentário do bloco acima). */}
      <AnimatePresence initial={false}>
        {barActive && barModel && (
          <ContextualBars
            key="contextual-bar"
            model={barModel}
            onBack={performBack}
            onRunAction={runBarAction}
            visivel={chromeVis.estado.visivel}
            inert={precisaDeInert(chromeVis.estado)}
            onMenuChange={chromeVis.notificarMenu}
            onFocusChange={chromeVis.notificarFoco}
          />
        )}
      </AnimatePresence>

      {/* Modais/toasts globais */}


    </div>
  );
};
