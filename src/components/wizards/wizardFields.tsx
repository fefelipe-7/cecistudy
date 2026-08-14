import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Rótulo de campo padrão dos wizards. */
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs font-medium text-ceci-secondary mb-1">{children}</label>
);

const inputClass =
  'w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-2.5 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 placeholder-ceci-faded';

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
      <p className="text-[11px] text-ceci-tertiary bg-white border border-ceci-border-default rounded-xl px-3.5 py-2.5">
        {emptyMessage ?? 'ainda não há opções no cantinho.'}
      </p>
    ) : (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-ceci-border-default rounded-xl px-3 py-2.5 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 cursor-pointer"
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

/** Pills de escolha única (categorias, prioridades, status…). */
export const ChipPicker = <T extends string>({
  label,
  options,
  value,
  onChange,
}: ChipPickerProps<T>) => (
  <div>
    {label && <FieldLabel>{label}</FieldLabel>}
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all cursor-pointer',
            value === o.value
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

/** Pills de escolha múltipla (disciplinas, autores…). */
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
          className="flex-1 min-w-0 bg-white border border-ceci-border-default rounded-xl px-3.5 py-2.5 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 placeholder-ceci-faded"
        />
        <button
          type="button"
          onClick={add}
          className="w-10 h-10 rounded-xl bg-ceci-primary hover:bg-ceci-primary-hover text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform active:scale-95 cursor-pointer"
          aria-label="adicionar"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
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
