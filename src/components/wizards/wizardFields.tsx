import React from 'react';
import { cn } from '../../lib/utils';

/** Rótulo de campo discreto dos wizards (o destaque é o headline do passo). */
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">{children}</label>
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

interface ReviewCardProps {
  rows: { label: string; value: string }[];
}

/** Card de revisão no último step do wizard: mostra o resumo antes de guardar. */
export const ReviewCard: React.FC<ReviewCardProps> = ({ rows }) => (
  <div className="bg-white rounded-2xl border border-ceci-border-default shadow-2xs divide-y divide-ceci-border-subtle">
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