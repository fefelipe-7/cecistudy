import type { EntityId } from './common';
import { makeId } from './ids';

export type Channel = 'instagram' | 'tiktok' | 'linkedin';

export type EditorialStatus =
  | 'ideia'
  | 'selecionado'
  | 'briefing'
  | 'rascunho'
  | 'em_revisao'
  | 'aprovado'
  | 'agendado'
  | 'publicado'
  | 'reaproveitamento'
  | 'arquivado';

export interface PositioningProfile {
  id: EntityId;
  workspaceId: EntityId;
  identity: string;
  purpose: string;
  interests: string[];
  pillars: string[];
  audience: string;
  tone: string;
  avoidTopics: string[];
  objectives: string[];
  hypotheses: string[];
}

export interface ContentIdea {
  id: EntityId;
  workspaceId: EntityId;
  title: string;
  status: EditorialStatus;
  pillar?: string;
  originRef?: { kind: string; id: EntityId };
}

/** Conteúdo-base autoral independente de canal. */
export interface ContentBase {
  id: EntityId;
  ideaId: EntityId;
  message: string;
  objective?: string;
  pillar?: string;
  audience?: string;
  originRef?: { kind: string; id: EntityId };
  references: EntityId[];
}

/** Adaptação específica de um conteúdo-base para um canal. */
export interface ChannelVariant {
  id: EntityId;
  contentBaseId: EntityId;
  channel: Channel;
  status: EditorialStatus;
  format: string;
  /** Campos específicos do canal (slides, roteiro, legenda, CTA...). */
  body: Record<string, unknown>;
  approved: boolean;
}

export interface Publication {
  id: EntityId;
  variantId: EntityId;
  channel: Channel;
  publishedAt?: string;
  manual: boolean;
}

export interface MetricSnapshot {
  id: EntityId;
  publicationId: EntityId;
  channel: Channel;
  capturedAt: string;
  metrics: Record<string, number>;
}

export interface StrategicInsight {
  id: EntityId;
  workspaceId: EntityId;
  text: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export function createContentBase(input: { ideaId: EntityId; message: string }): ContentBase {
  return {
    id: makeId('cbe'),
    ideaId: input.ideaId,
    message: input.message,
    references: [],
  };
}
