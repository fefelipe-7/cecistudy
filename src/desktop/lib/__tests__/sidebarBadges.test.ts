import { describe, expect, it } from 'vitest';
import { computeSidebarBadges } from '../sidebarBadges';

const today = new Date(2026, 8, 1);

function dateKey(offsetDays: number): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

describe('computeSidebarBadges', () => {
  it('conta provas não concluídas nos próximos 7 dias (inclusive)', () => {
    const exams = [
      { date: dateKey(0), completed: false }, // hoje
      { date: dateKey(3), completed: false }, // dentro
      { date: dateKey(7), completed: false }, // +7 (inclusivo)
      { date: dateKey(8), completed: false }, // fora
      { date: dateKey(2), completed: true }, // concluída → ignora
    ];
    const badges = computeSidebarBadges(exams, [], 0, today);
    expect(badges.faculdade).toBe(3);
  });

  it('ignora datas inválidas', () => {
    const badges = computeSidebarBadges([{ date: 'qualquer-coisa', completed: false }], [], 0, today);
    expect(badges.faculdade).toBe(0);
  });

  it('conta flashcards nunca revisados', () => {
    const flashcards = [
      { lastReviewed: '2026-08-01' },
      {},
      { lastReviewed: undefined },
      { lastReviewed: '2026-09-01' },
    ];
    const badges = computeSidebarBadges([], flashcards, 0, today);
    expect(badges.estudos).toBe(2);
  });

  it('reflete itens salvos da biblioteca', () => {
    const badges = computeSidebarBadges([], [], 5, today);
    expect(badges.biblioteca).toBe(5);
  });
});
