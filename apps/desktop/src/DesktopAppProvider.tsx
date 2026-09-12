import React, { useCallback, useMemo } from 'react';
import { AppBaseContext, DataClientContext, MobileAppContext, DesktopAppContext } from '@/context/appContexts';
import { DataClientProvider, useDataClientContext } from '@/context/DataClientProvider';
import { useSharedAppValue } from '@/context/sharedAppValue';
import {
  AppActionsContext,
  AppBundle,
  CoursesActionsContext,
  CoursesBundle,
  KnowledgeActionsContext,
  KnowledgeBundle,
  NavValueContext,
  StudyActionsContext,
  StudyBundle,
} from '@/context/shellNavContexts';
import { buildAppContextValue, type AppContextValue } from '@/context/AppContext';
import { DesktopUpdateSection } from '@/desktop/components/DesktopUpdateSection';
import { useDesktopSession, DesktopSessionProvider } from './desktopSessionState';
import { useDesktopNavigation } from './desktopNavigation';

const desktopShellExtras = { updateSection: DesktopUpdateSection };

function DesktopShellInner({ children }: { children: React.ReactNode }) {
  const data = useDataClientContext();
  const shared = useSharedAppValue(data);
  const nav = useDesktopNavigation(data, shared);
  const base: AppContextValue = buildAppContextValue(data, shared, nav);
  const { session, patch } = useDesktopSession();

  const coursesBundle: CoursesBundle = useMemo(
    () => ({
      ...shared.dataActions.courses,
      toggleBookmarkCourse: shared.toggleBookmarkCourse,
    }),
    [shared.dataActions.courses, shared.toggleBookmarkCourse]
  );

  const studyBundle: StudyBundle = useMemo(
    () => ({
      ...shared.dataActions.study,
      streakStats: shared.streakStats,
      currentWeekProgress: shared.currentWeekProgress,
      registerActivity: shared.registerActivity,
    }),
    [
      shared.dataActions.study,
      shared.streakStats,
      shared.currentWeekProgress,
      shared.registerActivity,
    ]
  );

  const knowledgeBundle: KnowledgeBundle = useMemo(
    () => ({
      ...shared.dataActions.knowledge,
      toggleSaveBook: shared.toggleSaveBook,
      updateReadingProgress: shared.updateReadingProgress,
      showToast: data.showToast,
    }),
    [
      shared.dataActions.knowledge,
      shared.toggleSaveBook,
      shared.updateReadingProgress,
      data.showToast,
    ]
  );

  const appBundle: AppBundle = useMemo(
    () => ({
      ...shared.dataActions.app,
      showToast: data.showToast,
      updateReminder: shared.updateReminder,
      setGcalEnabled: shared.setGcalEnabled,
    }),
    [shared.dataActions.app, data.showToast, shared.updateReminder, shared.setGcalEnabled]
  );

  const openKnowledgeGraph = useCallback(() => patch({ isKnowledgeGraphOpen: true }), [patch]);
  const closeKnowledgeGraph = useCallback(() => patch({ isKnowledgeGraphOpen: false }), [patch]);
  const openProjects = useCallback(() => patch({ isProjectsOpen: true }), [patch]);
  const closeProjects = useCallback(() => patch({ isProjectsOpen: false }), [patch]);
  const openInbox = useCallback(() => patch({ isInboxOpen: true }), [patch]);
  const closeInbox = useCallback(() => patch({ isInboxOpen: false }), [patch]);

  // base (AppContextValue) já carrega workspaces/currentWorkspace/switchWorkspace/
  // createWorkspace compartilhados. Aqui só agregamos o estado visual de sessão
  // desktop (panéis/grafo/clareza) + os handlers de painel + shellExtras. O motor
  // de navegação é uma instância desktop (pilha própria, ancorada no DataClient).
  const augmented = {
    ...base,
    ...session,
    openKnowledgeGraph,
    closeKnowledgeGraph,
    openProjects,
    closeProjects,
    openInbox,
    closeInbox,
    shellExtras: desktopShellExtras,
  };

  // Até a separação completar (spec 07 §6.6/§7), a casca desktop também fornece
  // os três contextos compartilhados (AppBase/DataClient/Mobile) com o `base` —
  // `useMobileApp()` (SlideContent/OverlayContent e views compartilhadas)
  // continua apontando para a mesma superfície. O supertype
  // `DesktopAppContext` fica só no contexto desktop (sessão + painéis + shellExtras).
  return (
    <AppBaseContext.Provider value={base}>
      <DataClientContext.Provider value={base}>
        <MobileAppContext.Provider value={base}>
          <DesktopAppContext.Provider value={augmented}>
            <CoursesActionsContext.Provider value={coursesBundle}>
              <StudyActionsContext.Provider value={studyBundle}>
                <KnowledgeActionsContext.Provider value={knowledgeBundle}>
                  <AppActionsContext.Provider value={appBundle}>
                    <NavValueContext.Provider value={nav}>{children}</NavValueContext.Provider>
                  </AppActionsContext.Provider>
                </KnowledgeActionsContext.Provider>
              </StudyActionsContext.Provider>
            </CoursesActionsContext.Provider>
          </DesktopAppContext.Provider>
        </MobileAppContext.Provider>
      </DataClientContext.Provider>
    </AppBaseContext.Provider>
  );
}

export function DesktopAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <DataClientProvider>
      <DesktopSessionProvider>
        <DesktopShellInner>{children}</DesktopShellInner>
      </DesktopSessionProvider>
    </DataClientProvider>
  );
}