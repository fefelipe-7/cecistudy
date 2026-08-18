import React, { useState } from 'react';
import { X, Share2, Sun, Moon, Type, ChevronLeft, ChevronRight, Highlighter, List } from 'lucide-react';
import { ReadingItem } from '../../types';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { BookmarkToggle } from '../ui/BookmarkToggle';

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
  const [theme, setTheme] = useState<'paper' | 'dark' | 'sepia'>('paper');
  const [fontSize, setFontSize] = useState<number>(18);
  const [currentPage, setCurrentPage] = useState<number>(() => reading?.readPages || 1);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!isOpen || !reading) return null;

  const totalPages = reading?.totalPages || 1;
  const progressPercent = Math.round((currentPage / totalPages) * 100);

  const themeClasses = {
    paper: 'bg-surface-muted text-ceci-primary',
    sepia: 'bg-surface-paper text-beige-700',
    dark: 'bg-ceci-primary text-surface-muted',
  };

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
      className={`w-full max-w-2xl h-[92vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden transition-colors duration-200 border border-ceci-border-default ${themeClasses[theme]}`}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Controls Bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-black/5">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            title="voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-bold tracking-widest lowercase opacity-60">
              páginas {currentPage} de {totalPages}
            </span>
            <p className="font-display text-xs font-semibold opacity-90 line-clamp-1">
              {reading.title}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize((s) => (s >= 22 ? 14 : s + 2))}
              className="p-2 rounded-full hover:bg-black/5 transition-colors text-xs font-bold cursor-pointer"
              title="ajustar tamanho do texto"
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
              className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Canvas Content */}
        <div className="flex-1 overflow-y-auto px-8 sm:px-14 py-8 space-y-6 select-text">
<div className="text-center space-y-2 mb-4">
             <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
               {reading.title}
             </h2>
             <div className="w-8 h-0.5 bg-rose-500 mx-auto opacity-70 mt-2" />
           </div>

          {reading.highlights && reading.highlights.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-surface-paper border-l-4 ceci-border-gold text-sm leading-relaxed italic text-beige-700">
              <strong className="text-beige-700">Destaques:</strong>
              <ul className="mt-2 space-y-1 pl-5 text-beige-600">
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
            <p className="text-center text-xs text-ceci-secondary italic">
              Nenhum capítulo disponível para esta leitura.
            </p>
          )}

          <p
            className="leading-relaxed text-justify"
            style={{ fontSize: `${fontSize}px` }}
          >
            Em seus estudos em Psicologia, o acompanhamento regular e a síntese diária de leituras fortalecem a base teórico-prática para estágios e atendimentos.
          </p>
        </div>

        {/* Floating Reader Actions Bar */}
        <div className="px-6 py-4 border-t border-black/5 bg-black/2 flex flex-col gap-3">
          {/* Progress Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] opacity-70">
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
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Bottom Theme & Nav Buttons */}
          <div className="flex items-center justify-between pt-1">
            <SegmentedControl
              ariaLabel="tema do leitor"
              value={theme}
              onChange={(v) => setTheme(v)}
              options={[
                { value: 'paper', label: 'papel', activeClassName: 'bg-white text-ceci-primary shadow-2xs' },
                { value: 'sepia', label: 'sépia', activeClassName: 'bg-surface-paper text-beige-700 shadow-2xs' },
                { value: 'dark', label: 'noturno', activeClassName: 'bg-ceci-primary text-white shadow-2xs' },
              ]}
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-xl border border-black/10 hover:bg-black/5 disabled:opacity-30 transition-colors cursor-pointer"
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
