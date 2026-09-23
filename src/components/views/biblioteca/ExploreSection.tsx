// ZONA 2 — seção colapsável do acervo (MOD-001 / B.4).
// Componente presentacional: cabeçalho clicável + corpo condicional.

import React from 'react';
import { ChevronRight } from 'lucide-react';

const ExploreSection: React.FC<{
  id: string;
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ id, icon, title, badge, open, onToggle, children }) => (
  <div data-section={id} className="cv-shelf space-y-3 pt-3 px-1 border-t border-ceci-border-default">
    <button
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center justify-between gap-2 cursor-pointer tap-interactive"
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <h2 className="font-display font-bold text-base text-ceci-primary truncate">{title}</h2>
      </div>
      <span className="flex items-center gap-2 shrink-0">
        {badge}
        <ChevronRight className={`w-4 h-4 text-ceci-secondary transition-transform ${open ? 'rotate-90' : ''}`} />
      </span>
    </button>
    {open && <div className="pt-1">{children}</div>}
  </div>
);

export default ExploreSection;