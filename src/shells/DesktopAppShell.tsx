import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { OnboardingScreen } from '../components/views/OnboardingScreen';
import { GlobalOverlays } from './GlobalOverlays';
import { SlideContent, OverlayContent } from './ScreenLayers';
import { DesktopSidebar } from '../desktop/components/DesktopSidebar';
import { DesktopTopbar } from '../desktop/components/DesktopTopbar';

/** Atalhos exclusivos da casca desktop (⌘K fica no GlobalOverlays). */
function useDesktopShortcuts() {
  const app = useApp();
  const appRef = React.useRef(app);
  appRef.current = app;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const app = appRef.current;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const tabs = ['home', 'faculdade', 'estudos', 'biblioteca'] as const;
        app.handleNavigate(tabs[Number(e.key) - 1]);
        return;
      }
      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        app.openQuickAdd();
        return;
      }
      // Esc volta um nível — só quando nenhum modal está cuidando do Escape.
      if (e.key === 'Escape' && !e.defaultPrevented && !mod) {
        const modalAberto =
          app.isQuickAddOpen ||
          app.isSearchOpen ||
          app.isEditCourseOpen ||
          app.isEditTccOpen ||
          app.isDetailPromptOpen ||
          app.managedItem !== null;
        if (!modalAberto) {
          app.handleSystemBack();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/**
 * Casca desktop (Tauri): sidebar com sub-navegação + topbar + área de
 * conteúdo com master-detail. Os fluxos de escrita (compose/wizards)
 * aparecem como janela centrada sobre a tela, não como tela cheia.
 * A pilha de navegação (AppContext) é a mesma do mobile — muda a apresentação.
 */
export const DesktopAppShell: React.FC = () => {
  const app = useApp();
  useDesktopShortcuts();

  // Primeiro acesso → onboarding em tela cheia (sem shell)
  if (!app.onboarding.completed) {
    return <OnboardingScreen />;
  }

  return (
    <div className="h-screen flex bg-canvas text-ceci-primary font-sans antialiased overflow-hidden selection:bg-rose-100 selection:text-ceci-brand-strong">
      {/* navegação principal (sempre visível — dialogs cobrem com dim) */}
      <DesktopSidebar />

      {/* coluna de conteúdo — fundo levemente mais escuro que a sidebar branca
          cria a hierarquia visual do layout premium */}
      <div className="flex flex-col flex-1 min-w-0 bg-surface-muted">
        <DesktopTopbar />

        <main className="flex-1 min-h-0 overflow-y-auto px-8 pb-8">
          {/* Troca de tela concorrente (fade + micro subida) — o popLayout mantém
              a tela antiga pinada na posição atual enquanto esvanece, então o
              crossfade funciona mesmo com o main rolado. */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={app.slideKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } }}
              className="max-w-6xl mx-auto"
            >
              <SlideContent shell="desktop" />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* rodapé fino */}
        <footer className="flex items-center gap-3 h-8 px-8 border-t border-ceci-border-subtle text-[11px] text-ceci-muted shrink-0">
          <span>cecistudy ♡</span>
          <span className="text-ceci-border-strong">·</span>
          <span>{app.profile.university || 'seu cantinho acadêmico'}</span>
        </footer>
      </div>

      {/* fluxos de escrita como janela centrada (compose/wizards/detalhes de nota)
          — crossfade concorrente: saída e entrada sobrepõem em vez de esperar */}
      <AnimatePresence initial={false}>
        {app.overlayKey && (
          <motion.div
            key={app.overlayKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 flex items-start justify-center px-10 py-8 bg-black/30 backdrop-blur-[2px] overflow-y-auto"
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-2xl rounded-[28px] border border-ceci-border-default shadow-xl bg-white overflow-hidden my-auto"
            >
              <OverlayContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* modais/toasts globais */}
      <GlobalOverlays />
    </div>
  );
};
