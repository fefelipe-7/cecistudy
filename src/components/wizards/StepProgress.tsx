import React from 'react';

interface StepProgressProps {
  steps: string[];
  current: number;
}

/**
 * Linha simples de progresso do wizard.
 *
 * As bolinhas numeradas viveram aqui um dia; quem fez o walkthrough dos
 * wizards viu dois contadores ao mesmo tempo (o "N de M" do header + as
 * bolinhas) e pediu para tirar as bolinhas: o header já tem a barra fina que
 * anda conforme os passos completam (`WizardScaffoldHeader`). A `aria-current`
 * dos passos também ficou no header, na `ol` sr-only (SPEC-008 F4.7).
 */
export const StepProgress: React.FC<StepProgressProps> = ({ steps, current }) => {
  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={current + 1}
      aria-label={`passo ${current + 1} de ${steps.length}: ${steps[current]}`}
    >
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-[2px] flex-1 ${i < current ? 'bg-status-success' : 'bg-ceci-border-subtle'}`}
          />
        ))}
      </div>
      <p className="text-[11px] text-ceci-secondary mt-2">{steps[current]}</p>
    </div>
  );
};
