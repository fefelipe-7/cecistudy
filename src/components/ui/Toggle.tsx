import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

/** Interruptor iOS-like (trilho + botãozinho branco), padrão do cecistudy. */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled,
  loading,
  className,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled || loading}
      className={cn(
        'relative w-12 h-7 rounded-full tap-interactive cursor-pointer shrink-0 touch-target transition-colors duration-200',
        checked ? 'bg-rose-500' : 'bg-ceci-border-strong',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center transition-transform duration-200',
          checked && 'translate-x-5'
        )}
      >
        {loading ? (
          <span className="text-[10px] text-ceci-secondary">…</span>
        ) : (
          checked && <Check className="w-3 h-3 text-rose-500" />
        )}
      </span>
    </button>
  );
};