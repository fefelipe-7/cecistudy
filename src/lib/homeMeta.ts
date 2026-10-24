/**
 * Apresentação dos cards de pendência.
 *
 * `SPEC-M-018 D13/D7` — este arquivo **fica**, e perde os motores de frase.
 * `getGreeting` e `getDailyGoalMessage` foram para `src/lib/voice.ts`
 * (`saudacao` e `resumoDoDia`): eram a mesma coisa que a dica, com a mesma voz,
 * em três mecanismos separados — que é exatamente o que fazia a voz divergir.
 *
 * O que fica aqui é o que **não** é voz: mapa de classe CSS, limite de lista e
 * rótulo de prazo. Rótulo funcional é camada 2 (`SPEC-C-014 D9`) e continua
 * legível como código.
 */
import type { WeekDayStatus } from './streak';

/** Week cell styles for streak calendars (HomeView + EstudosView). */
export const WEEK_CELL_STYLE: Record<WeekDayStatus, string> = {
  done: 'bg-ceci-brand-strong text-ceci-on-brand border-ceci-brand-strong',
  today: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand ring-2 ring-rose-300/50',
  upcoming: 'bg-surface-default text-ceci-tertiary border-ceci-border-default',
  weekend: 'bg-surface-muted text-ceci-faded border-ceci-border-subtle',
};

export type DueUrgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later' | 'none';

export const DUE_STYLES: Record<DueUrgency, string> = {
  overdue: 'text-status-danger-strong font-bold',
  today: 'text-status-danger-strong font-bold',
  tomorrow: 'text-status-warning-strong font-semibold',
  soon: 'text-ceci-secondary',
  later: 'text-ceci-secondary',
  none: 'text-ceci-muted',
};

export const ATTENTION_LIMIT = 5;

export interface DueLabel {
  label: string;
  urgency: DueUrgency;
}

/**
 * Prazo relativo para os cards da Home ("vence hoje", "amanhã", "em 3 dias"...).
 * Puro e testável — a urgência guia as cores do card (vermelho/âmbar/neutro).
 */
export function formatDueLabel(dueDate: string | undefined, today = new Date()): DueLabel {
  if (!dueDate) return { label: 'sem prazo', urgency: 'none' };

  const d = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { label: dueDate, urgency: 'none' };

  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - start.getTime()) / 86400000);

  if (diff < 0) {
    return {
      label: diff === -1 ? 'atrasada desde ontem' : `atrasada há ${-diff} dias`,
      urgency: 'overdue',
    };
  }
  if (diff === 0) return { label: 'vence hoje!', urgency: 'today' };
  if (diff === 1) return { label: 'amanhã', urgency: 'tomorrow' };
  if (diff <= 7) return { label: `em ${diff} dias`, urgency: 'soon' };
  return {
    label: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', ''),
    urgency: 'later',
  };
}
