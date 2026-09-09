import type { InternshipLog, SupervisionNotebook } from '../types';

/**
 * Migração one-shot (Fase 3 do estágio v3): converte o caderno de supervisão
 * (coleção legada `SupervisionNotebook[]`) em registros de `InternshipLog`
 * com `type: 'supervisao'`, unificando todo o domínio do estágio no `InternshipLog`.
 *
 * Executada na primeira abertura pós-update e idempotente: após a conversão,
 * a coleção legada é limpa para não re-migrar.
 */
export function migrateSupervisionNotebook(
  logs: InternshipLog[],
  notebooks: SupervisionNotebook[]
): InternshipLog[] {
  const migrated: InternshipLog[] = notebooks.map((nb) => ({
    id: nb.id,
    type: 'supervisao',
    date: nb.date,
    hours: 0,
    activity: nb.supervisor ? `supervisão com ${nb.supervisor}` : 'supervisão',
    reflections: '',
    supervisor: nb.supervisor,
    topics: nb.questions,
    referenceIds: nb.referenceIds,
    conceptIds: nb.conceptIds ?? [],
    nextSteps: nb.nextSteps,
    beforeNotes: nb.beforeNotes,
    afterNotes: nb.afterNotes,
    selfAssessment: nb.selfAssessment,
  }));
  return [...logs, ...migrated];
}
