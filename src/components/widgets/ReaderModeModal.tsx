import React, { useState } from 'react';
import { X, Share2, Sun, Moon, Type, ChevronLeft, ChevronRight, Highlighter, List } from 'lucide-react';
import { ReadingItem } from '../../types';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { BookmarkToggle } from '../ui/BookmarkToggle';
import { getActiveTheme } from '../../lib/themes';

type ReaderTheme = 'paper' | 'sepia' | 'dark';

interface ReaderModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reading: ReadingItem | null;
  onUpdateProgress?: (readingId: string, newPages: number) => void;
}

export const ReaderModeModal: React.FC<ReaderModeModalProps> = ({
  isOpen,
  onClose,
  reading,
  onUpdateProgress,
}) => {
  const [theme, setTheme] = useState<ReaderTheme>(() => (getActiveTheme().isDark ? 'dark' : 'paper'));
  const [fontSize, setFontSize] = useState<number>(18);
  const [currentPage, setCurrentPage] = useState<number>(() => reading?.readPages || 1);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!isOpen || !reading) return null;

  const totalPages = reading?.totalPages || 1;
  const progressPercent = Math.round((currentPage / totalPages) * 100);

  const readerSurface = {
    paper: 'reader-paper',
    sepia: 'reader-sepia',
    dark: 'reader-dark',
  } as const;

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);
    if (onUpdateProgress) {
      onUpdateProgress(reading.id, clamped);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      position="center"
      closeOnBackdrop={false}
      className={`w-full max-w-2xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-200 border border-[color:var(--reader-border)] ${readerSurface[theme]}`}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Controls Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[color:var(--reader-border)]">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[color:var(--reader-soft)] transition-colors cursor-pointer"
            title="voltar"
            aria-label="voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-bold tracking-widest lowercase opacity-90">
              páginas {currentPage} de {totalPages}
            </span>
            <p className="font-display text-xs font-semibold opacity-90 line-clamp-1">
              {reading.title}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize((s) => (s >= 22 ? 14 : s + 2))}
              className="p-2 rounded-full hover:bg-[color:var(--reader-soft)] transition-colors text-xs font-bold cursor-pointer"
              title="ajustar tamanho do texto"
              aria-label="ajustar tamanho do texto"
            >
              <Type className="w-4 h-4" />
            </button>
            <BookmarkToggle
              active={isBookmarked}
              onToggle={() => setIsBookmarked((s) => !s)}
              label="guardar marcador"
              activeLabel="marcador guardado"
              size="sm"
            />
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[color:var(--reader-soft)] transition-colors cursor-pointer"
              aria-label="fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Canvas Content */}
        <div className="flex-1 overflow-y-auto px-8 sm:px-14 py-8 space-y-6 select-text">
<div className="text-center space-y-2 mb-4">
             <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
               {reading.title}
             </h2>
             <div className="w-8 h-0.5 bg-ceci-brand mx-auto opacity-70 mt-2" />
           </div>

          {reading.highlights && reading.highlights.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-[color:var(--reader-soft)] border-l-4 border-[color:var(--color-status-warning-border)] text-sm leading-relaxed italic">
              <strong>Destaques:</strong>
              <ul className="mt-2 space-y-1 pl-5 opacity-90">
                {reading.highlights.map((h, idx) => (
                  <li key={idx}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {reading.chapters && reading.chapters.length > 0 ? (
            <>
              {reading.chapters.map((chapter, idx) => (
                <div key={chapter.id} className="mb-6">
                  <h3 className="font-display text-xl font-bold mb-2">{chapter.title}</h3>
                  <p
                    className="leading-relaxed text-justify"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {chapter.body}
                  </p>
                </div>
              ))}
            </>
          ) : (
            <p className="text-center text-xs italic opacity-90">
              Nenhum capítulo disponível para esta leitura.
            </p>
          )}

        </div>

        {/* Floating Reader Actions Bar */}
        <div className="px-6 py-4 border-t border-[color:var(--reader-border)] bg-[color:var(--reader-soft)] flex flex-col gap-3">
          {/* Progress Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] opacity-90">
              <span>{progressPercent}% lido</span>
              <span>página {currentPage} de {totalPages}</span>
              <span>~{Math.round((totalPages - currentPage) * 1.2)} min restantes</span>
            </div>
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="w-full accent-ceci-brand cursor-pointer"
            />
          </div>

          {/* Bottom Theme & Nav Buttons */}
          <div className="flex items-center justify-between pt-1">
            <SegmentedControl
              ariaLabel="tema do leitor"
              value={theme}
              onChange={(v) => setTheme(v)}
              options={[
                { value: 'paper', label: 'papel', activeClassName: 'bg-surface-default text-ceci-primary shadow-2xs' },
                { value: 'sepia', label: 'sépia', activeClassName: 'bg-surface-paper text-ceci-tertiary shadow-2xs' },
                { value: 'dark', label: 'noturno', activeClassName: 'bg-[color:var(--color-reader-dark-text)] text-[color:var(--color-reader-dark-bg)] shadow-2xs' },
              ]}
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="página anterior"
                className="p-2 rounded-xl border border-[color:var(--reader-border)] hover:bg-[color:var(--reader-soft)] disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="próxima página"
                className="p-2 rounded-xl border border-[color:var(--reader-border)] hover:bg-[color:var(--reader-soft)] disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
