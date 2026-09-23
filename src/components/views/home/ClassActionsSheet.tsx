// Home — menu rápido 2×2 de frequência da aula (spec-frequencia.md §6).
// Abre ao tocar no card "hoje na facul": fui / anotar / cancelou / falta.
// Opções que registram (fui/cancelou/falta) passam por um passo de confirmação
// antes de confirmar — a "anotar alguma coisinha" segue direto pro fluxo de nota.
import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  EyeOff,
  PartyPopper,
  StickyNote,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import type { AttendanceStatus } from '../../../types';

interface ClassActionsSheetProps {
  open: boolean;
  courseName: string;
  slotStart?: string;
  onClose: () => void;
  onSelect: (status: AttendanceStatus, annotate?: boolean) => void;
  onOpenCourse: () => void;
}

interface ClassOption {
  status: AttendanceStatus;
  label: string;
  desc: string;
  icon: React.ReactNode;
  className: string;
  iconClass: string;
  /** Botão sólido do passo de confirmação (theme-scoped). */
  confirmClass: string;
  annotate?: boolean;
}

const OPTION_BASE =
  'flex flex-col items-start gap-1 p-3.5 rounded-2xl border text-left tap-interactive active:scale-[0.98] transition min-h-[76px] cursor-pointer';

const OPTIONS: ClassOption[] = [
  {
    status: 'presente',
    label: 'fui na aula',
    desc: 'marca presença',
    icon: <CheckCircle2 className="w-5 h-5" />,
    className:
      'bg-status-success-surface border-status-success-border hover:border-status-success-strong/50',
    iconClass: 'text-status-success-strong',
    confirmClass: 'bg-status-success text-status-success-on border-status-success',
  },
  {
    status: 'presente',
    label: 'anotar alguma coisinha',
    desc: 'presença + anotação',
    icon: <StickyNote className="w-5 h-5" />,
    className: 'bg-surface-rose border-ceci-border-brand hover:border-ceci-brand-strong/40',
    iconClass: 'text-ceci-brand-strong',
    confirmClass: 'bg-ceci-brand text-ceci-on-brand border-ceci-brand',
    annotate: true,
  },
  {
    status: 'cancelada',
    label: 'ainda bem que cancelou',
    desc: 'não conta como falta',
    icon: <PartyPopper className="w-5 h-5" />,
    className: 'bg-status-warning-surface border-status-warning-border hover:border-status-warning/60',
    iconClass: 'text-status-warning-strong',
    confirmClass: 'bg-status-warning text-status-warning-on border-status-warning',
  },
  {
    status: 'falta',
    label: 'deixei de ir',
    desc: 'marca falta',
    icon: <EyeOff className="w-5 h-5" />,
    className:
      'bg-status-danger-surface border-status-danger-border hover:border-status-danger-strong/40',
    iconClass: 'text-status-danger-strong',
    confirmClass: 'bg-status-danger text-status-danger-on border-status-danger',
  },
];

export const ClassActionsSheet: React.FC<ClassActionsSheetProps> = ({
  open,
  courseName,
  slotStart,
  onClose,
  onSelect,
  onOpenCourse,
}) => {
  const [confirming, setConfirming] = useState<ClassOption | null>(null);

  // Ao fechar (open=false) volta pro passo inicial — garantindo um menu limpo.
  useEffect(() => {
    if (!open) setConfirming(null);
  }, [open]);

  const handleOption = (opt: ClassOption) => {
    if (opt.annotate) {
      onSelect(opt.status, true); // presença + anotação: sem confirmação (ação já é deliberada)
      return;
    }
    setConfirming(opt); // vira o passo "tem certeza?"
  };
  return (
    <Modal open={open} onClose={onClose} position="bottom" className="w-full max-w-md">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-ceci-border-subtle">
          <div>
            <h3 className="font-display font-bold text-lg text-ceci-primary">
              {confirming ? 'tem certeza, amiga?' : 'como foi essa aula?'}
            </h3>
            <p className="text-xs text-ceci-secondary">
              {courseName}
              {slotStart ? ` · ${slotStart}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-1.5 rounded-full hover:bg-surface-muted text-ceci-secondary transition-colors cursor-pointer"
            aria-label="fechar"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>

        {confirming ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center gap-2.5 rounded-2xl border border-ceci-border-default bg-surface-subtle px-4 py-5">
              <span
                className={`w-14 h-14 rounded-full flex items-center justify-center ${confirming.className}`}
              >
                <span className={confirming.iconClass}>{confirming.icon}</span>
              </span>
              <p className="text-sm font-display font-bold text-ceci-primary">
                confirmar &ldquo;{confirming.label}&rdquo;?
              </p>
              <p className="text-xs text-ceci-secondary leading-relaxed">
                isso {confirming.desc.toLowerCase()}. depois de confirmar, o card da home fica
                marcado para hoje — para ajustar, é só pelo histórico da matéria ♡
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-ceci-border-default bg-surface-default text-xs font-semibold text-ceci-secondary hover:text-ceci-primary transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  const opt = confirming;
                  setConfirming(null);
                  onSelect(opt.status);
                }}
                className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-transform active:scale-[0.98] cursor-pointer ${confirming.confirmClass}`}
              >
                <CheckCircle2 className="w-4 h-4" />
                confirmar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={`${OPTION_BASE} ${opt.className}`}
                  onClick={() => handleOption(opt)}
                >
                  <span className={opt.iconClass}>{opt.icon}</span>
                  <span className="text-xs font-semibold text-ceci-primary leading-snug">
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-ceci-secondary">{opt.desc}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenCourse}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold text-ceci-academic-strong bg-surface-blue border border-ceci-border-academic hover:border-ceci-border-academic/60 transition-colors cursor-pointer min-h-[44px]"
            >
              ir para a matéria <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ClassActionsSheet;