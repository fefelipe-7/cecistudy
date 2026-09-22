import React from 'react';
import { ChevronRight } from 'lucide-react';
import { splitMarked } from '../lib/searchLogic';

/** Título com o termo buscado em destaque rosé (<mark>). */
export const MarkedTitle: React.FC<{ title: string; ranges: [number, number][] }> = ({
  title,
  ranges,
}) => {
  if (ranges.length === 0) return <>{title}</>;
  return (
    <>
      {splitMarked(title, ranges).map((seg, i) =>
        seg.mark ? (
          <mark
            key={i}
            className="bg-ceci-border-brand/70 text-inherit rounded-[3px] px-px -mx-px"
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
};

interface SearchRowProps {
  id: string;
  title: string;
  titleRanges: [number, number][];
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
  registerRef: (id: string, el: HTMLButtonElement | null) => void;
}

/** Linha de resultado da busquinha — <button> nativo, 44px+, navegável por teclado. */
export const SearchRow: React.FC<SearchRowProps> = ({
  id,
  title,
  titleRanges,
  subtitle,
  badge,
  icon,
  selected,
  onSelect,
  onHover,
  registerRef,
}) => (
  <button
    ref={(el) => registerRef(id, el)}
    id={`search-option-${id}`}
    role="option"
    aria-selected={selected}
    type="button"
    onClick={onSelect}
    onMouseEnter={onHover}
    className={`w-full flex items-center justify-between gap-2 min-h-[44px] p-3 rounded-2xl text-left cursor-pointer transition-colors ${
      selected ? 'bg-surface-rose' : 'hover:bg-surface-rose/50'
    }`}
  >
    <span className="flex items-center gap-3 min-w-0">
      <span
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          selected
            ? 'bg-ceci-border-brand text-ceci-primary'
            : 'bg-surface-rose text-ceci-primary'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span
            className={`font-semibold text-sm truncate transition-colors ${
              selected ? 'text-ceci-brand-strong' : 'text-ceci-primary'
            }`}
          >
            <MarkedTitle title={title} ranges={titleRanges} />
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-blue text-ceci-academic-strong font-medium border border-ceci-border-academic shrink-0">
            {badge}
          </span>
        </span>
        <span className="block text-xs text-ceci-secondary line-clamp-1">{subtitle}</span>
      </span>
    </span>
    <ChevronRight
      className={`w-4 h-4 shrink-0 transition-all ${
        selected ? 'text-ceci-primary translate-x-0.5' : 'text-ceci-tertiary'
      }`}
    />
  </button>
);
