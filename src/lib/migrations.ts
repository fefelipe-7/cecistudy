import type { InternshipLog, SupervisionNotebook } from '../types';
import { legacyNotebookToLog } from '../lib/internshipCases';

/**
 * Migração one-shot (SPEC-009 §6.2): converte o caderno de supervisão legado
 * (`SupervisionNotebook[]`) em `InternshipLog` de `type: 'supervisao'`.
 *
 * **O mapeamento mora em `legacyNotebookToLog`, no domínio** — a mesma função que a
 * `MIGRATIONS[20]` usa. Antes o mapeamento existia em dois lugares (este arquivo e
 * a migração), e só este recebia `workspaceId`; hoje os dois caminhos são a mesma
 * regra, então não podem divergir.
 *
 * Idempotência por `id`: um caderno cujo id já existe em `logs` não é convertido de
 * novo. A versão anterior confiava no chamador limpar a coleção depois — e como
 * `F8` mostrou, ninguém lia a chave certa, então a garantia nunca valiu.
 */
export function migrateSupervisionNotebook(
  logs: InternshipLog[],
  notebooks: SupervisionNotebook[]
): InternshipLog[] {
  if (!notebooks.length) return logs;
  const byId = new Set(logs.map((l) => l.id));
  const migrated: InternshipLog[] = [];
  for (const nb of notebooks) {
    if (!nb?.id || byId.has(nb.id)) continue;
    const log = legacyNotebookToLog(nb);
    migrated.push(log);
    byId.add(log.id);
  }
  return migrated.length ? [...logs, ...migrated] : logs;
}