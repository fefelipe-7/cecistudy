// ZONA 2 — "explorar o acervo" (MOD-001 / B.4).
// Extraída de `BibliotecaView.tsx`: barra de busca + filtros + seções
// colapsáveis do acervo (repertório, psicoterapias, mistas, testes, autores,
// conceitos, abordagens, multidisciplinar, artigos) + empty state + modais.

import React from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
} from 'lucide-react';
import { CollectionBook } from '../../../data/libraryData';
import { Article } from '../../../data/books';
import { TagChip } from '../../ui/TagChip';
import { Mascote } from '../../ui/Mascote';
import { LibraryFilterModal } from '../../library/LibraryFilterModal';
import { BookDetailModal } from '../../library/BookDetailModal';
import { ArticleDetailModal } from '../../library/ArticleDetailModal';
import type { LibraryFilterResult } from './useLibraryFilters';
import { ExploreShelves } from './ExploreShelves';

/** Seção colapsável do acervo (explorar). Filtros ativos forçam abertura. */

interface ExploreSectionsProps {
  /** Estado + coleções filtradas do acervo (retorno de `useLibraryFilters`). */
  filter: LibraryFilterResult;
  savedBookIds: Set<string>;
  readingProgress: Record<string, number>;
  selectedBook: CollectionBook | null;
  selectedArticle: Article | null;
  onSelectBook: (book: CollectionBook) => void;
  onSelectArticle: (article: Article) => void;
  onCloseBook: () => void;
  onCloseArticle: () => void;
  openApproach: (id: string) => void;
  toggleSaveBook: (id: string) => void;
  updateReadingProgress: (id: string, p: number) => void;
}

export const ExploreSections: React.FC<ExploreSectionsProps> = ({
  filter,
  savedBookIds,
  readingProgress,
  selectedBook,
  selectedArticle,
  onSelectBook,
  onSelectArticle,
  onCloseBook,
  onCloseArticle,
  openApproach,
  toggleSaveBook,
  updateReadingProgress,
}) => {
  const {
    activeCategory, setActiveCategory, activeStatus, setActiveStatus, selectedTag, setSelectedTag,
    searchTerm, setSearchTerm, isFilterModalOpen, setIsFilterModalOpen,
    toggleSection, isOpen, hasActiveFilters, resetAllFilters,
    filteredCollections, filteredCatalogCollections, filteredComplementaryCollections,
    filteredTrendingBooks, filteredArticleGroups, totalFilteredArticles, filteredMixedCollections,
    testCollections, authorCollections, multidisciplinaryCollections, conceptCollections, approachCollections,
    availableTags, catalogBooks, psychotherapyCollections,
  } = filter;

  return (
    <section className="space-y-4">
      <h2 className="font-display font-bold text-sm text-ceci-tertiary uppercase tracking-wider px-1 pt-2 border-t border-ceci-border-default">
        explorar o acervo
      </h2>

      {/* Search Bar + Filter Toggle Button */}
      <div className="space-y-3 px-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ceci-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="pesquisar por obra, autor, Beck, Freud, TCC..."
              className="w-full bg-surface-default border border-ceci-border-default rounded-2xl pl-10 pr-8 py-3 text-xs text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-ceci-brand shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ceci-tertiary hover:text-ceci-primary cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`px-3.5 py-3 rounded-2xl border flex items-center gap-2 tap-interactive cursor-pointer shadow-2xs text-xs font-bold ${
              hasActiveFilters
                ? 'bg-ceci-primary text-ceci-on-primary border-ceci-primary'
                : 'bg-surface-default text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
            }`}
            title="abrir filtros"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-ceci-brand animate-pulse" />
            )}
          </button>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-ceci-tertiary mr-1">filtros aplicados:</span>

            {activeCategory !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand rounded-full text-[11px] font-semibold">
                categoria: {activeCategory}
                <button onClick={() => setActiveCategory('todos')} className="hover:text-ceci-primary">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeStatus !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-blue text-ceci-academic-strong border border-ceci-border-academic rounded-full text-[11px] font-semibold">
                status: {activeStatus}
                <button onClick={() => setActiveStatus('todos')} className="hover:text-ceci-primary">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedTag && (
              <TagChip
                variant="blue"
                size="sm"
                onRemove={() => setSelectedTag(null)}
                removeLabel="limpar filtro de tag"
              >
                tag: {selectedTag}
              </TagChip>
            )}

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-muted text-ceci-primary border border-ceci-border-default rounded-full text-[11px] font-semibold">
                "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-ceci-primary">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={resetAllFilters}
              className="text-[11px] font-bold text-ceci-brand-strong hover:underline ml-1 cursor-pointer flex items-center gap-0.5"
            >
              <RotateCcw className="w-3 h-3" />
              esquecer filtros
            </button>
          </div>
        )}
      </div>

      {/* EXPLORAR: REPERTÔRIO & LEITURAS RECOMENDADAS */}
      <ExploreShelves
        filter={filter}
        savedBookIds={savedBookIds}
        readingProgress={readingProgress}
        onSelectBook={onSelectBook}
        onSelectArticle={onSelectArticle}
        openApproach={openApproach}
      />

      {/* Empty Filter State */}
      {filteredCollections.length === 0 &&
        filteredTrendingBooks.length === 0 &&
        filteredCatalogCollections.length === 0 &&
        filteredComplementaryCollections.length === 0 &&
        filteredMixedCollections.length === 0 &&
        filteredArticleGroups.length === 0 && (
        <div className="py-12 text-center space-y-3 px-1 border-t border-ceci-border-default">
          <Mascote expression="no-results" className="w-16 h-16 mx-auto" decorative />
          <h3 className="font-display font-bold text-base text-ceci-primary">
            nenhuma coleção ou obra encontrada
          </h3>
          <p className="text-xs text-ceci-secondary max-w-xs mx-auto">
            nenhum resultado com esses filtros. que tal afrouxar um pouco?
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong rounded-full text-xs font-bold cursor-pointer"
          >
            limpar filtros
          </button>
        </div>
      )}
    </section>
  );
};

/** Modais do acervo (filtro + detalhe de livro/artigo). */
export const LibraryModals: React.FC<{
  filter: LibraryFilterResult;
  availableTags: string[];
  savedBookIds: Set<string>;
  readingProgress: Record<string, number>;
  selectedBook: CollectionBook | null;
  selectedArticle: Article | null;
  onCloseBook: () => void;
  onCloseArticle: () => void;
  toggleSaveBook: (id: string) => void;
  updateReadingProgress: (id: string, p: number) => void;
}> = ({
  filter,
  availableTags,
  savedBookIds,
  readingProgress,
  selectedBook,
  selectedArticle,
  onCloseBook,
  onCloseArticle,
  toggleSaveBook,
  updateReadingProgress,
}) => {
  const {
    isFilterModalOpen, activeCategory, activeStatus, selectedTag, setActiveCategory,
    setActiveStatus, setSelectedTag, resetAllFilters, setIsFilterModalOpen,
  } = filter;
  return (
    <>
      <LibraryFilterModal
        isOpen={isFilterModalOpen}
        activeCategory={activeCategory}
        activeStatus={activeStatus}
        selectedTag={selectedTag}
        availableTags={availableTags}
        onCategoryChange={setActiveCategory}
        onStatusChange={setActiveStatus}
        onTagChange={setSelectedTag}
        onReset={resetAllFilters}
        onClose={() => setIsFilterModalOpen(false)}
      />

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          isSaved={savedBookIds.has(selectedBook.id)}
          readPages={readingProgress[selectedBook.id] ?? 0}
          onClose={onCloseBook}
          onToggleSave={() => toggleSaveBook(selectedBook.id)}
          onUpdateProgress={(p) => updateReadingProgress(selectedBook.id, p)}
        />
      )}

      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          isSaved={savedBookIds.has(selectedArticle.id)}
          onClose={onCloseArticle}
          onToggleSave={() => toggleSaveBook(selectedArticle.id)}
        />
      )}
    </>
  );
};