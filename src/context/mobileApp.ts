import { useContext } from 'react';
import type { AppContextValue } from './AppContext';
import { MobileAppContext } from './appContexts';

/**
 * Acesso ao estado do app na casca mobile. Lê o `MobileAppContext`, fornecido
 * pelo `MobileAppProvider` (Fase 10.5). Hoje o valor é o mesmo base compartilhado;
 * o estado específico de mobile será agregado aqui sem tocar nas views.
 */
export function useMobileApp(): AppContextValue {
  const ctx = useContext(MobileAppContext);
  if (!ctx) {
    throw new Error('useMobileApp deve ser usado dentro de um MobileAppProvider');
  }
  return ctx;
}
