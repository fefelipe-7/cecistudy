import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight, Loader2 } from 'lucide-react';
import { IOS_EASE } from '../../lib/motion';
import { cn } from '../../lib/utils';
import { Mascote, type MascoteExpression } from '../ui/Mascote';

export interface WizardStep {
  id: string;
  title: string;
  /** Pergunta direta exibida em destaque no topo do passo (título em vez de rótulo de campo). */
  headline?: string;
  /** Microlinha de apoio logo abaixo do headline, explicando o propósito do passo. */
  subtitle?: string;
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
  /**
   * Motivo pelo qual o passo atual não pode avançar — exibido abaixo do botão
   * desabilitado (§5.1: "o botão não deve ficar silenciosamente desabilitado").
   */
  blockedReason?: string;
  /** Habilita o botão "guardar" no último step (default: canNext). */
  canSave?: boolean;
  /** Esconde o botão principal (usado em steps de escolha, ex.: tarefa × prova). */
  hideNext?: boolean;
  saveLabel?: string;
  onSave: () => void;
  onClose: () => void;
  /** Mascotinha ao lado do título (companhia da usuária no fluxo). */
  mascote?: MascoteExpression;
  /** Mostra estado "salvando..." e impede duplo envio (§5.1). */
  saving?: boolean;
  /** Exibe o indicador "2 de 4" ao lado do título (default: true). */
  showStepCount?: boolean;
  /**
   * Ação de salvamento mínimo disponível antes do último passo
   * (§5.7: registro essencial salvável sozinho).
   */
  onSaveMinimal?: () => void;
  saveMinimalLabel?: string;
  /**
   * Confirma descarte ao fechar somente quando há alteração real
   * (§5.1: "fechamento: confirmar descarte apenas se houver alteração real").
   */
  isDirty?: boolean;
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
  blockedReason,
  canSave,
  hideNext = false,
  saveLabel = 'guardar ♡',
  onSave,
  onClose,
  mascote = 'writing-note',
  saving = false,
  showStepCount = true,
  onSaveMinimal,
  saveMinimalLabel = 'guardar só o essencial ♡',
  isDirty = false,
}) => {
  const dirRef = useRef<number>(1);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const isLast = step === steps.length - 1;
  const canConfirm = isLast ? canSave ?? canNext : canNext;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    dirRef.current = clamped > step ? 1 : -1;
    onStepChange(clamped);
  };

  const requestClose = () => {
    if (isDirty && !confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  };

  const handleNext = () => {
    if (saving) return;
    if (isLast) onSave();
    else goTo(step + 1);
  };

  const showBlockedHint =
    !hideNext && !canConfirm && !!blockedReason && !confirmingDiscard;

  return (
    <div className="min-h-[70vh] flex flex-col pb-44">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle">
        <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={requestClose}
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
              aria-label={`etapa ${step + 1} de ${steps.length}`}
            >
              {step + 1}/{steps.length}
            </span>
          )}
          {!showStepCount && <span className="w-9 h-9 shrink-0" aria-hidden />}
        </div>

        {/* Barra de progresso linear fina (o único indicador de progresso) */}
        <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto mt-3 h-0.5 rounded-full bg-ceci-border-subtle overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-ceci-brand-strong"
            initial={false}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.35, ease: IOS_EASE }}
          />
        </div>
      </div>

      {/* Corpo — um passo por vez, com pergunta em destaque. Troca CONCORRENTE
          (popLayout): o passo que sai desliza enquanto o novo entra — sem o
          "vazio" do mode="wait" entre passos. */}
      <div className="flex-1 pt-4">
        <AnimatePresence mode="popLayout" initial={false} custom={dirRef.current}>
          <motion.div
            key={steps[step].id}
            custom={dirRef.current}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {(steps[step].headline || steps[step].subtitle) && (
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  {steps[step].headline && (
                    <h2 className="font-display font-bold text-[22px] sm:text-[26px] leading-[1.18] text-ceci-primary">
                      {steps[step].headline}
                    </h2>
                  )}
                  {steps[step].subtitle && (
                    <p className="mt-2 text-[12px] text-ceci-secondary leading-relaxed">
                      {steps[step].subtitle}
                    </p>
                  )}
                </div>
                <Mascote
                  expression={mascote}
                  decorative
                  className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 object-contain -mt-0.5 drop-shadow-sm"
                />
              </div>
            )}
            <div className="pt-4">{steps[step].content}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barra de ação fixa na base da tela (sticky footer) */}
      <div className="fixed bottom-0 inset-x-0 z-10 bg-canvas/95 backdrop-blur-md border-t border-ceci-border-subtle shadow-[0_-8px_24px_rgba(var(--shadow-rgb),0.06)]">
        <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto flex flex-col gap-1.5 px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          {/* confirmação de descarte com alteração real */}
          {confirmingDiscard ? (
            <div className="rounded-2xl bg-surface-default border border-ceci-border-default p-3 space-y-2">
              <p className="text-xs font-semibold text-ceci-primary text-center">
                tem coisas escritas aqui — sair sem guardar?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingDiscard(false)}
                  className="flex-1 min-h-[44px] rounded-xl bg-ceci-primary text-white text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
                >
                  continuar editando
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 min-h-[44px] rounded-xl border border-ceci-border-default bg-surface-default text-red-700 text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
                >
                  descartar
                </button>
              </div>
            </div>
          ) : (
            <>
              {!hideNext && (
                <>
                  <button
                    onClick={handleNext}
                    disabled={!canConfirm || saving}
                    className={cn(
                      'w-full min-h-[56px] rounded-[14px] text-sm font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-[0.98] cursor-pointer',
                      isLast
                        ? 'bg-rose-500 hover:bg-ceci-brand-strong text-white'
                        : 'bg-ceci-primary hover:bg-ceci-primary-hover text-white',
                      (!canConfirm || saving) && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>salvando...</span>
                      </>
                    ) : isLast ? (
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

                  {/* motivo explicado do bloqueio — nunca um botão mudo */}
                  {showBlockedHint && (
                    <p className="text-[11px] text-ceci-tertiary text-center">{blockedReason}</p>
                  )}

                  {/* salvamento mínimo antes do fim (registro essencial) */}
                  {!isLast && onSaveMinimal && canNext && (
                    <button
                      onClick={onSaveMinimal}
                      className="w-full min-h-[36px] rounded-lg text-[11px] font-semibold text-ceci-academic-strong hover:bg-surface-blue transition-colors cursor-pointer"
                    >
                      {saveMinimalLabel}
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => (step === 0 ? requestClose() : goTo(step - 1))}
                className="w-full min-h-[40px] rounded-xl text-xs font-medium text-ceci-tertiary hover:text-ceci-primary hover:bg-surface-muted transition-colors cursor-pointer"
              >
                {step === 0 ? 'cancelar' : 'voltar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
