import React from 'react';
import { X, BookOpen, Bookmark } from 'lucide-react';
import { CollectionBook } from '../../data/libraryData';
import { Modal } from '../ui/Modal';

interface BookDetailModalProps {
  book: CollectionBook;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onOpenReader: () => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isSaved,
  onClose,
  onToggleSave,
  onOpenReader,
}) => {
  const progressPercent = Math.round((book.readPages / book.totalPages) * 100);

  return (
    <Modal
      open
      onClose={onClose}
      className="w-full max-w-sm bg-white rounded-[28px] border border-ceci-border-default shadow-2xl overflow-hidden text-ceci-primary space-y-4 animate-in zoom-in-95 duration-200"
    >

        {/* Cover Preview Header */}
        <div
          className="p-6 text-center relative flex flex-col items-center justify-center space-y-2"
          style={{ backgroundColor: book.coverColor }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-ceci-primary flex items-center justify-center cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Mini Book Cover Card */}
          <div className="w-24 h-32 rounded-xl p-3 bg-white/90 shadow-lg border border-black/10 flex flex-col justify-between text-left relative">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-xl" />
            <span className="pl-1 text-[8px] font-bold uppercase text-ceci-tertiary">
              {book.badge || 'livro'}
            </span>
            <p className="pl-1 font-display font-bold text-xs leading-tight text-ceci-primary line-clamp-3">
              {book.title}
            </p>
            <p className="pl-1 text-[9px] text-ceci-secondary line-clamp-1">
              {book.author}
            </p>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 text-ceci-primary px-2.5 py-0.5 rounded-full shadow-2xs">
            {book.courseName || 'psicologia'}
          </span>
        </div>

        {/* Modal Content */}
        <div className="px-6 space-y-4 pb-6">
          <div>
            <h3 className="font-display font-bold text-lg text-ceci-primary leading-tight">
              {book.title}
            </h3>
            <p className="text-xs text-ceci-tertiary mt-0.5 font-medium">por {book.author}</p>
          </div>

          {/* Progress Bar */}
          <div className="p-3 rounded-2xl bg-surface-muted border border-ceci-border-default space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ceci-primary">
                progresso: {book.readPages} / {book.totalPages} págs
              </span>
              <span className="font-bold text-ceci-brand-strong">{progressPercent}%</span>
            </div>
            <div className="w-full bg-ceci-border-default h-2 rounded-full overflow-hidden">
              <div
                className="bg-ceci-brand-strong h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Book Description */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ceci-tertiary lowercase">resumo da obra</span>
            <p className="text-xs text-ceci-secondary leading-relaxed bg-surface-muted p-3 rounded-2xl border border-ceci-border-subtle">
              {book.description}
            </p>
          </div>

          {/* Quote Highlight */}
          {book.quote && (
            <div className="p-3 rounded-2xl bg-surface-rose border-l-4 border-rose-500 text-xs italic text-beige-700">
              "{book.quote}"
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onToggleSave}
              className={`p-3 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer min-h-[44px] ${
                isSaved
                  ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
                  : 'bg-white border-ceci-border-default text-ceci-secondary hover:bg-surface-muted'
              }`}
              title="guardar livro nos favoritos"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-ceci-brand-strong' : ''}`} />
            </button>

            <button
              onClick={onOpenReader}
              className="flex-1 bg-ceci-primary hover:bg-ceci-primary-hover text-white py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-transform active:scale-98 cursor-pointer min-h-[44px]"
            >
              <BookOpen className="w-4 h-4" />
              <span>abrir no modo leitura</span>
            </button>
          </div>
        </div>
    </Modal>
  );
};
