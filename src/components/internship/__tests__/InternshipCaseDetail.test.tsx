import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InternshipCaseDetail } from '../InternshipCaseDetail';
import type { DerivedCase } from '../../../lib/internshipCases';
import type { InternshipLog } from '../../../types';

// Regressão F1: `InternshipCaseDetail` desestruturava `caseData` ANTES do guard
// `if (!isOpen) return null`, e o call-site em `InternshipDiaryView.tsx` passava
// `selectedCase!` — que é `null` enquanto nenhum caso está selecionado. O TypeError
// derrubava a tela inteira pelo ErrorBoundary da raiz, então abrir a aba pacientes
// (mesmo vazia) quebrava o app.

const caso: DerivedCase = {
  patientKey: 'ms',
  patientLabel: 'M.S.',
  logs: [],
  totalHours: 0,
  pendingReflection: 0,
  pendingSupervision: 0,
  lastSessionDate: '',
} as DerivedCase;

const logFixture = (date: string) =>
  ({
    id: `at-${date}`,
    type: 'atendimento_clinico',
    date,
    hours: 1,
    activity: 'sessão',
    reflections: '',
  }) as unknown as InternshipLog;

describe('InternshipCaseDetail', () => {
  it('não lança com caseData nulo mesmo com isOpen verdadeiro', () => {
    expect(() => render(<InternshipCaseDetail caseData={null} isOpen today="2026-09-10" onClose={() => {}} />)).not.toThrow();
  });

  it('não lança com caseData nulo e fechado', () => {
    expect(() =>
      render(<InternshipCaseDetail caseData={null} isOpen={false} today="2026-09-10" onClose={() => {}} />)
    ).not.toThrow();
  });

  it('não renderiza nada sem caso selecionado', () => {
    const { container } = render(<InternshipCaseDetail caseData={null} isOpen today="2026-09-10" onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza o caso quando há dados', () => {
    render(<InternshipCaseDetail caseData={caso} isOpen today="2026-09-10" onClose={() => {}} />);
    expect(screen.getByText('M.S.')).toBeInTheDocument();
  });

  it('escreve o plural certo (regressão U2)', () => {
    const comSessoes = {
      ...caso,
      logs: [logFixture('2026-09-02'), logFixture('2026-09-09')],
    } as DerivedCase;
    render(<InternshipCaseDetail caseData={comSessoes} isOpen today="2026-09-10" onClose={() => {}} />);
    expect(screen.getByText(/2 sessões/)).toBeInTheDocument();
    expect(screen.queryByText(/sessãoões/)).not.toBeInTheDocument();
  });

  it('chama onClose ao fechar', () => {
    const onClose = vi.fn();
    render(<InternshipCaseDetail caseData={caso} isOpen today="2026-09-10" onClose={onClose} />);
    screen.getByLabelText('fechar').click();
    expect(onClose).toHaveBeenCalled();
  });
});