// Perfil — bloco "stickers & conquistas" (MOD-001 / B.6).
// Extraído de `PerfilView.tsx`.
import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Sticker } from '../../../types';

interface StickersSectionProps {
  stickers: Sticker[];
  unlocked: number;
  onOpen: () => void;
}

const StickersSection: React.FC<StickersSectionProps> = ({ stickers, unlocked, onOpen }) => (
  <div id="perfil-stickers" className="scroll-mt-4 rounded-2xl p-5 bg-white border border-ceci-border-default shadow-sm space-y-3">
    <div className="flex items-center justify-between gap-2">
      <div>
        <h2 className="font-display font-bold text-xl text-ceci-primary">
          stickers & conquistas
        </h2>
        <p className="text-xs text-ceci-secondary">
          celebrando cada passo do cantinho ♡
        </p>
      </div>
      <button
        onClick={onOpen}
        className="flex items-center gap-1 text-xs font-bold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand px-3.5 py-2 rounded-xl tap-interactive cursor-pointer hover:bg-ceci-border-brand/40 active:scale-[0.98] transition-colors shrink-0"
      >
        ver conquistas
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>

    <div className="flex items-center gap-2 flex-wrap pt-1">
      {stickers.filter((s) => s.unlocked).slice(0, 6).map((st) => (
        <span
          key={st.id}
          title={st.name}
          className="w-11 h-11 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-2xl"
        >
          {st.emoji}
        </span>
      ))}
      {stickers.filter((s) => !s.unlocked).slice(0, 3).map((st) => (
        <span
          key={st.id}
          title={st.name}
          className="w-11 h-11 rounded-2xl bg-surface-muted border border-dashed border-ceci-border-default flex items-center justify-center text-2xl opacity-50 grayscale"
        >
          {st.emoji}
        </span>
      ))}
    </div>

    <p className="text-[11px] text-ceci-secondary">
      {unlocked} de {stickers.length} desbloqueados — bora buscar as próximas? ♡
    </p>
  </div>
);

export default StickersSection;