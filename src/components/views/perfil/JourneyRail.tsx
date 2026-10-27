// Perfil — trilho contínuo da formação (SPEC-013 D4).
//
// A assinatura visual do perfil: o caminho do curso em pontos — passado cheio,
// nó atual destacado, futuro vazado. Substitui a repetição de barras e caixas
// (`ProfileHeader.tsx:64-76` + `JourneyTimeline.tsx:71-104`) por uma metáfora
// única de percurso.
//
// Acessibilidade (D11/I8): o status **nunca** é só cor. Cada nó tem texto para
// leitor de tela, o atual leva `aria-current="step"`, e a decoração é
// `aria-hidden`. O `<ol>` carrega um resumo do percurso.
import React from 'react';
import { cn } from '@/lib/utils';
import type { ProfileJourneySlot } from '../../../lib/profileViewModel';
import { Reveal } from '@/lib/motion';

interface JourneyRailProps {
  slots: ProfileJourneySlot[];
}

const STATUS_TEXT: Record<ProfileJourneySlot['status'], string> = {
  past: 'concluído',
  current: 'atual',
  future: 'a cursar',
};

function nodeClass(status: ProfileJourneySlot['status']): string {
  if (status === 'current') {
    return 'w-4 h-4 bg-ceci-brand ring-4 ring-ceci-border-brand';
  }
  if (status === 'past') {
    return 'w-2.5 h-2.5 bg-ceci-brand-strong';
  }
  return 'w-2.5 h-2.5 border-2 border-ceci-border-strong bg-surface-default';
}

function connectorClass(status: ProfileJourneySlot['status']): string {
  return status === 'future' ? 'bg-ceci-border-subtle' : 'bg-ceci-border-strong';
}

const JourneyRail: React.FC<JourneyRailProps> = ({ slots }) => {
  const summary = slots.map((s) => `${s.ordinal}º ${STATUS_TEXT[s.status]}`).join(', ');

  return (
    <div className="rounded-2xl bg-surface-muted border border-ceci-border-subtle px-3 py-4">
      <ol className="flex items-center" aria-label={`trilho da formação: ${summary}`}>
        {slots.map((slot, index) => (
          <Reveal key={slot.ordinal} index={index}>
          <li
            key={slot.ordinal}
            aria-current={slot.status === 'current' ? 'step' : undefined}
            className="flex flex-1 flex-col items-center gap-1 min-w-0"
          >
            <span className="flex items-center w-full" aria-hidden="true">
              <span
                className={cn(
                  'flex-1 h-0.5',
                  index === 0 ? 'bg-transparent' : connectorClass(slots[index - 1].status),
                )}
              />
              <span className={cn('rounded-full shrink-0', nodeClass(slot.status))} />
              <span
                className={cn(
                  'flex-1 h-0.5',
                  index === slots.length - 1 ? 'bg-transparent' : connectorClass(slot.status),
                )}
              />
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'font-display text-[10px] font-semibold tabular-nums',
                slot.status === 'current' ? 'text-ceci-brand-strong' : 'text-ceci-tertiary',
              )}
            >
              {slot.ordinal}º
            </span>
            <span className="sr-only">{`${slot.ordinal}º semestre, ${STATUS_TEXT[slot.status]}`}</span>
          </li>
          </Reveal>
        ))}
      </ol>
    </div>
  );
};

export default JourneyRail;
