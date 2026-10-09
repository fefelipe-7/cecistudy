// UI — hero card: molde único de abertura de superfície do Estágio (SPEC-010 D1/D2).
// Molde copiado de `views/faculdade/HeroSection.tsx:24-51` — apresentação pura:
// não importa contexto, não calcula dado, não navega. Dado chega por props.
import React from 'react';
import { cn } from '../../lib/utils';
import { Mascote, type MascoteExpression } from './Mascote';

export interface HeroCardProps {
  /** eyebrow em minúsculas: "estágio", "paciente". */
  eyebrow: string;
  /** número principal ou iniciais — o único texto em serifa acadêmica. */
  title: string;
  /** frase de resumo, uma linha. */
  summary?: React.ReactNode;
  /** ação primária no canto superior direito. */
  action?: { label: string; onClick: () => void; ariaLabel?: string };
  expression?: MascoteExpression;
  accent?: 'rose' | 'blue';
  testId?: string;
}

const ACCENTS = {
  rose: 'from-surface-default to-surface-rose border-ceci-border-subtle',
  blue: 'from-surface-default to-surface-blue border-ceci-border-academic',
} as const;

export const HeroCard: React.FC<HeroCardProps> = ({
  eyebrow,
  title,
  summary,
  action,
  expression = 'field-prepare',
  accent = 'rose',
  testId = 'hero-card',
}) => (
  <section
    data-testid={testId}
    className={cn(
      'rounded-[26px] bg-gradient-to-br border shadow-sm p-5 relative overflow-hidden',
      ACCENTS[accent]
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-ceci-secondary font-medium lowercase tracking-wide">{eyebrow}</p>
        <h1 className="font-serif-academic text-3xl sm:text-4xl text-ceci-primary mt-0.5 tracking-tight break-words">
          {title}
        </h1>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          aria-label={action.ariaLabel ?? action.label}
          className="min-h-[44px] px-3.5 rounded-full bg-surface-default/80 border border-ceci-border-default flex items-center gap-1.5 text-xs font-semibold text-ceci-secondary hover:bg-surface-default transition-colors shadow-2xs cursor-pointer shrink-0 tap-interactive focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand focus-visible:ring-offset-1"
        >
          {action.label}
        </button>
      )}
    </div>
    {summary && (
      <p className="text-xs sm:text-[13px] text-ceci-secondary leading-relaxed mt-2.5 max-w-[92%]">{summary}</p>
    )}
    <Mascote
      expression={expression}
      className="w-16 h-16 absolute -bottom-2 -right-2 opacity-95 pointer-events-none"
      decorative
    />
  </section>
);

export default HeroCard;
