import React from 'react';
import { AppBaseContext, DataClientContext, MobileAppContext } from '@/context/appContexts';
import { DataClientProvider, useDataClientContext } from '@/context/DataClientProvider';
import { useSharedAppValue } from '@/context/sharedAppValue';
import {
  AppActionsContext,
  CoursesActionsContext,
  KnowledgeActionsContext,
  NavValueContext,
  StudyActionsContext,
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
  return (
    <AppBaseContext.Provider value={value}>
      <DataClientContext.Provider value={value}>
        <MobileAppContext.Provider value={value}>
          <CoursesActionsContext.Provider value={shared.dataActions.courses}>
            <StudyActionsContext.Provider value={shared.dataActions.study}>
              <KnowledgeActionsContext.Provider value={shared.dataActions.knowledge}>
                <AppActionsContext.Provider value={shared.dataActions.app}>
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