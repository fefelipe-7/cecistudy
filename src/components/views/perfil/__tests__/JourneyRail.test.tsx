/**
 * SPEC-013 D4/I3/I4 — o trilho comunica o percurso e o CTA de virada aparece uma
 * única vez, sempre habilitado com período ativo (SPEC-008 D1). Os casos de 1, 2,
 * 8 e 12 semestres e o ordinal além do total fecham o contrato de D4/I4.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JourneyRail from '../JourneyRail';
import JourneyNow from '../JourneyNow';
import {
  deriveProfileViewModel,
  type ProfileViewModelInput,
} from '../../../../lib/profileViewModel';
import { MAX_TERM_ORDINAL } from '../../../../lib/termScope';
import type { AcademicTerm, UserProfile } from '../../../../types';

const profile = (over: Partial<UserProfile> = {}): UserProfile => ({
  name: 'ceci',
  semester: 1,
  totalSemesters: 8,
  university: 'USP',
  targetCareer: 'Psicologia',
  dailyQuote: '',
  stickersCollected: 0,
  ...over,
});

const term = (over: Partial<AcademicTerm> = {}): AcademicTerm => ({
  id: 'trm-1',
  ordinal: 6,
  label: '6º semestre',
  status: 'ativo',
  startedAt: '2026-02-01',
  statusTransitionAt: '2026-02-01T00:00:00.000Z',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
  ...over,
});

const base = (over: Partial<ProfileViewModelInput> = {}): ProfileViewModelInput => ({
  profile: profile(),
  activeTerm: term(),
  academicTerms: [term()],
  courses: [],
  classes: [],
  tasks: [],
  exams: [],
  readings: [],
  flashcards: [],
  sessions: [],
  stickers: [],
  streak: { current: 0, longest: 0, total: 0, alive: false },
  themePref: 'rosa-claro',
  reminderSettings: { enabled: false, time: '20:00' },
  reminderSupported: true,
  gcalConfigured: false,
  gcalEnabled: false,
  native: false,
  ...over,
});

const journeyFor = (total: number, currentOrdinal: number) =>
  deriveProfileViewModel(
    base({
      profile: profile({ totalSemesters: total, semester: currentOrdinal }),
      activeTerm: term({ ordinal: currentOrdinal }),
      academicTerms: [term({ ordinal: currentOrdinal })],
    }),
  ).journey;

describe('JourneyRail', () => {
  it('desenha um nó por semestre, do 1º ao total (2 semestres)', () => {
    render(<JourneyRail slots={journeyFor(2, 1).slots} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('1º semestre, atual')).toBeTruthy();
    expect(screen.getByText('2º semestre, a cursar')).toBeTruthy();
  });

  it('marca o nó atual com aria-current="step" (8 semestres)', () => {
    const { container } = render(<JourneyRail slots={journeyFor(8, 6).slots} />);
    const current = container.querySelector('[aria-current="step"]');
    expect(current).not.toBeNull();
    expect(current).toHaveTextContent('6º');
  });

  it('com período único, um nó é atual e o resto é futuro', () => {
    render(<JourneyRail slots={journeyFor(1, 1).slots} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('1º semestre, atual')).toBeTruthy();
  });

  it('expõe um resumo textual do percurso no aria-label', () => {
    render(<JourneyRail slots={journeyFor(3, 2).slots} />);
    const list = screen.getByRole('list');
    expect(list.getAttribute('aria-label')).toContain('2º atual, 3º a cursar');
  });
});

describe('JourneyNow', () => {
  const noop = () => {};

  it('mostra o CTA de virada uma vez e habilitado (I3 / SPEC-008 D1)', () => {
    render(
      <JourneyNow
        journey={journeyFor(8, 6)}
        onCorrectOrdinal={noop}
        onSetTotalSemesters={noop}
        onOpenSemesterWizard={noop}
        onShowToast={noop}
      />,
    );
    const ctas = screen.getAllByRole('button', { name: /virar o semestre/ });
    expect(ctas).toHaveLength(1);
    expect((ctas[0] as HTMLButtonElement).disabled).toBe(false);
  });

  it('o progresso da graduação aparece uma vez (I2)', () => {
    render(
      <JourneyNow
        journey={journeyFor(8, 6)}
        onCorrectOrdinal={noop}
        onSetTotalSemesters={noop}
        onOpenSemesterWizard={noop}
        onShowToast={noop}
      />,
    );
    expect(screen.getAllByText(/do curso/)).toHaveLength(1);
  });

  it('avisa (sem bloquear) quando o ordinal passa do total (I4 / SPEC-008 D3)', () => {
    render(
      <JourneyNow
        journey={journeyFor(8, 9)}
        onCorrectOrdinal={noop}
        onSetTotalSemesters={noop}
        onOpenSemesterWizard={noop}
        onShowToast={noop}
      />,
    );
    expect(screen.getByText(/além dos 8 do curso/)).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: /virar o semestre/ }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it('sem período ativo, colapsa em abrir meu 1º semestre', () => {
    render(
      <JourneyNow
        journey={
          journeyFor(1, 1) && { ...journeyFor(1, 1), hasActiveTerm: false, activeTermId: undefined }
        }
        onCorrectOrdinal={noop}
        onSetTotalSemesters={noop}
        onOpenSemesterWizard={noop}
        onShowToast={noop}
      />,
    );
    expect(screen.getByRole('button', { name: /abrir meu 1º semestre/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /virar o semestre/ })).toBeNull();
  });

  it('corrigir o semestre chama onCorrectOrdinal com o id do período ativo', () => {
    const onCorrectOrdinal = vi.fn();
    render(
      <JourneyNow
        journey={journeyFor(8, 6)}
        onCorrectOrdinal={onCorrectOrdinal}
        onSetTotalSemesters={noop}
        onOpenSemesterWizard={noop}
        onShowToast={noop}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /corrigir semestre atual/ }));
    const input = screen.getByLabelText('em que semestre você está?') as HTMLInputElement;
    expect(input.value).toBe('6');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'guardar' }));
    expect(onCorrectOrdinal).toHaveBeenCalledWith('trm-1', 5);
  });

  /**
   * Comportamento herdado do `JourneyTermCard` (SPEC-008) — a reestruturação em
   * `JourneyNow` (SPEC-013 D1) não pode perder as garantias que a tela antiga
   * fixou: correção por id, teto global, stepper do total, escape e rascunho.
   */
  describe('JourneyNow — garantias herdadas do JourneyTermCard (SPEC-008)', () => {
    it('escape cancela a correção sem gravar', () => {
      const onCorrectOrdinal = vi.fn();
      render(
        <JourneyNow
          journey={journeyFor(8, 6)}
          onCorrectOrdinal={onCorrectOrdinal}
          onSetTotalSemesters={noop}
          onOpenSemesterWizard={noop}
          onShowToast={noop}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /corrigir semestre atual/ }));
      const input = screen.getByLabelText('em que semestre você está?');
      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(onCorrectOrdinal).not.toHaveBeenCalled();
      expect(screen.getByText('6º semestre')).toBeTruthy();
    });

    it('o teto do ordinal é o global (12), não o total do curso', () => {
      const onCorrectOrdinal = vi.fn();
      render(
        <JourneyNow
          journey={{ ...journeyFor(8, 9), activeTermId: 'trm-9', activeTermLabel: '9º semestre' }}
          onCorrectOrdinal={onCorrectOrdinal}
          onSetTotalSemesters={noop}
          onOpenSemesterWizard={noop}
          onShowToast={noop}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /corrigir semestre atual/ }));
      const input = screen.getByLabelText('em que semestre você está?') as HTMLInputElement;
      expect(input.max).toBe('12');
      fireEvent.change(input, { target: { value: '10' } });
      fireEvent.click(screen.getByRole('button', { name: 'guardar' }));
      expect(onCorrectOrdinal).toHaveBeenCalledWith('trm-9', 10);
    });

    it('edita o total com stepper, preso a 1..12', () => {
      const onSetTotalSemesters = vi.fn();
      const { rerender } = render(
        <JourneyNow
          journey={journeyFor(8, 6)}
          onCorrectOrdinal={noop}
          onSetTotalSemesters={onSetTotalSemesters}
          onOpenSemesterWizard={noop}
          onShowToast={noop}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /aumentar o total do curso/ }));
      expect(onSetTotalSemesters).toHaveBeenCalledWith(9);

      rerender(
        <JourneyNow
          journey={journeyFor(12, 6)}
          onCorrectOrdinal={noop}
          onSetTotalSemesters={onSetTotalSemesters}
          onOpenSemesterWizard={noop}
          onShowToast={noop}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /aumentar o total do curso/ }));
      expect(onSetTotalSemesters).toHaveBeenCalledTimes(1);

      rerender(
        <JourneyNow
          journey={journeyFor(1, 1)}
          onCorrectOrdinal={noop}
          onSetTotalSemesters={onSetTotalSemesters}
          onOpenSemesterWizard={noop}
          onShowToast={noop}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /diminuir o total do curso/ }));
      expect(onSetTotalSemesters).toHaveBeenCalledTimes(1);
    });

    it('o rascunho de correção reseta quando o período ativo muda de id', () => {
      const { rerender } = render(
        <JourneyNow
          journey={journeyFor(10, 6)}
          onCorrectOrdinal={noop}
          onSetTotalSemesters={noop}
          onOpenSemesterWizard={noop}
          onShowToast={noop}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /corrigir semestre atual/ }));
      fireEvent.change(screen.getByLabelText('em que semestre você está?'), {
        target: { value: '5' },
      });

      rerender(
        <JourneyNow
          journey={{ ...journeyFor(10, 7), activeTermId: 'trm-2', activeTermLabel: '7º semestre' }}
          onCorrectOrdinal={noop}
          onSetTotalSemesters={noop}
          onOpenSemesterWizard={noop}
          onShowToast={noop}
        />,
      );
      expect(screen.getByText('7º semestre')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /corrigir semestre atual/ }));
      expect((screen.getByLabelText('em que semestre você está?') as HTMLInputElement).value).toBe(
        '7',
      );
    });

    it('virar o semestre abre o wizard; sem período, abre o primeiro', () => {
      const onOpenSemesterWizard = vi.fn();
      const { rerender } = render(
        <JourneyNow
          journey={journeyFor(8, 6)}
          onCorrectOrdinal={noop}
          onSetTotalSemesters={noop}
          onOpenSemesterWizard={onOpenSemesterWizard}
          onShowToast={noop}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /virar o semestre/ }));
      expect(onOpenSemesterWizard).toHaveBeenCalledTimes(1);

      rerender(
        <JourneyNow
          journey={{ ...journeyFor(8, 6), hasActiveTerm: false, activeTermId: undefined }}
          onCorrectOrdinal={noop}
          onSetTotalSemesters={noop}
          onOpenSemesterWizard={onOpenSemesterWizard}
          onShowToast={noop}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: /abrir meu 1º semestre/ }));
      expect(onOpenSemesterWizard).toHaveBeenCalledTimes(2);
    });

    it('sem período ativo, não oferece correção', () => {
      render(
        <JourneyNow
          journey={{ ...journeyFor(8, 6), hasActiveTerm: false, activeTermId: undefined }}
          onCorrectOrdinal={noop}
          onSetTotalSemesters={noop}
          onOpenSemesterWizard={noop}
          onShowToast={noop}
        />,
      );
      expect(screen.queryByRole('button', { name: /corrigir/ })).toBeNull();
    });
  });
});
