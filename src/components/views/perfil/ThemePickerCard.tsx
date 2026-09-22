// Perfil → "trocar a pele do cantinho ♡" — seletor visual de tema (TEM-001 D.1).
// Grade 2×3 de mini-mocks; tocar aplica + haptics; ativo ganha borda forte + check.
import React from 'react';
import { Check, Palette } from 'lucide-react';
import { THEMES, THEME_ORDER, type ThemeId } from '../../../lib/themes';
import { hapticSuccess } from '../../../lib/haptics';

interface ThemePickerCardProps {
  currentTheme: ThemeId;
  onSelect: (id: ThemeId) => void;
}

const ThemePickerCard: React.FC<ThemePickerCardProps> = ({ currentTheme, onSelect }) => {
  const current = THEMES[currentTheme];
  const t = current.tokens;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-ceci-brand-strong" />
        <h3 className="font-display font-bold text-base text-ceci-primary">
          trocar a pele do cantinho ♡
        </h3>
      </div>
      <p className="text-xs text-ceci-tertiary">
        seis ares de clima para o seu espacinho — é só guardar a escolha.
      </p>

      <div className="rounded-2xl border border-ceci-border-default bg-surface-default p-3 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-semibold text-ceci-secondary uppercase tracking-wide w-20">
            tema
          </label>
          <select
            aria-label="selecionar tema"
            value={currentTheme}
            onChange={(e) => {
              const id = e.target.value as ThemeId;
              if (id !== currentTheme) {
                onSelect(id);
                hapticSuccess();
              }
            }}
            className="flex-1 rounded-xl border border-ceci-border-default bg-surface-default px-3 py-2 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-ceci-brand"
          >
            {THEME_ORDER.map((id) => {
              const theme = THEMES[id];
              return (
                <option key={id} value={id}>
                  {theme.emoji} {theme.label}
                </option>
              );
            })}
          </select>
        </div>

        <div className="rounded-xl p-3 border border-black/5" style={{ backgroundColor: t['canvas'] }}>
          <div className="h-1.5 w-2/3 rounded-full mb-2" style={{ backgroundColor: t['ceci-primary'] }} />
          <div className="h-8 rounded-lg px-1.5 py-1 space-y-1" style={{ backgroundColor: t['surface-default'] }}>
            <div className="flex gap-1">
              <div className="h-2 w-6 rounded-full" style={{ backgroundColor: t['ceci-brand'] }} />
              <div className="h-2 w-4 rounded-full" style={{ backgroundColor: t['ceci-academic'] }} />
            </div>
            <div className="h-1 w-3/5 rounded-full" style={{ backgroundColor: t['ceci-border-strong'] }} />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-ceci-primary">
            {current.emoji} {current.label}
          </p>
          <p className="text-[10px] leading-snug text-ceci-tertiary mt-0.5 line-clamp-2">
            {current.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThemePickerCard;