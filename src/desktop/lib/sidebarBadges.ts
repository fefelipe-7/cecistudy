export interface SidebarBadges {
  faculdade: number;
  estudos: number;
  biblioteca: number;
}

/**
 * Deriva os contadores dos badges por aba da sidebar (somente leitura).
 * - faculdade: provas não concluídas nos próximos 7 dias (hoje ≤ data ≤ hoje+7).
 * - estudos: flashcards nunca revisados (!lastReviewed).
 * - biblioteca: itens salvos (savedBookIds.length).
 */
export function computeSidebarBadges(
  exams: { date: string; completed: boolean }[],
  flashcards: { lastReviewed?: string }[],
  savedBookIdsLength: number,
  today: Date = new Date()
): SidebarBadges {
  const start = startOfDayMs(today);
  const end = start + 8 * 86400000;
  const faculdade = exams.filter((e) => {
    if (e.completed) return false;
    const ts = parseDate(e.date);
    return ts !== null && ts >= start && ts < end;
  }).length;
  const estudos = flashcards.filter((f) => !f.lastReviewed).length;
  return { faculdade, estudos, biblioteca: savedBookIdsLength };
}

function parseDate(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

function startOfDayMs(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
