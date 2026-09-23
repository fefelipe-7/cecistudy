// ZONA 2 — seções colapsáveis do acervo (MOD-001 / B.4).
// Extraídas de `ExploreSections.tsx`: repertório, psicoterapias, mistas,
// testes, autores, conceitos, abordagens, multidisciplinar e artigos.

import React from 'react';
import {
  TrendingUp,
  Bookmark,
  Sparkles,
  BrainCircuit,
  User,
  Brain,
  Compass,
  Newspaper,
} from 'lucide-react';
import { CollectionBook } from '../../../data/libraryData';
import { Article } from '../../../data/books';
import { ManageSurface } from '../../ui/ManageSurface';
import { InlineCollectionBlock } from '../../library/InlineCollectionBlock';
import { MixedCollectionBlock } from '../../library/MixedCollectionBlock';
import { ArticleCard } from '../../library/ArticleCard';
import type { LibraryFilterResult } from './useLibraryFilters';
import ExploreSection from './ExploreSection';

interface ExploreShelvesProps {
  filter: LibraryFilterResult;
  savedBookIds: Set<string>;
  readingProgress: Record<string, number>;
  onSelectBook: (book: CollectionBook) => void;
  onSelectArticle: (article: Article) => void;
  openApproach: (id: string) => void;
}

export const ExploreShelves: React.FC<ExploreShelvesProps> = ({
  filter,
  savedBookIds,
  readingProgress,
  onSelectBook,
  onSelectArticle,
  openApproach,
}) => {
  const {
    activeCategory, isOpen, toggleSection,
    filteredTrendingBooks, filteredCatalogCollections, filteredMixedCollections,
    filteredArticleGroups, totalFilteredArticles, testCollections, authorCollections,
    conceptCollections, approachCollections, multidisciplinaryCollections,
    catalogBooks, psychotherapyCollections,
  } = filter;
  return (
    <>      {/* EXPLORAR: REPERTÔRIO & LEITURAS RECOMENDADAS */}
      {filteredTrendingBooks.length > 0 && (
        <ExploreSection
          id="repertorio"
          icon={<TrendingUp className="w-4 h-4 text-ceci-brand-strong" />}
          title="repertório & leituras recomendadas"
          badge={
            <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
              bagagem extra
            </span>
          }
          open={isOpen('repertorio')}
          onToggle={() => toggleSection('repertorio')}
        >
          <p className="text-xs text-ceci-secondary leading-relaxed">
            obras de finanças comportamentais, design de experiência, literatura e decisão para enriquecer sua visão clínica.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-1">
            {filteredTrendingBooks.map((book) => {
              const isSaved = savedBookIds.has(book.id);
              return (
                <ManageSurface
                  key={book.id}
                  kind="catalogBook"
                  id={book.id}
                  onTap={() => onSelectBook(book)}
                  className="contents"
                >
                <button
                  aria-label={`abrir ${book.title}`}
                  className="w-full cursor-pointer group space-y-2 text-left"
                >
                  <div
                    className="w-full h-[145px] sm:h-[155px] rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden shadow-xs border border-black/5 card-lift"
                    style={{ backgroundColor: book.coverColor }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/10 border-r border-black/10" />

                    <div className="pl-1.5 flex items-center justify-between">
                      <span className="text-[8px] font-extrabold uppercase bg-cover-base/90 text-cover-ink px-1.5 py-0.5 rounded shadow-2xs line-clamp-1">
                        {book.badge || 'livro'}
                      </span>
                      {isSaved && (
                        <Bookmark className="w-3.5 h-3.5 fill-cover-ink text-cover-ink" />
                      )}
                    </div>

                    <div className="pl-1.5 my-auto">
                      <p className="font-display font-bold text-[11px] sm:text-[12px] text-cover-ink line-clamp-3 leading-tight">
                        {book.title}
                      </p>
                    </div>

                    <div className="pl-1.5">
                      <p className="text-[9px] font-semibold text-cover-ink/80 line-clamp-1">
                        {book.author}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <p className="font-display font-bold text-xs text-ceci-primary line-clamp-1 group-hover:text-ceci-brand-strong transition-colors">
                      {book.title}
                    </p>
                    <p className="text-[10px] text-ceci-tertiary line-clamp-1">
                      {book.author}
                    </p>
                  </div>
                </button>
                </ManageSurface>
              );
            })}
          </div>
        </ExploreSection>
      )}

      {/* EXPLORAR: CATÁLOGO DE PSICOTERAPIAS (10 famílias) */}
      {filteredCatalogCollections.length > 0 && (
        <ExploreSection
          id="psicoterapias"
          icon={<Brain className="w-4 h-4 text-ceci-brand-strong" />}
          title="catálogo de psicoterapias"
          badge={
            <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
              {catalogBooks.length} obras · {psychotherapyCollections.length} famílias
            </span>
          }
          open={isOpen('psicoterapias')}
          onToggle={() => toggleSection('psicoterapias')}
        >
          <p className="text-xs text-ceci-secondary leading-relaxed">
            as grandes obras de cada abordagem terapêutica — da psicanálise à terapia pragmática, com resumo e trecho memorável para navegar o repertório.
          </p>

          <div className="space-y-6">
            {filteredCatalogCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                readProgress={readingProgress}
                onSelectBook={(book) => onSelectBook(book)}
              />
            ))}
          </div>
        </ExploreSection>
      )}

      {/* EXPLORAR: CATEGORIAS MISTAS (livros + artigos) */}
      {filteredMixedCollections.length > 0 && (
        <ExploreSection
          id="mistas"
          icon={<Sparkles className="w-4 h-4 text-ceci-brand-strong" />}
          title="categorias mistas"
          badge={
            <span className="text-[10px] font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
              {filteredMixedCollections.length} trilhas
            </span>
          }
          open={isOpen('mistas')}
          onToggle={() => toggleSection('mistas')}
        >
          <p className="text-xs text-ceci-secondary leading-relaxed">
            trilhas temáticas que cruzam obras e artigos de diferentes abordagens — toque para abrir e registrar suas páginas lidas.
          </p>

          <div className="space-y-6">
            {filteredMixedCollections.map((col) => (
              <MixedCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                readProgress={readingProgress}
                onSelectBook={(book) => onSelectBook(book)}
                onSelectArticle={(article) => onSelectArticle(article)}
              />
            ))}
          </div>
        </ExploreSection>
      )}

      {/* EXPLORAR: TESTES & INSTRUMENTOS PSICOLÓGICOS */}
      {(activeCategory === 'todos' || activeCategory === 'testes') && testCollections.length > 0 && (
        <ExploreSection
          id="testes"
          icon={<BrainCircuit className="w-4 h-4 text-status-success-strong" />}
          title="testes, escalas & avaliação clínica"
          badge={
            <span className="text-[11px] text-ceci-tertiary">
              {testCollections.length} coleções
            </span>
          }
          open={isOpen('testes')}
          onToggle={() => toggleSection('testes')}
        >
          <div className="space-y-6">
            {testCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => onSelectBook(book)}
                readProgress={readingProgress}
              />
            ))}
          </div>
        </ExploreSection>
      )}

      {/* EXPLORAR: AUTORES DA PSICOLOGIA */}
      {(activeCategory === 'todos' || activeCategory === 'autores') && authorCollections.length > 0 && (
        <ExploreSection
          id="autores"
          icon={<User className="w-4 h-4 text-ceci-brand-strong" />}
          title="autores & grandes obras"
          badge={
            <span className="text-[11px] text-ceci-tertiary">
              {authorCollections.length} coleções
            </span>
          }
          open={isOpen('autores')}
          onToggle={() => toggleSection('autores')}
        >
          <div className="space-y-6">
            {authorCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => onSelectBook(book)}
                readProgress={readingProgress}
              />
            ))}
          </div>
        </ExploreSection>
      )}

      {/* EXPLORAR: CONCEITOS-CHAVE & FICHAMENTOS */}
      {(activeCategory === 'todos' || activeCategory === 'conceitos') && conceptCollections.length > 0 && (
        <ExploreSection
          id="conceitos"
          icon={<Sparkles className="w-4 h-4 text-ceci-academic-strong" />}
          title="conceitos-chave & fichamentos"
          badge={
            <span className="text-[11px] text-ceci-tertiary">
              {conceptCollections.length} coleções
            </span>
          }
          open={isOpen('conceitos')}
          onToggle={() => toggleSection('conceitos')}
        >
          <div className="space-y-6">
            {conceptCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => onSelectBook(book)}
                readProgress={readingProgress}
              />
            ))}
          </div>
        </ExploreSection>
      )}

      {/* EXPLORAR: ABORDAGENS DA PSICOLOGIA */}
      {(activeCategory === 'todos' || activeCategory === 'abordagens') && approachCollections.length > 0 && (
        <ExploreSection
          id="abordagens"
          icon={<Bookmark className="w-4 h-4 text-ceci-tertiary" />}
          title="abordagens & correntes da psicologia"
          badge={
            <span className="text-[11px] text-ceci-tertiary">
              {approachCollections.length} coleções
            </span>
          }
          open={isOpen('abordagens')}
          onToggle={() => toggleSection('abordagens')}
        >
          <div className="space-y-6">
            {approachCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => {
                  // Coleção de abordagem → abre a abordagem real do catálogo (se mapeada).
                  if (col.approachId) {
                    openApproach(col.approachId);
                  }
                }}
              />
            ))}
          </div>
        </ExploreSection>
      )}

      {/* EXPLORAR: BAGAGEM MULTIDISCIPLINAR COMPLETA */}
      {(activeCategory === 'todos' || activeCategory === 'multidisciplinar') && multidisciplinaryCollections.length > 0 && (
        <ExploreSection
          id="multidisciplinar"
          icon={<Compass className="w-4 h-4 text-status-warning-strong" />}
          title="bagagem complementar & visão expandida"
          badge={
            <span className="text-[10px] font-bold text-status-success-strong bg-status-success-surface px-2.5 py-0.5 rounded-full border border-ceci-border-academic">
              100 obras · 10 áreas
            </span>
          }
          open={isOpen('multidisciplinar')}
          onToggle={() => toggleSection('multidisciplinar')}
        >
          <p className="text-xs text-ceci-secondary leading-relaxed">
            filosofia, literatura, sociologia, história, neurociência e mais — o repertório que enriquece seu olhar clínico.
          </p>

          <div className="space-y-6">
            {multidisciplinaryCollections.map((col) => (
              <InlineCollectionBlock
                key={col.id}
                collection={col}
                savedBookIds={savedBookIds}
                onSelectBook={(book) => onSelectBook(book)}
                readProgress={readingProgress}
              />
            ))}
          </div>
        </ExploreSection>
      )}

      {/* EXPLORAR: ARTIGOS CIENTÍFICOS (150, 15 por família) */}
      {filteredArticleGroups.length > 0 && (
        <ExploreSection
          id="artigos"
          icon={<Newspaper className="w-4 h-4 text-ceci-academic-strong" />}
          title="artigos científicos"
          badge={
            <span className="text-[10px] font-bold text-ceci-academic-strong bg-surface-blue px-2.5 py-0.5 rounded-full border border-ceci-border-academic">
              {totalFilteredArticles} artigos
            </span>
          }
          open={isOpen('artigos')}
          onToggle={() => toggleSection('artigos')}
        >
          <p className="text-xs text-ceci-secondary leading-relaxed">
            referências reais com DOI — toque para ler o resumo e abrir o artigo onde ele está disponível.
          </p>

          <div className="space-y-5">
            {filteredArticleGroups.map((group) => (
              <div key={group.familia} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="font-display font-bold text-sm text-ceci-primary">
                    {group.label}
                  </span>
                  <span className="text-[10px] font-bold text-ceci-tertiary bg-surface-muted px-2 py-0.5 rounded-full border border-ceci-border-default">
                    {group.articles.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {group.articles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      isSaved={savedBookIds.has(article.id)}
                      onSelect={() => onSelectArticle(article)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ExploreSection>
      )}
    </>
  );
};
