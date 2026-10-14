// Perfil — row de preferência/manutenção (SPEC-013 D6).
//
// Sete controles que hoje têm peso de cartão viram linhas leves dentro de um
// bloco único. A interação fica nativa de graça (D11): row com `onClick` é um
// `button` de verdade (Enter/Espaço/Tab vêm do browser), row com `toggle` usa o
// `Toggle` padrão (`button role="switch"`, `toggle-switch-glass.tsx:207-211`).
// Nenhuma `div role="button"` nova.
import React from 'react';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toggle } from '../../ui/Toggle';

interface PreferenceRowToggle {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

interface PreferenceRowProps {
  icon: ReactNode;
  label: string;
  description?: ReactNode;
  /** Valor exibido à direita (ex.: nome do tema). */
  value?: ReactNode;
  /** Presente → a row é um `button` de navegação/ação. */
  onClick?: () => void;
  /** Presente → a row leva interruptor em vez de ação. */
  toggle?: PreferenceRowToggle;
  /** Nome acessível completo (default: `label` + `value`). */
  ariaLabel?: string;
}

const Frame: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-3 w-full text-left">{children}</div>
);

const IconTile: React.FC<{ icon: ReactNode }> = ({ icon }) => (
  <span
    aria-hidden="true"
    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-surface-muted text-ceci-secondary border border-ceci-border-default"
  >
    {icon}
  </span>
);

const Label: React.FC<{ label: string; description?: ReactNode }> = ({ label, description }) => (
  <span className="flex-1 min-w-0">
    <span className="block font-display font-bold text-sm text-ceci-primary">{label}</span>
    {description ? (
      <span className="block text-[11px] leading-tight text-ceci-secondary mt-0.5">{description}</span>
    ) : null}
  </span>
);

const PreferenceRow: React.FC<PreferenceRowProps> = ({
  icon,
  label,
  description,
  value,
  onClick,
  toggle,
  ariaLabel,
}) => {
  const rowClass = cn(
    'w-full flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors',
    onClick ? 'cursor-pointer hover:bg-surface-muted' : '',
  );

  const body = (
    <>
      <IconTile icon={icon} />
      <Label label={label} description={description} />
      {value ? (
        <span className="shrink-0 text-xs font-medium text-ceci-secondary flex items-center gap-1">
          {value}
          {onClick ? <ChevronRight className="w-4 h-4 text-ceci-muted" aria-hidden="true" /> : null}
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel ?? label} className={cn(rowClass, 'text-left')}>
        {body}
      </button>
    );
  }

  if (toggle) {
    return (
      <div className={rowClass}>
        <Frame>
          <IconTile icon={icon} />
          <Label label={label} description={description} />
          <Toggle
            checked={toggle.checked}
            onChange={toggle.onChange}
            disabled={toggle.disabled}
            label={ariaLabel ?? label}
          />
        </Frame>
      </div>
    );
  }

  return (
    <div className={rowClass}>
      <Frame>{body}</Frame>
    </div>
  );
};

export default PreferenceRow;
