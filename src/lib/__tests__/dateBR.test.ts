import { describe, it, expect } from 'vitest';
import {
  localDateKey,
  todayKeyLocal,
  formatDateBR,
  formatDateShortBR,
  dateKeyOrdinal,
  addDaysKey,
  weekStartKey,
  inWeek,
  isScheduledDate,
} from '../dateBR';

// Regressão F4: `new Date('2026-08-26')` é UTC 00:00 e, em fuso de São Paulo
// (UTC−3), `toLocaleDateString('pt-BR')` mostrava 25/08/2026. A data civil tem de
// ser lida como string. Estes testes são independentes de fuso de propósito.

describe('formatDateBR', () => {
  it('formata DateKey sem passar por Date (regressão F4)', () => {
    expect(formatDateBR('2026-08-26')).toBe('26/08/2026');
    expect(formatDateBR('2026-01-01')).toBe('01/01/2026');
    expect(formatDateBR('2026-12-31')).toBe('31/12/2026');
  });

  it('devolve a entrada como veio quando não é DateKey (dado legado não some)', () => {
    expect(formatDateBR('')).toBe('');
    expect(formatDateBR('amanhã')).toBe('amanhã');
    expect(formatDateBR('26/08/2026')).toBe('26/08/2026');
    expect(formatDateBR(undefined as unknown as string)).toBeUndefined();
  });

  it('formata curto', () => {
    expect(formatDateShortBR('2026-08-26')).toBe('26/08');
    expect(formatDateShortBR('x')).toBe('x');
  });
});

describe('localDateKey / todayKeyLocal', () => {
  it('usa getters locais, não toISOString (regressão F5)', () => {
    // 23:30 locais: em UTC−3 isto é 02:30 do dia seguinte. `toISOString` mentiria.
    const d = new Date(2026, 7, 26, 23, 30, 0);
    expect(localDateKey(d)).toBe('2026-08-26');
    expect(todayKeyLocal(d)).toBe('2026-08-26');
  });

  it('meia-noite local continua no mesmo dia', () => {
    expect(localDateKey(new Date(2026, 0, 1, 0, 0, 0))).toBe('2026-01-01');
  });

  it('formatos de mês e dia com dois dígitos', () => {
    expect(localDateKey(new Date(2026, 2, 3))).toBe('2026-03-03');
  });
});

describe('dateKeyOrdinal', () => {
  it('ordena por inteiro e põe chave inválida por último', () => {
    expect(dateKeyOrdinal('2026-08-26')).toBeLessThan(dateKeyOrdinal('2026-08-27'));
    expect(dateKeyOrdinal('2025-12-31')).toBeLessThan(dateKeyOrdinal('2026-01-01'));
    expect(dateKeyOrdinal('nada')).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe('addDaysKey', () => {
  it('atravessa mês e ano', () => {
    expect(addDaysKey('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDaysKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDaysKey('2028-02-28', 1)).toBe('2028-02-29'); // ano bissexto
    expect(addDaysKey('2026-12-25', 10)).toBe('2027-01-04');
  });

  it('devolve a entrada quando não é DateKey', () => {
    expect(addDaysKey('ontem', 3)).toBe('ontem');
  });
});

describe('weekStartKey', () => {
  it('devolve a segunda da semana corrente', () => {
    // 2026-08-26 é uma quarta-feira.
    expect(weekStartKey('2026-08-26')).toBe('2026-08-24');
    expect(weekStartKey('2026-08-24')).toBe('2026-08-24');
    expect(weekStartKey('2026-08-30')).toBe('2026-08-24'); // domingo → segunda anterior
  });

  it('atravessa o ano', () => {
    expect(weekStartKey('2026-01-01')).toBe('2025-12-29');
  });
});

describe('inWeek', () => {
  it('inclui a segunda e exclui a segunda seguinte', () => {
    const ws = '2026-08-24';
    expect(inWeek('2026-08-24', ws)).toBe(true);
    expect(inWeek('2026-08-30', ws)).toBe(true); // domingo
    expect(inWeek('2026-08-31', ws)).toBe(false); // segunda seguinte
    expect(inWeek('2026-08-23', ws)).toBe(false); // domingo anterior
  });
});

describe('isScheduledDate', () => {
  it('data futura é agendada; hoje é feito (SPEC-M-013 D7)', () => {
    const today = '2026-08-26';
    expect(isScheduledDate('2026-08-27', today)).toBe(true);
    expect(isScheduledDate('2026-08-26', today)).toBe(false);
    expect(isScheduledDate('2026-08-25', today)).toBe(false);
  });
});