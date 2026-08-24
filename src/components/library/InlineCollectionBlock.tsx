import React from 'react';
import { Bookmark } from 'lucide-react';
import { ContextCollection, CollectionBook } from '../../data/libraryData';
import { ManageSurface } from '../ui/ManageSurface';

interface InlineCollectionBlockProps {
  collection: ContextCollection;
  savedBookIds: string[];
  readProgress?: Record<string, number>;
  onSelectBook: (book: CollectionBook) => void;
}

/**
 * Bloco de coleção com apresentação expandida: grade de capas grandes
 * (título/autor abaixo da capa) em vez de prateleira horizontal compacta.
 */
export const InlineCollectionBlock: React.FC<InlineCollectionBlockProps> = ({
  collection,
  savedBookIds,
  readProgress,
  onSelectBook,
}) => {
  return (
    <div className="space-y-3">
      {/* Title with left raspberry accent border directly on page canvas */}
      <div className="border-l-3 border-ceci-brand-strong pl-3.5 space-y-0.5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-ceci-primary leading-tight">
            {collection.title}
          </h3>
          <span className="text-[10px] font-semibold text-ceci-tertiary bg-surface-muted px-2 py-0.5 rounded border border-ceci-border-default">
            {collection.books.length} obras
          </span>
        </div>
        <p className="text-xs text-ceci-secondary leading-relaxed">
          {collection.subtitle}
        </p>
      </div>

      {/* Grade expandida de livros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-4">
        {collection.books.map((book) => {
          const isSaved = savedBookIds.includes(book.id);
          const readPages = readProgress?.[book.id];
          const isReading = (readPages ?? 0) > 0;
          const progressPercent =
            book.totalPages && readPages
              ? Math.round((readPages / book.totalPages) * 100)
              : 0;

          return (
            <ManageSurface
              key={book.id}
              kind="catalogBook"
              id={book.id}
              onTap={() => onSelectBook(book)}
              className="group/book cursor-pointer select-none space-y-1.5"
            >
              {/* Capa grande */}
              <div
                className="w-full h-[150px] sm:h-[165px] rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden shadow-xs border border-black/5 card-lift"
                style={{ backgroundColor: book.coverColor }}
              >
                {/* Lombada */}
                <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/10 border-r border-black/10" />

                <div className="pl-1.5 flex items-center justify-between">
                  <span className="text-[8px] font-extrabold uppercase tracking-wider bg-white/90 text-ceci-primary px-1.5 py-0.5 rounded shadow-2xs line-clamp-1 max-w-[80px]">
                    {book.badge || 'Livro'}
                  </span>
                  {isSaved && (
                    <Bookmark className="w-3.5 h-3.5 fill-ceci-primary text-ceci-primary" />
                  )}
                </div>

                <div className="pl-1.5 my-auto">
                  <p className="font-display font-bold text-xs sm:text-[13px] leading-tight text-ceci-primary line-clamp-4">
                    {book.title}
                  </p>
                </div>

                <div className="pl-1.5">
                  <p className="text-[9px] font-semibold text-ceci-primary/80 line-clamp-1">
                    {book.author}
                  </p>

                  {isReading && book.totalPages && readPages && (
                    <div className="mt-1 w-full bg-black/10 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-ceci-primary h-full rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Título/autor expandidos sob a capa */}
              <div className="px-0.5 space-y-0.5">
                <p className="font-display font-bold text-xs text-ceci-primary line-clamp-2 leading-snug group-hover:text-ceci-brand-strong transition-colors">
                  {book.title}
                </p>
                <p className="text-[10px] text-ceci-tertiary line-clamp-1">
                  {book.author}
                </p>
              </div>
            </ManageSurface>
          );
        })}
      </div>
    </div>
  );
};
