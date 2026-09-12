/**
 * Contextos de casca (PERF-001 A.3): expõem "bundles" por domínio — o grupo de
 * ações (`DataActionGroups`) + helpers compartilhados ESTÁVEIS daquele domínio
 * (ex.: toggleSaveBook/updateReadingProgress na biblioteca) + `showToast`.
 * Assim as views pesadas re-renderizam SÓ quando o domínio que importa muda,
 * sem depender do valor agregado do app (que muda a cada alteração de qualquer
 * domínio) nem do `SharedAppValue` agregado.
 *
 * Os providers são montados por cada casca (MobileAppProvider/DesktopAppProvider),
 * que têm acesso a `shared.dataActions.<grupo>` e aos helpers estáveis.
 */
import { createContext, useContext } from 'react';
import type { DataActionGroups } from './dataActions';
import type { NavigationValue } from './navigationEngine';
import type { StreakStats, WeekDayCell } from '../lib/streak';
import type { ReminderSettings } from './DataClientProvider';

export type CoursesBundle = DataActionGroups['courses'] & {
  toggleBookmarkCourse: (courseId: string) => void;
};

export type StudyBundle = DataActionGroups['study'] & {
  streakStats: StreakStats;
  currentWeekProgress: WeekDayCell[];
  registerActivity: () => void;
};

export type KnowledgeBundle = DataActionGroups['knowledge'] & {
  toggleSaveBook: (bookId: string) => void;
  updateReadingProgress: (bookId: string, readPages: number) => void;
  showToast: (message: string) => void;
};

export type AppBundle = DataActionGroups['app'] & {
  showToast: (message: string) => void;
  updateReminder: (settings: ReminderSettings) => void;
  setGcalEnabled: (on: boolean) => Promise<boolean>;
};

export const CoursesActionsContext = createContext<CoursesBundle | undefined>(undefined);
export const StudyActionsContext = createContext<StudyBundle | undefined>(undefined);
export const KnowledgeActionsContext = createContext<KnowledgeBundle | undefined>(undefined);
export const AppActionsContext = createContext<AppBundle | undefined>(undefined);
export const NavValueContext = createContext<NavigationValue | undefined>(undefined);

export function useCoursesActions(): CoursesBundle {
  const ctx = useContext(CoursesActionsContext);
  if (!ctx) throw new Error('useCoursesActions must be used within a shell provider (CoursesActionsContext)');
  return ctx;
}

export function useStudyActions(): StudyBundle {
  const ctx = useContext(StudyActionsContext);
  if (!ctx) throw new Error('useStudyActions must be used within a shell provider (StudyActionsContext)');
  return ctx;
}

export function useKnowledgeActions(): KnowledgeBundle {
  const ctx = useContext(KnowledgeActionsContext);
  if (!ctx) throw new Error('useKnowledgeActions must be used within a shell provider (KnowledgeActionsContext)');
  return ctx;
}

export function useAppActions(): AppBundle {
  const ctx = useContext(AppActionsContext);
  if (!ctx) throw new Error('useAppActions must be used within a shell provider (AppActionsContext)');
  return ctx;
}

export function useNavValue(): NavigationValue {
  const ctx = useContext(NavValueContext);
  if (!ctx) throw new Error('useNavValue must be used within a shell provider (NavValueContext)');
  return ctx;
}