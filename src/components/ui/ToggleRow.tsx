import React from 'react';
import { cn } from '@/lib/utils';
import { Toggle } from './Toggle';

interface ToggleRowProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  /** Estilo do quadradinho do ícone (ex.: bg/border/text). */
  iconClassName?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  /** Conteúdo extra abaixo da descrição (ex.: aviso de não concedido). */
  extra?: React.ReactNode;
}

/** Linha de configuração com interruptor (ícone + rótulo + descrição + Toggle à direita). */
export const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  description,
  icon,
  iconClassName,
  checked,
  onChange,
  disabled,
  loading,
  className,
  extra,
}) => (
  <div className={cn('flex items-center gap-3', className)}>
    {icon && (
      <span
        className={cn(
          'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
          iconClassName ?? 'bg-surface-muted text-ceci-secondary border border-ceci-border-default'
        )}
      >
        {icon}
      </span>
    )}
    <div className="flex-1 min-w-0">
      <h3 className="font-display font-bold text-sm text-ceci-primary">{label}</h3>
      {description && <p className="text-[11px] text-ceci-secondary leading-tight mt-0.5">{description}</p>}
      {extra}
    </div>
    <Toggle checked={checked} onChange={onChange} disabled={disabled} loading={loading} label={label} />
  </div>
);