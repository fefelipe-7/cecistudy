import React, { useRef } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { IOS_EASE } from '../../lib/motion';
import { cn } from '../../lib/utils';

export interface WizardStep {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface WizardScaffoldProps {
  /** Título exibido no header (ex.: "novo conceito"). */
  title: string;
  subtitle?: string;
  /** Ícone decorativo do header. */
  icon: React.ReactNode;
  /** Classes do badge do ícone (ex.: bg-surface-rose border-ceci-border-brand text-ceci-brand-strong). */
  iconClass?: string;
  steps: WizardStep[];
  step: number;
  onStepChange: (step: number) => void;
  /** Habilita o botão "continuar" (validação do step atual). */
  canNext?: boolean;
  /** Habilita o botão "guardar" no último step (default: canNext). */
  canSave?: boolean;
  /** Esconde o botão direito de navegação (usado em steps de escolha, ex.: tarefa × prova). */
  hideNext?: boolean;
  saveLabel?: string;
  onSave: () => void;
  onClose: () => void;
}

/** Transição lateral entre steps: avançar desliza da direita, voltar da esquerda. */
const stepVariants: Variants = {
  initial: (dir: number) => ({ x: dir * 48, opacity: 0 }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.26, ease: IOS_EASE } },
  exit: (dir: number) => ({ x: dir * -48, opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } }),
};

export const WizardScaffold: React.FC<WizardScaffoldProps> = ({
  title,
  subtitle,
  icon,
  iconClass,
  steps,
  step,
  onStepChange,
  canNext = true,
  canSave,
  hideNext = false,
  saveLabel = 'guardar ♡',
  onSave,
  onClose,
}) => {
  const dirRef = useRef<number>(1);
  const isLast = step === steps.length - 1;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    dirRef.current = clamped > step ? 1 : -1;
    onStepChange(clamped);
  };

  const handleNext = () => {
    if (isLast) onSave();
    else goTo(step + 1);
  };

  return (
    <div className="min-h-[70vh] flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle">
        <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white border border-ceci-border-default hover:bg-surface-rose flex items-center justify-center text-ceci-primary shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="voltar"
            aria-label="voltar"
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
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm text-ceci-primary truncate leading-tight">{title}</h1>
              {subtitle && <p className="text-[11px] text-ceci-secondary truncate">{subtitle}</p>}
            </div>
          </div>

          <span className="text-[11px] font-bold text-ceci-tertiary tabular-nums shrink-0">
            {step + 1}/{steps.length}
          </span>
        </div>

        {/* Barra de progresso do wizard */}
        <div className="max-w-md sm:max-w-xl mx-auto mt-3 h-1.5 rounded-full bg-ceci-border-subtle overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-ceci-brand-strong"
            initial={false}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3, ease: IOS_EASE }}
          />
        </div>
      </div>

      {/* Steps (pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-3 scrollbar-none">
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              step === i
                ? 'bg-ceci-primary text-white shadow-2xs'
                : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-rose'
            }`}
          >
            {i + 1} · {s.title}
          </button>
        ))}
      </div>

      {/* Corpo com transição entre steps */}
      <div className="flex-1 pt-4 pb-2">
        <AnimatePresence mode="wait" initial={false} custom={dirRef.current}>
          <motion.div
            key={steps[step].id}
            custom={dirRef.current}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {steps[step].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegação do wizard */}
      <div className="flex items-center justify-between gap-2 pt-4 mt-auto">
        <button
          onClick={() => (step === 0 ? onClose() : goTo(step - 1))}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
        >
          {step === 0 ? 'cancelar' : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>voltar</span>
            </>
          )}
        </button>

        {!hideNext && (
          <button
            onClick={handleNext}
            disabled={isLast ? !(canSave ?? canNext) : !canNext}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[48px] cursor-pointer',
              isLast
                ? 'bg-rose-500 hover:bg-ceci-brand-strong text-white'
                : 'bg-ceci-primary hover:bg-ceci-primary-hover text-white',
              (isLast ? !(canSave ?? canNext) : !canNext) && 'opacity-40 cursor-not-allowed'
            )}
          >
            {isLast ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{saveLabel}</span>
              </>
            ) : (
              <>
                <span>continuar</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
