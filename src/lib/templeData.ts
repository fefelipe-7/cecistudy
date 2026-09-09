/**
 * Loader platform-aware do Templo de Conhecimento (irmão de `catalogLibrary.ts`).
 *
 *   nativo → `.db` embutido (`src/lib/db/catalogDb.ts`)
 *   web    → facades split (`src/data/temple/`) carregados sob demanda por
 *            dataset: índice/corpos de conceitos em chunks próprios, autores,
 *            técnicas, comparações e o registry cada um no seu chunk — nada do
 *            monólito antigo (~5 MB) entra quando o usuário abre uma seção só.
 *
 * Todos os loads são memoizados — telas chamam quantas vezes quiserem.
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
import { conceptChunkLoader } from '../data/temple/conceptChunks.ts';

// ---- domínios + índice ----

export async function getTempleConceptDomains(): Promise<TempleConceptDomain[]> {
  if (isNativePlatform) {
    const { getCatalogConceptDomains } = await import('./db/catalogDb.ts');
    return getCatalogConceptDomains();
  }
  const { conceptDomains } = await import('../data/temple/conceptChunks.ts');
  return conceptDomains;
}

export async function getTempleConceptIndex(): Promise<TempleConceptIndexEntry[]> {
  if (isNativePlatform) {
    const { getCatalogConceptIndex } = await import('./db/catalogDb.ts');
    return getCatalogConceptIndex();
  }
  const { conceptIndex } = await import('../data/temple/conceptIndex.ts');
  return conceptIndex;
}

const conceptsByDomainCache = new Map<string, Promise<TempleConcept[]>>();

/** Corpo completo dos conceitos de um domínio (chunk lazy na web). */
export async function getTempleConceptsByDomain(
  domainId: string
): Promise<TempleConcept[]> {
  if (isNativePlatform) {
    const { getCatalogConceptsByDomain } = await import('./db/catalogDb.ts');
    return getCatalogConceptsByDomain<TempleConcept>(domainId);
  }
  const cached = conceptsByDomainCache.get(domainId);
  if (cached) return cached;
  const promise = (async () => {
    const loader = conceptChunkLoader(domainId);
    if (!loader) return [];
    const chunk = await loader();
    return chunk.default;
  })();
  conceptsByDomainCache.set(domainId, promise);
  return promise;
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
  if (isNativePlatform) {
    const { getCatalogAuthors } = await import('./db/catalogDb.ts');
    authorsCache = await getCatalogAuthors<TempleAuthor>();
    return authorsCache;
  }
  const { curatedAuthorsFile } = await import('../data/temple/authors.ts');
  authorsCache = curatedAuthorsFile.authors;
  return authorsCache;
}

// ---- técnicas ----

let techniqueCategoriesCache: TempleTechniqueCategory[] | undefined;
const techniquesByCategory = new Map<string | undefined, TempleTechnique[]>();

export async function getTempleTechniqueCategories(): Promise<TempleTechniqueCategory[]> {
  if (techniqueCategoriesCache) return techniqueCategoriesCache;
  if (isNativePlatform) {
    const { getCatalogTechniqueCategories } = await import('./db/catalogDb.ts');
    techniqueCategoriesCache = await getCatalogTechniqueCategories<TempleTechniqueCategory>();
    return techniqueCategoriesCache;
  }
  const { techniqueCategories } = await import('../data/temple/techniques.ts');
  techniqueCategoriesCache = techniqueCategories;
  return techniqueCategoriesCache;
}

export async function getTempleTechniques(categoryId?: string): Promise<TempleTechnique[]> {
  const cached = techniquesByCategory.get(categoryId);
  if (cached) return cached;
  let result: TempleTechnique[];
  if (isNativePlatform) {
    const { getCatalogTechniques } = await import('./db/catalogDb.ts');
    result = await getCatalogTechniques<TempleTechnique>(categoryId);
  } else {
    const { templeTechniques } = await import('../data/temple/techniques.ts');
    result = categoryId
      ? templeTechniques.filter((t) => t.dominioId === categoryId)
      : templeTechniques;
  }
  techniquesByCategory.set(categoryId, result);
  return result;
}

// ---- comparações ----

let comparisonsCache: TempleComparison[] | undefined;

export async function getTempleComparisons(): Promise<TempleComparison[]> {
  if (comparisonsCache) return comparisonsCache;
  if (isNativePlatform) {
    const { getCatalogComparisons } = await import('./db/catalogDb.ts');
    comparisonsCache = await getCatalogComparisons<TempleComparison>();
    return comparisonsCache;
  }
  const { comparisonsFile } = await import('../data/temple/comparisons.ts');
  comparisonsCache = comparisonsFile.comparacoes;
  return comparisonsCache;
}

export async function getTempleComparison(slug: string): Promise<TempleComparison | null> {
  const comparisons = await getTempleComparisons();
  return comparisons.find((comparison) => comparison.slug === slug) ?? null;
}

// ---- registry de abordagens ----

let approachRegistryModule: Promise<typeof import('../data/temple/registry.ts')> | undefined;

/** Resolve qualquer alias de abordagem → canônica; registro pequeno, chunk próprio. */
export async function resolveApproach(
  aliasId: string
): Promise<{ id: string; name: string; familyId: string | null } | null> {
  if (!approachRegistryModule) {
    approachRegistryModule = import('../data/temple/registry.ts');
  }
  const registry = await approachRegistryModule;
  return registry.resolveApproach(aliasId);
}