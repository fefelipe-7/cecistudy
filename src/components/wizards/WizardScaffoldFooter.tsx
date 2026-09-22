import React from 'react';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FixedBottomBar } from '../ui/FixedBottomBar';

interface WizardScaffoldFooterProps {
  isLast: boolean;
  hideNext: boolean;
  canConfirm: boolean;
  saving: boolean;
  saveLabel: string;
  blockedReason?: string;
  showBlockedHint: boolean;
  canNext: boolean;
  onSaveMinimal?: () => void;
  saveMinimalLabel: string;
  confirmingDiscard: boolean;
  onCancelDiscard: () => void;
  onPrimary: () => void;
  onClose: () => void;
  onBack: () => void;
  isFirst: boolean;
}

/** Barra de ação fixa na base da tela (sticky footer). */
export const WizardScaffoldFooter: React.FC<WizardScaffoldFooterProps> = ({
  isLast,
  hideNext,
  canConfirm,
  saving,
  saveLabel,
  blockedReason,
  showBlockedHint,
  canNext,
  onSaveMinimal,
  saveMinimalLabel,
  confirmingDiscard,
  onCancelDiscard,
  onPrimary,
  onClose,
  onBack,
  isFirst,
}) => (
  <FixedBottomBar>
    <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto flex flex-col gap-1.5 px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      {/* confirmação de descarte com alteração real */}
      {confirmingDiscard ? (
        <div className="rounded-2xl bg-surface-default border border-ceci-border-default p-3 space-y-2">
          <p className="text-xs font-semibold text-ceci-primary text-center">
            tem coisas escritas aqui — sair sem guardar?
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancelDiscard}
              className="flex-1 min-h-[44px] rounded-xl bg-ceci-primary text-ceci-on-primary text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
            >
              continuar editando
            </button>
            <button
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl border border-ceci-border-default bg-surface-default text-status-danger-strong text-xs font-semibold active:scale-[0.98] transition-transform cursor-pointer"
            >
              descartar
            </button>
          </div>
        </div>
      ) : (
        <>
          {!hideNext && (
            <>
              <button
                onClick={onPrimary}
                disabled={!canConfirm || saving}
                className={cn(
                  'w-full min-h-[56px] rounded-[14px] text-sm font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-[0.98] cursor-pointer',
                  isLast
                    ? 'bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand'
                    : 'bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary',
                  (!canConfirm || saving) && 'opacity-40 cursor-not-allowed'
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>salvando...</span>
                  </>
                ) : isLast ? (
                  <>
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    <span>{saveLabel}</span>
                  </>
                ) : (
                  <>
                    <span>continuar</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* motivo explicado do bloqueio — nunca um botão mudo */}
              {showBlockedHint && (
                <p className="text-[11px] text-ceci-tertiary text-center">{blockedReason}</p>
              )}

              {/* salvamento mínimo antes do fim (registro essencial) */}
              {!isLast && onSaveMinimal && canNext && (
                <button
                  onClick={onSaveMinimal}
                  className="w-full min-h-[36px] rounded-lg text-[11px] font-semibold text-ceci-academic-strong hover:bg-surface-blue transition-colors cursor-pointer"
                >
                  {saveMinimalLabel}
                </button>
              )}
            </>
          )}

          <button
            onClick={onBack}
            className="w-full min-h-[40px] rounded-xl text-xs font-medium text-ceci-tertiary hover:text-ceci-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            {isFirst ? 'cancelar' : 'voltar'}
          </button>
        </>
      )}
    </div>
  </FixedBottomBar>
);
