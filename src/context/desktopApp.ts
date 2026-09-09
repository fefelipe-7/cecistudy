import { useContext } from 'react';
import type { DesktopAppContextValue } from './appContexts';
import { DesktopAppContext } from './appContexts';

/**
 * Acesso ao estado do app na casca desktop. Lê o `DesktopAppContext`, fornecido
 * pelo `DesktopAppProvider` (Fase 10.5). O valor é o base compartilhado aumentado
 * com o estado de sessão desktop (painéis, workspace ativo, grafo…) injetado pela
 * casca desktop, sem mexer nas views.
 */
export function useDesktopApp(): DesktopAppContextValue {
  const ctx = useContext(DesktopAppContext);
  if (!ctx) {
    throw new Error('useDesktopApp deve ser usado dentro de um DesktopAppProvider');
  }
  return ctx;
}
