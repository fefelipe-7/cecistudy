/**
 * Tradução do `extra` da notificação em navegação (SPEC-M-025 D8).
 *
 * O adaptador grava `{ family, target }`; o TCC legado gravava `{ thesis }`.
 * Este módulo é puro e defensivo: `extra` desconhecido simplesmente não navega.
 */
import { routeFromNotificationExtra } from '../../packages/domain/src/core/domain/thesis';
import type { NavTab } from '../types/navigation';

export type NotificationRoute =
  | { kind: 'tcc'; tab: 'visao' | 'capitulos' | 'orientacao'; focusId?: string }
  | { kind: 'calendar'; day?: string }
  | { kind: 'internship' }
  | { kind: 'tab'; tab: NavTab };

export function resolveNotificationRoute(extra: unknown): NotificationRoute | null {
  if (typeof extra !== 'object' || extra === null) return null;
  const rec = extra as Record<string, unknown>;
  const target =
    typeof rec.target === 'object' && rec.target !== null
      ? (rec.target as Record<string, unknown>)
      : undefined;

  switch (rec.family) {
    case 'thesis': {
      const route = routeFromNotificationExtra(extra);
      return route ? { kind: 'tcc', ...route } : null;
    }
    case 'exam':
      return {
        kind: 'calendar',
        ...(typeof target?.day === 'string' && target.day ? { day: target.day } : {}),
      };
    case 'class':
      return { kind: 'tab', tab: 'faculdade' };
    case 'internship':
      return { kind: 'internship' };
    case 'task':
    case 'daily':
      return { kind: 'tab', tab: 'home' };
    default:
      break;
  }

  // Formato legado do TCC (sem `family`).
  const legacy = routeFromNotificationExtra(extra);
  return legacy ? { kind: 'tcc', ...legacy } : null;
}
