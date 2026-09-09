import React, { createContext, useContext, useCallback } from 'react';
import { usePersistentState } from '@/lib/usePersistentState';
import { DEFAULT_WORKSPACE_ID } from '@/data/schema';
import type { DesktopSessionState } from './session/types';

export function emptyDesktopSession(): DesktopSessionState {
  return {
    lastWorkspaceId: DEFAULT_WORKSPACE_ID,
    activeWorkspaceId: DEFAULT_WORKSPACE_ID,
    openDocuments: [],
    activePanels: [],
    activeModule: 'conhecimento',
    layoutState: {},
    sidebarCollapsed: false,
    canvasClarity: 'calmo',
    density: 'conforto',
    inspectorOpen: true,
    isCommandPaletteOpen: false,
    commandHistory: [],
    isKnowledgeGraphOpen: false,
    isProjectsOpen: false,
    isInboxOpen: false,
  };
}

export interface DesktopSessionApi {
  session: DesktopSessionState;
  setSession: React.Dispatch<React.SetStateAction<DesktopSessionState>>;
  patch: (next: Partial<DesktopSessionState>) => void;
}

const DesktopSessionContext = createContext<DesktopSessionApi | undefined>(undefined);

export function DesktopSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = usePersistentState<DesktopSessionState>('desktopSession', emptyDesktopSession());
  const patch = useCallback((next: Partial<DesktopSessionState>) => {
    setSession((prev) => ({ ...prev, ...next }));
  }, [setSession]);
  const value: DesktopSessionApi = { session, setSession, patch };
  return <DesktopSessionContext.Provider value={value}>{children}</DesktopSessionContext.Provider>;
}

export function useDesktopSession(): DesktopSessionApi {
  const ctx = useContext(DesktopSessionContext);
  if (!ctx) throw new Error('useDesktopSession deve ser usado dentro de um DesktopSessionProvider');
  return ctx;
}
