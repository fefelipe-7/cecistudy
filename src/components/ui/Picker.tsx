import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './Modal';
import { Kitty } from './Kitty';

export interface PickerOption {
  value: string;
  label: string;
}

interface PickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: PickerOption[];
  placeholder?: string;
  emptyMessage?: string;
  /** Classe do botão disparador (padrão: campo "chunky" dos wizards). */
  buttonClassName?: string;
  /** Rótulo exibido no topo da sheet. */
  sheetTitle?: string;
}

/**
 * Seletor bottom-sheet: botão abre uma lista em modal inferior (padrão app nativo).
 * Substitui os `<select>` nativos e o antigo `SelectField`.
 */
export const Picker: React.FC<PickerProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'escolher...',
  emptyMessage,
  buttonClassName,
  sheetTitle,
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}

      {options.length === 0 ? (
        <div className="flex items-center gap-2.5 bg-surface-input rounded-2xl px-4 py-4">
          <Kitty expression="curiosa" className="w-8 h-8 shrink-0" decorative />
          <p className="text-[11px] text-ceci-tertiary">
            {emptyMessage ?? 'ainda não há opções no cantinho.'}
          </p>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              'w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 cursor-pointer transition-colors',
              buttonClassName
            )}
          >
            <span className={cn('truncate', value ? 'text-ceci-primary' : 'text-ceci-faded')}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronDown className={cn('w-4 h-4 text-ceci-tertiary shrink-0 transition-transform', open && 'rotate-180')} />
          </button>

          <Modal
            open={open}
            onClose={() => setOpen(false)}
            position="bottom"
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-t-[28px] sm:rounded-[24px] border border-ceci-border-default shadow-xl overflow-hidden text-ceci-primary">
              <div className="px-5 pt-4 pb-2 border-b border-ceci-border-subtle">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
                  {sheetTitle ?? label ?? 'escolher'}
                </p>
              </div>
              <div
                role="listbox"
                aria-label={sheetTitle ?? label ?? 'escolher'}
                className="max-h-[55vh] overflow-y-auto py-1"
              >
                {options.map((o) => {
                  const isSelected = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-5 py-3.5 text-sm text-left cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-surface-rose text-ceci-brand-strong font-semibold'
                          : 'text-ceci-primary hover:bg-surface-muted'
                      )}
                    >
                      <span className="truncate">{o.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-ceci-brand-strong shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};