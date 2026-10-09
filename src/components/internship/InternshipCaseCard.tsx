import React from 'react';
import { Clock, AlertCircle, Stethoscope, ArrowRight } from 'lucide-react';
import type { DerivedCase } from '../../lib/internshipCases';
import { formatDateShortBR } from '../../lib/dateBR';
import { formatHours } from '../../lib/formatHours';
import { pluralPt } from '../../lib/pluralPt';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusChip } from './StatusChip';

/**
 * Card do paciente — v2 (`SPEC-009 §9.5`).
 *
 * Antes: iniciais, contagem de sessões, horas e dois chips de pendência. Não tinha
 * barra de progresso, nem idade, nem abordagem, nem próxima sessão — o usuário
 * via "3 supervisões pendentes" como número solto, sem nenhuma noção de quanto
 * do acompanhamento já aconteceu.
 */
export const InternshipCaseCard: React.FC<{
  caseData: DerivedCase;
  onPress: () => void;
}> = ({ caseData, onPress }) => {
  const {
    patientLabel,
    totalHours,
    lastSessionDate,
    nextScheduledDate,
    sessionsDone,
    sessionsSupervised,
    progress,
    pendingReflection,
    pendingSupervision,
    latestAge,
    latestApproach,
  } = caseData;

  // Tile de iniciais (SPEC-010 D5): mesma geometria do tile de ícone do
  // `CourseDetailView.tsx:113-118`. Sem cor por paciente (rejeitado em D5) —
  // token rose do app. Label longo (ex.: "sem iniciais") vira "?", porque o
  // tile é identidade, não texto de conteúdo.
  const tile = patientLabel.length <= 6 ? patientLabel : '?';

  return (
    <button
      onClick={onPress}
      className="w-full text-left p-4 rounded-2xl bg-surface-default border border-ceci-border-default shadow-sm hover:shadow-md transition-shadow cursor-pointer tap-interactive"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border border-ceci-border-brand bg-surface-rose text-ceci-brand-strong font-display font-bold text-[11px] leading-tight text-center px-1 break-words"
        >
          {tile}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-display font-bold text-base text-ceci-primary truncate">
              {patientLabel}
            </span>
            {latestAge && (
              <span className="text-[10px] text-ceci-secondary whitespace-nowrap">{latestAge} anos</span>
            )}
            {latestApproach && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong whitespace-nowrap">
                {latestApproach.length > 14 ? `${latestApproach.slice(0, 14)}…` : latestApproach}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[12px] text-ceci-secondary flex-wrap">
            <span>{pluralPt(sessionsDone, 'sessão', 'sessões')}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" aria-hidden />
              {formatHours(totalHours)} h
            </span>
            {sessionsDone > 0 && lastSessionDate ? (
              <span className="inline-flex items-center gap-1">
                <Stethoscope className="w-4 h-4" aria-hidden />
                última {formatDateShortBR(lastSessionDate)}
              </span>
            ) : nextScheduledDate ? (
              <span>primeira sessão agendada · {formatDateShortBR(nextScheduledDate)}</span>
            ) : null}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-ceci-muted shrink-0" aria-hidden />
      </div>

      {sessionsDone > 0 && (
        <div className="mt-3 space-y-1">
          <ProgressBar
            value={progress}
            barClassName={progress >= 100 ? 'bg-status-success' : undefined}
          />
          <p className="text-[10px] text-ceci-tertiary">
            {sessionsSupervised} de {sessionsDone} supervisionadas
          </p>
        </div>
      )}

      {(pendingReflection > 0 || pendingSupervision > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pendingReflection > 0 && (
            <StatusChip tone="warning" label={`${pendingReflection} sem reflexão`} />
          )}
          {pendingSupervision > 0 && (
            <StatusChip tone="warning" label={`${pendingSupervision} sem supervisão`} />
          )}
        </div>
      )}

      {nextScheduledDate && sessionsDone > 0 && (
        <p className="mt-2 text-[11px] text-ceci-secondary">
          próxima sessão: {formatDateShortBR(nextScheduledDate)}
        </p>
      )}
    </button>
  );
};

/** Rótulo de badge de pendência para a lista (usado no empty state dos órfãos). */
export const orphanLabel = (n: number): string =>
  `${n} ${n === 1 ? 'atendimento' : 'atendimentos'} sem iniciais — toque pra completar`;

export { AlertCircle };