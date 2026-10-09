import React from 'react';
import type { InternshipLog, InternshipLogType } from '../../types';
import { pluralPt } from '../../lib/pluralPt';
import { StatusChip } from './StatusChip';
import { typeMeta } from './LogTypeBadge';

/** Rótulo de paciente + sessão, para linha de meta do card clínico. */
export const patientLine = (log: InternshipLog): string => {
  const parts: string[] = [];
  const who = log.patient?.trim();
  if (who) parts.push(who);
  if (log.sessionNumber) parts.push(`sessão ${log.sessionNumber}`);
  if (log.patientAge?.trim()) parts.push(log.patientAge.trim());
  return parts.join(' · ');
};

/** Linha de meta por tipo: o que identifica o registro em uma olhada. */
export const metaLine = (log: InternshipLog): string => {
  switch (log.type) {
    case 'atendimento_clinico':
      return patientLine(log);
    case 'supervisao':
    case 'intervisao':
      return log.supervisor?.trim()
        ? `com ${log.supervisor.trim()}`
        : log.type === 'intervisao'
        ? 'intervisão com o grupo'
        : '';
    default:
      return '';
  }
};

/**
 * `FieldBlock` — bloco rotulado de conteúdo.
 *
 * O card antigo mostrava só reflexão, dúvidas, próximos passos, checklist e notas
 * legadas: **13 dos campos que o wizard pede** nunca apareciam (`U1`), entre eles
 * tema, abordagem, intervenções, supervisora, antes/depois e autoavaliação.
 */
export const FieldBlock: React.FC<{
  label: string;
  children?: React.ReactNode;
  tone?: 'default' | 'muted' | 'rose';
}> = ({ label, children, tone = 'muted' }) => {
  if (!children) return null;
  return (
    <div
      className={
        tone === 'muted'
          ? 'bg-surface-muted border border-ceci-border-default rounded-xl p-3'
          : tone === 'rose'
          ? 'bg-surface-rose border border-ceci-border-brand rounded-xl p-3'
          : 'bg-surface-default border border-ceci-border-default rounded-xl p-3'
      }
    >
      <p className="text-[12px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1">{label}</p>
      <div className="text-[13px] text-ceci-secondary leading-relaxed break-words">{children}</div>
    </div>
  );
};

/** Lista de textos como itens de linha. */
export const FieldList: React.FC<{ items: string[]; dotClassName?: string }> = ({
  items,
  dotClassName = 'bg-ceci-brand-strong',
}) => (
  <ul className="space-y-1">
    {items.map((item, i) => (
      <li key={`${item}-${i}`} className="flex items-start gap-1.5">
        <span className={cn2('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', dotClassName)} />
        <span className="break-words">{item}</span>
      </li>
    ))}
  </ul>
);

const cn2 = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

/** Autoavaliação: três mini blocos (confiança / limites / temas). */
export const SelfAssessmentBlocks: React.FC<{
  value?: InternshipLog['selfAssessment'];
}> = ({ value }) => {
  if (!value) return null;
  const rows: [string, string | undefined][] = [
    ['confiança', value.confidence],
    ['limites', value.limits],
    ['temas', value.themes],
  ];
  const filled = rows.filter(([, v]) => v?.trim());
  if (!filled.length) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {filled.map(([label, text]) => (
        <div
          key={label}
          className="bg-surface-muted border border-ceci-border-subtle rounded-xl p-2 min-w-0"
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1 truncate">
            {label}
          </p>
          <p className="text-[11px] text-ceci-secondary leading-snug break-words line-clamp-3">{text}</p>
        </div>
      ))}
    </div>
  );
};

/** Chip "sem supervisão" que abre o wizard direto no passo de reflexão. */
export const ReflectionChip: React.FC<{
  reflected: boolean;
  onAdd?: () => void;
}> = ({ reflected, onAdd }) =>
  reflected ? (
    <StatusChip tone="success" label="reflexão ok" />
  ) : (
    <StatusChip tone="warning" onClick={onAdd} ariaLabel="adicionar reflexão">
      sem reflexão · adicionar
    </StatusChip>
  );

/** "discutida em": as supervisões que tocaram esta sessão, em ordem de data. */
export const DiscussedList: React.FC<{
  lines: { id: string; label: string }[];
  onOpen?: (supervisionId: string) => void;
}> = ({ lines, onOpen }) => {
  if (!lines.length) return null;
  return (
    <FieldBlock label="discutida em">
      <ul className="space-y-1">
        {lines.map((l) => (
          <li key={l.id}>
            {onOpen ? (
              <button
                type="button"
                onClick={() => onOpen(l.id)}
                className="text-left text-ceci-academic-strong underline underline-offset-2 cursor-pointer tap-interactive min-h-[44px]"
              >
                {l.label}
              </button>
            ) : (
              <span>{l.label}</span>
            )}
          </li>
        ))}
      </ul>
    </FieldBlock>
  );
};

/** Rótulo do tipo de um log, já normalizado. */
export const labelOf = (type: InternshipLogType): string => typeMeta(type).label;

export { pluralPt };