import React from 'react';
import { X, Clock, Stethoscope, AlertCircle, FileText, Brain } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { DerivedCase } from '../../lib/internshipCases';

interface Props {
  caseData: DerivedCase;
  isOpen: boolean;
  onClose: () => void;
}

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR');

export const InternshipCaseDetail: React.FC<Props> = ({ caseData, isOpen, onClose }) => {
  const { patientLabel, logs, totalHours, pendingReflection, pendingSupervision } = caseData;

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} position="bottom" className="w-full sm:w-[420px]">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pb-4">
        <div className="flex items-center justify-between border-b border-ceci-border-subtle pb-3">
          <div>
            <h3 className="font-display font-bold text-lg text-ceci-primary">{patientLabel}</h3>
            <p className="text-[11px] text-ceci-secondary">{logs.length} sessões • {totalHours} h total</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-ceci-border-subtle" aria-label="fechar">
            <X className="w-5 h-5 text-ceci-muted" />
          </button>
        </div>
        {/* Pendências */}
        {(pendingReflection > 0 || pendingSupervision > 0) && (
          <div className="rounded-xl p-3 bg-surface-muted border border-ceci-border-subtle">
            <p className="text-[11px] font-semibold text-ceci-secondary mb-2">pendências</p>
            <div className="flex flex-wrap gap-2">
              {pendingReflection > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-rose border border-ceci-border-brand text-[10px] font-semibold text-ceci-brand-strong">
                  <AlertCircle className="w-3 h-3" />
                  {pendingReflection} reflexão{pendingReflection !== 1 ? 'ões' : ''}
                </span>
              )}
              {pendingSupervision > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-blue border border-ceci-border-academic text-[10px] font-semibold text-ceci-academic-strong">
                  <Stethoscope className="w-3 h-3" />
                  {pendingSupervision} supervisão{pendingSupervision !== 1 ? 'ões' : ''}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Lista de sessões */}
        <div className="space-y-3">
          {logs
            .slice()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-surface-default border border-ceci-border-default shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-ceci-primary">
                    Sessão {log.sessionNumber ?? '—'}
                  </span>
                  <span className="text-[11px] text-ceci-secondary">
                    {fmt(log.date)}
                  </span>
                </div>
                <p className="text-sm text-ceci-secondary mb-2">{log.activity}</p>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {log.reflections?.trim() ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-200 text-green-700">
                      <FileText className="w-3 h-3" /> reflexão ok
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700">
                      <AlertCircle className="w-3 h-3" /> sem reflexão
                    </span>
                  )}
                  {log.supervisionLogId ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                      <Brain className="w-3 h-3" /> supervisionada
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-700">
                      <Brain className="w-3 h-3" /> sem supervisão
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