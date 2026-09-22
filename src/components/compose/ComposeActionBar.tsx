import React from 'react';
import { ArrowLeftRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposeActionBarProps {
  canSave: boolean;
  /** Texto do botão de guardar (padrão "guardar ♡"). */
  saveLabel?: string;
  showNudge: boolean;
  onNudge: () => void;
  onSave: () => void;
}

/** Barra de ação fixa na base — nudge "parece aula?" + botão guardar. */
export const ComposeActionBar: React.FC<ComposeActionBarProps> = ({
  canSave,
  saveLabel = 'guardar ♡',
  showNudge,
  onNudge,
  onSave,
}) => (
  <div className="sticky bottom-0 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2 bg-gradient-to-t from-canvas via-canvas/95 to-transparent">
    <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto flex flex-col gap-2">
      {showNudge && (
        <button
          type="button"
          onClick={onNudge}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong text-[11px] font-bold shadow-2xs transition active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          parece nota de aula? anotar como aula 📚
        </button>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        className={cn(
          'flex items-center justify-center gap-1.5 w-full min-h-[48px] rounded-2xl text-sm font-bold transition active:scale-[0.99] cursor-pointer',
          canSave
            ? 'bg-ceci-brand-strong hover:bg-ceci-brand-hover text-ceci-on-brand shadow-2xs'
            : 'bg-surface-muted text-ceci-tertiary cursor-not-allowed'
        )}
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
        {saveLabel}
      </button>
    </div>
  </div>
);