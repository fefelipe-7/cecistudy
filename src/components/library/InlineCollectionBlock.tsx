import React from 'react';
import { Bookmark } from 'lucide-react';
import { ContextCollection, CollectionBook } from '../../data/libraryData';

interface InlineCollectionBlockProps {
  collection: ContextCollection;
  savedBookIds: string[];
  onSelectBook: (book: CollectionBook) => void;
}

export const InlineCollectionBlock: React.FC<InlineCollectionBlockProps> = ({
  collection,
  savedBookIds,
  onSelectBook,
}) => {
  return (
    <div className="space-y-3">
      {/* Title with left raspberry accent border directly on page canvas */}
      <div className="border-l-3 border-[#B94862] pl-3.5 space-y-0.5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-[#40383A] leading-tight">
            {collection.title}
          </h3>
          <span className="text-[10px] font-semibold text-[#918689] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E9DFDC]">
            {collection.books.length} obras
          </span>
        </div>
        <p className="text-xs text-[#6D6366] leading-relaxed">
          {collection.subtitle}
        </p>
      </div>

      {/* Books horizontal shelf */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
        {collection.books.map((book) => {
          const isSaved = savedBookIds.includes(book.id);
          const progressPercent = Math.round((book.readPages / book.totalPages) * 100);

          return (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="group/book relative w-[105px] sm:w-[115px] h-[145px] sm:h-[155px] rounded-2xl p-2.5 flex flex-col justify-between shrink-0 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden border border-black/5 select-none"
              style={{ backgroundColor: book.coverColor }}
            >
              {/* Realistic Spine Line */}
              <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/10 border-r border-black/10 backdrop-blur-3xs" />

              <div className="pl-2 flex items-center justify-between">
                <span className="text-[8px] font-extrabold uppercase tracking-wider bg-white/90 text-[#40383A] px-1.5 py-0.5 rounded shadow-2xs line-clamp-1 max-w-[70px]">
                  {book.badge || 'Livro'}
                </span>
                {isSaved && (
                  <Bookmark className="w-3 h-3 fill-[#40383A] text-[#40383A]" />
                )}
              </div>

              <div className="pl-2 my-auto">
                <p className="font-display font-bold text-[11px] sm:text-[12px] leading-tight text-[#40383A] line-clamp-3">
                  {book.title}
                </p>
              </div>

              <div className="pl-2 space-y-1">
                <p className="text-[9px] font-semibold text-[#40383A]/80 line-clamp-1">
                  {book.author}
                </p>

                {book.status === 'lendo' && (
                  <div className="w-full bg-black/10 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[#40383A] h-full rounded-full"
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
