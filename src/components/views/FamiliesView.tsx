import React, { useState } from 'react';
import { Network, Search, ChevronRight, Landmark } from 'lucide-react';
import { PSICOTERAPIA_FAMILIES } from '../../data/psicoterapiaFamilies';
import { useApp } from '../../context/AppContext';
import { Kitty } from '../ui/Kitty';

export const FamiliesView: React.FC = () => {
  const { openFamily } = useApp();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const families = PSICOTERAPIA_FAMILIES.filter((f) =>
    !q || f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
  );

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 relative">
      {/* Intro */}
      <div className="bg-white rounded-[24px] p-5 border border-ceci-border-default space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-ceci-primary leading-tight">
              10 famílias, 97 abordagens
            </h1>
            <p className="text-xs text-ceci-secondary">
              grupos de teorias e correntes que organizam o pensamento clínico
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative px-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ceci-tertiary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="procurar família…"
          className="w-full bg-white border border-ceci-border-default rounded-2xl pl-11 pr-4 py-3 text-sm text-ceci-primary placeholder:text-ceci-muted focus:border-ceci-border-brand focus:outline-none shadow-2xs"
          aria-label="procurar família de psicoterapia"
        />
      </div>

      {/* Lista de famílias */}
      <div className="space-y-3 px-1">
        {families.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <Kitty expression="surpresa" className="w-14 h-14 mx-auto" decorative />
            <p className="text-sm text-ceci-secondary">
              nada por aqui com esse nome ♡
            </p>
          </div>
        )}
        {families.map((family) => (
          <button
            key={family.id}
            onClick={() => openFamily(family.id)}
            className="w-full text-left bg-white rounded-[22px] p-4 border border-ceci-border-default hover:border-ceci-border-brand shadow-2xs card-lift press-card cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div
                className="w-11 h-11 rounded-2xl border flex items-center justify-center text-ceci-primary shrink-0"
                style={{ backgroundColor: `${family.color}33`, borderColor: family.color }}
              >
                <Landmark className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md text-ceci-primary"
                    style={{ backgroundColor: family.color }}
                  >
                    {String(family.order).padStart(2, '0')}
                  </span>
                  <h2 className="text-sm font-bold text-ceci-primary font-display transition-colors group-hover:text-ceci-brand-strong">
                    {family.name}
                  </h2>
                </div>
                <p className="text-xs text-ceci-secondary mt-1 line-clamp-2">
                  {family.description}
                </p>
                <p className="text-[11px] text-ceci-tertiary mt-1">
                  {family.approachCount} abordagens
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-ceci-brand-strong group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
