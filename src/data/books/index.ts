/**
 * Facade tipada do catálogo de livros e artigos da biblioteca.
 *
 * Lê os JSONs brutos (`src/data/books/*.json`) e expõe arrays tipados +
 * coleções curadas prontas para a UI (`ContextCollection`) e grupos de
 * artigos por família.
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
import { CollectionBook, ContextCollection } from '../libraryData';

export type {
  Article,
  ArticleGroup,
  BookCategoryMeta,
  CatalogBook,
  InterdisciplinaryBook,
} from './types';

/** Coleção mista curada: mistura livros (catálogo + bagagem) e artigos. */
export interface MixedCollection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  accent: string;
  books: CollectionBook[];
  articles: Article[];
}

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
  fallback: { color: string; accent: string }
): T {
  return (meta ?? fallback) as T;
}

const FALLBACK_STYLE = { color: '#DCCBB8', accent: '#756354' };

function bookCard(
  id: string,
  title: string,
  author: string,
  description: string,
  quote: string,
  meta: { color: string; accent: string; short?: string; label?: string }
): CollectionBook {
  return {
    id,
    title,
    author,
    coverColor: meta.color,
    accentColor: meta.accent,
    badge: meta.short ?? 'catálogo',
    description,
    quote,
    tags: meta.label ? [meta.label, meta.short ?? meta.label].filter(Boolean) : [],
    courseName: meta.label,
  };
}

function readersAvatars(color: string, accent: string) {
  return [
    { name: 'Ceci', bg: '#FFD3DD', text: '#B94862' },
    { name: 'Ana', bg: color, text: accent },
    { name: 'Lia', bg: '#CEE7F0', text: '#396D82' },
  ];
}

// ---------------------------------------------------------------------------
// 150 livros do catálogo de psicoterapias (10 famílias × 15)
// ---------------------------------------------------------------------------
// Livros marcados "[sem edição brasileira confirmada]" têm título original em
// inglês e não são editados no Brasil — ficam de fora do catálogo exibido.
const SEM_EDICAO_BR = '[sem edição brasileira confirmada]';

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
// Coleções curadas: 10 famílias de psicoterapia
// ---------------------------------------------------------------------------
const catalogByFamily = catalogBooks.reduce<Record<string, CollectionBook[]>>(
  (acc, b) => {
    (acc[b.familia] = acc[b.familia] ?? []).push(
      bookCard(b.id, b.nome, b.autor, b.resumo, b.trecho, {
        color: b.coverColor,
        accent: b.accentColor,
        short: PSYCHOTHERAPY_FAMILIES[b.familia]?.short,
        label: PSYCHOTHERAPY_FAMILIES[b.familia]?.label,
      })
    );
    return acc;
  },
  {}
);

export const psychotherapyCollections: ContextCollection[] = Object.entries(
  PSYCHOTHERAPY_FAMILIES
)
  .filter(([, meta]) => (catalogByFamily[meta.id]?.length ?? 0) > 0)
  .map(([familia, meta]) => ({
    id: `col-${familia}`,
    blockType: 'catalog',
    blockCategory: 'psicoterapias',
    title: meta.label,
    subtitle: meta.subtitle,
    readersCount: catalogByFamily[familia]?.length ?? 0,
    readersAvatars: readersAvatars(meta.color, meta.accent),
    books: catalogByFamily[familia] ?? [],
  }));

// ---------------------------------------------------------------------------
// Coleções curadas: 10 áreas interdisciplinares (bagagem complementar)
// ---------------------------------------------------------------------------
const complementaryByArea = interdisciplinaryBooks.reduce<
  Record<string, CollectionBook[]>
>((acc, b) => {
  (acc[b.area] = acc[b.area] ?? []).push(
    bookCard(b.id, b.nome, b.autor, b.resumo, b.trecho, {
      color: b.coverColor,
      accent: b.accentColor,
      short: INTERDISCIPLINARY_AREAS[b.area]?.short,
      label: INTERDISCIPLINARY_AREAS[b.area]?.label,
    })
  );
  return acc;
}, {});

export const complementaryCollections: ContextCollection[] = Object.entries(
  INTERDISCIPLINARY_AREAS
).map(([area, meta]) => ({
  id: `col-${area}`,
  blockType: 'complementary',
  blockCategory: 'complementar',
  title: meta.label,
  subtitle: meta.subtitle,
  readersCount: complementaryByArea[area]?.length ?? 0,
  readersAvatars: readersAvatars(meta.color, meta.accent),
  books: complementaryByArea[area] ?? [],
}));

// ---------------------------------------------------------------------------
// Grupos de artigos por família (para a seção "artigos científicos")
// ---------------------------------------------------------------------------
const articlesByFamily = articles.reduce<Record<string, Article[]>>((acc, a) => {
  (acc[a.familia] = acc[a.familia] ?? []).push(a);
  return acc;
}, {});

export const articleGroups: ArticleGroup[] = Object.entries(
  PSYCHOTHERAPY_FAMILIES
).map(([familia, meta]) => ({
  familia,
  label: meta.label,
  color: meta.color,
  accent: meta.accent,
  articles: articlesByFamily[familia] ?? [],
}));

/** Busca o grupo de artigos de uma família (fallback vazio). */
export function articlesForFamily(familia: string): Article[] {
  return articlesByFamily[familia] ?? [];
}

// ---------------------------------------------------------------------------
// Categorias mistas curadas: misturam livros (catálogo + bagagem complementar)
// e artigos científicos em temas transversais.
// ---------------------------------------------------------------------------
function pickFrom<T>(pool: Record<string, T[]>, spec: Record<string, number>): T[] {
  return Object.entries(spec).flatMap(([key, n]) => (pool[key] ?? []).slice(0, n));
}

export const mixedCollections: MixedCollection[] = [
  {
    id: 'col-misto-mente',
    title: 'mente & cérebro',
    subtitle: 'neurociência, psicanálise e terapia cognitiva de mãos dadas',
    icon: 'brain',
    color: '#BFDDED',
    accent: '#396D82',
    books: [
      ...pickFrom(complementaryByArea, { '08_neurociencia_cerebro_e_comportamento': 3 }),
      ...pickFrom(catalogByFamily, { '01_psicanalitica_psicodinamica': 4 }),
    ],
    articles: pickFrom(articlesByFamily, { '04_cognitiva_tcc': 4 }),
  },
  {
    id: 'col-misto-existencia',
    title: 'existência & sentido',
    subtitle: 'as grandes perguntas sobre viver bem e a terapia que as escuta',
    icon: 'sun',
    color: '#DCCBB8',
    accent: '#756354',
    books: [
      ...pickFrom(complementaryByArea, { '01_filosofia_e_existencia': 3 }),
      ...pickFrom(catalogByFamily, { '02_existencial_humanista': 1 }),
    ],
    articles: pickFrom(articlesByFamily, { '02_existencial_humanista': 4 }),
  },
  {
    id: 'col-misto-vinculos',
    title: 'vínculos & cuidado',
    subtitle: 'afeto, encontros culturais e a cura que acontece na relação',
    icon: 'heart',
    color: '#FFD3DD',
    accent: '#B94862',
    books: [
      ...pickFrom(complementaryByArea, { '06_antropologia_cultura_e_diferenca': 2 }),
      ...pickFrom(catalogByFamily, { '07_interpessoal_relacional': 1 }),
    ],
    articles: pickFrom(articlesByFamily, { '07_interpessoal_relacional': 4 }),
  },
  {
    id: 'col-misto-sociedade',
    title: 'cultura & sociedade',
    subtitle: 'poder, instituições e o individual que é sempre político',
    icon: 'globe',
    color: '#E8C98C',
    accent: '#8C7338',
    books: pickFrom(complementaryByArea, { '05_sociologia_e_vida_social': 3 }),
    articles: pickFrom(articlesByFamily, { '09_social_cultural_genero': 4 }),
  },
  {
    id: 'col-misto-historia',
    title: 'história & poder',
    subtitle: 'a loucura, a memória e os arquivos que moldaram o presente',
    icon: 'landmark',
    color: '#FCE4A8',
    accent: '#8C7338',
    books: [
      ...pickFrom(complementaryByArea, { '07_historia_memoria_e_poder': 3 }),
      ...pickFrom(catalogByFamily, { '01_psicanalitica_psicodinamica': 4 }),
    ],
    articles: pickFrom(articlesByFamily, { '01_psicanalitica_psicodinamica': 4 }),
  },
  {
    id: 'col-misto-narrativa',
    title: 'narrativa & linguagem',
    subtitle: 'romances do íntimo e a reescrita das histórias de vida',
    icon: 'feather',
    color: '#E8AFC0',
    accent: '#B94862',
    books: pickFrom(complementaryByArea, { '03_literatura_e_subjetividade': 3 }),
    articles: pickFrom(articlesByFamily, { '06_construtivista_narrativa': 4 }),
  },
  {
    id: 'col-misto-pratica',
    title: 'prática & mudança',
    subtitle: 'terapia breve, escolhas e responsabilidade no aqui e agora',
    icon: 'target',
    color: '#8BC7A2',
    accent: '#43805B',
    books: pickFrom(catalogByFamily, { '10_pragmaticos_objetivo': 2 }),
    articles: pickFrom(articlesByFamily, {
      '10_pragmaticos_objetivo': 2,
      '08_integrativa_ecletica': 2,
    }),
  },
  {
    id: 'col-misto-educacao',
    title: 'educação & desenvolvimento',
    subtitle: 'aprender, falar e crescer — e as terapias que acompanham cada fase',
    icon: 'graduation-cap',
    color: '#B7E0C3',
    accent: '#43805B',
    books: pickFrom(complementaryByArea, { '09_educacao_linguagem_e_desenvolvimento': 3 }),
    articles: pickFrom(articlesByFamily, {
      '03_comportamental': 3,
      '05_sistemica_familiar_casais': 1,
    }),
  },
];
