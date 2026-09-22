/**
 * Re-export do motor de navegação para o shell mobile (spec 07 §6.6).
 * O shell mobile instancia a própria pilha de navegação (`useMobileNavigation`).
 */
import { useNavigationEngine } from '@/context/navigationEngine';

export const useMobileNavigation = useNavigationEngine;
export type { NavigationValue } from '@/context/navigationEngine';