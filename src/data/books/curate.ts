/**
 * Curadoria pura da biblioteca: arrays mapeados de obras → coleções prontas
 * para a UI.
 *
 * Extraída do facade (`index.ts`) para que a MESMA lógica sirva às duas fontes
 * de dados: os JSONs estáticos (web, bundle) e o banco do catálogo SQLite
 * (nativo — ver `lib/db/catalogLibrary.ts`). Determinística: mesma entrada,
 * mesmas coleções.
 */
import {
  Article,
  ArticleGroup,
  CatalogBook,
  InterdisciplinaryBook,
} from './types';
import { PSYCHOTHERAPY_FAMILIES, INTERDISCIPLINARY_AREAS } from './families';
import { CollectionBook, ContextCollection } from '../libraryData';

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

/** Conjunto completo consumido pela BibliotecaView (fonte-agnóstico). */
export interface LibraryDataset {
  catalogBooks: CatalogBook[];
  interdisciplinaryBooks: InterdisciplinaryBook[];
  articles: Article[];
  psychotherapyCollections: ContextCollection[];
  complementaryCollections: ContextCollection[];
  articleGroups: ArticleGroup[];
  mixedCollections: MixedCollection[];
}

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

function pickFrom<T>(pool: Record<string, T[]>, spec: Record<string, number>): T[] {
  return Object.entries(spec).flatMap(([key, n]) => (pool[key] ?? []).slice(0, n));
}

/** Deriva todas as estruturas curadas a partir das obras mapeadas. */
export function curateLibrary(input: {
  catalogBooks: CatalogBook[];
  interdisciplinaryBooks: InterdisciplinaryBook[];
  articles: Article[];
}): Omit<LibraryDataset, keyof Pick<LibraryDataset, 'catalogBooks' | 'interdisciplinaryBooks' | 'articles'>> & {
  articlesByFamily: Record<string, Article[]>;
  catalogByFamily: Record<string, CollectionBook[]>;
  complementaryByArea: Record<string, CollectionBook[]>;
} {
  const { catalogBooks, interdisciplinaryBooks, articles } = input;

  // 10 famílias de psicoterapia
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

  const psychotherapyCollections: ContextCollection[] = Object.entries(
    PSYCHOTHERAPY_FAMILIES
  )
    .filter(([, meta]) => (catalogByFamily[meta.id]?.length ?? 0) > 0)
    .map(([familia, meta]) => ({
      id: `col-${familia}`,
      blockType: 'catalog' as const,
      blockCategory: 'psicoterapias',
      title: meta.label,
      subtitle: meta.subtitle,
      readersCount: catalogByFamily[familia]?.length ?? 0,
      readersAvatars: readersAvatars(meta.color, meta.accent),
      books: catalogByFamily[familia] ?? [],
    }));

  // 10 áreas interdisciplinares (bagagem complementar)
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

  const complementaryCollections: ContextCollection[] = Object.entries(
    INTERDISCIPLINARY_AREAS
  ).map(([area, meta]) => ({
    id: `col-${area}`,
    blockType: 'complementary' as const,
    blockCategory: 'complementar',
    title: meta.label,
    subtitle: meta.subtitle,
    readersCount: complementaryByArea[area]?.length ?? 0,
    readersAvatars: readersAvatars(meta.color, meta.accent),
    books: complementaryByArea[area] ?? [],
  }));

  // Grupos de artigos por família
  const articlesByFamily = articles.reduce<Record<string, Article[]>>((acc, a) => {
    (acc[a.familia] = acc[a.familia] ?? []).push(a);
    return acc;
  }, {});

  const articleGroups: ArticleGroup[] = Object.entries(PSYCHOTHERAPY_FAMILIES).map(
    ([familia, meta]) => ({
      familia,
      label: meta.label,
      color: meta.color,
      accent: meta.accent,
      articles: articlesByFamily[familia] ?? [],
    })
  );

  // Categorias mistas curadas
  const mixedCollections: MixedCollection[] = [
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

  return {
    psychotherapyCollections,
    complementaryCollections,
    articleGroups,
    articlesByFamily,
    mixedCollections,
    catalogByFamily,
    complementaryByArea,
  };
}
