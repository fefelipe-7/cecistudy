import React, { useMemo, useRef, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { normalizeText } from '../../lib/readingMatching';

interface AuthorSuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Nomes sugeridos (banco pessoal + leituras + catálogo). */
  suggestions?: string[];
  /** Chamado ao confirmar a criação de um autor novo com o nome digitado. */
  onCreateAuthor?: (name: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Campo de autor com autocomplete: sugestões do cantinho enquanto digita e,
 * quando o nome ainda não existe, atalho "guardar como autor ♡".
 */
export const AuthorSuggestInput: React.FC<AuthorSuggestInputProps> = ({
  value,
  onChange,
  suggestions = [],
  onCreateAuthor,
  placeholder,
  autoFocus,
}) => {
  const [focused, setFocused] = useState(false);
  const [createdFor, setCreatedFor] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = value.trim();
  const matches = useMemo(() => {
    if (!trimmed) return [];
    const t = normalizeText(trimmed);
    return suggestions
      .filter((s) => normalizeText(s).includes(t))
      .slice(0, 5);
  }, [suggestions, trimmed]);

  const exactExists = useMemo(
    () => suggestions.some((s) => normalizeText(s) === normalizeText(trimmed)),
    [suggestions, trimmed]
  );

  const canCreate =
    !!onCreateAuthor && trimmed.length >= 2 && !exactExists && createdFor !== trimmed;

  const pick = (name: string) => {
    onChange(name);
    setFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        aria-label="autor da obra"
        className="w-full bg-surface-input border border-transparent rounded-2xl px-4 py-4 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-shadow"
      />

      {focused && matches.length > 0 && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-surface-default rounded-2xl border border-ceci-border-default shadow-lg overflow-hidden">
          {matches.map((name) => (
            <button
              key={name}
              type="button"
              // onMouseDown dispara antes do blur do input — mantém o clique
              onMouseDown={(e) => {
                e.preventDefault();
                pick(name);
              }}
              className={cn(
                'w-full text-left px-4 py-2.5 text-xs font-medium text-ceci-primary',
                'hover:bg-surface-muted transition-colors cursor-pointer'
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {canCreate && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onCreateAuthor?.(trimmed);
            setCreatedFor(trimmed);
          }}
          className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong hover:bg-ceci-border-brand/40 tap-interactive cursor-pointer transition active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5" />
          guardar "{trimmed}" como autor ♡
        </button>
      )}
    </div>
  );
};
