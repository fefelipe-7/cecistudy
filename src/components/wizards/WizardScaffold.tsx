import React, { useRef } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { IOS_EASE } from '../../lib/motion';
import { cn } from '../../lib/utils';

export interface WizardStep {
  id: string;
  title: string;
  /** Pergunta direta exibida em destaque no topo do passo (título em vez de rótulo de campo). */
  headline?: string;
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
  /** Esconde o botão principal (usado em steps de escolha, ex.: tarefa × prova). */
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
  const canConfirm = isLast ? canSave ?? canNext : canNext;

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
    <div className="min-h-[70vh] flex flex-col animate-in fade-in duration-300 pb-44">
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

          <span className="w-9 h-9 shrink-0" aria-hidden />
        </div>

        {/* Barra de progresso linear fina (o único indicador de progresso) */}
        <div className="max-w-md sm:max-w-xl mx-auto mt-3 h-0.5 rounded-full bg-ceci-border-subtle overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-ceci-brand-strong"
            initial={false}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.35, ease: IOS_EASE }}
          />
        </div>
      </div>

      {/* Corpo — um passo por vez, com pergunta em destaque */}
      <div className="flex-1 pt-4">
        <AnimatePresence mode="wait" initial={false} custom={dirRef.current}>
          <motion.div
            key={steps[step].id}
            custom={dirRef.current}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {steps[step].headline && (
              <h2 className="font-display font-bold text-[26px] leading-[1.15] text-ceci-primary">
                {steps[step].headline}
              </h2>
            )}
            <div className="pt-4">{steps[step].content}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barra de ação fixa na base da tela (sticky footer) */}
      <div className="fixed bottom-0 inset-x-0 z-10 bg-canvas/95 backdrop-blur-md border-t border-ceci-border-subtle shadow-[0_-8px_24px_rgba(64,56,58,0.06)]">
        <div className="max-w-md sm:max-w-xl mx-auto flex flex-col gap-1.5 px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          {!hideNext && (
            <button
              onClick={handleNext}
              disabled={!canConfirm}
              className={cn(
                'w-full min-h-[56px] rounded-[14px] text-sm font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-[0.98] cursor-pointer',
                isLast
                  ? 'bg-rose-500 hover:bg-ceci-brand-strong text-white'
                  : 'bg-ceci-primary hover:bg-ceci-primary-hover text-white',
                !canConfirm && 'opacity-40 cursor-not-allowed'
              )}
            >
              {isLast ? (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>{saveLabel}</span>
                </>
              ) : (
                <>
                  <span>continuar</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}

          <button
            onClick={() => (step === 0 ? onClose() : goTo(step - 1))}
            className="w-full min-h-[40px] rounded-xl text-xs font-medium text-ceci-tertiary hover:text-ceci-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            {step === 0 ? 'cancelar' : 'voltar'}
          </button>
        </div>
      </div>
    </div>
  );
};