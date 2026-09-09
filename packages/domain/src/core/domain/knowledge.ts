import type { EntityId } from './common';
import { makeId } from './ids';

/** Bloco = unidade atômica de conteúdo de um Document. */
export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'list'
  | 'table'
  | 'image'
  | 'quote'
  | 'code'
  | 'equation'
  | 'reference'
  | 'note';

export interface Block {
  id: EntityId;
  type: BlockType;
  /** Conteúdo fonte (markdown/rich text). Formatos externos são derivados. */
  content: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  /** Proveniência: origem de ClassNote/Material/LooseNote migrado. */
  legacySourceId?: string;
}

export interface Document {
  id: EntityId;
  workspaceId: EntityId;
  title: string;
  blocks: Block[];
  tags: string[];
  areaId?: EntityId;
  createdAt: string;
  updatedAt: string;
  legacySourceId?: string;
}

export type RelationKind = 'explicita' | 'deterministica' | 'semantica' | 'user-defined';
export type RelationProvenance = 'inferred' | 'manual' | 'structural';

/** Relação tipada entre duas entidades do domínio. */
export interface Relation {
  id: EntityId;
  workspaceId: EntityId;
  sourceId: EntityId;
  targetId: EntityId;
  kind: RelationKind;
  label?: string;
  provenance: RelationProvenance;
  /** Relações não-aceitas ficam no Inbox como hipótese. */
  accepted: boolean;
  createdAt: string;
}

export type SuggestionType = 'relation' | 'concept' | 'conflict' | 'gap' | 'study' | 'reflection';
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'archived';

/** Item do Inbox de curadoria. */
export interface Suggestion {
  id: EntityId;
  workspaceId: EntityId;
  type: SuggestionType;
  payload: Record<string, unknown>;
  status: SuggestionStatus;
  createdAt: string;
}

/** Política que persiste bloqueios/recusas de associações. */
export interface AssociationPolicy {
  id: EntityId;
  workspaceId: EntityId;
  /** Assinatura estável da associação (ex.: `${source}->${target}:${kind}`). */
  rule: string;
  action: 'block' | 'reject';
  createdAt: string;
}

export type LearningDimension =
  | 'definition'
  | 'explanation'
  | 'recall'
  | 'application'
  | 'comparison'
  | 'problemSolving'
  | 'creation';

/** Estado de aprendizagem multidimensional de um conceito (0..1 por dimensão). */
export interface LearningState {
  conceptId: EntityId;
  levels: Partial<Record<LearningDimension, number>>;
  updatedAt: string;
}

export function createDocument(input: { workspaceId: EntityId; title: string; blocks?: Block[] }): Document {
  const now = new Date().toISOString();
  return {
    id: makeId('doc'),
    workspaceId: input.workspaceId,
    title: input.title,
    blocks: input.blocks ?? [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createRelation(input: {
  workspaceId: EntityId;
  sourceId: EntityId;
  targetId: EntityId;
  kind: RelationKind;
  provenance?: RelationProvenance;
  accepted?: boolean;
  label?: string;
}): Relation {
  return {
    id: makeId('rel'),
    workspaceId: input.workspaceId,
    sourceId: input.sourceId,
    targetId: input.targetId,
    kind: input.kind,
    label: input.label,
    provenance: input.provenance ?? 'manual',
    accepted: input.accepted ?? input.kind === 'semantica' ? false : true,
    createdAt: new Date().toISOString(),
  };
}
