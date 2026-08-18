import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagList } from './TagList';

const inputClass =
  'w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-shadow';

interface TagFieldProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}

/**
 * Campo de tags: digite e toque em + (ou Enter/vírgula) para adicionar;
 * backspace com o campo vazio remove a última tag. Deduplica sem diferenciar maiúsculas.
 */
export const TagField: React.FC<TagFieldProps> = ({
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
    setDraft('');
    const lower = v.toLowerCase();
    if (tags.some((t) => t.toLowerCase() === lower)) return;
    onChange([...tags, v]);
  };

  return (
    <div>
      {label && (
        <span className="block text-[11px] font-semibold text-ceci-tertiary mb-1.5 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
              onChange(tags.slice(0, -1));
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

      <div className="mt-2.5">
        <TagList
          tags={tags}
          onRemove={(t) => onChange(tags.filter((x) => x !== t))}
          emptyMessage={emptyMessage}
        />
      </div>
    </div>
  );
};