import React from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { CollectionBook } from '../../data/libraryData';
import { Modal } from '../ui/Modal';
import { Mascote } from '../ui/Mascote';
import { BookmarkToggle } from '../ui/BookmarkToggle';
import { cn } from '../../lib/utils';

interface BookDetailModalProps {
  book: CollectionBook;
  isSaved: boolean;
  readPages: number;
  onClose: () => void;
  onToggleSave: () => void;
  onUpdateProgress: (readPages: number) => void;
}

const QUICK_STEPS = [5, 10, 25];

const chip =
  'text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-surface-muted text-ceci-secondary border border-ceci-border-subtle shadow-2xs';

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isSaved,
  readPages,
  onClose,
  onToggleSave,
  onUpdateProgress,
}) => {
  const maxPages = book.totalPages ?? Infinity;
  const clamped = Math.min(Math.max(readPages, 0), maxPages);
  const progressPercent = book.totalPages
    ? Math.round((clamped / book.totalPages) * 100)
    : 0;

  const step = (delta: number) => onUpdateProgress(Math.min(Math.max(clamped + delta, 0), maxPages));

  const stepperBtn =
    'w-11 h-11 rounded-full border border-ceci-border-default bg-surface-default text-ceci-primary flex items-center justify-center transition active:scale-90 tap-interactive cursor-pointer disabled:opacity-35 disabled:pointer-events-none';

  return (
    <Modal
      open
      onClose={onClose}
      className="w-full max-w-sm bg-surface-default rounded-[28px] border border-ceci-border-default shadow-2xl overflow-hidden text-ceci-primary flex flex-col max-h-[85dvh]"
    >
      {/* Hero da capa */}
      <div
        className="relative shrink-0 pt-7"
        style={{
          backgroundColor: `color-mix(in srgb, ${book.coverColor} 65%, var(--color-cover-base))`,
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.18), rgba(0,0,0,0.06))',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-surface-default/85 hover:bg-surface-default text-ceci-primary flex items-center justify-center cursor-pointer shadow-2xs tap-interactive"
          aria-label="fechar livro"
        >
          <X className="w-4 h-4" />
        </button>

         {/* Capa sobrepondo a fronteira com o corpo */}
        <div className="relative flex justify-center">
          <div className="relative z-10 w-28 h-40 -mb-16 rounded-r-xl rounded-l-md p-3 bg-cover-base/95 shadow-lg border border-black/5 flex flex-col justify-between text-left -rotate-2 transition-transform duration-300">
            <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/10 rounded-l-md border-r border-black/10" />
            <span className="pl-1.5 text-[8px] font-bold uppercase tracking-wider text-cover-ink/70">
              {book.badge || 'livro'}
            </span>
            <p className="pl-1.5 font-display font-bold text-xs leading-tight text-cover-ink line-clamp-4">
              {book.title}
            </p>
            <p className="pl-1.5 text-[9px] text-cover-ink/80 line-clamp-1">
              {book.author}
            </p>
          </div>
        </div>
      </div>

      {/* Corpo rolável */}
      <div className="px-6 pt-[72px] pb-4 space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="text-center">
          <h3 className="font-display font-bold text-lg text-ceci-primary leading-snug">
            {book.title}
          </h3>
          <p className="text-xs text-ceci-tertiary mt-0.5 font-medium">por {book.author}</p>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className={chip}>{book.badge || 'livro'}</span>
          <span className={cn(chip, 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand')}>
            {book.courseName || 'psicologia'}
          </span>
        </div>

        {/* Progresso compacto */}
        <div className="rounded-2xl bg-surface-muted p-3.5 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold text-ceci-tertiary lowercase">
              seu progresso
            </span>
            <span className="text-[11px] font-bold text-ceci-brand-strong tabular-nums">
              {book.totalPages
                ? `${clamped} de ${book.totalPages} págs · ${progressPercent}%`
                : `${clamped} págs`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => step(-1)}
              disabled={clamped <= 0}
              className={stepperBtn}
              aria-label="diminuir páginas lidas"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0">
              {book.totalPages ? (
                <div className="w-full bg-ceci-border-default h-2 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-colors duration-300', clamped > 0 ? 'bg-ceci-brand-strong' : '')}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              ) : (
                <p className="text-xs text-ceci-secondary font-medium text-center">
                  quantas páginas você já leu?
                </p>
              )}
            </div>

            <button
              onClick={() => step(1)}
              disabled={book.totalPages !== undefined && clamped >= book.totalPages}
              className={stepperBtn}
              aria-label="aumentar páginas lidas"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2">
            {QUICK_STEPS.map((n) => (
              <button
                key={n}
                onClick={() => step(n)}
                disabled={book.totalPages !== undefined && clamped >= book.totalPages}
                className="px-3 py-1 rounded-full bg-surface-default border border-ceci-border-subtle text-ceci-secondary text-[11px] font-semibold hover:bg-surface-rose hover:text-ceci-brand-strong hover:border-ceci-border-brand transition-colors tap-interactive cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
              >
                +{n}
              </button>
            ))}
          </div>
        </div>

        {/* Resumo da obra — com scroll próprio */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ceci-tertiary lowercase">resumo da obra</span>
          <div className="max-h-40 overflow-y-auto overscroll-contain bg-surface-muted p-3.5 rounded-2xl">
            <p className="text-xs text-ceci-secondary leading-relaxed">
              {book.description}
            </p>
          </div>
        </div>

        {/* Citação como pull-quote, com companhia do cecinho */}
        {book.quote && (
          <div className="flex items-start gap-3 rounded-2xl bg-surface-rose p-4">
            <Mascote expression="library-shelf" className="w-10 h-10 shrink-0" decorative />
            <div className="min-w-0">
              <p className="font-serif-academic italic text-sm text-ceci-tertiary leading-relaxed">
                "{book.quote}"
              </p>
              <p className="text-[10px] text-ceci-tertiary mt-1.5 lowercase">
                te acompanho nessa leitura ♡
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé fixo — sempre visível */}
      <div className="shrink-0 flex items-center gap-2 px-6 py-4 border-t border-ceci-border-subtle bg-surface-default">
        <BookmarkToggle
          active={isSaved}
          onToggle={onToggleSave}
          size="md"
          label="guardar livro"
          activeLabel="remover livro dos salvos"
          ariaLabel={isSaved ? 'remover livro dos salvos' : 'guardar livro'}
        />

        <button
          onClick={onClose}
          className="flex-1 bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-transform active:scale-98 cursor-pointer min-h-[44px]"
        >
          voltar para a biblioteca
        </button>
      </div>
    </Modal>
  );
};
