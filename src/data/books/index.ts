/**
 * Facade tipada do catálogo de livros e artigos da biblioteca (web).
 *
 * Lê os JSONs brutos (`src/data/books/*.json`), mapeia para arrays tipados e
 * delega a curadoria (coleções/grupos/mistas) para `curateLibrary()` — a MESMA
 * função usada pelo nativo ao ler o banco do catálogo SQLite
 * (`src/lib/db/catalogLibrary.ts`). Assim as duas fontes produzem estruturas
 * idênticas.
 *
 * No nativo este módulo continua existindo como fallback inicial; a view troca
 * para os dados do catálogo quando disponíveis.
 *
 * Fonte bruta original: `library/books/` (mantida como backup).
 */
import rawCatalog from './catalogo_livros_portugues.json';
import rawInterdisciplinary from './livros_interdisciplinares_100.json';
import rawArticles from './artigos_150.json';
import { PSYCHOTHERAPY_FAMILIES, INTERDISCIPLINARY_AREAS } from './families';
import {
  Article,
  ArticleGroup,
  CatalogBook,
  InterdisciplinaryBook,
} from './types';
import { curateLibrary } from './curate';

export type {
  Article,
  ArticleGroup,
  BookCategoryMeta,
  CatalogBook,
  InterdisciplinaryBook,
} from './types';
export type { MixedCollection, LibraryDataset } from './curate';
export { curateLibrary } from './curate';

// ---------------------------------------------------------------------------
// Tipos brutos dos JSONs
// ---------------------------------------------------------------------------
interface RawCatalogBook {
  familia: string;
  nome: string;
  autor: string;
  resumo_do_livro: string;
  trecho_memoravel: string;
  tipo_trecho: string;
}

interface RawInterdisciplinaryBook extends RawCatalogBook {
  area: string;
  colecao: string;
}

interface RawArticle {
  familia: string;
  titulo: string;
  autores: string;
  ano: number;
  periodico: string;
  resumo: string;
  doi: string;
  link_direto: string;
  classificacao: string;
  observacao_relevancia: string;
}

// ---------------------------------------------------------------------------
// Helper de capa (cor determinística por família/área)
// ---------------------------------------------------------------------------
function metaOr<T extends { color: string; accent: string }>(
  meta: T | undefined,
  fallback: T
): T {
  return (meta ?? fallback) as T;
}

const FALLBACK_STYLE = { color: '#DCCBB8', accent: '#756354' };

/** Livros marcados "[sem edição brasileira confirmada]" ficam fora do catálogo. */
const SEM_EDICAO_BR = '[sem edição brasileira confirmada]';

// ---------------------------------------------------------------------------
// 150 livros do catálogo de psicoterapias (10 famílias × 15)
// ---------------------------------------------------------------------------
export const catalogBooks: CatalogBook[] = (rawCatalog as RawCatalogBook[])
  .filter((b) => !b.nome.includes(SEM_EDICAO_BR))
  .map((b, i) => {
    const meta = metaOr(PSYCHOTHERAPY_FAMILIES[b.familia], FALLBACK_STYLE);
    return {
      id: `cat-${i + 1}`,
      familia: b.familia,
      nome: b.nome,
      autor: b.autor,
      resumo: b.resumo_do_livro,
      trecho: b.trecho_memoravel,
      tipoTrecho: b.tipo_trecho,
      coverColor: meta.color,
      accentColor: meta.accent,
    };
  });

// ---------------------------------------------------------------------------
// 100 livros interdisciplinares (10 áreas × 10)
// ---------------------------------------------------------------------------
export const interdisciplinaryBooks: InterdisciplinaryBook[] = (
  rawInterdisciplinary as RawInterdisciplinaryBook[]
).map((b, i) => {
  const meta = metaOr(INTERDISCIPLINARY_AREAS[b.area], FALLBACK_STYLE);
  return {
    id: `inter-${i + 1}`,
    area: b.area,
    nome: b.nome,
    autor: b.autor,
    resumo: b.resumo_do_livro,
    trecho: b.trecho_memoravel,
    tipoTrecho: b.tipo_trecho,
    coverColor: meta.color,
    accentColor: meta.accent,
  };
});

// ---------------------------------------------------------------------------
// 150 artigos científicos (15 por família)
// ---------------------------------------------------------------------------
export const articles: Article[] = (rawArticles as RawArticle[]).map((a, i) => ({
  id: `art-${i + 1}`,
  familia: a.familia,
  titulo: a.titulo,
  autores: a.autores,
  ano: a.ano,
  periodico: a.periodico,
  resumo: a.resumo,
  doi: a.doi,
  linkDireto: a.link_direto,
  classificacao: a.classificacao,
  observacao: a.observacao_relevancia,
}));

// ---------------------------------------------------------------------------
// Curadoria compartilhada (idêntica à do catálogo nativo)
// ---------------------------------------------------------------------------
const curated = curateLibrary({ catalogBooks, interdisciplinaryBooks, articles });

export const psychotherapyCollections = curated.psychotherapyCollections;
export const complementaryCollections = curated.complementaryCollections;
export const articleGroups = curated.articleGroups;
export const mixedCollections = curated.mixedCollections;

/** Busca o grupo de artigos de uma família (fallback vazio). */
export function articlesForFamily(familia: string): Article[] {
  return curated.articlesByFamily[familia] ?? [];
}
