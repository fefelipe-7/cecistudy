import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { IOS_EASE } from '../../lib/motion';
import { cn } from '../../lib/utils';

interface WizardScaffoldHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconClass?: string;
  step: number;
  stepsLength: number;
  showStepCount: boolean;
  isLast: boolean;
  onBack: () => void;
}

/** Cabeçalho fixo do wizard: voltar, título + mascote-badge, etapa e progresso. */
export const WizardScaffoldHeader: React.FC<WizardScaffoldHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconClass,
  step,
  stepsLength,
  showStepCount,
  isLast,
  onBack,
}) => (
  <div className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle">
    <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto flex items-center justify-between gap-2">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-2xl bg-surface-default border border-ceci-border-default hover:bg-surface-rose flex items-center justify-center text-ceci-primary shadow-2xs transition active:scale-95 cursor-pointer"
        title="voltar"
        aria-label={isLast ? 'voltar' : 'cancelar'}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            'w-7 h-7 rounded-xl border flex items-center justify-center shrink-0',
            iconClass ?? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 text-center">
          <h1 className="font-display font-bold text-sm text-ceci-primary truncate leading-tight">{title}</h1>
          {subtitle && <p className="text-[11px] text-ceci-secondary truncate">{subtitle}</p>}
        </div>
      </div>

      {/* indicador de etapa — "a usuária sabe em que passo está" */}
      {showStepCount && (
        <span
          className="w-9 h-9 shrink-0 flex items-center justify-center text-[10px] font-bold text-ceci-tertiary tabular-nums"
          aria-label={`etapa ${step + 1} de ${stepsLength}`}
        >
          {step + 1}/{stepsLength}
        </span>
      )}
      {!showStepCount && <span className="w-9 h-9 shrink-0" aria-hidden />}
    </div>

    {/* Barra de progresso linear fina (o único indicador de progresso) */}
    <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto mt-3 h-0.5 rounded-full bg-ceci-border-subtle overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-ceci-brand-strong"
        initial={false}
        animate={{ width: `${((step + 1) / stepsLength) * 100}%` }}
        transition={{ duration: 0.35, ease: IOS_EASE }}
      />
    </div>
  </div>
);
