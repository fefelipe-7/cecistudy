/**
 * Registry canônico das coleções de domínio (Fase 0 / T0.3 da sincronização
 * mobile ↔ desktop).
 *
 * Este arquivo é a **fonte única** da lista de coleções persistidas. Antes ela
 * existia implicitamente espalhada: `USER_COLLECTION_KEYS` em
 * `src/lib/db/normalize.ts`, o `TABLE_BY_KEY` logo abaixo dele, o
 * `PersistedDatabase`/`EmptyDatabase` em `src/data/empty.ts` e o
 * `USER_COLLECTION_KEYS` de `cecistudy-data` (Rust). Qualquer coleção nova
 * precisei ser lembrada em N lugares — foi assim que `decks` (chegou na
 * migração 16) ficou no payload sem estar em nenhum `USER_COLLECTION_KEYS`.
 *
 * Regra: coleção nova entra **aqui**, e os consumidores passam a derivar.
 *
 * ## Decisões de escopo (deliberadamente adiadas)
 *
 * A spec §7 pede por chave também `mergeStrategy`, `deletionPolicy`,
 * `introducedIn` e `validationSchema`. Elas **não** estão aqui de propósito:
 * nenhum consumidor existe até a Fase 1 (merge/outbox), e campo sem
 * consumidor é dívida. Devem entrar na mesma task que as passar a usar.
 *
 * A spec pede `id` **e** "chave persistida" como campos separados. Estão
 * unificados em `key`: hoje `id === chave persistida` nas 24 coleções, e um
 * campo idêntico sem uso seria peso morto. Se um dia uma chave precisar ser
 * renomeada sem quebrar o payload, aí `id` ganha a depreciação da chave.
 *
 * ## Escopo de sincronização (§7.1/§7.2 da spec)
 *
 * `syncable: false` tem duas razões distintas, e a diferença importa:
 * - `supervision` — coleção **legada**. `DataClientProvider` já migrou o
 *   antigo `supervisionNotebook` para dentro de `internshipLogs` (a
 *   `SupervisionView` filtra `internshipLogs` por `type === 'supervisao'`), e
 *   por isso ela não existe mais em `EmptyDatabase` nem no payload. Continua
 *   aqui porque a tabela `supervision_notebook` e a chave de Preferences ainda
 *   existem, e o import legado precisa ler o que sobrou — remover a linha
 *   agora viraria perda de dado em vez de limpeza. Enquanto for legado, ela
 *   fica de fora do contrato de sync; promovê-la é uma task explícita
 *   (tipar em `types.ts` + seed em `empty.ts` + payload + flip da flag).
 * - `savedBookIds`/`bookmarkedCourseIds`/`readingProgress`/`streakData` —
 *   entram no sync, mas exigem merge por conjunto/mapa (§7.1), não LWW de
 *   documento. Por isso são `syncable: true` com a estratégia de merge
 *   pendente.
 */

/** Forma do valor persistido — define como `normalize` lê/grava a coleção. */
export type CollectionKind =
  /** um objeto único (`profile`, `tcc`, `streakData`) */
  | 'singleton'
  /** lista de entidades (`courses`, `flashcards`, `decks`, …) */
  | 'array'
  /** lista de ids gravada em `saved_catalog_item` filtrada por `item_type` */
  | 'idList'
  /** mapa string→número (`readingProgress`: obra → páginas) */
  | 'map';

export interface CollectionSpec {
  /**
   * Chave persistida: nome do campo no payload/backup, na base da usuária e
   * no `data_json`. É a identidade da coleção para validação, export, import
   * e merge.
   *
   * A ordem do array é a **ordem de hidratação/import legado** (era a ordem do
   * `USER_COLLECTION_KEYS` em `normalize.ts`, usada por
   * `importLegacyCollections` e `loadAllCollections`). Ela **não** é a ordem do
   * payload — essa é a ordem de `buildBackupData`/`EmptyDatabase`, e já diverge
   * (`techniques` vem depois de `bookmarkedCourseIds` no payload). Não
   * reordenar: import legado e migração de Preferences dependem da sequência.
   */
  readonly key: string;
  readonly kind: CollectionKind;
  /**
   * Tabela física da coleção em `cecistudy_user` (`null` = pref sem tabela
   * própria). Repare que `key` e tabela quase nunca coincidem — é exatamente
   * essa diferença que o registry torna explícita, em vez de implícita em
   * `table_by_key`.
   */
  readonly table: string | null;
  /** Discriminador em `saved_catalog_item.item_type` (só `kind: 'idList'`). */
  readonly itemType?: string;
  /** Entra no payload de sincronização? (spec §7.1) */
  readonly syncable: boolean;
}

/**
 * As 24 coleções persistidas na base da usuária, na ordem do payload.
 * `reminder`, `onboarding` e `syncIndex` são preferências (Preferences) e os
 * catálogos `approaches`/`questions` são dados estáticos — nenhum dos dois
 * grupos entra aqui (spec §7.2).
 */
export const COLLECTIONS = [
  { key: 'profile', kind: 'singleton', table: 'profile', syncable: true },
  { key: 'courses', kind: 'array', table: 'course', syncable: true },
  { key: 'classes', kind: 'array', table: 'class_note', syncable: true },
  { key: 'tasks', kind: 'array', table: 'task', syncable: true },
  { key: 'exams', kind: 'array', table: 'assessment', syncable: true },
  { key: 'authors', kind: 'array', table: 'author', syncable: true },
  { key: 'concepts', kind: 'array', table: 'concept', syncable: true },
  { key: 'readings', kind: 'array', table: 'reading', syncable: true },
  { key: 'flashcards', kind: 'array', table: 'flashcard', syncable: true },
  { key: 'decks', kind: 'array', table: 'deck', syncable: true },
  { key: 'materials', kind: 'array', table: 'material', syncable: true },
  { key: 'techniques', kind: 'array', table: 'technique', syncable: true },
  // chave `internshipLogs` → tabela `internship`: o mesmo desvio dos demais,
  // agora declarado uma vez só em vez de repetido em read/write.
  { key: 'internshipLogs', kind: 'array', table: 'internship', syncable: true },
  { key: 'supervision', kind: 'array', table: 'supervision_notebook', syncable: false },
  { key: 'tcc', kind: 'singleton', table: 'thesis_project', syncable: true },
  { key: 'stickers', kind: 'array', table: 'achievement', syncable: true },
  { key: 'sessions', kind: 'array', table: 'study_session', syncable: true },
  { key: 'streakData', kind: 'singleton', table: 'streak', syncable: true },
  { key: 'looseNotes', kind: 'array', table: 'note', syncable: true },
  { key: 'savedBookIds', kind: 'idList', table: 'saved_catalog_item', itemType: 'book', syncable: true },
  { key: 'bookmarkedCourseIds', kind: 'idList', table: 'saved_catalog_item', itemType: 'course', syncable: true },
  { key: 'readingProgress', kind: 'map', table: 'reading_progress', syncable: true },
  { key: 'quizSessions', kind: 'array', table: 'quiz_session', syncable: true },
  // SPEC-005: entra no **fim** de propósito. A ordem do array é a ordem de
  // hidratação/import legado (ver `CollectionSpec.key`); inserting no meio
  // mudaria a sequência com que `importLegacyCollections`/`loadAllCollections`
  // leem as tabelas. `academicTerms` não tem dependência de leitura de nenhuma
  // outra coleção, então o fim é seguro.
  { key: 'academicTerms', kind: 'array', table: 'academic_term', syncable: true },
] as const satisfies readonly CollectionSpec[];

/** União das chaves persistidas (ex.: `'courses' | 'decks' | …`). */
export type CollectionKey = (typeof COLLECTIONS)[number]['key'];

/** @deprecated Use `CollectionKey`. Mantido porque é o nome importado pelo app. */
export type UserCollectionKey = CollectionKey;

const BY_KEY = new Map<string, CollectionSpec>(COLLECTIONS.map((c) => [c.key, c]));

/** Coleções persistidas, na ordem do payload (ordem estável p/ import legado). */
export const USER_COLLECTION_KEYS = COLLECTIONS.map((c) => c.key) as CollectionKey[];

/** `true` se `key` é uma das coleções persistidas da base da usuária. */
export function isUserCollectionKey(key: string): key is CollectionKey {
  return BY_KEY.has(key);
}

/** Spec da coleção, ou `undefined` se a chave não é persistida. */
export function getCollection(key: string): CollectionSpec | undefined {
  return BY_KEY.get(key);
}

/** Tabela física da coleção, ou `null` se não houver (ou chave desconhecida). */
export function getCollectionTable(key: string): string | null {
  return BY_KEY.get(key)?.table ?? null;
}

/** Coleções que entram no payload de sincronização (spec §7.1). */
export const SYNCABLE_COLLECTION_KEYS = COLLECTIONS.filter((c) => c.syncable).map(
  (c) => c.key
) as CollectionKey[];

/** Coleções com merge por conjunto/mapa — exigem tombstones/stamp por chave. */
export const SET_LIKE_COLLECTION_KEYS: CollectionKey[] = [
  'savedBookIds',
  'bookmarkedCourseIds',
  'readingProgress',
  'streakData',
];
