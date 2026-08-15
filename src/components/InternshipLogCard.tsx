import React from 'react';
import type { InternshipLog, InternshipLogType } from '../types';

const TYPE_LABEL: Record<InternshipLogType, string> = {
  estagio: 'estágio',
  atendimento_clinico: 'atendimento clínico',
  supervisao: 'supervisão',
  intervisao: 'intervisão',
  outro: 'outro',
};

const TYPE_EMOJI: Record<InternshipLogType, string> = {
  estagio: '🩺',
  atendimento_clinico: '🧑‍⚕️',
  supervisao: '🧭',
  intervisao: '👥',
  outro: '✨',
};

const formatDate = (date: string): string => {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('pt-BR');
};

/** Bloco rotulado de conteúdo (ex.: "intervenções"). */
const FieldBlock: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="bg-surface-muted border border-ceci-border-default rounded-xl p-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1">{label}</p>
    <div className="text-xs text-ceci-secondary leading-relaxed">{children}</div>
  </div>
);

/** Chip pequeno (ex.: paciente, idade, temas). */
const MiniChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-blue border border-ceci-border-academic text-[11px] font-semibold text-ceci-academic-strong">
    {children}
  </span>
);

interface InternshipLogCardProps {
  log: InternshipLog;
}

/** Card de registro de estágio renderizado por extenso (Perfil + diário completo). */
export const InternshipLogCard: React.FC<InternshipLogCardProps> = ({ log }) => {
  const type = log.type || 'estagio';
  const isAtendimento = type === 'atendimento_clinico';
  const isSupervisao = type === 'supervisao' || type === 'intervisao';

  return (
    <div className="p-4 rounded-2xl bg-white border border-ceci-border-default shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand px-2.5 py-1 rounded-full">
          {TYPE_EMOJI[type]} {TYPE_LABEL[type]}
        </span>
        <span className="text-[11px] font-medium text-ceci-tertiary">
          {formatDate(log.date)} • {log.hours} h
        </span>
      </div>

      <h3 className="font-display font-bold text-base text-ceci-primary leading-snug">
        {log.activity}
      </h3>

      {isAtendimento && (
        <div className="flex flex-wrap gap-1.5">
          {log.sessionNumber !== undefined && <MiniChip>sessão {log.sessionNumber}</MiniChip>}
          {log.patient && <MiniChip>{log.patient}</MiniChip>}
          {log.patientAge && <MiniChip>{log.patientAge}</MiniChip>}
          {log.approach && <MiniChip>{log.approach}</MiniChip>}
        </div>
      )}

      {isAtendimento && log.theme && (
        <FieldBlock label="tema / queixa central">{log.theme}</FieldBlock>
      )}
      {isAtendimento && log.interventionNotes && (
        <FieldBlock label="intervenções / técnicas">{log.interventionNotes}</FieldBlock>
      )}
      {isAtendimento && log.observations && (
        <FieldBlock label="impressões clínicas">{log.observations}</FieldBlock>
      )}

      {isSupervisao && (
        <div className="flex flex-wrap gap-1.5">
          {log.supervisor && <MiniChip>com {log.supervisor}</MiniChip>}
          {log.topics?.map((t) => (
            <MiniChip key={t}>{t}</MiniChip>
          ))}
        </div>
      )}
      {isSupervisao && log.orientations && (
        <FieldBlock label="orientações">{log.orientations}</FieldBlock>
      )}
      {isSupervisao && log.doubts && (
        <FieldBlock label="dúvidas para investigar">{log.doubts}</FieldBlock>
      )}
      {isSupervisao && log.nextSteps && (
        <FieldBlock label="próximos passos">{log.nextSteps}</FieldBlock>
      )}

      {/* legado: dados antigos guardavam notas de supervisão soltas */}
      {!isSupervisao && log.supervisionNotes && (
        <FieldBlock label="notas da supervisão">{log.supervisionNotes}</FieldBlock>
      )}

      {log.reflections && (
        <FieldBlock label="reflexões">{log.reflections}</FieldBlock>
      )}
    </div>
  );
};
