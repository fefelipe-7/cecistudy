import React from 'react';
import { Check, ListTodo, BookOpen, Timer } from 'lucide-react';
import type { InternshipLog, InternshipNextStepLink } from '../../types';
import { hasLiveNextStepLink } from '../../lib/internshipCases';
import { StatusChip } from './StatusChip';

type Kind = InternshipNextStepLink['kind'];

const KIND_META: Record<Kind, { label: string; verb: string; Icon: typeof Check }> = {
  task: { label: 'tarefa', verb: 'virou tarefa ✓', Icon: ListTodo },
  reading: { label: 'leitura', verb: 'virou leitura ✓', Icon: BookOpen },
  session: { label: 'foco', verb: 'virou foco ✓', Icon: Timer },
};

/**
 * Próximo passo com conversão **uma única vez** (`D17`).
 *
 * Antes cada toque criava uma tarefa/leitura/foco nova (`SupervisionView.tsx:26-41`),
 * sem lembrar do que já tinha sido convertido — duplicava. Agora o vínculo é
 * persistido em `nextStepLinks` e o botão só some quando o vínculo está **vivo**:
 * texto ainda em `nextSteps` **e** entidade ainda existente. Se a tarefa foi
 * apagada, os botões voltam (`E20`) — o app não pode mentir dizendo que virou.
 */
export const NextStepRow: React.FC<{
  step: string;
  log: InternshipLog;
  /** A entidade ligada existe? Injetado para o teste poder responder. */
  exists: (entityId: string) => boolean;
  onConvert: (step: string, kind: Kind) => void;
}> = ({ step, log, exists, onConvert }) => {
  const live = hasLiveNextStepLink(log, step, exists);
  const link = (log.nextStepLinks ?? []).find((l) => l.step.trim() === step.trim());

  return (
    <li className="flex items-start justify-between gap-2 py-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-ceci-brand-strong mt-1.5 shrink-0" />
      <span className="text-xs text-ceci-secondary leading-relaxed break-words flex-1 min-w-0">{step}</span>
      {live && link ? (
        <StatusChip tone="success" label={KIND_META[link.kind].verb} />
      ) : (
        <span className="flex items-center gap-1 shrink-0">
          {(Object.keys(KIND_META) as Kind[]).map((kind) => {
            const { label, Icon } = KIND_META[kind];
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onConvert(step, kind)}
                aria-label={`virar ${label}`}
                title={`virar ${label}`}
                className="w-11 h-11 -my-1.5 flex items-center justify-center rounded-full text-ceci-secondary hover:bg-surface-muted cursor-pointer tap-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand"
              >
                <Icon className="w-4 h-4" aria-hidden />
              </button>
            );
          })}
        </span>
      )}
    </li>
  );
};

/** Lista de próximos passos com conversão. */
export const NextStepList: React.FC<{
  steps: string[];
  log: InternshipLog;
  exists: (entityId: string) => boolean;
  onConvert: (step: string, kind: Kind) => void;
}> = ({ steps, log, exists, onConvert }) => {
  if (!steps.length) return null;
  return (
    <div className="bg-surface-muted border border-ceci-border-default rounded-xl p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary mb-1">
        próximos passos
      </p>
      <ul className="divide-y divide-ceci-border-subtle">
        {steps.map((step, i) => (
          <NextStepRow
            key={`${step}-${i}`}
            step={step}
            log={log}
            exists={exists}
            onConvert={onConvert}
          />
        ))}
      </ul>
    </div>
  );
};