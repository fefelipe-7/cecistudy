import type { InternshipLog, InternshipPhase } from '../types';

/**
 * Deriva a `phase` de um registro de estágio a partir do conteúdo (v3).
 * A fase não é mais escolhida pela usuária; é inferida do estágio do ciclo.
 *
 * - supervisão/intervisão  → `supervisionar`
 * - preparou o campo       → `preparar`
 * - teve reflexão          → `refletir`
 * - senão                  → `registrar`
 *
 * `entregar` é a etapa terminal do ciclo (guia visual), não derivada de
 * um único registro.
 */
export function derivedPhase(log: InternshipLog): InternshipPhase {
  if (log.type === 'supervisao' || log.type === 'intervisao') return 'supervisionar';
  if (log.prepChecklist && log.prepChecklist.length > 0) return 'preparar';
  if (log.reflections?.trim()) return 'refletir';
  return 'registrar';
}