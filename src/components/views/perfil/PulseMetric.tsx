// Perfil — indicador de ritmo acionável (SPEC-013 D3/D11).
//
// Cada métrica é um `button` de verdade — nunca `div role="button"` novo (D11) —
// com rótulo acessível completo ("1h 15min estudados. abrir sessões de estudo"),
// não só o número. O `value` fica em `font-display`, o resto em texto pequeno.
import React from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PulseMetricProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  /** Frase completa para leitor de tela; o visual não a repete. */
  ariaLabel: string;
  onClick: () => void;
  /** `attention` só quando há pendência real (ex.: provas > 0). */
  tone?: 'default' | 'attention';
}

const PulseMetric: React.FC<PulseMetricProps> = ({
  icon,
  label,
  value,
  ariaLabel,
  onClick,
  tone = 'default',
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={cn(
      'touch-target w-full text-left flex flex-col gap-1.5 rounded-2xl border p-3.5 transition-colors cursor-pointer active:scale-[0.98]',
      tone === 'attention'
        ? 'bg-status-warning-surface border-status-warning-border hover:border-status-warning'
        : 'bg-surface-muted border-ceci-border-subtle hover:border-ceci-border-default',
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex',
        tone === 'attention' ? 'text-status-warning-strong' : 'text-ceci-brand-strong',
      )}
    >
      {icon}
    </span>
    <span className="font-display text-xl font-bold text-ceci-primary leading-none">{value}</span>
    <span className="text-[11px] text-ceci-secondary">{label}</span>
  </button>
);

export default PulseMetric;
