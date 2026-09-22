// ZONA 2 — seção colapsável do acervo (MOD-001 / B.4).
// Componente presentacional: cabeçalho clicável + corpo condicional.

import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface ExploreSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  /** Quando false (ex.: filtros ativos), o corpo monta na hora; quando true, o corpo só monta perto do viewport. */
  defer?: boolean;
  children: React.ReactNode;
}

/**
 * Seção colapsável do acervo.
 * Com `defer`, o corpo só monta depois que a seção chega perto do viewport
 * (uma vez) — corta o custo de montar os ~400 cards da biblioteca na
 * abertura da aba. O cabeçalho sempre aparece; filtros ativos desmontam o
 * defer (`defer={false}`) para os resultados aparecerem de imediato.
 */
const ExploreSection: React.FC<ExploreSectionProps> = ({
  id,
  icon,
  title,
  badge,
  open,
  onToggle,
  defer = true,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    if (nearViewport) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNearViewport(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearViewport(true);
          io.disconnect();
        }
      },
      // monta bem antes de entrar na tela, para o conteúdo já vir pronto ao rolar
      { rootMargin: '500px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [nearViewport]);

  const shouldRender = nearViewport || !defer;

  return (
    <div ref={ref} data-section={id} className="cv-shelf space-y-3 pt-3 px-1 border-t border-ceci-border-default">
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
      {open && shouldRender && <div className="pt-1">{children}</div>}
    </div>
  );
};

export default ExploreSection;