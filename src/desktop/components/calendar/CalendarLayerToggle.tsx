import React from 'react';
import { Check } from 'lucide-react';
import type { CalendarLayer } from '../../../lib/schedule';
import { CALENDAR_LAYERS, LAYER_META } from './layers';

interface CalendarLayerToggleProps {
  visible: Record<CalendarLayer, boolean>;
  onToggle: (layer: CalendarLayer) => void;
}

/** Filtro de camadas (Faculdade / TCC / Estudos / Google Calendar). */
export const CalendarLayerToggle: React.FC<CalendarLayerToggleProps> = ({
  visible,
  onToggle,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CALENDAR_LAYERS.map((layer) => {
        const meta = LAYER_META[layer];
        const on = visible[layer];
        return (
          <button
            key={layer}
            type="button"
            onClick={() => onToggle(layer)}
            aria-pressed={on}
            aria-label={`${on ? 'ocultar' : 'mostrar'} camada ${meta.label}`}
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              borderColor: on ? meta.border : 'var(--ds-border-default)',
              background: on ? meta.bg : 'transparent',
              color: on ? meta.fg : 'var(--ds-text-tertiary)',
            }}
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: meta.fg }}
            />
            <span>{meta.label}</span>
            <span
              className="flex h-3 w-3 items-center justify-center rounded-sm border"
              style={{
                borderColor: on ? meta.fg : 'var(--ds-border-default)',
                background: on ? meta.fg : 'var(--ds-surface-raised)',
              }}
            >
              {on && <Check className="text-white" style={{ width: 9, height: 9 }} />}
            </span>
          </button>
        );
      })}
    </div>
  );
};
