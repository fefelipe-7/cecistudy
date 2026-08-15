import React from 'react';
import { BookOpen } from 'lucide-react';

interface ApproachDetailBookCardProps {
  book: {
    title: string;
    author: string;
    year?: string;
    importance?: string;
    content?: string;
    centralIdeas?: string;
    reasonToRead?: string;
    description?: string;
  };
  isFeatured?: boolean;
  onSelect: () => void;
}

export const ApproachDetailBookCard: React.FC<ApproachDetailBookCardProps> = ({
  book,
  isFeatured = false,
  onSelect,
}) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex flex-col items-start p-4 border border-ceci-border-default rounded-[18px] bg-white ${
        isFeatured
          ? 'border-ceci-brand-strong bg-surface-rose/20'
          : 'hover:border-ceci-brand-strong'
      } cursor-pointer transition-colors`}
    >
      <div className="flex items-start gap-3 w-full">
        <div className="w-10 h-10 rounded-full bg-surface-rose flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-ceci-brand-strong" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-sm text-ceci-primary">{book.title}</h3>
          <p className="text-xs text-ceci-secondary">
            por {book.author}{book.year ? ` (${book.year})` : ''}
          </p>
          {book.importance && (
            <p className="text-[10px] font-semibold text-ceci-primary mt-1">
              {book.importance}
            </p>
          )}
          {book.reasonToRead && (
            <p className="text-[10px] text-ceci-secondary mt-1 line-clamp-2">
              {book.reasonToRead}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};