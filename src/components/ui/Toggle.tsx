import React from 'react';
import { cn } from '../../lib/utils';
import ToggleSwitch from './toggle-switch-glass';

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

/** Interruptor de vidro (toggle-switch-glass), padrão do cecistudy. */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled,
  loading,
  className,
}) => (
  <ToggleSwitch
    isActive={checked}
    onChange={() => onChange()}
    label={label}
    disabled={disabled || loading}
    size="sm"
    colorTheme="brand"
    className={cn('shrink-0', className)}
  />
);
