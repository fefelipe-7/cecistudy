import React from 'react';
import { cn } from '../../lib/utils';

/** Rótulo de campo discreto dos wizards (o destaque é o headline do passo). */
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">{children}</label>
);

/** Microlinha de ajuda abaixo de um campo: explica o que colocar ali. */
export const FieldHint: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cn('text-[11px] text-ceci-tertiary leading-relaxed mt-1.5', className)}>{children}</p>
);

/** Campo completo dos wizards: rótulo + controle + hint explicativo opcional. */
export const Field: React.FC<{
  label?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div>
    {label && <FieldLabel>{label}</FieldLabel>}
    {children}
    {hint && <FieldHint>{hint}</FieldHint>}
  </div>
);

/** Input "chunky": fundo sólido suave, cantos grandes, bastante respiro interno. */
const inputClass =
  'w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-shadow';

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={cn(inputClass, props.className)} />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={cn(inputClass, 'resize-none leading-relaxed', props.className)} />
);

export const DateInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input type="date" {...props} className={cn(inputClass, 'text-sm', props.className)} />
);

/** Seletor de hora nativo (HH:MM). */
export const TimeInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input type="time" {...props} className={cn(inputClass, 'text-sm', props.className)} />
);

const isoDay = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

/**
 * Campo de data com atalhos explícitos ("hoje", "amanhã", "sem data") — §4.6:
 * nunca preencher hoje silenciosamente; o campo começa vazio e os atalhos são
 * escolhas intencionais da usuária.
 */
export const DateField: React.FC<{
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => {
  const chipBase =
    'px-3 py-1.5 rounded-full border text-[11px] font-semibold tap-interactive cursor-pointer transition-all active:scale-95';
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <DateInput value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        <button
          type="button"
          onClick={() => onChange(isoDay(0))}
          className={`${chipBase} ${
            value === isoDay(0)
              ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
              : 'bg-surface-default border-ceci-border-default text-ceci-secondary hover:bg-surface-muted'
          }`}
        >
          hoje
        </button>
        <button
          type="button"
          onClick={() => onChange(isoDay(1))}
          className={`${chipBase} ${
            value === isoDay(1)
              ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
              : 'bg-surface-default border-ceci-border-default text-ceci-secondary hover:bg-surface-muted'
          }`}
        >
          amanhã
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className={`${chipBase} bg-surface-default border-ceci-border-default text-red-700 hover:bg-surface-rose`}
          >
            sem data
          </button>
        )}
        {!value && placeholder && (
          <span className="text-[11px] text-ceci-faded self-center">{placeholder}</span>
        )}
      </div>
    </div>
  );
};

/** Input numérico com teclado numérico no mobile. */
export const NumberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    inputMode="numeric"
    {...props}
    className={cn(inputClass, 'text-sm', props.className)}
  />
);

interface ReviewCardProps {
  rows: { label: string; value: string }[];
}

/** Card de revisão no último step do wizard: mostra o resumo antes de guardar. */
export const ReviewCard: React.FC<ReviewCardProps> = ({ rows }) => (
  <div className="bg-surface-default rounded-2xl border border-ceci-border-default shadow-2xs divide-y divide-ceci-border-subtle">
    {rows.map((r) => (
      <div key={r.label} className="px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary mb-0.5">
          {r.label}
        </p>
        <p className="text-sm text-ceci-primary leading-snug">{r.value || '—'}</p>
      </div>
    ))}
  </div>
);