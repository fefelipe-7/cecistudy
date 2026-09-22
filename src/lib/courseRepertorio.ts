/**
 * Resolução do repertório da disciplina (SPEC-001): conceitos-chave, autores
 * fundamentais e bibliografia recomendada a partir dos vínculos explícitos da
 * `Course` (`conceptIds`/`authorIds`/`bibliographyIds`) unidos ao caminho
 * legado (`concept.courseIds`, autores transitivos de conceitos/anotações,
 * `reading.courseId`/`material.courseId`).
 *
 * Puro e síncrono: não importa React nem Capacitor. O catálogo estático
 * (livros/artigos) é INJETADO (`entities.catalog`) para manter o módulo
 * testável e sem puxar o facade pesado no import.
 */
import type {
  ClassNote,
  Course,
  MaterialItem,
  PsychologyAuthor,
  PsychologyConcept,
  ReadingItem,
} from '../types';

/** Ref leve de obra do catálogo (só o que o repertório precisa renderizar). */
export interface CatalogWorkRef {
  id: string;
  title: string;
  author: string;
}

/** Catálogo estático injetado para resolver ids `cat-*`/`inter-*`/`art-*`. */
export interface RepertorioCatalog {
  books: CatalogWorkRef[];
  interdisciplinary: CatalogWorkRef[];
  articles: CatalogWorkRef[];
}

/** Entidades do banco pessoal + referências do catálogo disponíveis. */
export interface CourseRepertorioEntities {
  concepts: PsychologyConcept[];
  authors: PsychologyAuthor[];
  readings: ReadingItem[];
  materials: MaterialItem[];
  classes: ClassNote[];
  catalog?: RepertorioCatalog;
}

/** Item de bibliografia resolvido — leitura/material pessoal ou obra do catálogo. */
export type RepertorioBibliographyItem =
  | { kind: 'reading'; ref: ReadingItem }
  | { kind: 'material'; ref: MaterialItem }
  | { kind: 'cat-book'; title: string; author: string }
  | { kind: 'inter-book'; title: string; author: string }
  | { kind: 'article'; title: string; author: string };

export interface CourseRepertorioResolved {
  concepts: PsychologyConcept[];
  authors: PsychologyAuthor[];
  bibliography: RepertorioBibliographyItem[];
}

/** Prefixos de id por fonte (tabela da SPEC-001). */
export const PERSONAL_READING_PREFIX = 'r-';
export const PERSONAL_MATERIAL_PREFIX = 'm-';
export const CATALOG_BOOK_PREFIX = 'cat-';
export const INTERDISCIPLINARY_PREFIX = 'inter-';
export const ARTICLE_PREFIX = 'art-';

export const COURSE_REPERTORY_PREFIXES = [
  PERSONAL_READING_PREFIX,
  PERSONAL_MATERIAL_PREFIX,
  CATALOG_BOOK_PREFIX,
  INTERDISCIPLINARY_PREFIX,
  ARTICLE_PREFIX,
] as const;

export const isCatalogWorkId = (id: string): boolean =>
  [CATALOG_BOOK_PREFIX, INTERDISCIPLINARY_PREFIX, ARTICLE_PREFIX].some((p) => id.startsWith(p));

export const isPersonalBibliographyId = (id: string): boolean =>
  id.startsWith(PERSONAL_READING_PREFIX) || id.startsWith(PERSONAL_MATERIAL_PREFIX);

/** Concatena dois mapeamentos por id preservando a ordem (chave já vista não duplica). */
function mergeByKey<T>(key: (t: T) => string, ...lists: T[][]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const list of lists) {
    for (const item of list) {
      const k = key(item);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/**
 * Resolve o repertório de uma disciplina: união dos vínculos explícitos
 * (`conceptIds`/`authorIds`/`bibliographyIds`) com o caminho legado,
 * deduplicada por id.
 */
export function resolveCourseRepertorio(
  course: Course,
  entities: CourseRepertorioEntities
): CourseRepertorioResolved {
  const conceptIds = new Set(course.conceptIds ?? []);
  const authorIds = new Set(course.authorIds ?? []);
  const bibliographyIds = new Set(course.bibliographyIds ?? []);

  // ---- conceitos: vínculo explícito ∪ legado (concept.courseIds) ----
  const conceptsByLegacy = entities.concepts.filter((c) => c.courseIds?.includes(course.id));
  const concepts = mergeByKey(
    (c) => c.id,
    entities.concepts.filter((c) => conceptIds.has(c.id)),
    conceptsByLegacy
  );

  // ---- autores: vínculo explícito ∪ legado (transitividade) ----
  const authorIdsByDerivation = new Set<string>();
  const addDerived = (ids?: string[]) => ids?.forEach((id) => authorIdsByDerivation.add(id));
  concepts.forEach((c) => addDerived(c.authorIds));
  entities.classes
    .filter((cl) => cl.courseId === course.id)
    .forEach((cl) => addDerived(cl.authorIds));
  const authors = mergeByKey(
    (a) => a.id,
    entities.authors.filter((a) => authorIds.has(a.id)),
    entities.authors.filter((a) => authorIdsByDerivation.has(a.id))
  );

  // ---- bibliografia: vínculo explícito ∪ legado (reading/material courseId) ----
  const readingMap = new Map(entities.readings.map((r) => [r.id, r]));
  const materialMap = new Map(entities.materials.map((m) => [m.id, m]));
  const catBookMap = new Map((entities.catalog?.books ?? []).map((b) => [b.id, b]));
  const interMap = new Map((entities.catalog?.interdisciplinary ?? []).map((b) => [b.id, b]));
  const articleMap = new Map((entities.catalog?.articles ?? []).map((a) => [a.id, a]));

  const push = (key: string, item: RepertorioBibliographyItem) => {
    if (bibliographySeen.has(key)) return;
    bibliographySeen.add(key);
    bibliography.push(item);
  };
  const bibliography: RepertorioBibliographyItem[] = [];
  const bibliographySeen = new Set<string>();

  for (const id of bibliographyIds) {
    const reading = readingMap.get(id);
    if (reading) {
      push(id, { kind: 'reading', ref: reading });
      continue;
    }
    const material = materialMap.get(id);
    if (material) {
      push(id, { kind: 'material', ref: material });
      continue;
    }
    const catBook = catBookMap.get(id);
    if (catBook) {
      push(id, { kind: 'cat-book', title: catBook.title, author: catBook.author });
      continue;
    }
    const inter = interMap.get(id);
    if (inter) {
      push(id, { kind: 'inter-book', title: inter.title, author: inter.author });
      continue;
    }
    const article = articleMap.get(id);
    if (article) {
      push(id, { kind: 'article', title: article.title, author: article.author });
      continue;
    }
  }

  entities.readings
    .filter((r) => r.courseId === course.id)
    .forEach((r) => push(r.id, { kind: 'reading', ref: r }));
  entities.materials
    .filter((m) => m.courseId === course.id)
    .forEach((m) => push(m.id, { kind: 'material', ref: m }));

  return { concepts, authors, bibliography };
}