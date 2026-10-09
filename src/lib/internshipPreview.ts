// Lógica pura para selecionar os estágios a exibir na aba estagio da faculdade.
// Futuro (agendado) tem prioridade; mostra até `limit` itens (padrão 5),
// com futuros em ordem cronológica (mais próximo → mais distante)
// seguido dos passados mais recentes.

import type { InternshipLog, InternshipLogType } from '../types';

/**
 * Chave de data local (YYYY-MM-DD) para comparações consistentes.
 * Usa fuso local (como streakData) ao invés de UTC para coerência UX.
 */
function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Seleciona prévia do diário de estágio: futuros primeiro (agendados),
 * depois passados mais recentes, até `limit` itens.
 */
export function selectDiaryPreview(logs: InternshipLog[], now: Date, limit = 5): InternshipLog[] {
  if (logs.length === 0) return [];

  const todayKey = localDateKey(now);
  const future = logs
    .filter((log) => log.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date)); // crescente: mais próximo primeiro

  const past = logs
    .filter((log) => log.date < todayKey)
    .sort((a, b) => b.date.localeCompare(a.date)); // decrescente: mais recente primeiro

  return [...future, ...past].slice(0, limit);
}

/**
 * Rótulo legível para cada tipo de registro de estágio.
 * Mantido aqui para reaproveitamento em views (evita duplicação com InternshipLogCard).
 */
export const INTERNSHIP_TYPE_LABEL: Record<InternshipLogType, string> = {
  estagio: 'estágio',
  atendimento_clinico: 'atendimento clínico',
  supervisao: 'supervisão',
  intervisao: 'intervisão',
  outro: 'outro',
};