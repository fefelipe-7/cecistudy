/**
 * Lógica de streak de estudos — pura e testável.
 *
 * Regras do produto:
 * - A semana de estudos são os 5 dias úteis (seg–sex). Sáb/dom são descanso:
 *   não contam como dia ativo e não quebram a streak.
 * - A semana inicia na segunda-feira.
 * - Uma streak quebra quando um dia útil passa sem atividade.
 * - Se "hoje" ainda não tem atividade, a streak fica pendente (não quebra até o fim do dia).
 * - Datas são sempre `YYYY-MM-DD` em fuso local (evita o bug UTC do `toISOString`).
 */

/** Retorna a data local no formato YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Faz parse de YYYY-MM-DD para Date (meia-noite local). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Dia da semana a partir de um Date: 0=dom, 1=seg, ..., 6=sáb. */
function weekday(date: Date): number {
  return date.getDay();
}

/** Segunda-feira = 1, ..., Sexta-feira = 5. Fins de semana (0 e 6) não são dias de estudo. */
export function isStudyDay(dateKey: string): boolean {
  const wd = weekday(parseDateKey(dateKey));
  return wd >= 1 && wd <= 5;
}

/** Chave YYYY-MM-DD do próximo dia a partir de `dateKey`. */
export function addDays(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Rotulo pt-BR curto do dia da semana (seg–dom). */
export function getWeekdayLabel(dateKey: string): string {
  const labels = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  return labels[weekday(parseDateKey(dateKey))];
}

/**
 * As 7 chaves (YYYY-MM-DD) da semana (seg a dom) que contém `reference`.
 * A semana de estudo usa apenas seg–sex.
 */
export function getWeekDates(reference: Date | string): string[] {
  const d = typeof reference === 'string' ? parseDateKey(reference) : reference;
  const key = toDateKey(d);
  const today = weekday(d);
  // offset para a segunda-feira (today 1=seg → 0; 0=dom → -6; 6=sáb → -5)
  const offsetToMonday = today === 0 ? -6 : 1 - today;
  const monday = addDays(key, offsetToMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export interface StreakStats {
  /** Dias de streak atual (contínuos nos dias úteis, ignorando fins de semana). */
  current: number;
  /** Maior streak já alcançada. */
  longest: number;
  /** Total de dias ativos (dias úteis com atividade, sem duplicar). */
  total: number;
  /** Se a streak está "viva": há atividade hoje ou ontem (ou em um fim de semana). */
  alive: boolean;
}

/** True se entre `from` e `to` (exclusivo) só existem fins de semana (nenhum dia útil pulado). */
function isConsecutiveStudyDays(from: string, to: string): boolean {
  let cursor = addDays(from, 1);
  while (cursor < to) {
    if (isStudyDay(cursor)) return false;
    cursor = addDays(cursor, 1);
  }
  return true;
}

/**
 * Calcula a streak a partir do conjunto de dias ativos.
 * `activeDays` pode ter qualquer data; fins de semana são ignorados.
 */
export function computeStreak(activeDays: string[], todayKey: string): StreakStats {
  const active = new Set(activeDays);

  const walkBack = (start: string): number => {
    let cursor = start;
    let count = 0;
    // Limite de segurança (ex.: 5 anos) para evitar loop infinito
    for (let i = 0; i < 5 * 365; i++) {
      if (!isStudyDay(cursor)) {
        // fim de semana: não conta nem quebra — pula
        cursor = addDays(cursor, -1);
        continue;
      }
      if (active.has(cursor)) {
        count++;
        cursor = addDays(cursor, -1);
        continue;
      }
      break;
    }
    return count;
  };

  // Streak atual: começa hoje se ativo; senão começa de ontem (pendente).
  let current = 0;
  if (isStudyDay(todayKey) && active.has(todayKey)) {
    current = walkBack(todayKey);
  } else {
    const yesterday = addDays(todayKey, -1);
    if (isStudyDay(yesterday) && active.has(yesterday)) {
      current = walkBack(yesterday);
    } else if (!isStudyDay(todayKey) && !isStudyDay(yesterday)) {
      // fim de semana (domingo): a streak permanece a da última sexta, se ainda não quebrou
      const offset = weekday(parseDateKey(todayKey)) === 0 ? -2 : -1; // dom→sex -2, sáb→sex -1
      const friday = addDays(todayKey, offset);
      if (isStudyDay(friday) && active.has(friday)) {
        current = walkBack(friday);
      }
    }
  }

  // Streak mais longa: maior sequência contínua nos dias úteis.
  let longest = 0;
  const sorted = [...active].filter(isStudyDay).sort();
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      // consecutivo = só fins de semana entre as duas datas (ex.: sex→seg); qualquer dia útil pulado quebra.
      run = isConsecutiveStudyDays(sorted[i - 1], sorted[i]) ? run + 1 : 1;
    }
    longest = Math.max(longest, run);
  }

  const total = sorted.length;

  // "viva": streak atual > 0 (ainda não quebrou; "hoje" pendente não zera).
  const alive = current > 0;

  return { current, longest, total, alive };
}

export type WeekDayStatus = 'done' | 'today' | 'upcoming' | 'weekend';

export interface WeekDayCell {
  dateKey: string;
  label: string;
  status: WeekDayStatus;
  active: boolean;
}

/**
 * Progresso da semana atual para o card da Home: 7 células (seg–dom),
 * mas apenas seg–sex contam como dia de estudo.
 */
export function getWeekProgress(activeDays: string[], reference: Date | string): WeekDayCell[] {
  const active = new Set(activeDays);
  const todayKey = typeof reference === 'string' ? reference : toDateKey(reference);
  const week = getWeekDates(reference);

  return week.map((dateKey) => {
    if (!isStudyDay(dateKey)) return { dateKey, label: getWeekdayLabel(dateKey), status: 'weekend', active: false };
    if (active.has(dateKey)) return { dateKey, label: getWeekdayLabel(dateKey), status: 'done', active: true };
    if (dateKey === todayKey) return { dateKey, label: getWeekdayLabel(dateKey), status: 'today', active: false };
    return { dateKey, label: getWeekdayLabel(dateKey), status: 'upcoming', active: false };
  });
}

export interface HistoryWeek {
  /** Chave YYYY-MM-DD da segunda-feira que inicia a semana. */
  weekStart: string;
  /** Os 5 dias úteis da semana (seg–sex), mais antigos para mais recentes. */
  days: { dateKey: string; label: string; active: boolean }[];
}

/**
 * Histórico das últimas `weeks` semanas (da semana atual para trás), usado na tela
 * de streak. Cada semana traz apenas os dias úteis (seg–sex), com flag de atividade.
 * Retorna da semana mais antiga para a mais recente (para renderizar em coluna).
 */
export function getRecentWeeks(
  activeDays: string[],
  todayKey: string,
  weeks = 8
): HistoryWeek[] {
  const active = new Set(activeDays);
  const currentWeekMonday = getWeekDates(todayKey)[0];
  const result: HistoryWeek[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = addDays(currentWeekMonday, -7 * w);
    const days = Array.from({ length: 5 }, (_, i) => {
      const dateKey = addDays(weekStart, i);
      return { dateKey, label: getWeekdayLabel(dateKey), active: active.has(dateKey) };
    });
    result.push({ weekStart, days });
  }

  return result;
}
