// Home — "dica do cecinho" contextual (MOD-001 / B.7).
// Extraído de `HomeView.tsx`.
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Mascote } from '../../ui/Mascote';

interface CecinhoTipProps {
  tip: string;
}

const CecinhoTip: React.FC<CecinhoTipProps> = ({ tip }) => (
  <div className="p-4 rounded-xl bg-surface-default border border-ceci-border-subtle shadow-sm flex items-center gap-3">
    <Mascote expression="celebrate-small" className="w-12 h-12 shrink-0" decorative />
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-xs font-semibold text-ceci-primary font-display">
        <Sparkles className="w-4 h-4 text-rose-500" />
        <span>dica do cecinho ✨</span>
      </div>
      <p className="text-xs text-ceci-secondary mt-1 leading-relaxed font-serif-academic">
        {tip}
      </p>
    </div>
  </div>
);

export default CecinhoTip;