import { createContext } from 'react';
import type { AppContextValue } from './AppContext';
import type { DesktopSessionState } from '../../apps/desktop/src/session/types';

/**
 * Contextos da Fase 10.5 — separação por camada:
 * - `AppBaseContext`: estado compartilhado de UI/navegação (fonte da verdade).
 * - `DataClientContext`: superfície de acesso a dados/domínio.
 * - `MobileAppContext` / `DesktopAppContext`: contextos específicos de cada casca.
 *   `MobileAppContext` carrega só o `AppContextValue` (compartilhado). `DesktopAppContext`
 *   carrega um valor AUMENTADO: o `AppContextValue` + o `DesktopSessionState` (estado
 *   visual de sessão, dono em `apps/desktop`) + os handlers de painéis desktop. Assim a
 *   casca mobile nunca recebe estado visual desktop (spec 06, B6/B7).
 *
 * Cada provider por casca (MobileAppProvider/DesktopAppProvider) fornece os
 * três contextos compartilhados (AppBase/DataClient/Mobile); o desktop adiciona
 * o `DesktopAppContext` aumentado.
 */
export const AppBaseContext = createContext<AppContextValue | undefined>(undefined);
export const DataClientContext = createContext<AppContextValue | undefined>(undefined);
export const MobileAppContext = createContext<AppContextValue | undefined>(undefined);

export type DesktopAppContextValue = AppContextValue &
  DesktopSessionState & {
    openKnowledgeGraph: () => void;
    closeKnowledgeGraph: () => void;
    openProjects: () => void;
    closeProjects: () => void;
    openInbox: () => void;
    closeInbox: () => void;
  };

export const DesktopAppContext = createContext<DesktopAppContextValue | undefined>(undefined);
