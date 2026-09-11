/**
 * Contextos de casca (PERF-001 A.3): expõem os grupos de ações por domínio
 * (`DataActionGroups`) e o valor de navegação memoizado (`NavigationValue`) em
 * contextos próprios, permitindo às views pesadas re-renderizar SÓ quando o
 * domínio que importa muda — sem depender do valor agregado do app (que muda
 * a cada alteração de qualquer domínio).
 *
 * Os providers são montados por cada casca (MobileAppProvider/DesktopAppProvider),
 * que têm acesso a `shared.dataActions` (grupos) e `nav` (motor de navegação).
 */
import { createContext, useContext } from 'react';
import type { DataActionGroups } from './dataActions';
import type { NavigationValue } from './navigationEngine';

export const CoursesActionsContext = createContext<DataActionGroups['courses'] | undefined>(undefined);
export const StudyActionsContext = createContext<DataActionGroups['study'] | undefined>(undefined);
export const KnowledgeActionsContext = createContext<DataActionGroups['knowledge'] | undefined>(undefined);
export const AppActionsContext = createContext<DataActionGroups['app'] | undefined>(undefined);
export const NavValueContext = createContext<NavigationValue | undefined>(undefined);

export function useCoursesActions(): DataActionGroups['courses'] {
  const ctx = useContext(CoursesActionsContext);
  if (!ctx) throw new Error('useCoursesActions must be used within a shell provider (CoursesActionsContext)');
  return ctx;
}

export function useStudyActions(): DataActionGroups['study'] {
  const ctx = useContext(StudyActionsContext);
  if (!ctx) throw new Error('useStudyActions must be used within a shell provider (StudyActionsContext)');
  return ctx;
}

export function useKnowledgeActions(): DataActionGroups['knowledge'] {
  const ctx = useContext(KnowledgeActionsContext);
  if (!ctx) throw new Error('useKnowledgeActions must be used within a shell provider (KnowledgeActionsContext)');
  return ctx;
}

export function useAppActions(): DataActionGroups['app'] {
  const ctx = useContext(AppActionsContext);
  if (!ctx) throw new Error('useAppActions must be used within a shell provider (AppActionsContext)');
  return ctx;
}

export function useNavValue(): NavigationValue {
  const ctx = useContext(NavValueContext);
  if (!ctx) throw new Error('useNavValue must be used within a shell provider (NavValueContext)');
  return ctx;
}