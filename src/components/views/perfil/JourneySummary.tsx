// Perfil — "resumo da minha jornada" (métricas reais) (MOD-001 / B.6).
// Extraído de `PerfilView.tsx`.
import React from 'react';
import type { ReactNode } from 'react';
import { AnimatedNumber } from '../../ui/AnimatedNumber';

export interface JourneyTile {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  display: ReactNode;
  animate?: boolean;
  onClick: () => void;
}

interface JourneySummaryProps {
  tiles: JourneyTile[];
  semestersLeft: number;
}

const JourneySummary: React.FC<JourneySummaryProps> = ({ tiles, semestersLeft }) => (
  <div className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-4">
    <div>
      <h2 className="font-display font-bold text-xl text-ceci-primary">
        resumo da minha jornada
      </h2>
      <p className="text-xs text-ceci-secondary">
        tudo anotado com carinho ao longo dos semestres, reunido aqui ♡
      </p>
    </div>

    <div className="grid grid-cols-2 gap-2.5">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          role="button"
          tabIndex={0}
          onClick={tile.onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              tile.onClick();
            }
          }}
          className="p-3 rounded-2xl bg-surface-muted border border-ceci-border-default hover:border-ceci-border-brand tap-interactive cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-surface-default border border-ceci-border-subtle flex items-center justify-center mb-1.5">
            <tile.Icon className="w-3.5 h-3.5 text-ceci-brand-strong" />
          </div>
          <p className="font-display font-bold text-lg text-ceci-primary leading-none">
            {tile.animate ? <AnimatedNumber value={tile.display as number} /> : tile.display}
          </p>
          <p className="text-[10px] font-medium text-ceci-secondary mt-0.5 leading-tight">
            {tile.label}
          </p>
        </div>
      ))}
    </div>

    <div className="flex items-center justify-end border-t border-ceci-border-subtle pt-3">
      <span className="text-[11px] font-semibold text-ceci-brand-strong">
        {semestersLeft} semestres restantes
      </span>
    </div>
  </div>
);

export default JourneySummary;