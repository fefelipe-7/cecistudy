import { describe, expect, it } from 'vitest';
import {
  toDateKey,
  parseDateKey,
  isStudyDay,
  addDays,
  getWeekdayLabel,
  getWeekDates,
  computeStreak,
  getWeekProgress,
  getRecentWeeks,
} from '../streak';

// Semana de referência: segunda 2026-08-10 ... domingo 2026-08-16 (hoje sexta 2026-08-14).
const MON = '2026-08-10';
const TUE = '2026-08-11';
const WED = '2026-08-12';
const THU = '2026-08-13';
const FRI = '2026-08-14';
const SAT = '2026-08-15';
const SUN = '2026-08-16';
const NEXT_MON = '2026-08-17';

describe('datas', () => {
  it('toDateKey/parseDateKey fazem round-trip', () => {
    expect(toDateKey(parseDateKey(FRI))).toBe(FRI);
  });

  it('isStudyDay reconhece seg–sex e ignora fim de semana', () => {
    expect(isStudyDay(MON)).toBe(true);
    expect(isStudyDay(FRI)).toBe(true);
    expect(isStudyDay(SAT)).toBe(false);
    expect(isStudyDay(SUN)).toBe(false);
  });

  it('addDays soma/subtrai dias', () => {
    expect(addDays(FRI, 1)).toBe(SAT);
    expect(addDays(FRI, -1)).toBe(THU);
    expect(addDays(SUN, 1)).toBe(NEXT_MON);
  });

  it('getWeekdayLabel retorna rótulos pt-BR', () => {
    expect(getWeekdayLabel(MON)).toBe('seg');
    expect(getWeekdayLabel(FRI)).toBe('sex');
    expect(getWeekdayLabel(SAT)).toBe('sáb');
    expect(getWeekdayLabel(SUN)).toBe('dom');
  });

  it('getWeekDates inicia a semana na segunda', () => {
    expect(getWeekDates(FRI)).toEqual([MON, TUE, WED, THU, FRI, SAT, SUN]);
    expect(getWeekDates(SUN)).toEqual([MON, TUE, WED, THU, FRI, SAT, SUN]);
  });
});

describe('computeStreak', () => {
  it('começa zerada sem dias ativos', () => {
    expect(computeStreak([], FRI)).toEqual({ current: 0, longest: 0, total: 0, alive: false });
  });

  it('conta 1 quando só hoje está ativo', () => {
    const stats = computeStreak([FRI], FRI);
    expect(stats.current).toBe(1);
    expect(stats.alive).toBe(true);
  });

  it('conta a sequência de seg–sex ativa', () => {
    expect(computeStreak([WED, THU, FRI], FRI).current).toBe(3);
  });

  it('mantém a streak pendente quando ontem esteve ativo e hoje ainda não', () => {
    // hoje (sex) sem atividade, ontem (qui) ativo → streak viva
    expect(computeStreak([TUE, WED, THU], FRI).current).toBe(3);
  });

  it('quebra a streak quando um dia útil foi pulado', () => {
    // seg–qua ativos, qui pulado, hoje sex sem atividade → quebrada
    expect(computeStreak([MON, TUE, WED], FRI).current).toBe(0);
  });

  it('preserva a streak no sábado quando sexta esteve ativa', () => {
    expect(computeStreak([THU, FRI], SAT).current).toBe(2);
  });

  it('preserva a streak no domingo quando sexta esteve ativa', () => {
    expect(computeStreak([WED, THU, FRI], SUN).current).toBe(3);
  });

  it('quebra no fim de semana se sexta foi pulada', () => {
    expect(computeStreak([TUE, WED, THU], SAT).current).toBe(0);
  });

  it('atravessa o fim de semana (sex→seg conta como consecutivo)', () => {
    expect(computeStreak([FRI, NEXT_MON], NEXT_MON).current).toBe(2);
  });

  it('ignora fins de semana no total, no longest e na streak atual', () => {
    // qua–sex ativos + sáb/dom no meio + seg seguinte → fins de semana não contam nem quebram
    const stats = computeStreak([WED, THU, FRI, SAT, SUN, NEXT_MON], NEXT_MON);
    expect(stats.total).toBe(4);
    expect(stats.longest).toBe(4);
    expect(stats.current).toBe(4);
  });

  it('deduplica dias repetidos', () => {
    expect(computeStreak([FRI, FRI, FRI], FRI).total).toBe(1);
  });

  it('longest considera a maior sequência, ignorando quebras antigas', () => {
    // seg-ter-qua (3) ... sex (1) → longest 3
    expect(computeStreak([MON, TUE, WED, FRI], FRI).longest).toBe(3);
  });

  it('longest atravessa fins de semana', () => {
    expect(computeStreak([WED, THU, FRI, NEXT_MON, '2026-08-18'], FRI).longest).toBe(5);
  });
});

describe('getWeekProgress', () => {
  it('marca done, today, upcoming e weekend corretamente', () => {
    const cells = getWeekProgress([TUE, FRI], FRI);
    expect(cells.map((c) => c.status)).toEqual([
      'upcoming', // seg 10
      'done',     // ter 11
      'upcoming', // qua 12
      'upcoming', // qui 13
      'done',     // sex 14 (já ativo hoje)
      'weekend',  // sáb 15
      'weekend',  // dom 16
    ]);
    expect(cells.map((c) => c.label)).toEqual(['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']);
  });

  it('marca today quando hoje ainda não tem atividade', () => {
    const cells = getWeekProgress([TUE], FRI);
    expect(cells.find((c) => c.dateKey === FRI)).toMatchObject({ status: 'today' });
  });

  it('marca a semana da segunda-feira de referência', () => {
    const cells = getWeekProgress([], MON);
    expect(cells[0]).toMatchObject({ dateKey: MON, status: 'today' });
  });
});

describe('getRecentWeeks', () => {
  it('retorna o número padrão de semanas (8), da mais antiga para a mais recente', () => {
    const weeks = getRecentWeeks([], FRI);
    expect(weeks).toHaveLength(8);
    expect(weeks[7].weekStart).toBe(MON); // última = semana atual
    expect(weeks[0].weekStart).toBe('2026-06-22'); // 8 semanas antes
  });

  it('cada semana traz apenas os 5 dias úteis (seg–sex)', () => {
    const [week] = getRecentWeeks([], FRI, 1);
    expect(week.days).toHaveLength(5);
    expect(week.days.map((d) => d.label)).toEqual(['seg', 'ter', 'qua', 'qui', 'sex']);
    expect(week.days.some((d) => d.label === 'sáb')).toBe(false);
  });

  it('marca active apenas nos dias úteis presentes em activeDays', () => {
    const weeks = getRecentWeeks([TUE, FRI], FRI, 1);
    const current = weeks[0];
    expect(current.days.map((d) => d.active)).toEqual([false, true, false, false, true]);
  });

  it('semanas anteriores aparecem corretamente', () => {
    const prevWeekMon = '2026-08-03';
    const prevWeekFri = '2026-08-07';
    const weeks = getRecentWeeks([prevWeekFri], FRI, 2);
    expect(weeks[0].weekStart).toBe(prevWeekMon);
    expect(weeks[0].days[4]).toMatchObject({ dateKey: prevWeekFri, active: true });
    expect(weeks[1].weekStart).toBe(MON);
  });

  it('ignora fins de semana mesmo que estejam em activeDays', () => {
    const weeks = getRecentWeeks([SAT, SUN, FRI], FRI, 1);
    expect(weeks[0].days.some((d) => d.active)).toBe(true);
    expect(weeks[0].days.filter((d) => d.active)).toHaveLength(1); // só sex
  });

  it('aceita um número custom de semanas', () => {
    expect(getRecentWeeks([], FRI, 3)).toHaveLength(3);
  });
});
