import React, { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDesktopApp } from '@/context/desktopApp';
import {
  computeDesktopSlideKey,
  desktopOverlayVariants,
  desktopScreenVariants,
} from '../desktop/lib/screenTransition';
import { isDesktop } from '@/lib/platform';
import { OnboardingScreen } from '../components/views/OnboardingScreen';

import { DesktopSlideContent, DesktopOverlayContent, preloadDesktopScreenChunks } from '../desktop/screens/DesktopScreenLayers';
import { CommandPalette } from '../desktop/components/CommandPalette';
import { DesktopSidebar } from '../desktop/components/DesktopSidebar';
import { DesktopTopbar } from '../desktop/components/DesktopTopbar';
import { ContextInspector } from '../desktop/components/ContextInspector';
import { useDesktopSession } from '../../apps/desktop/src/desktopSessionState';

/** Atalhos exclusivos da casca desktop (⌘K fica no SharedOverlays). */
function useDesktopShortcuts() {
  const app = useDesktopApp();
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
        // fecha painéis auxiliares que tomam a tela inteira (grafo/inbox/projetos)
        if (app.isKnowledgeGraphOpen || app.isProjectsOpen || app.isInboxOpen) {
          app.closeKnowledgeGraph();
          app.closeProjects();
          app.closeInbox();
          return;
        }
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
  const app = useDesktopApp();
  useDesktopShortcuts();
  const { session, patch } = useDesktopSession();
  const inspectorOpen = session.inspectorOpen;

  // Identidade da tela DESKTOP: abrir/focar uma disciplina não remonta a tela
  // inteira (o master-detail troca só a pane); tabs, painéis e telas auxiliares
  // sim. Sem essa key, cada curso clicado faz a tela toda piscar (slideKey do
  // contexto muda a cada push na pilha).
  const slideKey = useMemo(
    () =>
      computeDesktopSlideKey({
        isKnowledgeGraphOpen: app.isKnowledgeGraphOpen,
        isProjectsOpen: app.isProjectsOpen,
        isInboxOpen: app.isInboxOpen,
        isStreakScreenOpen: app.isStreakScreenOpen,
        isSyncScreenOpen: app.isSyncScreenOpen,
        isQuizGroupDetailOpen: app.isQuizGroupDetailOpen,
        isQuizLoadingOpen: app.isQuizLoadingOpen,
        isQuizCategoryOpen: app.isQuizCategoryOpen,
        isQuizPlayOpen: app.isQuizPlayOpen,
        isQuizResultOpen: app.isQuizResultOpen,
        isInternshipDiaryOpen: app.isInternshipDiaryOpen,
        isTccScreenOpen: app.isTccScreenOpen,
        isNotesScreenOpen: app.isNotesScreenOpen,
        isTempleScreenOpen: app.isTempleScreenOpen,
        isFamiliesScreenOpen: app.isFamiliesScreenOpen,
        isStickersScreenOpen: app.isStickersScreenOpen,
        focusedStudyScreen: app.focusedStudyScreen,
        focusedComparisonSlug: app.focusedComparisonSlug,
        focusedTempleSection: app.focusedTempleSection,
        focusedFamilyId: app.focusedFamilyId,
        focusedApproachId: app.focusedApproachId,
        activeTab: app.activeTab,
        subTabFaculdade: app.subTabFaculdade,
      }),
    [
      app.isKnowledgeGraphOpen,
      app.isProjectsOpen,
      app.isInboxOpen,
      app.isStreakScreenOpen,
      app.isSyncScreenOpen,
      app.isQuizGroupDetailOpen,
      app.isQuizLoadingOpen,
      app.isQuizCategoryOpen,
      app.isQuizPlayOpen,
      app.isQuizResultOpen,
      app.isInternshipDiaryOpen,
      app.isTccScreenOpen,
      app.isNotesScreenOpen,
      app.isTempleScreenOpen,
      app.isFamiliesScreenOpen,
      app.isStickersScreenOpen,
      app.focusedStudyScreen,
      app.focusedComparisonSlug,
      app.focusedTempleSection,
      app.focusedFamilyId,
      app.focusedApproachId,
      app.activeTab,
      app.subTabFaculdade,
    ]
  );

  // Aquece os chunks desktop (master-detail da faculdade) em idle pós-boot.
  useEffect(() => {
    preloadDesktopScreenChunks();
  }, []);

  // Primeiro acesso → onboarding em tela cheia (sem shell)
  if (!app.onboarding.completed) {
    return <OnboardingScreen />;
  }

  return (
    <div
      className="desktop-shell h-screen flex text-ceci-primary font-sans antialiased overflow-hidden selection:bg-rose-100 selection:text-ceci-brand-strong"
      style={{ backgroundColor: 'var(--ds-surface-canvas)' }}
    >
      {/* navegação principal (sempre visível — dialogs cobrem com dim) */}
      <DesktopSidebar />

      {/* coluna de conteúdo (canvas + inspector) */}
      <div className="flex flex-col flex-1 min-w-0">
        <DesktopTopbar />

        <div className="flex flex-1 min-h-0">
        <main
        className={`flex-1 min-w-0 overflow-y-auto ${session.density === 'compacto' ? 'px-5 pb-5' : 'px-8 pb-8'}`}
 style={{ backgroundColor: 'var(--ds-surface-canvas, #fff)' }}
      >
          {/* Troca de tela concorrente (crossfade + micro subida) — o popLayout mantém
              a tela antiga pinada na posição atual enquanto esvanece, então o
              crossfade funciona mesmo com o main rolado. Refocos de disciplina no
              master-detail não remontam a tela (a pane de detalhe transiciona sozinha). */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={slideKey}
              variants={desktopScreenVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="max-w-6xl mx-auto"
            >
              <DesktopSlideContent />
            </motion.div>
          </AnimatePresence>
        </main>

          <ContextInspector
            open={inspectorOpen && !(app.activeTab === 'faculdade' && app.subTabFaculdade === 'calendario')}
            onToggle={() => patch({ inspectorOpen: !inspectorOpen })}
          />

        </div>

        {/* status bar (28px) — só informação secundária, dot de status por cor */}
        <footer
          className="flex h-7 items-center gap-3 px-8 text-xs text-ceci-muted"
          style={{ background: 'var(--ds-surface-sidebar)', borderTop: '1px solid var(--ds-border-default)' }}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--ds-status-success)' }} />
            sincronizado
          </span>
          <span className="text-ceci-border-strong">·</span>
          <span className="font-mono">{app.profile.university || 'seu cantinho acadêmico'}</span>
        </footer>
      </div>

      {/* fluxos de escrita como janela centrada (compose/wizards/detalhes de nota)
          — crossfade concorrente: saída e entrada sobrepõem em vez de esperar */}
      <AnimatePresence initial={false}>
        {app.overlayKey && (
          <motion.div
            key={app.overlayKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } }}
            exit={{ opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }}
            className="fixed inset-0 z-40 flex items-start justify-center px-10 py-8 bg-black/30 overflow-y-auto"
            role="presentation"
          >
            <motion.div
              variants={desktopOverlayVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-2xl rounded-xl border border-ceci-border-default bg-white overflow-hidden my-auto"
              style={{ boxShadow: 'var(--ds-elevation-md)' }}
            >
               <DesktopOverlayContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* modais/toasts globais */}

      {/* command palette (⌘K) — acelerador de navegação desktop */}
      <CommandPalette />
    </div>
  );
};
