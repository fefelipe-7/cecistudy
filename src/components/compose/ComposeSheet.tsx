import React from 'react';
import { BookOpen, CalendarHeart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StarRating } from '../ui/StarRating';
import type { ComposeMode } from '@/lib/composeLogic';

interface ComposeSheetProps {
  mode: ComposeMode;
  /** Nome da disciplina selecionada (modo aula). */
  courseLabel?: string;
  classNumber: number;
  tag: string;
  onTagChange: (v: string) => void;
  rating: number;
  onRatingChange: (n: number) => void;
  hasCourses: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * A "folha de papel" do caderno do cantinho: no modo aula vira a página de
 * caderno (cabeçalho com disciplina, nº da aula e data); no modo avulsa fica
 * uma folha limpa para o pensamento solto. O corpo (textarea) é passado como
 * children para manter a folha um contêiner puro.
 */
export const ComposeSheet: React.FC<ComposeSheetProps> = ({
  mode,
  courseLabel,
  classNumber,
  tag,
  onTagChange,
  rating,
  onRatingChange,
  hasCourses,
  className,
  children,
}) => (
  <div
    className={cn(
      'relative flex-1 min-h-0 flex flex-col bg-surface-default rounded-[20px] border border-ceci-border-default shadow-[0_2px_8px_rgba(64,56,58,0.05)] overflow-hidden',
      className
    )}
  >
    {mode === 'aula' ? (
      <>
        {/* cabeçalho de página de caderno */}
        <div className="px-4 pt-3.5 pb-3 bg-surface-rose/60 border-b border-ceci-border-brand/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-7 h-7 rounded-xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </span>
              <p className="text-[11px] font-bold text-ceci-brand-strong truncate">
                {courseLabel ? `aula de ${courseLabel}` : 'escolha a disciplina'}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-ceci-secondary shrink-0">
              <span className="bg-surface-default border border-ceci-border-brand rounded-full px-2.5 py-0.5">
                aula nº {classNumber}
              </span>
              <span className="inline-flex items-center gap-1 text-ceci-tertiary">
                <CalendarHeart className="w-3.5 h-3.5" />
                hoje
              </span>
            </div>
          </div>

          {/* linha da tag/título */}
          <input
            type="text"
            value={tag}
            onChange={(e) => onTagChange(e.target.value)}
            placeholder="título da aula (ex.: ansiedade)"
            aria-label="título da aula"
            className="mt-2.5 w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-xs font-medium text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-ceci-brand focus:ring-2 focus:ring-ceci-brand/20"
          />
        </div>

        {/* estrelas na base do cabeçalho */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-surface-rose/30">
          <span className="text-[11px] font-medium text-ceci-tertiary">como foi a aula?</span>
          <StarRating value={rating} onChange={onRatingChange} size="sm" showLabel labelClassName="text-ceci-secondary" />
        </div>
      </>
    ) : (
      <div className="px-4 pt-3.5 pb-2 flex items-center gap-1.5 text-ceci-tertiary">
        <span className="w-1.5 h-1.5 rounded-full bg-ceci-brand/70" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {hasCourses ? 'pensamento solto' : 'nota avulsa'}
        </span>
      </div>
    )}

    {/* corpo — o textarea vem de fora para a folha ficar flexível */}
    {children}
  </div>
);