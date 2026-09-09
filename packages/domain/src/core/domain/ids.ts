/**
 * Geração de IDs estáveis para entidades do domínio.
 *
 * Prefixo por tipo + base temporal + contador de processo + random curto.
 * Não depende de React, localStorage, Capacitor ou Tauri. A base temporal é
 * apenas para legibilidade/hash; a unicidade vem do contador + random.
 */
export type EntityPrefix =
  | 'ws' // workspace
  | 'doc' // document
  | 'blk' // block
  | 'rel' // relation
  | 'sgt' // suggestion
  | 'asp' // association policy
  | 'cal' // calendar event
  | 'rec' // recurrence rule
  | 'ocn' // occurrence
  | 'rsp' // responsibility
  | 'plb' // planning block
  | 'exe' // execution record
  | 'sub' // subtask
  | 'prj' // project
  | 'out' // output
  | 'acn' // academic node
  | 'ref' // reference
  | 'cit' // citation
  | 'pos' // positioning profile
  | 'ide' // content idea
  | 'cbe' // content base
  | 'cvr' // channel variant
  | 'pub' // publication
  | 'mts' // metric snapshot
  | 'sin'; // strategic insight

let counter = 0;

export function makeId(prefix: EntityPrefix): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}-${rand}`;
}

/** Extrai o prefixo de um id gerado por `makeId` (útil em debug/validação). */
export function prefixOf(id: string): EntityPrefix | null {
  const p = id.split('-')[0];
  return (p as EntityPrefix) ?? null;
}
