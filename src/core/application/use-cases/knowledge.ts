import type { Relation, RelationKind, RelationProvenance, AssociationPolicy, Suggestion } from '../../domain';
import { createRelation } from '../../domain';

export interface AddRelationInput {
  workspaceId: string;
  sourceId: string;
  targetId: string;
  kind: RelationKind;
  label?: string;
  provenance?: RelationProvenance;
}

/**
 * Cria uma relação tipada, respeitando:
 * - deduplicação (mesma origem/destino/tipo no workspace);
 * - políticas de bloqueio (AssociationPolicy com action 'block');
 * - relações semânticas nascem não-aceitas (vão para o Inbox).
 */
export function addRelation(input: AddRelationInput, existing: Relation[], policies: AssociationPolicy[]): Relation {
  const dup = existing.find(
    (r) =>
      r.workspaceId === input.workspaceId &&
      r.sourceId === input.sourceId &&
      r.targetId === input.targetId &&
      r.kind === input.kind
  );
  if (dup) return dup;

  const rule = `${input.sourceId}->${input.targetId}:${input.kind}`;
  const blocked = policies.some((p) => p.action === 'block' && p.rule === rule);
  if (blocked) throw new Error(`relação bloqueada por política: ${rule}`);

  return createRelation(input);
}

export function acceptSuggestion(s: Suggestion): Suggestion {
  return { ...s, status: 'accepted' };
}

export function rejectSuggestion(s: Suggestion): Suggestion {
  return { ...s, status: 'rejected' };
}
