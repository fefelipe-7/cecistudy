import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { IOS_EASE } from '../../lib/motion';
import { Mascote, type MascoteExpression } from '../ui/Mascote';
import { WizardScaffoldHeader } from './WizardScaffoldHeader';
import { WizardScaffoldFooter } from './WizardScaffoldFooter';

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
      <WizardScaffoldHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        iconClass={iconClass}
        step={step}
        stepsLength={steps.length}
        showStepCount={showStepCount}
        isLast={isLast}
        onBack={requestClose}
      />

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
      <WizardScaffoldFooter
        isLast={isLast}
        hideNext={hideNext}
        canConfirm={canConfirm}
        saving={saving}
        saveLabel={saveLabel}
        blockedReason={blockedReason}
        showBlockedHint={showBlockedHint}
        canNext={canNext}
        onSaveMinimal={onSaveMinimal}
        saveMinimalLabel={saveMinimalLabel}
        confirmingDiscard={confirmingDiscard}
        onCancelDiscard={() => setConfirmingDiscard(false)}
        onPrimary={handleNext}
        onClose={onClose}
        onBack={() => (step === 0 ? requestClose() : goTo(step - 1))}
        isFirst={step === 0}
      />
    </div>
  );
};
