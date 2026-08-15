/**
 * Tipos do catálogo de livros e artigos da biblioteca.
 *
 * Estes dados são estáticos (lidos dos JSONs brutos em `src/data/books/`),
 * diferente das entidades persistidas de `src/types.ts`.
 */

/** Livro do catálogo de psicoterapias (150 livros, 10 famílias × 15). */
export interface CatalogBook {
  id: string;
  /** Código da família de psicoterapia (ex.: `01_psicanalitica_psicodinamica`). */
  familia: string;
  nome: string;
  autor: string;
  resumo: string;
  trecho: string;
  tipoTrecho: string;
  /** Cor de capa (hex como dado, usada via `style`). */
  coverColor: string;
  /** Cor de acento da capa (hex como dado). */
  accentColor: string;
}

/** Livro da coleção complementar interdisciplinar (100 livros, 10 áreas × 10). */
export interface InterdisciplinaryBook {
  id: string;
  /** Código da área interdisciplinar (ex.: `01_filosofia_e_existencia`). */
  area: string;
  nome: string;
  autor: string;
  resumo: string;
  trecho: string;
  tipoTrecho: string;
  coverColor: string;
  accentColor: string;
}

/** Artigo científico (150 artigos, 15 por família de psicoterapia). */
export interface Article {
  id: string;
  familia: string;
  titulo: string;
  autores: string;
  ano: number;
  periodico: string;
  resumo: string;
  /** DOI/URL do artigo. */
  doi: string;
  /** Link direto para onde o artigo está disponível (prioriza DOI). */
  linkDireto: string;
  classificacao: string;
  observacao: string;
}

/** Metadados de categoria (família de psicoterapia ou área interdisciplinar). */
export interface BookCategoryMeta {
  id: string;
  /** Nome bonito para a UI (ex.: "Psicanálise & Psicodinâmica"). */
  label: string;
  /** Rótulo curto para badges/capas. */
  short: string;
  /** Subtítulo usado no card da coleção. */
  subtitle: string;
  /** Ícone lucide (nome da categoria). */
  icon: string;
  /** Cor de capa (hex). */
  color: string;
  /** Cor de acento (hex). */
  accent: string;
}

/** Grupo de artigos por família (para a seção "artigos científicos"). */
export interface ArticleGroup {
  familia: string;
  label: string;
  color: string;
  accent: string;
  articles: Article[];
}
