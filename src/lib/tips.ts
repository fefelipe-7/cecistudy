/**
 * Dica do cecinho ✨ — escolhida pelo contexto real do dia.
 * Determinística: a mesma situação sempre devolve a mesma dica, e as
 * candidatas são avaliadas por prioridade (a mais específica vence).
 */

export interface TipContext {
  /** Flashcards com revisão vencida hoje. */
  dueCards?: number;
  /** Tarefas pendentes. */
  pendingTasks?: number;
  /** Data (YYYY-MM-DD) da próxima prova pendente, se houver. */
  nextExamDate?: string | null;
  /** Há leitura em andamento? */
  readingInProgress?: boolean;
  /** Dias ativos da streak atual. */
  streakDays?: number;
  /** Minutos de foco registrados hoje. */
  focusMinutesToday?: number;
}

/** Dias (inteiro ≥ 0) entre hoje e a data YYYY-MM-DD; null se inválida ou passada. */
export function daysUntil(date?: string | null, now = new Date()): number | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return diff >= 0 ? diff : null;
}

interface TipCandidate {
  matches: () => boolean;
  message: string;
  /** Dica padrão — usada apenas quando nenhuma específica se aplica. */
  fallback?: boolean;
}

function candidatesFor(ctx: TipContext): TipCandidate[] {
  const examDays = daysUntil(ctx.nextExamDate);
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

  return [
    {
      matches: () => examDays != null && examDays <= 7,
      message: 'a prova está pertinho — revisa os tópicos principais com calma, um de cada vez ♡',
    },
    {
      matches: () => (ctx.dueCards ?? 0) > 0,
      message: `tem ${ctx.dueCards} ${plural(ctx.dueCards ?? 0, 'cartão esperando', 'cartões esperando')} revisão — começa pelos rápidos ✨`,
    },
    {
      matches: () => (ctx.pendingTasks ?? 0) > 0,
      message:
        'pega a tarefa com prazo mais próximo e resolve ela primeiro — o resto flui ♡',
    },
    {
      matches: () => ctx.readingInProgress === true,
      message:
        'que tal uns parágrafos da leitura em andamento? poucos por dia terminam o livro ♡',
    },
    {
      matches: () => (ctx.streakDays ?? 0) >= 3 && (ctx.focusMinutesToday ?? 0) === 0,
      message: `${ctx.streakDays} dias seguidos — bora manter a chama com uma sessão curtinha hoje? 🔥`,
    },
    {
      matches: () => (ctx.streakDays ?? 0) >= 3,
      message: `${ctx.streakDays} dias seguidos de estudo. você tá construindo algo bonito ♡`,
    },
    {
      matches: () => (ctx.focusMinutesToday ?? 0) === 0,
      message: 'uma sessão leve de foco já conta. começa devagar, sem pressa ☕',
    },
    {
      matches: () => true,
      fallback: true,
      message: 'sem pressa hoje: uma página, um cartão, um resumo. o cantinho cuida do resto ♡',
    },
  ];
}

const FALLBACK_TIP =
  'sem pressa hoje: uma página, um cartão, um resumo. o cantinho cuida do resto ♡';

/** Dica contextual do cecinho para o momento atual (a mais específica vence). */
export function pickTip(ctx: TipContext, now = new Date()): string {
  const match = candidatesFor(ctx).find((c) => c.matches());
  return match?.message ?? FALLBACK_TIP;
}
