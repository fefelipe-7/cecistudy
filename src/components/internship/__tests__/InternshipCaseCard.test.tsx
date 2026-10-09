import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InternshipCaseCard } from '../InternshipCaseCard';
import type { DerivedCase } from '../../../lib/internshipCases';

// SPEC-010 D5: o card de paciente ganha identidade — tile de iniciais à
// esquerda na geometria do tile do `CourseDetailView.tsx:113-118`, sem cor
// por paciente e sem nome completo.

const caso = {
  patientKey: 'ms',
  patientLabel: 'M. S.',
  logs: [],
  totalHours: 32,
  pendingReflection: 1,
  pendingSupervision: 2,
  lastSessionDate: '2026-09-26',
  nextScheduledDate: '',
  sessionsDone: 8,
  sessionsSupervised: 3,
  progress: 37,
  latestAge: 22,
  latestApproach: 'TCC',
} as unknown as DerivedCase;

describe('InternshipCaseCard', () => {
  it('renderiza o tile de iniciais e o título', () => {
    const { container } = render(<InternshipCaseCard caseData={caso} onPress={() => {}} />);
    // "M. S." aparece duas vezes: no tile (identidade) e no título (conteúdo)
    expect(screen.getAllByText('M. S.')).toHaveLength(2);
    expect(container.querySelector('span[aria-hidden]')?.textContent).toBe('M. S.');
    expect(screen.getByText('8 sessões')).toBeInTheDocument();
  });

  it('usa geometria do tile da referência (12×12, rounded-2xl) sem hex em classe', () => {
    const { container } = render(<InternshipCaseCard caseData={caso} onPress={() => {}} />);
    const tile = container.querySelector('span[aria-hidden]');
    expect(tile?.className).toContain('w-12 h-12');
    expect(tile?.className).toContain('rounded-2xl');
    expect(tile?.className).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it('label longo vira "?" no tile (o tile é identidade, não conteúdo)', () => {
    const longo = { ...caso, patientLabel: 'sem iniciais' } as DerivedCase;
    const { container } = render(<InternshipCaseCard caseData={longo} onPress={() => {}} />);
    expect(container.querySelector('span[aria-hidden]')?.textContent).toBe('?');
    expect(screen.getByText('sem iniciais')).toBeInTheDocument();
  });

  it('chama onPress e mantém o card inteiro clicável (≥44px)', () => {
    const onPress = vi.fn();
    const { container } = render(<InternshipCaseCard caseData={caso} onPress={onPress} />);
    const card = container.querySelector('button');
    expect(card?.className).toContain('p-4');
    card?.click();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
