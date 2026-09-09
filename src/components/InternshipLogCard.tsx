import React from 'react';
import type { InternshipLog, InternshipLogType, InternshipPhase } from '../types';
import { useMobileApp } from '@/context/mobileApp';
import { ManageSurface } from './ui/ManageSurface';

const PHASE_LABEL: Record<InternshipPhase, string> = {
  preparar: 'preparar',
  registrar: 'registrar',
  refletir: 'refletir',
  supervisionar: 'supervisionar',
  entregar: 'entregar',
};

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

interface InternshipLogCardProps {
  log: InternshipLog;
}

/** Card de registro de estágio renderizado por extenso (Perfil + diário completo). */
export const InternshipLogCard: React.FC<InternshipLogCardProps> = ({ log }) => {
  const { openManageItem, handleAddTask, handleAddFlashcard, handleAddReading } = useMobileApp();

  const type = log.type ?? 'estagio';

  return (
    <ManageSurface
      kind="internship"
      id={log.id}
      className="p-4 rounded-2xl bg-surface-default border border-ceci-border-default shadow-2xs space-y-3"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand px-2.5 py-1 rounded-full">
          {TYPE_EMOJI[type]} {TYPE_LABEL[type]}
        </span>
<div className="flex items-center gap-1.5">
           <span className="text-[11px] font-medium text-ceci-tertiary">
             {formatDate(log.date)} • {log.hours} h
           </span>
         </div>
      </div>

      <h3 className="font-display font-bold text-base text-ceci-primary leading-snug">
        {log.activity}
      </h3>

      {log.reflections && (
        <FieldBlock label="reflexões">{log.reflections}</FieldBlock>
      )}

      {log.doubts && (
        <FieldBlock label="dúvidas">{log.doubts}</FieldBlock>
      )}
      {(log.nextSteps ?? []).length > 0 && (
        <FieldBlock label="próximos passos">
          <ul className="space-y-1">
            {(log.nextSteps ?? []).map((item, i) => (
              <li key={i} className="flex items-center gap-1.5 text-ceci-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-ceci-brand-strong" />
                {item}
              </li>
            ))}
          </ul>
        </FieldBlock>
      )}

      {(log.prepChecklist ?? []).length > 0 && (
        <FieldBlock label="preparar o campo">
          <ul className="space-y-1">
            {(log.prepChecklist ?? []).map((item, i) => (
              <li key={i} className="flex items-center gap-1.5 text-ceci-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-ceci-academic" />
                {item}
              </li>
            ))}
          </ul>
        </FieldBlock>
      )}
      {log.supervisionNotes && (
        <FieldBlock label="notas da supervisão">{log.supervisionNotes}</FieldBlock>
      )}
    </ManageSurface>
  );
};
