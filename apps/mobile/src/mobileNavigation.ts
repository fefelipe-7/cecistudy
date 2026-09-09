/**
 * Re-export do motor de navegação para o shell mobile (spec 07 §6.6).
 * Cada casca instancia a SUA pilha de navegação (`useMobileNavigation`);
 * o desktop usa `useDesktopNavigation` (próprio arquivo em apps/desktop).
 */
import { useNavigationEngine } from '@/context/navigationEngine';

export const useMobileNavigation = useNavigationEngine;
export type { NavigationValue } from '@/context/navigationEngine';