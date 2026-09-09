import React from 'react';
import { Clock, AlertCircle, Stethoscope, ArrowRight } from 'lucide-react';
import type { DerivedCase } from '../../lib/internshipCases';

interface Props {
  caseData: DerivedCase;
  onPress: () => void;
}

export const InternshipCaseCard: React.FC<Props> = ({ caseData, onPress }) => {
  const { patientLabel, totalHours, lastSessionDate, pendingReflection, pendingSupervision, logs } = caseData;
  const sessionsCount = logs.length;

  return (
    <button
      onClick={onPress}
      className="w-full text-left p-4 rounded-2xl bg-white border border-ceci-border-default shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold text-base text-ceci-primary truncate">{patientLabel}</span>
            <span className="text-[10px] text-ceci-secondary whitespace-nowrap">
              {sessionsCount} sessão{sessionsCount !== 1 ? 'ões' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ceci-secondary">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {totalHours} h total
            </span>
            {lastSessionDate && (
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" />
                {new Date(lastSessionDate).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-ceci-muted shrink-0" />
      </div>

      {(pendingReflection > 0 || pendingSupervision > 0) && (
        <div className="mt-3 flex gap-2">
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
      )}
    </button>
  );
};