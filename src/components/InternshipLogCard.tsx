import React from 'react';
import { FileText, BookOpen, Brain } from 'lucide-react';
import type { InternshipLog, InternshipLogType, InternshipPhase } from '../types';
import { useApp } from '../context/AppContext';
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
  const { openManageItem, handleAddTask, handleAddFlashcard, handleAddReading } = useApp();
  const type = log.type || 'estagio';
  const isAtendimento = type === 'atendimento_clinico';
  const isSupervisao = type === 'supervisao' || type === 'intervisao';

  const eloTexts: string[] = [log.doubts, log.nextSteps]
    .filter(Boolean)
    .flatMap((t) => (t as string).split('\n').map((s) => s.trim()).filter(Boolean));

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <ManageSurface
      kind="internship"
      id={log.id}
      className="p-4 rounded-2xl bg-white border border-ceci-border-default shadow-2xs space-y-3"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand px-2.5 py-1 rounded-full">
          {TYPE_EMOJI[type]} {TYPE_LABEL[type]}
        </span>
        <div className="flex items-center gap-1.5">
          {log.phase && (
            <span className="text-[10px] font-semibold text-ceci-academic-strong bg-surface-blue border border-ceci-border-academic px-2 py-0.5 rounded-full">
              {PHASE_LABEL[log.phase]}
            </span>
          )}
          <span className="text-[11px] font-medium text-ceci-tertiary">
            {formatDate(log.date)} • {log.hours} h
          </span>
        </div>
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

      {log.prepChecklist && log.prepChecklist.length > 0 && (
        <FieldBlock label="preparar o campo">
          <ul className="space-y-1">
            {log.prepChecklist.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5 text-ceci-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-ceci-academic" />
                {item}
              </li>
            ))}
          </ul>
        </FieldBlock>
      )}

      {log.reflections && (
        <FieldBlock label="reflexões">{log.reflections}</FieldBlock>
      )}

      {eloTexts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">transformar em próximo passo</p>
          {eloTexts.map((text, i) => (
            <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-muted border border-ceci-border-subtle">
              <span className="text-xs text-ceci-primary truncate">{text}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { stop(e); handleAddTask({ id: 'task_' + Date.now(), title: text, completed: false, priority: 'media', category: 'estagio' }); }}
                  title="virar tarefa"
                  className="w-7 h-7 rounded-lg bg-white border border-ceci-border-default flex items-center justify-center text-ceci-primary hover:border-ceci-border-brand cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { stop(e); handleAddFlashcard({ id: 'f-' + Date.now(), question: text, answer: '' }); }}
                  title="virar flashcard"
                  className="w-7 h-7 rounded-lg bg-white border border-ceci-border-default flex items-center justify-center text-ceci-primary hover:border-ceci-border-brand cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { stop(e); handleAddReading({ id: 'r-' + Date.now(), title: text, author: '', type: 'artigo', status: 'nao_iniciado' }); }}
                  title="virar leitura"
                  className="w-7 h-7 rounded-lg bg-white border border-ceci-border-default flex items-center justify-center text-ceci-primary hover:border-ceci-border-brand cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ManageSurface>
  );
};
