import React from 'react';
import { Check } from 'lucide-react';

interface StepProgressProps {
  steps: string[];
  current: number;
}

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
      <div className="flex items-center justify-between">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={`${label}-${i}`} className="flex items-center gap-2 flex-1">
              <div aria-current={active ? 'step' : undefined} className={`flex items-center justify-center w-7 h-7 rounded-full border text-[11px] font-bold ${active ? 'bg-ceci-primary text-ceci-on-primary border-ceci-primary' : done ? 'bg-status-success-surface border-status-success-border text-status-success-strong' : 'bg-surface-muted border-ceci-border-subtle text-ceci-tertiary'}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-[2px] flex-1 ${done ? 'bg-status-success' : 'bg-ceci-border-subtle'}`} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-ceci-secondary mt-2">{steps[current]}</p>
    </div>
  );
};
