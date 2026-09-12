import React, { useMemo } from 'react';
import { AppBaseContext, DataClientContext, MobileAppContext } from '@/context/appContexts';
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
import { useMobileNavigation } from './mobileNavigation';

/**
 * Provider da experiência mobile (spec 07 §6.6).
 *
 * Composição própria: dados (DataClient) + valor compartilhado + motor de
 * navegação mobile (`useMobileNavigation`). O sandbox mobile fornece os três
 * contextos (AppBase/DataClient/Mobile) para que `useMobileApp()` e o
 * fallback dos contextos compartilhados apontem para a mesma superfície.
 * Não depende do app desktop.
 *
 * Além da superfície agregada, fornece os bundles por domínio (PERF-001 A.3):
 * ações + helpers estáveis de cada domínio em contextos próprios, para que as
 * views pesadas re-renderizem apenas quando o domínio relevante muda.
 */
export function MobileAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <DataClientProvider>
      <MobileShellInner>{children}</MobileShellInner>
    </DataClientProvider>
  );
}

function MobileShellInner({ children }: { children: React.ReactNode }) {
  const data = useDataClientContext();
  const shared = useSharedAppValue(data);
  const nav = useMobileNavigation(data, shared);
  const value: AppContextValue = buildAppContextValue(data, shared, nav);

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

  return (
    <AppBaseContext.Provider value={value}>
      <DataClientContext.Provider value={value}>
        <MobileAppContext.Provider value={value}>
          <CoursesActionsContext.Provider value={coursesBundle}>
            <StudyActionsContext.Provider value={studyBundle}>
              <KnowledgeActionsContext.Provider value={knowledgeBundle}>
                <AppActionsContext.Provider value={appBundle}>
                  <NavValueContext.Provider value={nav}>
                    {children}
                  </NavValueContext.Provider>
                </AppActionsContext.Provider>
              </KnowledgeActionsContext.Provider>
            </StudyActionsContext.Provider>
          </CoursesActionsContext.Provider>
        </MobileAppContext.Provider>
      </DataClientContext.Provider>
    </AppBaseContext.Provider>
  );
}