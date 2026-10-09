import React from 'react';
import { Check, AlertCircle, Info, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Estado em chip — **nunca só cor** (`SPEC-009 §9.10`).
 *
 * Todo estado tem ícone e texto, para quem não distingue o tom e para leitor de
 * tela. `warning` é o tom de pendência (`D13`): neutro, nunca vermelho — o
 * `status-danger` que a tela de caso usava comunicava urgência que não existe.
 *
 * Promovido de `src/components/internship/` para `src/components/ui/` na
 * SPEC-012 F3.5: o TCC precisa dele e chip de estado não é vocabulário do
 * Estágio. O caminho antigo vira stub de re-export.
 */
export type StatusTone = 'success' | 'warning' | 'info' | 'muted';

const TONE: Record<
  StatusTone,
  { cls: string; Icon: typeof Check; defaultLabel: string }
> = {
  success: {
    cls: 'bg-status-success-surface border-status-success-border text-status-success-strong',
    Icon: Check,
    defaultLabel: 'ok',
  },
  warning: {
    cls: 'bg-status-warning-surface border-status-warning-border text-status-warning-strong',
    Icon: AlertCircle,
    defaultLabel: 'pendente',
  },
  info: {
    cls: 'bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong',
    Icon: Info,
    defaultLabel: '',
  },
  muted: {
    cls: 'bg-surface-muted border border-ceci-border-subtle text-ceci-secondary',
    Icon: Circle,
    defaultLabel: '',
  },
};

interface StatusChipProps {
  tone: StatusTone;
  children?: React.ReactNode;
  /** Rotulo; sem ele, usa o padrão do tom. */
  label?: string;
  onClick?: () => void;
  /** Estado pressionado de um chip **filtro** (`aria-pressed`). */
  pressed?: boolean;
  className?: string;
  iconOnly?: boolean;
  ariaLabel?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  tone,
  children,
  label,
  onClick,
  pressed,
  className,
  iconOnly,
  ariaLabel,
}) => {
  const { cls, Icon } = TONE[tone];
  const content = (
    <>
      <Icon className="w-4 h-4" aria-hidden />
      {!iconOnly && (children ?? label ?? TONE[tone].defaultLabel)}
    </>
  );

  const shell = cn(
    'inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-full',
    // 44px de alvo: o chip é clicável, e chip pequeno é alvo pequeno.
    onClick ? 'min-h-[44px] cursor-pointer tap-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand' : 'min-h-[36px]',
    pressed ? 'ring-2 ring-ceci-brand' : '',
    cls,
    className
  );

  if (!onClick) return <span className={shell}>{content}</span>;

  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} aria-label={ariaLabel} className={shell}>
      {content}
    </button>
  );
};
