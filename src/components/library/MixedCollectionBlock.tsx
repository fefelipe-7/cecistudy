import React from 'react';
import {
  Bookmark,
  Brain,
  Feather,
  Globe,
  GraduationCap,
  Heart,
  Landmark,
  LucideIcon,
  Sun,
  Target,
} from 'lucide-react';
import { Article, MixedCollection } from '../../data/books';
import { CollectionBook } from '../../data/libraryData';
import { ArticleCard } from './ArticleCard';

const ICON_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  sun: Sun,
  heart: Heart,
  globe: Globe,
  landmark: Landmark,
  feather: Feather,
  target: Target,
  'graduation-cap': GraduationCap,
};

interface MixedCollectionBlockProps {
  collection: MixedCollection;
  savedBookIds: string[];
  readProgress?: Record<string, number>;
  onSelectBook: (book: CollectionBook) => void;
  onSelectArticle: (article: Article) => void;
}

/** Bloco de categoria mista: shelf com capas de livros + artigos em folha de papel. */
export const MixedCollectionBlock: React.FC<MixedCollectionBlockProps> = ({
  collection,
  savedBookIds,
  readProgress,
  onSelectBook,
  onSelectArticle,
}) => {
  const Icon = ICON_MAP[collection.icon] ?? Globe;
  const total = collection.books.length + collection.articles.length;

  return (
    <div className="space-y-3">
      {/* Título com acento cor da categoria */}
      <div
        className="border-l-3 pl-3.5 space-y-0.5"
        style={{ borderColor: collection.accent }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
              style={{ backgroundColor: collection.color, color: collection.accent }}
            >
              <Icon className="w-3.5 h-3.5" />
            </span>
            <h3 className="font-display font-bold text-base text-ceci-primary leading-tight truncate">
              {collection.title}
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-ceci-tertiary bg-surface-muted px-2 py-0.5 rounded border border-ceci-border-default shrink-0">
            {total} obras
          </span>
        </div>
        <p className="text-xs text-ceci-secondary leading-relaxed">
          {collection.subtitle}
        </p>
      </div>

      {/* Shelf mista: livros + artigos */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
        {collection.books.map((book) => {
          const isSaved = savedBookIds.includes(book.id);
          const readPages = readProgress?.[book.id] ?? book.readPages;
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
              {/* Lombada */}
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

        {collection.articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            isSaved={savedBookIds.includes(article.id)}
            onSelect={() => onSelectArticle(article)}
          />
        ))}
      </div>
    </div>
  );
};
