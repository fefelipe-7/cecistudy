import React from 'react';
import { cn } from '@/lib/utils';

interface EmailSliderProps {
  label?: string;
  /** Valor em horas (undefined = não informado: campo vazio, slider no mínimo). */
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * Slider estilizado + campo numérico sincronizados (SPEC-004). O usuário pode
 * arrastar OU digitar; o input vazio devolve `undefined` (campo opcional).
 * Passo padrão de 1h; usar 0.5 para edição precisa.
 */
export const EmailSlider: React.FC<EmailSliderProps> = ({
  label,
  value,
  onChange,
  min = 1,
  max = 360,
  step = 1,
  className,
}) => {
  const isEmpty = value === undefined || Number.isNaN(value);
  const display = isEmpty ? '' : String(value);
  const sliderValue = isEmpty ? min : Math.min(Math.max(value, min), max);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <span className="text-[11px] font-semibold text-ceci-tertiary uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex items-center gap-3">
        <input
          type="range"
          role="slider"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={isEmpty ? min : sliderValue}
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={(ev) => onChange(Number(ev.target.value))}
          className="flex-1 accent-ceci-brand cursor-pointer"
        />
        <input
          type="number"
          inputMode="decimal"
          value={display}
          onChange={(ev) => {
            const raw = ev.target.value;
            if (raw === '') return onChange(undefined);
            const n = Number(raw);
            if (Number.isNaN(n)) return;
            onChange(n);
          }}
          placeholder="0"
          aria-label={`${label ?? 'valor'} em horas`}
          className="w-16 rounded-xl border border-ceci-border-default bg-surface-muted px-2 py-2 text-center text-sm font-semibold text-ceci-primary focus:border-ceci-border-brand focus:outline-none"
        />
      </div>
    </div>
  );
};