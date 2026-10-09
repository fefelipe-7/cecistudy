import React, { useState } from 'react';
import { Clock, ChevronDown, MoreHorizontal, CalendarClock } from 'lucide-react';
import type { InternshipLog } from '../types';
import { useMobileApp } from '@/context/mobileApp';
import { ManageSurface } from './ui/ManageSurface';
import { IconButton } from './ui/IconButton';
import { formatDateBR, formatDateShortBR } from '../lib/dateBR';
import { pluralPt } from '../lib/pluralPt';
import {
  statusOf,
  buildLinkIndex,
  isScheduled,
  proximasPendenciasDePreenchimento,
  camposDeReferencia,
  declinadosDe,
  valorCampoReferencia,
  statusPreenchimento,
  CAMPO_REFERENCIA_LABEL,
} from '../lib/internshipCases';
import { CompleteLogModal } from './internship/CompleteLogModal';
import { LogTypeBadge, typeMeta } from './internship/LogTypeBadge';
import { StatusChip } from './internship/StatusChip';
import {
  FieldBlock,
  FieldList,
  SelfAssessmentBlocks,
  DiscussedList,
} from './internship/FieldBlock';
import { NextStepList } from './internship/NextStepRow';

/**
 * Card de registro de estágio — v2 (`SPEC-009 §9.4`).
 *
 * **O que muda em relação ao card antigo:** ele renderizava 6 dos 19 campos que o
 * tipo tem (`theme`, `approach`, `interventionNotes`, `observations`, `patient`,
 * `sessionNumber`, `supervisor`, `topics`, `orientations`, `beforeNotes`,
 * `afterNotes`, `selfAssessment` — todos coletados pelo wizard e nenhum mostrado).
 * Além disso o badge era sempre rosa, a data vinha por `new Date()` (dia anterior em
 * UTC−3), e não havia estado agendado.
 *
 * Toque simples expande; long-press continua abrindo o menu de gerenciar.
 */

export interface InternshipLogCardProps {
  log: InternshipLog;
  /** `today` vem do `useMemo` da tela — o card não calcula nada. */
  today: string;
  /** Todos os logs, para resolver "discutida em" e o índice de vínculos. */
  allLogs?: InternshipLog[];
  /** Dentro da tela do caso: esconde badge e linha de iniciais (o caso já é o contexto). */
  variant?: 'default' | 'inCase';
  /** Abre o wizard já no passo de reflexão. */
  onAddReflection?: (logId: string) => void;
  /** Abre o registro de supervisão. */
  onOpenSupervision?: (supervisionId: string) => void;
  /** Realça o card por `focusLogId`. */
  highlighted?: boolean;
}

/** "agendado · amanhã" / "em 5 dias" / "26/09" — além de 14 dias vira data curta. */
export const scheduledChipLabel = (date: string, today: string): string => {
  const days = Math.round((ordinalDate(date) - ordinalDate(today)) / 86_400_000);
  if (days === 1) return 'agendado · amanhã';
  if (days > 1 && days <= 14) return `agendado · em ${days} dias`;
  return `agendado · ${formatDateShortBR(date)}`;
};

/** `DateKey` → epoch UTC em dias. Só para contagem de dias, nunca para formatar. */
const ordinalDate = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y || 1970, (m || 1) - 1, d || 1);
};

export const InternshipLogCard: React.FC<InternshipLogCardProps> = ({
  log,
  today,
  allLogs = [],
  variant = 'default',
  onAddReflection,
  onOpenSupervision,
  highlighted,
}) => {
  const { openManageItem, handleAddTask, handleAddReading, handleAddSession, openWizard, handleSaveInternshipLog } =
    useMobileApp();
  const [open, setOpen] = useState(false);
  const [completarAberto, setCompletarAberto] = useState(false);

  const type = log.type ?? 'estagio';
  const meta = typeMeta(type);
  const scheduled = isScheduled(log, today);

  // O índice vem pronto quando a tela o calculou; senão é derivado aqui (1 log só
  // não tem com quem estar vinculado).
  const index = allLogs.length ? buildLinkIndex(allLogs, today) : new Map();
  const status = statusOf(log, index, today);

  const discussedIn = [...status.supervisionIds, ...status.intervisionIds]
    .map((id) => allLogs.find((l) => l.id === id))
    .filter((l): l is InternshipLog => Boolean(l))
    .map((l) => ({
      id: l.id,
      label: `${formatDateBR(l.date)} · ${l.supervisor?.trim() || meta.label}`,
    }));

  const exists = () => true; // MVP: a entidade criada vive no mesmo contexto

  const handleConvert = (step: string, kind: 'task' | 'reading' | 'session') => {
    if (kind === 'task')
      handleAddTask({
        id: `task_${Date.now()}`,
        title: step,
        completed: false,
        priority: 'media',
        category: 'estagio',
      });
    if (kind === 'reading')
      handleAddReading({
        id: `r-${Date.now()}`,
        title: step,
        author: '',
        type: 'artigo',
        status: 'nao_iniciado',
      });
    if (kind === 'session')
      handleAddSession({
        id: `ss-${Date.now()}`,
        topic: step,
        date: today,
        durationMinutes: 30,
      });
  };

  const isSupervision = type === 'supervisao' || type === 'intervisao';
  const metaText = metaLineFor(log);

  // SPEC-011 D1/D2/D10: recomendação derivada, nunca persistida.
  const pendencias = proximasPendenciasDePreenchimento(log);
  // D13: chip informativo — só nos tipos com campos de referência.
  const preenchimento = statusPreenchimento(log);
  const podeCompletar =
    !scheduled && camposDeReferencia(type).length > 0 && pendencias.length > 0;
  const precisaSupervisao =
    !scheduled && type === 'atendimento_clinico' && !status.supervised;

  return (
    <ManageSurface
      kind="internship"
      id={log.id}
      className={`p-4 rounded-2xl shadow-2xs space-y-3 transition-colors ${
        scheduled
          ? 'bg-surface-muted border border-dashed border-ceci-border-subtle'
          : isSupervision
          ? 'bg-surface-default border border-ceci-border-academic'
          : 'bg-surface-default border border-ceci-border-default'
      } ${highlighted ? 'ring-2 ring-ceci-border-academic' : ''}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {variant === 'default' && <LogTypeBadge type={type} />}
            {scheduled && (
              <StatusChip tone="muted">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" aria-hidden />
                  {scheduledChipLabel(log.date, today)}
                </span>
              </StatusChip>
            )}
          </div>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="text-ceci-tertiary inline-flex items-center gap-1 min-h-[44px]">
              {formatDateBR(log.date)}
              {log.hours > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span>{`${log.hours} h`.replace('.', ',')}</span>
                </>
              )}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-ceci-muted transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </span>
        </div>

        <h3 className="font-display font-bold text-lg text-ceci-primary leading-snug mt-1.5 break-words line-clamp-2">
          {log.activity}
        </h3>

        {metaText && (
          <p className="text-[11px] text-ceci-secondary mt-0.5 break-words line-clamp-2">{metaText}</p>
        )}
      </button>

      {/* Chips recolhidos */}
      <div className="flex flex-wrap items-center gap-1.5">
        {!scheduled && preenchimento && (
          <StatusChip tone={preenchimento.tone} label={preenchimento.label} />
        )}
        {!scheduled && type === 'atendimento_clinico' &&
          (status.supervised ? (
            <StatusChip tone="info" label="supervisionada" />
          ) : (
            <StatusChip tone="warning" label="sem supervisão" />
          ))}
        {!scheduled && status.intervised && <StatusChip tone="info" label="discutida em intervisão" />}
        {isSupervision && (
          <StatusChip
            tone="info"
            label={pluralPt(log.discussedLogIds?.length ?? 0, 'sessão discutida', 'sessões discutidas')}
          />
        )}
        {(log.topics ?? []).length > 0 && <TopicChips topics={log.topics ?? []} />}
      </div>

      {(podeCompletar || precisaSupervisao) && (
        <div className="flex flex-wrap gap-1.5">
          {podeCompletar && (
            <button
              type="button"
              onClick={() => setCompletarAberto(true)}
              className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand cursor-pointer tap-interactive"
            >
              adicionar {CAMPO_REFERENCIA_LABEL[pendencias[0]]}
            </button>
          )}
          {precisaSupervisao && (
            <button
              type="button"
              onClick={() =>
                openWizard('internship', undefined, { kind: 'supervisao', discussedLogIds: [log.id] })
              }
              className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-blue text-ceci-academic-strong border border-ceci-border-academic cursor-pointer tap-interactive"
            >
              adicionar supervisão
            </button>
          )}
        </div>
      )}

      <CompleteLogModal
        open={completarAberto}
        log={log}
        onClose={() => setCompletarAberto(false)}
        onSave={handleSaveInternshipLog}
      />

      {!open ? null : scheduled ? (
        <div className="space-y-2">
          <p className="text-xs text-ceci-secondary">ainda não aconteceu — dá pra completar depois ♡</p>
          <button
            type="button"
            onClick={() => onAddReflection?.(log.id)}
            className="min-h-[44px] px-4 rounded-full text-xs font-semibold bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand cursor-pointer tap-interactive"
          >
            editar
          </button>
        </div>
      ) : (
        <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
          {/* D10/D13: campos de referência marcados aparecem mesmo vazios; os
              declinados ficam ocultos. */
          camposDeReferencia(type).length > 0 && (
            <>
              {camposDeReferencia(type).map((c) => {
                if (declinadosDe(log).includes(c)) return null;
                const valor = valorCampoReferencia(log, c);
                return (
                  <FieldBlock key={c} label={CAMPO_REFERENCIA_LABEL[c]}>
                    {valor.trim() ? (
                      c === 'abordagem' ? (
                        <StatusChip tone="info" label={valor} />
                      ) : (
                        valor
                      )
                    ) : (
                      <span className="italic text-ceci-muted">ainda não anotado ♡</span>
                    )}
                  </FieldBlock>
                );
              })}
              {type === 'atendimento_clinico' && (
                <DiscussedList lines={discussedIn} onOpen={onOpenSupervision} />
              )}
            </>
          )}

          {isSupervision && (
            <>
              {(log.topics ?? []).length > 0 && (
                <FieldBlock label="temas">
                  <FieldList items={log.topics ?? []} dotClassName="bg-ceci-academic" />
                </FieldBlock>
              )}
              {log.beforeNotes && <FieldBlock label="antes da conversa">{log.beforeNotes}</FieldBlock>}
              {log.afterNotes && <FieldBlock label="depois da conversa" tone="rose">{log.afterNotes}</FieldBlock>}
              {log.orientations && <FieldBlock label="orientações">{log.orientations}</FieldBlock>}
              {log.doubts && <FieldBlock label="dúvidas">{log.doubts}</FieldBlock>}
              <SelfAssessmentBlocks value={log.selfAssessment} />
              <NextStepList
                steps={log.nextSteps ?? []}
                log={log}
                exists={exists}
                onConvert={handleConvert}
              />
              {(log.nextSteps ?? []).length > 0 && (
                <FieldBlock label="o que ficou combinado">
                  <FieldList items={log.nextSteps ?? []} dotClassName="bg-ceci-brand-strong" />
                </FieldBlock>
              )}
              {(log.discussedLogIds ?? []).length > 0 && (
                <FieldBlock label="sessões discutidas">
                  <FieldList
                    items={(log.discussedLogIds ?? []).map((id) => {
                      const l = allLogs.find((x) => x.id === id);
                      return l ? `${l.patient?.trim() ?? '—'} · sessão ${l.sessionNumber ?? '—'} · ${formatDateBR(l.date)}` : id;
                    })}
                    dotClassName="bg-ceci-academic"
                  />
                </FieldBlock>
              )}
            </>
          )}

          {type === 'estagio' && <FieldBlock label="dúvidas">{log.doubts}</FieldBlock>}

          {(log.prepChecklist ?? []).length > 0 && (
            <FieldBlock label="checklist legado">
              <FieldList items={log.prepChecklist ?? []} dotClassName="bg-ceci-academic" />
            </FieldBlock>
          )}
          {log.supervisionNotes && <FieldBlock label="notas da supervisão">{log.supervisionNotes}</FieldBlock>}
          {log.nextSteps && type === 'outro' && (
            <FieldBlock label="próximos passos">
              <FieldList items={log.nextSteps} />
            </FieldBlock>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <IconButton
          label="mais"
          onClick={() => openManageItem('internship', log.id)}
          className="min-w-[44px] min-h-[44px]"
        >
          <MoreHorizontal className="w-4 h-4" aria-hidden />
        </IconButton>
      </div>
    </ManageSurface>
  );
};

/** Linha de meta por tipo — espelha `FieldBlock.metaLine`, kept local para o card. */
const metaLineFor = (log: InternshipLog): string => {
  if (log.type === 'atendimento_clinico') {
    const parts: string[] = [];
    if (log.patient?.trim()) parts.push(log.patient.trim());
    if (log.sessionNumber) parts.push(`sessão ${log.sessionNumber}`);
    if (log.patientAge?.trim()) parts.push(log.patientAge.trim());
    // `SPEC-011 D11`: tema declinado não aparece nem na linha de meta.
    if (log.theme?.trim() && !(log.declinedFields ?? []).includes('tema')) {
      parts.push(log.theme.trim());
    }
    return parts.join(' · ');
  }
  if (log.type === 'supervisao' || log.type === 'intervisao') {
    return log.supervisor?.trim() ? `com ${log.supervisor.trim()}` : '';
  }
  return '';
};

/** Até 3 chips de tema + "+N". */
const TopicChips: React.FC<{ topics: string[] }> = ({ topics }) => (
  <>
    {topics.slice(0, 3).map((t, i) => (
      <button
        type="button"
        key={`${t}-${i}`}
        className="inline-flex items-center min-h-[44px] text-[12px] px-3 py-2 rounded-full bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand"
        aria-label={`tema ${t}`}
      >
        {t}
      </button>
    ))}
    {topics.length > 3 && (
      <button
        type="button"
        className="inline-flex items-center min-h-[44px] text-[12px] px-3 py-2 rounded-full bg-surface-muted border border-ceci-border-subtle text-ceci-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand"
        aria-label={`mais ${topics.length - 3} temas`}
      >
        {`+${topics.length - 3}`}
      </button>
    )}
  </>
);