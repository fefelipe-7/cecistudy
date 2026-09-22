// Filtros do acervo da biblioteca (MOD-001 / B.4).
// Extraídos de `BibliotecaView.tsx` para reduzir o monolito:
// estado de filtro + matchers + coleções filtradas (memoizadas).

import { useMemo, useState } from 'react';
import {
  initialContextCollections,
  initialTrendingBooks,
  CollectionBook,
  ContextCollection,
} from '../../../data/libraryData';
import {
  Article,
  MixedCollection,
} from '../../../data/books';
import type { LibraryDataset } from '../../../data/books/curate';

export interface LibraryFilterDeps {
  /** Catálogo em uso (facade estático ou nativo SQLite). */
  library: LibraryDataset;
  savedBookIds: Set<string>;
  readingProgress: Record<string, number>;
}

/** Status derivado de leitura de uma obra (do progresso registrado). */
export type BookReadingStatus = 'lendo' | 'concluido' | 'para_ler';

/** Resultado completo de `useLibraryFilters` (estado + coleções filtradas). */
export type LibraryFilterResult = ReturnType<typeof useLibraryFilters>;

export function useLibraryFilters({ library, savedBookIds, readingProgress }: LibraryFilterDeps) {
  const { psychotherapyCollections, complementaryCollections, articleGroups, mixedCollections } = library;

  // Filter States
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [activeStatus, setActiveStatus] = useState<string>('todos');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Seções do "explorar" — abertas por padrão; a usuária pode colapsar.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const hasActiveFilters =
    activeCategory !== 'todos' ||
    activeStatus !== 'todos' ||
    selectedTag !== null ||
    searchTerm.trim() !== '';

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const isOpen = (id: string) => hasActiveFilters || openSections[id] !== false;

  const resetAllFilters = () => {
    setActiveCategory('todos');
    setActiveStatus('todos');
    setSelectedTag(null);
    setSearchTerm('');
  };

  // -----------------------------------------------------------------------
  // Status / matchers compartilhados
  // -----------------------------------------------------------------------
  const isBookReading = (book: CollectionBook) => {
    const progress = readingProgress[book.id];
    return progress !== undefined && progress > 0;
  };

  const isBookCompleted = (book: CollectionBook) => {
    const progress = readingProgress[book.id];
    return book.totalPages !== undefined && progress !== undefined && progress >= book.totalPages;
  };

  const getBookStatus = (book: CollectionBook): BookReadingStatus => {
    if (isBookCompleted(book)) return 'concluido';
    if (isBookReading(book)) return 'lendo';
    return 'para_ler';
  };

  const matchesCategory = (col: ContextCollection, allowed: string[]) => {
    if (activeCategory === 'todos') return true;
    if (activeCategory === 'salvos') return col.books.some((b) => savedBookIds.has(b.id));
    if (activeCategory === 'em_leitura') return col.books.some((b) => isBookReading(b));
    return allowed.includes(col.blockCategory) && col.blockCategory === activeCategory;
  };

  const matchesStatus = (col: ContextCollection) =>
    activeStatus === 'todos' ||
    col.books.some((b) => getBookStatus(b) === activeStatus);

  const matchesTag = (col: ContextCollection) =>
    !selectedTag ||
    col.books.some((b) =>
      b.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()))
    );

  const matchesSearch = (col: ContextCollection) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      col.title.toLowerCase().includes(searchLower) ||
      col.subtitle.toLowerCase().includes(searchLower) ||
      col.books.some(
        (b) =>
          b.title.toLowerCase().includes(searchLower) ||
          b.author.toLowerCase().includes(searchLower) ||
          b.tags.some((t) => t.toLowerCase().includes(searchLower))
      )
    );
  };

  // -----------------------------------------------------------------------
  // Coleções filtradas
  // -----------------------------------------------------------------------
  const filteredCollections = useMemo(
    () =>
      initialContextCollections.filter(
        (col) =>
          matchesCategory(col, ['autores', 'conceitos', 'abordagens', 'multidisciplinar', 'testes']) &&
          matchesStatus(col) &&
          matchesTag(col) &&
          matchesSearch(col)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategory, activeStatus, selectedTag, searchTerm, savedBookIds, readingProgress]
  );

  const filteredCatalogCollections = useMemo(
    () =>
      psychotherapyCollections.filter(
        (col) =>
          matchesCategory(col, ['psicoterapias']) &&
          matchesStatus(col) &&
          matchesTag(col) &&
          matchesSearch(col)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategory, activeStatus, selectedTag, searchTerm, savedBookIds, readingProgress]
  );

  const filteredComplementaryCollections = useMemo(
    () =>
      complementaryCollections.filter(
        (col) =>
          matchesCategory(col, ['multidisciplinar', 'complementar']) &&
          matchesStatus(col) &&
          matchesTag(col) &&
          matchesSearch(col)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategory, activeStatus, selectedTag, searchTerm, savedBookIds, readingProgress]
  );

  const filteredTrendingBooks = useMemo(
    () =>
      initialTrendingBooks.filter((b) => {
        const bookStatus = getBookStatus(b);
        if (activeStatus !== 'todos' && bookStatus !== activeStatus) return false;
        if (activeCategory === 'salvos' && !savedBookIds.has(b.id)) return false;
        if (activeCategory === 'em_leitura' && bookStatus !== 'lendo') return false;
        if (selectedTag && !b.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()))) return false;

        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          b.title.toLowerCase().includes(searchLower) ||
          b.author.toLowerCase().includes(searchLower) ||
          b.tags.some((t) => t.toLowerCase().includes(searchLower))
        );
      }),
    [activeStatus, activeCategory, savedBookIds, selectedTag, searchTerm, readingProgress]
  );

  const articleMatches = (a: Article) => {
    if (activeCategory === 'todos' || activeCategory === 'artigos') {
      // ok
    } else if (activeCategory === 'salvos') {
      if (!savedBookIds.has(a.id)) return false;
    } else {
      return false;
    }

    if (activeStatus !== 'todos') return false;

    const searchLower = searchTerm.toLowerCase();
    const text =
      `${a.titulo} ${a.autores} ${a.periodico} ${a.classificacao} ${a.observacao} ${a.resumo}`.toLowerCase();
    if (searchTerm && !text.includes(searchLower)) return false;

    if (selectedTag) {
      const tagLower = selectedTag.toLowerCase();
      const hasTag =
        a.titulo.toLowerCase().includes(tagLower) ||
        a.autores.toLowerCase().includes(tagLower) ||
        a.periodico.toLowerCase().includes(tagLower) ||
        a.classificacao.toLowerCase().includes(tagLower);
      if (!hasTag) return false;
    }

    return true;
  };

  const filteredArticleGroups = useMemo(
    () =>
      articleGroups
        .map((g) => ({ ...g, articles: g.articles.filter(articleMatches) }))
        .filter((g) => g.articles.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategory, activeStatus, selectedTag, searchTerm, savedBookIds]
  );
  const totalFilteredArticles = useMemo(
    () => filteredArticleGroups.reduce((acc, g) => acc + g.articles.length, 0),
    [filteredArticleGroups]
  );

  const mixedMatches = (col: MixedCollection) => {
    const bookCategoryOk =
      activeCategory === 'todos' ||
      activeCategory === 'psicoterapias' ||
      activeCategory === 'complementar' ||
      activeCategory === 'multidisciplinar' ||
      activeCategory === 'mistas' ||
      (activeCategory === 'salvos' &&
        col.books.some((b) => savedBookIds.has(b.id))) ||
      (activeCategory === 'em_leitura' && col.books.some((b) => isBookReading(b)));

    const articleCategoryOk =
      activeCategory === 'todos' ||
      activeCategory === 'artigos' ||
      activeCategory === 'mistas' ||
      (activeCategory === 'salvos' &&
        col.articles.some((a) => savedBookIds.has(a.id)));

    if (!bookCategoryOk && !articleCategoryOk) return false;

    if (activeStatus !== 'todos' && !col.books.some((b) => getBookStatus(b) === activeStatus)) {
      return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const bookMatch = col.books.some(
        (b) =>
          b.title.toLowerCase().includes(searchLower) ||
          b.author.toLowerCase().includes(searchLower) ||
          b.tags.some((t) => t.toLowerCase().includes(searchLower))
      );
      const articleMatch = col.articles.some(
        (a) =>
          `${a.titulo} ${a.autores} ${a.periodico} ${a.classificacao}`
            .toLowerCase()
            .includes(searchLower)
      );
      if (!bookMatch && !articleMatch) return false;
    }

    if (selectedTag) {
      const tagLower = selectedTag.toLowerCase();
      const bookTag = col.books.some((b) =>
        b.tags.some((t) => t.toLowerCase().includes(tagLower))
      );
      const articleTag = col.articles.some(
        (a) =>
          `${a.titulo} ${a.autores} ${a.periodico} ${a.classificacao}`
            .toLowerCase()
            .includes(tagLower)
      );
      if (!bookTag && !articleTag) return false;
    }

    return true;
  };

  const filteredMixedCollections = useMemo(
    () => mixedCollections.filter(mixedMatches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategory, activeStatus, selectedTag, searchTerm, savedBookIds, readingProgress]
  );

  // Category specific slices for inline sections
  const testCollections = filteredCollections.filter((c) => c.blockCategory === 'testes');
  const authorCollections = filteredCollections.filter((c) => c.blockCategory === 'autores');
  const multidisciplinaryCollections = [
    ...filteredCollections.filter((c) => c.blockCategory === 'multidisciplinar'),
    ...filteredComplementaryCollections,
  ];
  const conceptCollections = filteredCollections.filter((c) => c.blockCategory === 'conceitos');
  const approachCollections = filteredCollections.filter((c) => c.blockCategory === 'abordagens');

  // Pool único de livros do catálogo para montar "meus materiais"
  const allBooksById = useMemo(() => {
    const map = new Map<string, CollectionBook>();
    const pool: CollectionBook[] = [
      ...initialTrendingBooks,
      ...initialContextCollections.flatMap((c) => c.books),
      ...psychotherapyCollections.flatMap((c) => c.books),
      ...complementaryCollections.flatMap((c) => c.books),
      ...mixedCollections.flatMap((c) => c.books),
    ];
    pool.forEach((b) => {
      if (!map.has(b.id)) map.set(b.id, b);
    });
    return map;
    // As referências são estáveis no web (facade estático); no nativo, trocam
    // quando o dataset SQLite chega — aí o pool precisa ser reconstruído.
  }, [psychotherapyCollections, complementaryCollections, mixedCollections]);

  const savedBooks = useMemo(
    () => [...allBooksById.values()].filter((b) => savedBookIds.has(b.id)),
    [allBooksById, savedBookIds]
  );
  const readingBooks = useMemo(
    () =>
      [...allBooksById.values()].filter((b) => {
        const p = readingProgress[b.id];
        return p !== undefined && p > 0;
      }),
    [allBooksById, readingProgress]
  );

  // Tags derivadas do catálogo (nenhuma lista fixa no código da view)
  const availableTags = useMemo(
    () =>
      Array.from(
        new Set([
          ...initialContextCollections.flatMap((c) => c.books.flatMap((b) => b.tags)),
          ...initialTrendingBooks.flatMap((b) => b.tags),
          ...psychotherapyCollections.flatMap((c) => c.books.flatMap((b) => b.tags)),
          ...complementaryCollections.flatMap((c) => c.books.flatMap((b) => b.tags)),
        ])
      ).sort((a, b) => a.localeCompare(b)),
    [psychotherapyCollections, complementaryCollections]
  );

  return {
    activeCategory,
    setActiveCategory,
    activeStatus,
    setActiveStatus,
    selectedTag,
    setSelectedTag,
    searchTerm,
    setSearchTerm,
    isFilterModalOpen,
    setIsFilterModalOpen,
    openSections,
    toggleSection,
    isOpen,
    hasActiveFilters,
    resetAllFilters,
    getBookStatus,
    filteredCollections,
    filteredCatalogCollections,
    filteredComplementaryCollections,
    filteredTrendingBooks,
    filteredArticleGroups,
    totalFilteredArticles,
    filteredMixedCollections,
    testCollections,
    authorCollections,
    multidisciplinaryCollections,
    conceptCollections,
    approachCollections,
    allBooksById,
    savedBooks,
    readingBooks,
    availableTags,
    catalogBooks: library.catalogBooks,
    psychotherapyCollections,
  };
}
