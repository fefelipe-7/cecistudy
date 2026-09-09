/**
 * Loader platform-aware do Templo de Conhecimento (irmão de `catalogLibrary.ts`).
 *
 *   nativo → `.db` embutido (`src/lib/db/catalogDb.ts`)
 *   web    → facades lazy (`src/data/temple/`): índice + autores + técnicas num
 *            único chunk (import dinâmico); corpo dos conceitos em chunks por
 *            domínio carregados sob demanda.
 *
 * Todas as promises são memoizadas — telas chamam quantas vezes quiserem.
 */
import { isNativePlatform } from './storage.ts';
import type {
  TempleAuthor,
  TempleComparison,
  TempleConcept,
  TempleConceptDomain,
  TempleConceptIndexEntry,
  TempleTechnique,
  TempleTechniqueCategory,
} from '../types';

type TempleFacade = typeof import('../data/temple/index.ts');

let facadePromise: Promise<TempleFacade> | undefined;

/** Facade web lazy — no nativo não é importado. */
async function getWebFacade(): Promise<TempleFacade | null> {
  if (isNativePlatform) return null;
  if (!facadePromise) facadePromise = import('../data/temple/index.ts');
  return facadePromise;
}

// ---- domínios + índice ----

export async function getTempleConceptDomains(): Promise<TempleConceptDomain[]> {
  const facade = await getWebFacade();
  if (facade) return facade.conceptDomains;
  const { getCatalogConceptDomains } = await import('./db/catalogDb.ts');
  return getCatalogConceptDomains();
}

export async function getTempleConceptIndex(): Promise<TempleConceptIndexEntry[]> {
  const facade = await getWebFacade();
  if (facade) return facade.conceptIndex;
  const { getCatalogConceptIndex } = await import('./db/catalogDb.ts');
  return getCatalogConceptIndex();
}

/** Corpo completo dos conceitos de um domínio (chunk lazy na web). */
export async function getTempleConceptsByDomain(
  domainId: string
): Promise<TempleConcept[]> {
  const facade = await getWebFacade();
  if (facade) {
    const loader = facade.conceptChunkLoader(domainId);
    if (!loader) return [];
    const chunk = await loader();
    return chunk.default;
  }
  const { getCatalogConceptsByDomain } = await import('./db/catalogDb.ts');
  return getCatalogConceptsByDomain<TempleConcept>(domainId);
}

/** Um conceito pelo id (carrega o chunk do domínio na web). */
export async function getTempleConcept(id: string): Promise<TempleConcept | null> {
  const index = await getTempleConceptIndex();
  const entry = index.find((c) => c.id === id);
  if (!entry) return null;
  const concepts = await getTempleConceptsByDomain(entry.domainId);
  return concepts.find((c) => c.id === id) ?? null;
}

// ---- autores ----

let authorsCache: TempleAuthor[] | undefined;

export async function getTempleAuthors(): Promise<TempleAuthor[]> {
  if (authorsCache) return authorsCache;
  const facade = await getWebFacade();
  if (facade) {
    authorsCache = facade.curatedAuthorsFile.authors;
    return authorsCache;
  }
  const { getCatalogAuthors } = await import('./db/catalogDb.ts');
  authorsCache = await getCatalogAuthors<TempleAuthor>();
  return authorsCache;
}

// ---- técnicas ----

let techniqueCategoriesCache: TempleTechniqueCategory[] | undefined;
const techniquesByCategory = new Map<string | undefined, TempleTechnique[]>();

export async function getTempleTechniqueCategories(): Promise<TempleTechniqueCategory[]> {
  if (techniqueCategoriesCache) return techniqueCategoriesCache;
  const facade = await getWebFacade();
  if (facade) {
    techniqueCategoriesCache = facade.techniqueCategories;
    return techniqueCategoriesCache;
  }
  const { getCatalogTechniqueCategories } = await import('./db/catalogDb.ts');
  techniqueCategoriesCache = await getCatalogTechniqueCategories<TempleTechniqueCategory>();
  return techniqueCategoriesCache;
}

export async function getTempleTechniques(categoryId?: string): Promise<TempleTechnique[]> {
  const cached = techniquesByCategory.get(categoryId);
  if (cached) return cached;
  const facade = await getWebFacade();
  let result: TempleTechnique[];
  if (facade) {
    result = categoryId
      ? facade.templeTechniques.filter((t) => t.dominioId === categoryId)
      : facade.templeTechniques;
  } else {
    const { getCatalogTechniques } = await import('./db/catalogDb.ts');
    result = await getCatalogTechniques<TempleTechnique>(categoryId);
  }
  techniquesByCategory.set(categoryId, result);
  return result;
}

// ---- comparações ----

let comparisonsCache: TempleComparison[] | undefined;

export async function getTempleComparisons(): Promise<TempleComparison[]> {
  if (comparisonsCache) return comparisonsCache;
  const facade = await getWebFacade();
  if (facade) {
    comparisonsCache = facade.comparisonsFile.comparacoes;
    return comparisonsCache;
  }
  const { getCatalogComparisons } = await import('./db/catalogDb.ts');
  comparisonsCache = await getCatalogComparisons<TempleComparison>();
  return comparisonsCache;
}

export async function getTempleComparison(slug: string): Promise<TempleComparison | null> {
  const comparisons = await getTempleComparisons();
  return comparisons.find((comparison) => comparison.slug === slug) ?? null;
}

// ---- registry de abordagens ----

/** Resolve qualquer alias de abordagem → canônica (web usa o facade; nativo lê o .json estático). */
export async function resolveApproach(
  aliasId: string
): Promise<{ id: string; name: string; familyId: string | null } | null> {
  const facade = await getWebFacade();
  if (facade) return facade.resolveApproach(aliasId);
  // nativo: o registro é pequeno e estático — importa direto do JSON gerado
  const mod = await import('../data/temple/approachRegistry.json');
  const registry = mod.default as TempleFacade['approachRegistryFile'];
  const canonicalId = registry.resolve[aliasId];
  if (!canonicalId) return null;
  const entry = registry.entries.find((e) => e.id === canonicalId);
  if (!entry) return null;
  return { id: entry.id, name: entry.name, familyId: entry.familyId };
}
