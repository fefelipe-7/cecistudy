/**
 * Re-export do motor de navegação para o shell desktop (spec 07 §6.6).
 * O desktop usa uma instância PRÓPRIA do motor (`useDesktopNavigation`) —
 * pilha de navegação independente do mobile, ancorada no mesmo DataClient
 * compartilhado. Antes (AppContext universal) as duas cascas dividiam a
 * mesma pilha do navegador.
 */
import { useNavigationEngine } from '@/context/navigationEngine';

export const useDesktopNavigation = useNavigationEngine;
export type { NavigationValue } from '@/context/navigationEngine';