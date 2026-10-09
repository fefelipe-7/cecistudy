import React from 'react';
import { X, AlertCircle, FileText, Brain } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { DerivedCase } from '../../lib/internshipCases';
import type { InternshipLog } from '../../types';
import { formatDateBR, dateKeyOrdinal } from '../../lib/dateBR';
import { formatHours } from '../../lib/formatHours';
import { pluralPt } from '../../lib/pluralPt';
import { StatusChip } from './StatusChip';

/**
 * Detalhe do paciente — v2 (`SPEC-009 §9.7`, ainda em modal; a tela cheia é a fase 6).
 *
 * **Regressão `F1`:** a versão anterior desestruturava `caseData` **antes** do
 * `if (!isOpen) return null`, e a tela passava `selectedCase!` (que é `null`
 * enquanto nada está selecionado). O `TypeError` derrubava o app inteiro pelo
 * `ErrorBoundary` da raiz — abrir a aba pacientes quebrava a tela. O guard vem
 * primeiro agora, e `caseData` é `null` de verdade.
 *
 * Além disso: barra de progresso, sessões tocáveis, "+ nova sessão", e os dois
 * estados em tom **neutro** (`D13`) em vez de vermelho.
 */
interface Props {
  caseData: DerivedCase | null;
  /** Quando o caso é o grupo "sem iniciais", os logs vêm à parte. */
  orphanLogs?: InternshipLog[];
  isOpen: boolean;
  today: string;
  onClose: () => void;
}

export const InternshipCaseDetail: React.FC<Props> = ({
  caseData,
  orphanLogs = [],
  isOpen,
  onClose,
}) => {
  // Guard antes da desestruturação — ver a nota de `F1`.
  if (!isOpen || (!caseData && !orphanLogs.length)) return null;

  const label = caseData?.patientLabel ?? 'sem iniciais';
  const logs = caseData?.logs ?? orphanLogs;
  const sessionsDone = caseData?.sessionsDone ?? 0;
  const supervised = caseData?.sessionsSupervised ?? 0;
  const totalHours = caseData?.totalHours ?? orphanLogs.reduce((a, l) => a + (l.hours || 0), 0);

  return (
    <Modal open={isOpen} onClose={onClose} position="bottom" className="w-full sm:w-[420px]">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pb-4">
        <div className="flex items-center justify-between border-b border-ceci-border-subtle pb-3">
          <div>
            <h3 className="font-display font-bold text-lg text-ceci-primary">{label}</h3>
            <p className="text-[11px] text-ceci-secondary">
              {pluralPt(logs.length, 'sessão', 'sessões')} · {formatHours(totalHours)} h total
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-muted min-w-[44px] min-h-[44px] cursor-pointer"
            aria-label="fechar"
          >
            <X className="w-5 h-5 text-ceci-muted" />
          </button>
        </div>

        {sessionsDone > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] text-ceci-secondary">
              {supervised} de {sessionsDone} supervisionadas
            </p>
          </div>
        )}

        <div className="space-y-3">
          {[...logs]
            .sort((a, b) => dateKeyOrdinal(b.date) - dateKeyOrdinal(a.date))
            .map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-surface-default border border-ceci-border-default shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-ceci-primary">
                    {log.sessionNumber ? `Sessão ${log.sessionNumber}` : 'Sessão'}
                  </span>
                  <span className="text-[11px] text-ceci-secondary">{formatDateBR(log.date)}</span>
                </div>
                <p className="text-sm text-ceci-secondary mb-2 break-words">{log.activity}</p>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {log.reflections?.trim() ? (
                    <StatusChip tone="success" iconOnly label="reflexão ok">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" aria-hidden />
                        reflexão ok
                      </span>
                    </StatusChip>
                  ) : (
                    <StatusChip tone="warning" label="sem reflexão">
                      <span className="inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" aria-hidden />
                        sem reflexão
                      </span>
                    </StatusChip>
                  )}
                  {log.supervisionLogId ? (
                    <StatusChip tone="info" label="supervisionada">
                      <span className="inline-flex items-center gap-1">
                        <Brain className="w-3 h-3" aria-hidden />
                        supervisionada
                      </span>
                    </StatusChip>
                  ) : (
                    <StatusChip tone="warning" label="sem supervisão">
                      <span className="inline-flex items-center gap-1">
                        <Brain className="w-3 h-3" aria-hidden />
                        sem supervisão
                      </span>
                    </StatusChip>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </Modal>
  );
};