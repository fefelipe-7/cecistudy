import type { Responsibility, CalendarEvent } from '../../domain';
import { createResponsibility } from '../../domain';
import { makeId } from '../../domain';

export interface PlanResponsibilityInput {
  workspaceId: string;
  title: string;
  level?: Responsibility['level'];
  origin?: Responsibility['origin'];
  dueDate?: string;
}

export function planResponsibility(input: PlanResponsibilityInput): Responsibility {
  return createResponsibility(input);
}

export interface ScheduleEventInput {
  workspaceId: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  level?: CalendarEvent['level'];
  origin?: CalendarEvent['origin'];
  sourceRef?: CalendarEvent['sourceRef'];
}

export function scheduleEvent(input: ScheduleEventInput): CalendarEvent {
  return {
    id: makeId('cal'),
    workspaceId: input.workspaceId,
    title: input.title,
    start: input.start,
    end: input.end,
    allDay: input.allDay,
    origin: input.origin ?? 'faculdade',
    externalId: undefined,
    level: input.level ?? 'importante',
    status: 'planejado',
    sourceRef: input.sourceRef,
  };
}
