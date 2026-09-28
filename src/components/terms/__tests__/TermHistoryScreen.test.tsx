import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const reopenTermById = vi.fn();
const showToast = vi.fn();
const openTermHistory = vi.fn();
const focusedTermId = null;

vi.mock('@/context/mobileApp', () => ({
  useMobileApp: () => ({
    academicTerms: [
      {
        id: 'trm-2',
        ordinal: 7,
        label: '7º semestre',
        status: 'encerrado',
        startedAt: '2026-08-01',
        endedAt: '2026-12-31',
        statusTransitionAt: '2026-12-31T00:00:00.000Z',
        updatedAt: '2026-12-31T00:00:00.000Z',
        totalSemesters: 10,
        summary: { classNotes: 32, focusMinutes: 900, pagesRead: 210, highlights: [], grades: [] },
      },
      {
        id: 'trm-3',
        ordinal: 8,
        label: '8º semestre',
        status: 'ativo',
        startedAt: '2027-02-01',
        statusTransitionAt: '2027-02-01T00:00:00.000Z',
        updatedAt: '2027-02-01T00:00:00.000Z',
        totalSemesters: 10,
      },
    ],
    profile: { totalSemesters: 10, semester: 3 },
    focusedTermId,
    openTermHistory,
  }),
}));

vi.mock('@/context/shellNavContexts', () => ({
  useTermActions: () => ({ reopenTermById, showToast }),
}));

vi.mock('@/lib/termScope', async () => {
  const actual = await vi.importActual<typeof import('@/lib/termScope')>('@/lib/termScope');
  return { ...actual, useActiveTerm: (terms: Parameters<typeof actual.activeTermOf>[0]) => actual.activeTermOf(terms) };
});

import { TermHistoryScreen } from '../TermHistoryScreen';

beforeEach(() => {
  reopenTermById.mockClear();
  showToast.mockClear();
});

/**
 * B7 (SPEC-006 D7): quando a virada fechou o semestre errado, a usuária ficava
 * presa — o período certo estava encerrado, congelado e sem nenhuma forma de
 * voltar a ser o atual. A saída é **reabrir**, offered por período encerrado.
 */
describe('TermHistoryScreen — reabrir período', () => {
  it('oferece reabrir só no período encerrado', () => {
    render(<TermHistoryScreen />);
    // um botão de reabrir: o encerrado (7º) reabre, o ativo (8º) não
    expect(screen.getAllByRole('button', { name: /reabrir como atual/i })).toHaveLength(1);
  });

  it('reabrir chama reopenTermById com o id do período', () => {
    render(<TermHistoryScreen />);
    fireEvent.click(screen.getByRole('button', { name: /reabrir como atual/i }));
    expect(reopenTermById).toHaveBeenCalledWith('trm-2');
    expect(showToast).toHaveBeenCalledWith('7º semestre voltou a ser o seu semestre atual ♡');
  });

  it('o progresso do cabeçalho vem do período ativo, não do campo legado', () => {
    // `profile.semester` = 3 (legado divergente) enquanto o período ativo é o 8º.
    // O TermHistoryScreen antigo mostrava `degreeProgress(profile.semester, …)`
    // → 30%; a versão correta mostra 80% (SPEC-005 §D4).
    render(<TermHistoryScreen />);
    expect(screen.getByText(/80% do curso/)).toBeDefined();
    expect(screen.queryByText(/30% do curso/)).toBeNull();
    expect(screen.getByText('você está aqui agora ♡')).toBeDefined();
  });
});
