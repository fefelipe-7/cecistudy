import React, { useMemo, useState } from 'react';
import { ChevronDown, Check, Search, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './Modal';
import { Mascote } from './Mascote';

export interface PickerOption {
  value: string;
  label: string;
  /** Contexto secundário exibido sob o label (ex.: código da matéria). */
  hint?: string;
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
  /** Mostra a busca na sheet quando as opções passam deste limite (default: 9). */
  searchThreshold?: number;
  /** Oferece "limpar seleção" dentro da sheet (seleção opcional). */
  clearable?: boolean;
  /** Rótulo do CTA de criação contextual (ex.: "criar matéria agora"). */
  createLabel?: string;
  /** Ação de criação contextual — aparece na lista vazia e no rodapé da sheet. */
  onCreate?: () => void;
}

/**
 * Seletor bottom-sheet: botão abre uma lista em modal inferior (padrão app nativo).
 * Evoluições docs/modais-wizards.md §4.1/§4.2: busca em listas grandes, limpar
 * seleção, labels em duas linhas e criação contextual no empty state.
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
  searchThreshold = 9,
  clearable = false,
  createLabel,
  onCreate,
}) => {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const selected = options.find((o) => o.value === value);
  const showSearch = options.length > searchThreshold;

  const filtered = useMemo(() => {
    if (!showSearch || !term.trim()) return options;
    const t = term.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(t));
  }, [options, term, showSearch]);

  const closeSheet = () => {
    setOpen(false);
    setTerm('');
  };

  return (
    <div>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}

      {options.length === 0 ? (
        <div className="flex items-center gap-2.5 bg-surface-input rounded-2xl px-4 py-4">
          <Mascote expression="empty-invite" className="w-8 h-8 shrink-0" decorative />
          <div className="min-w-0">
            <p className="text-[11px] text-ceci-tertiary leading-snug">
              {emptyMessage ?? 'ainda não há opções no cantinho.'}
            </p>
            {onCreate && createLabel && (
              <button
                type="button"
                onClick={onCreate}
                className="mt-1.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-ceci-brand-strong text-white text-[11px] font-bold active:scale-95 transition-transform cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                {createLabel}
              </button>
            )}
          </div>
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
            <span className="truncate text-left min-w-0 flex flex-col">
              <span className={cn('leading-tight', value ? 'text-ceci-primary' : 'text-ceci-faded')}>
                {selected ? selected.label : placeholder}
              </span>
              {selected?.hint && (
                <span className="text-[10px] text-ceci-tertiary leading-tight">{selected.hint}</span>
              )}
            </span>
            <ChevronDown className={cn('w-4 h-4 text-ceci-tertiary shrink-0 transition-transform', open && 'rotate-180')} />
          </button>

          <Modal
            open={open}
            onClose={closeSheet}
            position="bottom"
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-t-[28px] sm:rounded-[24px] border border-ceci-border-default shadow-xl overflow-hidden text-ceci-primary">
              <div className="px-5 pt-4 pb-2 border-b border-ceci-border-subtle">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
                  {sheetTitle ?? label ?? 'escolher'}
                </p>
              </div>

              {showSearch && (
                <div className="px-5 pt-3 pb-1">
                  <div className="relative">
                    <Search className="w-4 h-4 text-ceci-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="buscar por nome..."
                      aria-label={`buscar em ${sheetTitle ?? label ?? 'opções'}`}
                      className="w-full bg-surface-input rounded-2xl pl-10 pr-8 py-3 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    />
                    {term && (
                      <button
                        type="button"
                        onClick={() => setTerm('')}
                        aria-label="limpar busca"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ceci-tertiary hover:text-ceci-primary cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div
                role="listbox"
                aria-label={sheetTitle ?? label ?? 'escolher'}
                className="max-h-[45vh] overflow-y-auto py-1"
              >
                {filtered.length === 0 && (
                  <p className="px-5 py-6 text-xs text-ceci-tertiary text-center">
                    nada encontrado para "{term}" ♡
                  </p>
                )}
                {filtered.map((o) => {
                  const isSelected = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(o.value);
                        closeSheet();
                      }}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-5 py-3.5 text-sm text-left cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-surface-rose text-ceci-brand-strong font-semibold'
                          : 'text-ceci-primary hover:bg-surface-muted'
                      )}
                    >
                      <span className="min-w-0 flex flex-col">
                        <span className="line-clamp-2 leading-snug">{o.label}</span>
                        {o.hint && (
                          <span className="text-[10px] font-normal text-ceci-tertiary leading-snug">
                            {o.hint}
                          </span>
                        )}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-ceci-brand-strong shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* rodapé fixo: limpar seleção + criação contextual */}
              {(clearable || onCreate) && (
                <div className="px-5 pb-5 pt-2 border-t border-ceci-border-subtle flex gap-2">
                  {clearable && value && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange('');
                        closeSheet();
                      }}
                      className="flex-1 min-h-[44px] rounded-2xl border border-ceci-border-default bg-white text-ceci-secondary text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      sem vínculo
                    </button>
                  )}
                  {onCreate && createLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        closeSheet();
                        onCreate();
                      }}
                      className={cn(
                        'min-h-[44px] px-4 rounded-2xl bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong text-xs font-bold inline-flex items-center gap-1.5 active:scale-[0.98] transition-transform cursor-pointer',
                        !(clearable && value) && 'flex-1 justify-center'
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {createLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};
