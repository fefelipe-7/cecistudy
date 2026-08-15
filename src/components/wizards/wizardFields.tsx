import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Rótulo de campo discreto dos wizards (o destaque é o headline do passo). */
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">{children}</label>
);

/** Input "chunky": fundo sólido suave, cantos grandes, bastante respiro interno. */
const inputClass =
  'w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-shadow';

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={cn(inputClass, props.className)} />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={cn(inputClass, 'resize-none leading-relaxed', props.className)} />
);

export const DateInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input type="date" {...props} className={cn(inputClass, 'text-sm', props.className)} />
);

interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  emptyMessage?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  emptyMessage,
}) => (
  <div>
    {label && <FieldLabel>{label}</FieldLabel>}
    {options.length === 0 ? (
      <p className="text-[11px] text-ceci-tertiary bg-surface-input rounded-2xl px-4 py-4">
        {emptyMessage ?? 'ainda não há opções no cantinho.'}
      </p>
    ) : (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 cursor-pointer"
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )}
  </div>
);

interface ChipOption<T extends string> {
  value: T;
  label: string;
  emoji?: string;
}

interface ChipPickerProps<T extends string> {
  label?: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: React.SetStateAction<T>) => void;
}

interface MultiChipPickerProps<T extends string> {
  label?: string;
  options: ChipOption<T>[];
  values: T[];
  onChange: (values: React.SetStateAction<T[]>) => void;
}

/**
 * Escolha única em cartões clicáveis (selection cards):
 * cantos 16px, borda leve; selecionado = borda da marca + fundo rosado.
 */
export const ChipPicker = <T extends string>({
  label,
  options,
  value,
  onChange,
}: ChipPickerProps<T>) => (
  <div>
    {label && <FieldLabel>{label}</FieldLabel>}
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            'flex items-center gap-2.5 px-3.5 py-3.5 rounded-[16px] border-2 text-left transition-all active:scale-[0.98] cursor-pointer min-h-[52px]',
            value === o.value
              ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong shadow-2xs'
              : 'bg-white border-ceci-border-subtle text-ceci-primary hover:bg-surface-muted'
          )}
        >
          {o.emoji && <span className="text-lg leading-none shrink-0">{o.emoji}</span>}
          <span className="text-xs font-semibold leading-snug">{o.label}</span>
        </button>
      ))}
    </div>
  </div>
);

/** Pills de escolha múltipla (disciplinas, autores…) — mantidas compactas p/ listas grandes. */
export const MultiChipPicker = <T extends string>({
  label,
  options,
  values,
  onChange,
}: MultiChipPickerProps<T>) => {
  const toggle = (value: T) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            aria-pressed={values.includes(o.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all cursor-pointer',
              values.includes(o.value)
                ? 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand shadow-2xs'
                : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-rose'
            )}
          >
            {o.emoji ? `${o.emoji} ` : ''}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}

/** Campo de texto com botão + para montar lista de chips (tópicos, obras, autores…). */
export const TagInput: React.FC<TagInputProps> = ({
  label,
  tags,
  onChange,
  placeholder = 'digite e toque em +',
  emptyMessage,
}) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (tags.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...tags, v]);
    setDraft('');
  };

  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={cn(inputClass, 'flex-1 min-w-0')}
        />
        <button
          type="button"
          onClick={add}
          className="w-14 h-14 rounded-2xl bg-ceci-primary hover:bg-ceci-primary-hover text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform active:scale-95 cursor-pointer"
          aria-label="adicionar"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-rose border border-ceci-border-brand text-[11px] font-semibold text-ceci-brand-strong"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="cursor-pointer hover:text-ceci-brand-strong/60"
              aria-label={`remover ${t}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && emptyMessage && (
          <span className="text-[11px] text-ceci-tertiary">{emptyMessage}</span>
        )}
      </div>
    </div>
  );
};

interface ReviewCardProps {
  rows: { label: string; value: string }[];
}

/** Card de revisão no último step do wizard: mostra o resumo antes de guardar. */
export const ReviewCard: React.FC<ReviewCardProps> = ({ rows }) => (
  <div className="bg-white rounded-2xl border border-ceci-border-default shadow-2xs divide-y divide-ceci-border-subtle">
    {rows.map((r) => (
      <div key={r.label} className="px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary mb-0.5">
          {r.label}
        </p>
        <p className="text-sm text-ceci-primary leading-snug">{r.value || '—'}</p>
      </div>
    ))}
  </div>
);