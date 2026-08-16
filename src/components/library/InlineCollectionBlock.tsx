import React from 'react';
import { Bookmark } from 'lucide-react';
import { ContextCollection, CollectionBook } from '../../data/libraryData';

interface InlineCollectionBlockProps {
  collection: ContextCollection;
  savedBookIds: string[];
  readProgress?: Record<string, number>;
  onSelectBook: (book: CollectionBook) => void;
}

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

      {/* Books horizontal shelf */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
        {collection.books.map((book) => {
          const isSaved = savedBookIds.includes(book.id);
          const readPages = readProgress?.[book.id];
          const isReading = (readPages ?? 0) > 0;
          const progressPercent =
            book.totalPages && readPages
              ? Math.round((readPages / book.totalPages) * 100)
              : 0;

          return (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="group/book card-lift relative w-[105px] sm:w-[115px] h-[145px] sm:h-[155px] rounded-2xl p-2.5 flex flex-col justify-between shrink-0 shadow-xs cursor-pointer overflow-hidden border border-black/5 select-none"
              style={{ backgroundColor: book.coverColor }}
            >
              {/* Realistic Spine Line */}
              <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/10 border-r border-black/10" />

              <div className="pl-2 flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-wider bg-white/90 text-ceci-primary px-1.5 py-0.5 rounded shadow-2xs line-clamp-1 max-w-[70px]">
                  {book.badge || 'Livro'}
                </span>
                {isSaved && (
                  <Bookmark className="w-3 h-3 fill-ceci-primary text-ceci-primary" />
                )}
              </div>

              <div className="pl-2 my-auto">
                <p className="font-display font-bold text-[11px] sm:text-[12px] leading-tight text-ceci-primary line-clamp-3">
                  {book.title}
                </p>
              </div>

              <div className="pl-2 space-y-1">
                <p className="text-[9px] font-semibold text-ceci-primary/80 line-clamp-1">
                  {book.author}
                </p>

                {isReading && book.totalPages && readPages && (
                  <div className="w-full bg-black/10 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-ceci-primary h-full rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
