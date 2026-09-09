import React from 'react';
import { ArrowLeft, ChevronRight, Loader2, Search } from 'lucide-react';

/** Identidade cromática por tela do templo: azul acadêmico · verde clínico · rosa da marca. */
export type TempleAccent = 'academic' | 'success' | 'brand';

const ACCENTS: Record<
  TempleAccent,
  {
    tile: string;
    chipActive: string;
    chipIdle: string;
    lead: string;
    leadIcon: string;
    sectionHighlight: string;
    sectionHighlightTitle: string;
    rowHover: string;
  }
> = {
  academic: {
    tile: 'bg-surface-blue border-ceci-border-academic text-ceci-academic-strong',
    chipActive: 'bg-surface-blue text-ceci-academic-strong border-ceci-border-academic shadow-xs',
    chipIdle: 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-blue',
    lead: 'bg-surface-blue border border-ceci-border-academic rounded-[18px] p-3.5',
    leadIcon: 'text-ceci-academic-strong shrink-0 mt-0.5',
    sectionHighlight: 'rounded-xl p-4 border shadow-2xs bg-surface-blue border-ceci-border-academic',
    sectionHighlightTitle: 'text-xs uppercase tracking-wider font-bold mb-2 text-ceci-academic-strong',
    rowHover: 'hover:bg-surface-blue',
  },
  success: {
    tile: 'bg-surface-mint-soft border-ceci-border-mint text-success-deep',
    chipActive: 'bg-surface-mint-soft text-success-deep border-ceci-border-mint shadow-xs',
    chipIdle: 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-mint-soft',
    lead: 'bg-surface-mint-soft border border-ceci-border-mint rounded-[18px] p-3.5',
    leadIcon: 'text-success-deep shrink-0 mt-0.5',
    sectionHighlight: 'rounded-xl p-4 border shadow-2xs bg-surface-mint-soft border-ceci-border-mint',
    sectionHighlightTitle: 'text-xs uppercase tracking-wider font-bold mb-2 text-success-deep',
    rowHover: 'hover:bg-surface-mint-soft',
  },
  brand: {
    tile: 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong',
    chipActive: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand shadow-xs',
    chipIdle: 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-rose',
    lead: 'bg-surface-rose border border-ceci-border-brand rounded-[18px] p-3.5',
    leadIcon: 'text-ceci-brand-strong shrink-0 mt-0.5',
    sectionHighlight: 'rounded-xl p-4 border shadow-2xs bg-surface-rose border-ceci-border-brand',
    sectionHighlightTitle: 'text-xs uppercase tracking-wider font-bold mb-2 text-ceci-brand-strong',
    rowHover: 'hover:bg-surface-rose',
  },
};

export const templeAccent = (accent: TempleAccent) => ACCENTS[accent];

export const TempleIntroCard: React.FC<{
  accent: TempleAccent;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ accent, icon, title, subtitle }) => (
  <div className="bg-white rounded-2xl p-5 border border-ceci-border-default shadow-2xs">
    <div className="flex items-center gap-2.5">
      <div
        className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 [&_svg]:w-5 [&_svg]:h-5 ${ACCENTS[accent].tile}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h1 className="text-lg font-bold font-display text-ceci-primary leading-tight truncate">{title}</h1>
        <p className="text-xs text-ceci-secondary">{subtitle}</p>
      </div>
    </div>
  </div>
);

export const TempleSearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
}> = ({ value, onChange, label, placeholder }) => (
  <div className="relative px-1">
    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ceci-tertiary pointer-events-none" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? `${label}…`}
      className="w-full bg-white border border-ceci-border-default rounded-2xl pl-11 pr-4 py-3 text-sm text-ceci-primary placeholder:text-ceci-muted focus:border-ceci-border-brand focus:outline-none shadow-2xs"
      aria-label={label}
    />
  </div>
);

export const TempleBackButton: React.FC<{
  onClick: () => void;
  /** texto visível, ex.: "voltar aos conceitos" */
  label: string;
  /** aria-label completo, ex.: "voltar para a lista de conceitos" */
  ariaLabel: string;
}> = ({ onClick, label, ariaLabel }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-sm font-semibold text-ceci-brand-strong hover:text-ceci-primary transition-colors cursor-pointer px-1 py-2 touch-target"
    aria-label={ariaLabel}
  >
    <ArrowLeft className="w-4 h-4" /> {label}
  </button>
);

export const TempleChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
      active ? ACCENTS.brand.chipActive : ACCENTS.brand.chipIdle
    }`}
  >
    {label}
  </button>
);

export const TempleBadge: React.FC<{ children: React.ReactNode; accent: TempleAccent }> = ({
  children,
  accent,
}) => (
  <span
    className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ACCENTS[accent].chipActive}`}
  >
    {children}
  </span>
);

export const TempleNeutralBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-surface-muted text-ceci-secondary border border-ceci-border-subtle">
    {children}
  </span>
);

export const TempleLead: React.FC<{ accent: TempleAccent; icon?: React.ReactNode; children: React.ReactNode }> = ({
  accent,
  icon,
  children,
}) => (
  <div className={`flex items-start gap-2.5 ${ACCENTS[accent].lead}`}>
    {icon && <span className={`[&_svg]:w-4 [&_svg]:h-4 ${ACCENTS[accent].leadIcon}`}>{icon}</span>}
    <div className="min-w-0 text-xs text-ceci-primary leading-relaxed">{children}</div>
  </div>
);

export const TempleSectionCard: React.FC<{
  title: string;
  accent?: TempleAccent;
  highlighted?: boolean;
  children: React.ReactNode;
}> = ({ title, accent = 'academic', highlighted = false, children }) => (
  <section
    className={
      highlighted
        ? ACCENTS[accent].sectionHighlight
        : 'rounded-xl p-4 border shadow-2xs bg-white border-ceci-border-default'
    }
  >
    <h2 className={highlighted ? ACCENTS[accent].sectionHighlightTitle : 'text-xs uppercase tracking-wider font-bold mb-2 text-ceci-secondary'}>
      {title}
    </h2>
    {children}
  </section>
);

export const TempleLoading: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center justify-center gap-2 py-8 text-sm text-ceci-secondary">
    <Loader2 className="w-4 h-4 animate-spin" /> {label}
  </div>
);

export const TempleEmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-8">
    <p className="text-sm text-ceci-secondary">{message}</p>
  </div>
);

/** Cabeçalho de accordion de lista (domínios/categorias) — padrão único nas 3 telas. */
export const TempleAccordionHeader: React.FC<{
  title: string;
  meta?: string;
  count: number;
  countLabel: string;
  open: boolean;
  onToggle: () => void;
}> = ({ title, meta, count, countLabel, open, onToggle }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between gap-2 p-4 cursor-pointer hover:bg-surface-muted transition-colors text-left"
    aria-expanded={open}
  >
    <div className="min-w-0 pr-2">
      <h2 className="text-sm font-bold text-ceci-primary font-display">{title}</h2>
      {meta && <p className="text-xs text-ceci-secondary mt-0.5 line-clamp-2">{meta}</p>}
      <p className="text-[11px] text-ceci-muted mt-0.5">
        {count} {countLabel}
      </p>
    </div>
    <ChevronRight
      className={`w-4 h-4 text-ceci-tertiary transition-transform shrink-0 ${open ? 'rotate-90' : ''}`}
    />
  </button>
);
