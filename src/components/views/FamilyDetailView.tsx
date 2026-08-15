import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { PSICOTERAPIA_FAMILIES, PSICOTERAPIA_APPROACHES } from '../../data/psicoterapiaBase';
import { useApp } from '../../context/AppContext';

export const FamilyDetailView: React.FC<{ familyId: string }> = ({ familyId }) => {
  const { openApproach } = useApp();
  const [showAll, setShowAll] = useState(false);

  const family = PSICOTERAPIA_FAMILIES.find((f) => f.id === familyId);
  if (!family) {
    return (
      <div className="max-w-md sm:max-w-xl mx-auto px-1 py-10 text-center text-sm text-ceci-secondary">
        não achei essa família por aqui ♡
      </div>
    );
  }

  const approaches = PSICOTERAPIA_APPROACHES.filter((a) => a.familyId === familyId);
  const visible = showAll ? approaches : approaches.slice(0, 10);

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 relative animate-in fade-in duration-300">
      {/* Título da família */}
      <div
        className="bg-white rounded-[24px] p-5 border space-y-1.5 shadow-2xs"
        style={{ borderColor: `${family.color}66` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-11 h-11 rounded-2xl border flex items-center justify-center text-ceci-primary shrink-0"
            style={{ backgroundColor: `${family.color}33`, borderColor: family.color }}
          >
            <span className="font-display font-bold">{String(family.order).padStart(2, '0')}</span>
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-ceci-primary leading-tight">
              {family.name}
            </h1>
            <p className="text-xs text-ceci-secondary">
              {family.approachCount} abordagens nesta família
            </p>
          </div>
        </div>
        <p className="text-sm text-ceci-secondary leading-relaxed pt-1">
          {family.description}
        </p>
      </div>

      {/* Cards das abordagens */}
      <div className="space-y-3 px-1">
        {visible.map((approach, idx) => (
          <button
            key={approach.id}
            onClick={() => openApproach(approach.id)}
            className="w-full text-left bg-white rounded-[22px] p-4 border border-ceci-border-default hover:border-ceci-border-brand shadow-2xs tap-interactive hover:shadow-xs active:scale-[0.99] cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <span
                className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md text-ceci-primary shrink-0"
                style={{ backgroundColor: `${family.color}55` }}
              >
                {idx + 1}
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-ceci-primary font-display transition-colors group-hover:text-ceci-brand-strong">
                  {approach.name}
                </h2>
                {approach.description && (
                  <p className="text-xs text-ceci-secondary mt-0.5 line-clamp-2">
                    {approach.description}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-ceci-brand-strong group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        ))}

        {!showAll && approaches.length > 10 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center text-sm font-semibold text-ceci-brand-strong py-3 rounded-2xl border border-ceci-border-brand bg-surface-rose tap-interactive active:scale-[0.99] cursor-pointer"
          >
            ver todas as {approaches.length} abordagens
          </button>
        )}
      </div>
    </div>
  );
};
