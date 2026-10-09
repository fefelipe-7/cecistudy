import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { stepVariants } from '../../lib/motion';
import { Mascote, type MascoteExpression } from '../ui/Mascote';
import { WizardScaffoldHeader } from './WizardScaffoldHeader';
import { WizardScaffoldFooter } from './WizardScaffoldFooter';
import { StepProgress } from './StepProgress';

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
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const isLast = step === steps.length - 1;
  const canConfirm = isLast ? canSave ?? canNext : canNext;

  /**
   * O foco vai para a pergunta do passo (SPEC-008 F4.7).
   *
   * Trocar de passo substitui o conteúdo inteiro por baixo do dedo/teclado: sem
   * isto, quem navega por teclado continua "dentro" de um botão que sumiu (o foco
   * cai no `body` e o leitor de tela anuncia o cabeçalho do app inteiro). O
   * `h2` da pergunta é o alvo natural — é a primeira coisa nova da tela.
   *
   * Só depois do primeiro passo, para não roubar o foco de quem acabou de abrir
   * o wizard por um clique num botão que agora é outro.
   */
  useEffect(() => {
    if (step > 0) headlineRef.current?.focus();
  }, [step]);

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
        stepTitles={steps.map((s) => s.title)}
        stepsLength={steps.length}
        showStepCount={showStepCount}
        isLast={isLast}
        onBack={requestClose}
      />

      {/* Corpo — um passo por vez, com pergunta em destaque. Troca CONCORRENTE
          (popLayout): o passo que sai desliza enquanto o novo entra — sem o
          "vazio" do mode="wait" entre passos. */}
      <div className="flex-1 pt-4">
        <StepProgress steps={steps.map(s => s.title)} current={step} />
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
                    <h2
                      ref={headlineRef}
                      tabIndex={-1}
                      className="font-display font-bold text-[22px] sm:text-[26px] leading-[1.18] text-ceci-primary focus:outline-none"
                    >
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
