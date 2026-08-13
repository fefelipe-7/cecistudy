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
      className="w-full max-w-sm bg-white rounded-[28px] border border-[#E9DFDC] shadow-2xl overflow-hidden text-[#40383A] space-y-4 animate-in zoom-in-95 duration-200"
    >

        {/* Cover Preview Header */}
        <div
          className="p-6 text-center relative flex flex-col items-center justify-center space-y-2"
          style={{ backgroundColor: book.coverColor }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#40383A] flex items-center justify-center cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Mini Book Cover Card */}
          <div className="w-24 h-32 rounded-xl p-3 bg-white/90 shadow-lg border border-black/10 flex flex-col justify-between text-left relative">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-xl" />
            <span className="pl-1 text-[8px] font-bold uppercase text-[#918689]">
              {book.badge || 'Livro'}
            </span>
            <p className="pl-1 font-display font-bold text-xs leading-tight text-[#40383A] line-clamp-3">
              {book.title}
            </p>
            <p className="pl-1 text-[9px] text-[#6D6366] line-clamp-1">
              {book.author}
            </p>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[#40383A] px-2.5 py-0.5 rounded-full shadow-2xs">
            {book.courseName || 'Psicologia'}
          </span>
        </div>

        {/* Modal Content */}
        <div className="px-6 space-y-4 pb-6">
          <div>
            <h3 className="font-display font-bold text-lg text-[#40383A] leading-tight">
              {book.title}
            </h3>
            <p className="text-xs text-[#918689] mt-0.5 font-medium">Por {book.author}</p>
          </div>

          {/* Progress Bar */}
          <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E9DFDC] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#40383A]">
                Progresso: {book.readPages} / {book.totalPages} págs
              </span>
              <span className="font-bold text-[#B94862]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#E9DFDC] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#B94862] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Book Description */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#918689] lowercase">resumo da obra</span>
            <p className="text-xs text-[#6D6366] leading-relaxed bg-[#FAF8F5] p-3 rounded-2xl border border-[#F2EBE8]">
              {book.description}
            </p>
          </div>

          {/* Quote Highlight */}
          {book.quote && (
            <div className="p-3 rounded-2xl bg-[#FFF5F7] border-l-4 border-[#E97891] text-xs italic text-[#756354]">
              "{book.quote}"
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onToggleSave}
              className={`p-3 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer min-h-[44px] ${
                isSaved
                  ? 'bg-[#FFF5F7] border-[#FFD3DD] text-[#B94862]'
                  : 'bg-white border-[#E9DFDC] text-[#6D6366] hover:bg-[#FAF8F5]'
              }`}
              title="Salvar citação/livro"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#B94862]' : ''}`} />
            </button>

            <button
              onClick={onOpenReader}
              className="flex-1 bg-[#40383A] hover:bg-[#2D2728] text-white py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-transform active:scale-98 cursor-pointer min-h-[44px]"
            >
              <BookOpen className="w-4 h-4" />
              <span>abrir no modo leitura</span>
            </button>
          </div>
        </div>
    </Modal>
  );
};
