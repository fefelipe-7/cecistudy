import React, { useState } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { clampPageInput } from '../../lib/contextActions';
import { cn } from '../../lib/utils';

interface ReadingProgressEditorProps {
  currentPages: number;
  totalPages?: number;
  /** Mostra "marcar como concluído" quando o total é desconhecido (só leituras da estante). */
  allowMarkDone?: boolean;
  onSave: (pages: number) => void;
  onCancel: () => void;
}

const QUICK_STEPS = [5, 10, 25];

/**
 * Mini-editor de progresso de leitura (docs/modais-wizards.md §3.4).
 * Stepper −/+ , entrada direta da página e atalhos rápidos. Não abre o wizard
 * de leitura — usado dentro do menu contextual do item.
 */
export const ReadingProgressEditor: React.FC<ReadingProgressEditorProps> = ({
  currentPages,
  totalPages,
  allowMarkDone = false,
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState(String(currentPages));
  const parsed = clampPageInput(currentPages, draft, totalPages);
  const invalid = draft !== '' && parsed === null;
  const valid = parsed !== null && parsed !== currentPages;

  const setClamped = (n: number) => {
    const max = totalPages ?? Number.MAX_SAFE_INTEGER;
    setDraft(String(Math.min(Math.max(n, 0), max)));
  };

  const stepperBtn =
    'w-11 h-11 rounded-2xl border border-ceci-border-default bg-surface-default text-ceci-primary font-bold flex items-center justify-center transition-all active:scale-90 tap-interactive cursor-pointer disabled:opacity-35 disabled:pointer-events-none';

  return (
    <div className="space-y-4">
      <p className="text-sm text-ceci-secondary">
        {totalPages !== undefined
          ? 'quantas páginas você já leu?'
          : 'quantas páginas você já leu? (essa obra não tem total cadastrado)'}
      </p>

      <div className="p-3.5 rounded-2xl bg-surface-muted border border-ceci-border-default space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-ceci-tertiary lowercase">páginas lidas</span>
          <span className="text-xs font-bold text-ceci-brand-strong">
            {totalPages !== undefined ? `${parsed ?? draft} / ${totalPages}` : `${draft || 0} págs`}
          </span>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setClamped((parseInt(draft, 10) || currentPages) - 1)}
            disabled={currentPages <= 0 && (parseInt(draft, 10) || 0) <= 0}
            className={stepperBtn}
            aria-label="diminuir páginas lidas"
          >
            <Minus className="w-4 h-4" />
          </button>

          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            aria-label="digite a nova página lida"
            className={cn(
              'w-20 text-center bg-surface-input border rounded-2xl py-2.5 font-display font-bold text-xl text-ceci-primary tabular-nums focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow',
              invalid ? 'border-red-400' : 'border-ceci-border-default'
            )}
          />

          <button
            type="button"
            onClick={() => setClamped((parseInt(draft, 10) || currentPages) + 1)}
            disabled={totalPages !== undefined && (parseInt(draft, 10) || 0) >= totalPages}
            className={stepperBtn}
            aria-label="aumentar páginas lidas"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          {QUICK_STEPS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setClamped((parseInt(draft, 10) || currentPages) + n)}
              disabled={totalPages !== undefined && (parseInt(draft, 10) || 0) >= totalPages}
              className="px-3 py-1.5 rounded-full border border-ceci-border-default bg-surface-default text-ceci-secondary text-[11px] font-semibold hover:bg-surface-rose hover:text-ceci-brand-strong hover:border-ceci-border-brand transition-colors tap-interactive cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
            >
              +{n}
            </button>
          ))}
        </div>

        {invalid && (
          <p className="text-[11px] text-red-700 text-center">
            {totalPages !== undefined && parseInt(draft, 10) > totalPages
              ? `essa obra tem ${totalPages} páginas ♡`
              : 'a página não pode ser menor do que você já leu'}
          </p>
        )}

        {totalPages !== undefined && (
          <div className="w-full bg-ceci-border-default h-2 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', (parsed ?? 0) > 0 ? 'bg-ceci-brand-strong' : '')}
              style={{ width: `${Math.round(((parsed ?? 0) / totalPages) * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => parsed !== null && onSave(parsed)}
          disabled={!valid}
          className="w-full min-h-[48px] rounded-2xl bg-ceci-brand-strong text-white text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <Check className="w-4 h-4" />
          guardar progresso
        </button>
        {totalPages === undefined && allowMarkDone && (
          <button
            type="button"
            onClick={() => onSave(Number.MAX_SAFE_INTEGER)}
            className="w-full min-h-[44px] rounded-2xl border border-ceci-border-default bg-surface-default text-ceci-secondary text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
          >
            marcar como concluído
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="w-full min-h-[44px] text-xs font-medium text-ceci-tertiary hover:text-ceci-primary transition-colors cursor-pointer"
        >
          voltar para as ações
        </button>
      </div>
    </div>
  );
};
