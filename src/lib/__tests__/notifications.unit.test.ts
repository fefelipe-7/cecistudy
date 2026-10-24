import { describe, it, expect } from 'vitest';

function calcReminderTime(start: string): { hour: number; minute: number } {
  const [h, m] = start.split(':').map(Number);
  let hour = Number.isFinite(h) ? h : 9;
  let minute = Number.isFinite(m) ? m : 0;
  minute -= 10;
  if (minute < 0) { minute += 60; hour -= 1; }
  if (hour < 0) hour = 23;
  return { hour, minute };
}

describe('notifications unit', () => {
  it('calc reminder 10 min before', () => {
    expect(calcReminderTime('08:00')).toEqual({ hour: 7, minute: 50 });
    expect(calcReminderTime('09:10')).toEqual({ hour: 9, minute: 0 });
    expect(calcReminderTime('00:05')).toEqual({ hour: 23, minute: 55 });
    expect(calcReminderTime('12:00')).toEqual({ hour: 11, minute: 50 });
  });
});
