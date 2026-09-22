import React, { useMemo, useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { cn, NoInfer } from '@/lib/utils';
import type { PillOption } from './PillGroup';

interface PillGroupMultiProps<T extends string> {
  label?: string;
  options: PillOption<NoInfer<T>>[];
  /** Valores selecionados (escolha múltipla). */
  value: T[];
  onChange: (value: T[]) => void;
  /** Estilo do estado selecionado. */
  variant?: 'primary' | 'academic' | 'brand' | 'rose';
  size?: 'sm' | 'md';
  className?: string;
  /**
   * Acima deste número de opções, alterna para lista com busca (§4.3 do
   * docs/modais-wizards.md). `false` desativa a alternância. Default: 8.
   */
  searchThreshold?: number | false;
}

const VARIANT_CLASSES: Record<NonNullable<PillGroupMultiProps<string>['variant']>, string> = {
  primary: 'bg-ceci-primary text-ceci-on-primary border-ceci-primary',
  academic: 'bg-ceci-academic text-ceci-on-academic border-ceci-academic',
  brand: 'bg-ceci-brand-strong text-ceci-on-brand border-ceci-brand-strong',
  rose: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand shadow-2xs',
};

const SIZES = {
  sm: 'px-2.5 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
} as const;

/** Grupo de pills de escolha múltipla — padrão do cecistudy. */
export const PillGroupMulti = <T extends string>({
  label,
  options,
  value,
  onChange,
  variant = 'brand',
  size = 'md',
  className,
  searchThreshold = 8,
}: PillGroupMultiProps<T>) => {
  const [term, setTerm] = useState('');
  const useSearchList = searchThreshold !== false && options.length > searchThreshold;

  const toggle = (v: T) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const filtered = useMemo(() => {
    if (!term.trim()) return options;
    const t = term.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(t));
  }, [options, term]);

  const selectedOptions = options.filter((o) => value.includes(o.value));

  if (!useSearchList) {
    return (
      <div>
        {label && (
          <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
            {label}
          </span>
        )}
        <div className={cn('flex flex-wrap gap-1.5', className)}>
          {options.map((o) => {
            const sel = value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                aria-pressed={sel}
                className={cn(
                  'rounded-full font-semibold capitalize whitespace-nowrap tap-interactive cursor-pointer transition',
                  SIZES[size],
                  sel
                    ? VARIANT_CLASSES[variant]
                    : 'bg-surface-default text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted'
                )}
              >
                {o.emoji ? `${o.emoji} ` : ''}
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- modo lista com busca (listas grandes) ----
  return (
    <div className={className}>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}

      {/* contador + limpar tudo */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-ceci-secondary">
          {value.length} selecionado{value.length === 1 ? '' : 's'}
        </span>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] font-semibold text-ceci-tertiary hover:text-status-danger-strong transition-colors cursor-pointer"
          >
            limpar tudo
          </button>
        )}
      </div>

      {/* chips removíveis das seleções */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              aria-label={`remover ${o.label}`}
              className={cn(
                'inline-flex items-center gap-1 rounded-full font-semibold tap-interactive cursor-pointer transition',
                SIZES[size],
                VARIANT_CLASSES[variant]
              )}
            >
              {o.label}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* busca */}
      <div className="relative mb-2">
        <Search className="w-4 h-4 text-ceci-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={`buscar em ${options.length} opções...`}
          aria-label={label ? `buscar em ${label}` : 'buscar opções'}
          className="w-full bg-surface-input rounded-xl pl-9 pr-3 py-2.5 text-xs text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-ceci-brand/30"
        />
      </div>

      {/* lista rolável com estado redundante (cor + check) */}
      <div className="max-h-52 overflow-y-auto rounded-2xl border border-ceci-border-default divide-y divide-ceci-border-subtle">
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-[11px] text-ceci-tertiary text-center">
            nada encontrado para "{term}" ♡
          </p>
        )}
        {filtered.map((o) => {
          const sel = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role="checkbox"
              aria-checked={sel}
              onClick={() => toggle(o.value)}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs font-medium capitalize cursor-pointer transition-colors',
                sel ? 'bg-surface-rose text-ceci-brand-strong font-bold' : 'hover:bg-surface-muted text-ceci-primary'
              )}
            >
              <span className="line-clamp-2 leading-snug">
                {o.emoji ? `${o.emoji} ` : ''}
                {o.label}
              </span>
              {sel && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
