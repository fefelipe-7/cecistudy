import React from 'react';
import { X, Clock, Stethoscope, AlertCircle, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { DerivedCase } from '../../lib/internshipCases';

interface Props {
  caseData: DerivedCase;
  isOpen: boolean;
  onClose: () => void;
}

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR');

/** Minutos como `1h30` / `45min`. A projeção guarda minutos (`SPEC-M-013` `D2`). */
const fmtDuracao = (min: number): string =>
  min >= 60 && min % 60 !== 0 ? `${Math.floor(min / 60)}h${min % 60}` : min >= 60 ? `${min / 60}h` : `${min}min`;

export const InternshipCaseDetail: React.FC<Props> = ({ caseData, isOpen, onClose }) => {
  const { patientLabel, projections, totalMin, pendingParaLevar, pendingSupervision } = caseData;

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} position="bottom" className="w-full sm:w-[420px]">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pb-4">
        <div className="flex items-center justify-between border-b border-ceci-border-subtle pb-3">
          <div>
            <h3 className="font-display font-bold text-lg text-ceci-primary">{patientLabel}</h3>
            <p className="text-[11px] text-ceci-secondary">
              {projections.length} sessões • {fmtDuracao(totalMin)} no total
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-ceci-border-subtle" aria-label="fechar">
            <X className="w-5 h-5 text-ceci-muted" />
          </button>
        </div>
        {/* Pendências */}
        {(pendingParaLevar > 0 || pendingSupervision > 0) && (
          <div className="rounded-xl p-3 bg-surface-muted border border-ceci-border-subtle">
            <p className="text-[11px] font-semibold text-ceci-secondary mb-2">pendências</p>
            <div className="flex flex-wrap gap-2">
              {pendingParaLevar > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-rose border border-ceci-border-brand text-[10px] font-semibold text-ceci-brand-strong">
                  <AlertCircle className="w-3 h-3" />
                  {pendingParaLevar} sem &quot;para levar&quot;
                </span>
              )}
              {pendingSupervision > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-blue border border-ceci-border-academic text-[10px] font-semibold text-ceci-academic-strong">
                  <Stethoscope className="w-3 h-3" /> supervisionada{pendingSupervision !== 1 ? 'ões' : ''} {pendingSupervision}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Projeções do caso. Só existe o que a lista fechada autoriza
            (`SPEC-M-013` `D1`): data, duração e o "para levar" escolhido. */}
        <div className="space-y-3">
          {projections
            .slice()
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .map((projecao) => (
              <div
                key={projecao.id}
                className="p-3 rounded-xl bg-surface-default border border-ceci-border-default shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-ceci-primary">{fmt(projecao.data)}</span>
                  <span className="flex items-center gap-1 text-[11px] text-ceci-secondary">
                    <Clock className="w-3 h-3" />
                    {fmtDuracao(projecao.duracaoMin)}
                  </span>
                </div>
                <p className="text-sm text-ceci-secondary mb-2">
                  {projecao.paraLevar.trim() || <span className="italic">sem &quot;para levar&quot;</span>}
                </p>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {projecao.paraLevar.trim() ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-status-success-surface border border-status-success-border text-status-success-strong">
                      <FileText className="w-3 h-3" /> para levar ok
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-status-warning-surface border border-status-warning-border text-status-warning-strong">
                      <AlertCircle className="w-3 h-3" /> sem &quot;para levar&quot;
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </Modal>
  );
};