import React, { useMemo, useState } from 'react';
import { Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './Modal';

/** Uma opção candidata a entrar num grupo do repertório (SPEC-001). */
export interface CatalogSelectOption {
  value: string;
  label: string;
  hint?: string;
  /** Grupo de origem, exibido como cabeçalho na sheet. */
  group: 'pessoal' | 'acervo' | 'catalogo';
  /** Badge curto de fonte (ex.: "livro", "artigo", "minha leitura"). */
  badge?: string;
}

interface CatalogMultiSelectProps {
  open: boolean;
  onClose: () => void;
  /** Título do header da sheet (ex.: "conceitos-chave"). */
  title: string;
  options: CatalogSelectOption[];
  /** Valores selecionados (ids reais/pseudo-ids). */
  value: string[];
  onChange: (value: string[]) => void;
  /** Config do empty state. */
  emptyMessage?: string;
  /** Config da faixa de grupos visíveis. Default: todos. */
  groups?: ('pessoal' | 'acervo' | 'catalogo')[];
}

const GROUP_LABEL: Record<CatalogSelectOption['group'], string> = {
  pessoal: 'do seu cantinho',
  acervo: 'do acervo ✦',
  catalogo: 'do catálogo',
};

const GROUP_ORDER: CatalogSelectOption['group'][] = ['pessoal', 'acervo', 'catalogo'];

/**
 * Seletor bottom-sheet de várias opções com busca e agrupamento por origem
 * (banco pessoal / acervo ✦ / catálogo) — usado nos passos de repertório do
 * CourseWizard, no detalhe da disciplina e no EditCourseModal. O valor é
 * controlado pelo caller (que resolve pseudo-ids de acervo via `resolveIds`).
 */
export const CatalogMultiSelect: React.FC<CatalogMultiSelectProps> = ({
  open,
  onClose,
  title,
  options,
  value,
  onChange,
  emptyMessage,
  groups = GROUP_ORDER,
}) => {
  const [term, setTerm] = useState('');

  const closeSheet = () => {
    onClose();
    setTerm('');
  };

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const filtered = useMemo(() => {
    if (!term.trim()) return options;
    const t = term.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(t) || o.hint?.toLowerCase().includes(t));
  }, [options, term]);

  const visibleGroups = groups.filter((g) => filtered.some((o) => o.group === g));
  const selectedOptions = options.filter((o) => value.includes(o.value));

  return (
    <Modal open={open} onClose={closeSheet} position="bottom" className="w-full max-w-md">
      <div className="bg-surface-default rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden text-ceci-primary">
        <div className="px-5 pt-4 pb-2 border-b border-ceci-border-subtle">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">{title}</p>
        </div>

        <div className="px-5 pt-3 pb-1">
          <div className="relative">
            <Search className="w-4 h-4 text-ceci-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={`buscar em ${options.length} opções...`}
              aria-label={`buscar em ${title}`}
              className="w-full bg-surface-input rounded-2xl pl-10 pr-8 py-3 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-ceci-brand/30"
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

        {/* chips removíveis do que já foi selecionado */}
        {selectedOptions.length > 0 && (
          <div className="px-5 pt-2 pb-1 flex flex-wrap gap-1.5">
            {selectedOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                aria-label={`remover ${o.label}`}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand text-xs font-semibold tap-interactive cursor-pointer transition"
              >
                {o.label}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        {visibleGroups.length === 0 && (
          <p className="px-5 py-8 text-xs text-ceci-tertiary text-center">
            {emptyMessage ?? `nada de ${title} por aqui ainda ♡`}
          </p>
        )}

        <div className="max-h-[45vh] overflow-y-auto pb-2">
          {visibleGroups.map((group) => (
            <div key={group} className="mt-2">
              <p className="px-5 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
                {GROUP_LABEL[group]}
              </p>
              <div className="divide-y divide-ceci-border-subtle">
                {filtered
                  .filter((o) => o.group === group)
                  .map((o) => {
                    const sel = value.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="checkbox"
                        aria-checked={sel}
                        onClick={() => toggle(o.value)}
                        className={cn(
                          'w-full flex items-center justify-between gap-2 px-5 py-3 text-sm text-left cursor-pointer transition-colors',
                          sel ? 'bg-surface-rose text-ceci-brand-strong font-semibold' : 'hover:bg-surface-muted'
                        )}
                      >
                        <span className="min-w-0 flex flex-col">
                          <span className="line-clamp-2 leading-snug">{o.label}</span>
                          {o.hint && (
                            <span className="text-[10px] font-normal text-ceci-tertiary leading-snug">
                              {o.badge ? `${o.badge} • ` : ''}
                              {o.hint}
                            </span>
                          )}
                        </span>
                        {sel && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pt-2 pb-5 border-t border-ceci-border-subtle flex items-center justify-between">
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
      </div>
    </Modal>
  );
};