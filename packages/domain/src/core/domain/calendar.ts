import type { EntityId } from './common';
import { makeId } from './ids';

export type CommitmentLevel = 'obrigatorio' | 'importante' | 'recomendado' | 'opcional';
export type CalendarItemStatus =
  | 'planejado'
  | 'em_andamento'
  | 'concluido'
  | 'adiado'
  | 'nao_realizado'
  | 'cancelado'
  | 'dispensado';

/** Módulo dono do conteúdo (o Calendário é dono só do tempo). */
export type ModuleOrigin = 'faculdade' | 'tcc' | 'estudos' | 'estagio' | 'conhecimento' | 'google' | 'marketing';

export interface SourceRef {
  kind: string;
  id: EntityId;
}

/** Evento = algo que acontece em um horário. */
export interface CalendarEvent {
  id: EntityId;
  workspaceId: EntityId;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  origin: ModuleOrigin;
  externalId?: string;
  recurrenceRuleId?: EntityId;
  level: CommitmentLevel;
  status: CalendarItemStatus;
  sourceRef?: SourceRef;
}

export interface RecurrenceRule {
  id: EntityId;
  freq: 'daily' | 'weekly' | 'monthly';
  days?: number[];
  startTime: string;
  endTime?: string;
  startDate: string;
  endDate?: string;
  count?: number;
  tz: string;
}

/** Instância de um evento recorrente (alterações ficam na ocorrência). */
export interface Occurrence {
  id: EntityId;
  eventId: EntityId;
  ruleId?: EntityId;
  date: string;
  status: CalendarItemStatus;
  overrides?: Partial<CalendarEvent>;
}

/** Responsabilidade = o que precisa ser feito dentro de um prazo. */
export interface Subtask {
  id: EntityId;
  title: string;
  done: boolean;
  dueDate?: string;
}

export interface Responsibility {
  id: EntityId;
  workspaceId: EntityId;
  title: string;
  dueDate?: string;
  level: CommitmentLevel;
  status: CalendarItemStatus;
  origin: ModuleOrigin;
  sourceRef?: SourceRef;
  plannedBlockId?: EntityId;
  subtasks: Subtask[];
}

/** Bloco de planejamento = tempo reservado para uma responsabilidade. */
export interface PlanningBlock {
  id: EntityId;
  responsibilityId: EntityId;
  start: string;
  end: string;
  plannedDurationMin?: number;
}

/** Registro do que realmente aconteceu. */
export interface ExecutionRecord {
  id: EntityId;
  refId: EntityId;
  actualStart?: string;
  actualEnd?: string;
  actualDurationMin?: number;
  note?: string;
  outcome: 'done' | 'partial' | 'skipped';
}

export function createResponsibility(input: {
  workspaceId: EntityId;
  title: string;
  level?: CommitmentLevel;
  origin?: ModuleOrigin;
  dueDate?: string;
}): Responsibility {
  return {
    id: makeId('rsp'),
    workspaceId: input.workspaceId,
    title: input.title,
    level: input.level ?? 'importante',
    status: 'planejado',
    origin: input.origin ?? 'faculdade',
    dueDate: input.dueDate,
    subtasks: [],
  };
}
