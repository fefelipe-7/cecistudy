/**
 * SPEC-013 D1/D8/I3 — a memória mostra o que foi fechado (no máximo 2 no resumo)
 * e **não** repete o CTA de virada (que vive só em `JourneyNow`). Os estados
 * vazios (sem período ativo e com período ativo mas sem histórico) são texto,
 * nunca caixa em branco.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JourneyHistory from '../JourneyHistory';
import type { ProfileJourney } from '../../../../lib/profileViewModel';

const journey = (over: Partial<ProfileJourney> = {}): ProfileJourney => ({
  currentOrdinal: 6,
  totalSemesters: 8,
  percent: 75,
  semestersLeft: 2,
  activeTermLabel: '6º semestre',
  activeTermId: 'trm-6',
  hasActiveTerm: true,
  beyondCourseEstimate: false,
  slots: [],
  history: [],
  ...over,
});

const row = (ordinal: number, over: Partial<ProfileJourney['history'][number]> = {}) => ({
  ordinal,
  label: `${ordinal}º semestre`,
  courses: 5,
  highlights: [`destaque do ${ordinal}º`],
  ...over,
});

describe('JourneyHistory', () => {
  it('mostra no máximo dois períodos fechados no resumo', () => {
    render(
      <JourneyHistory
        journey={journey({ history: [row(5), row(4), row(3)] })}
        onOpenTermHistory={vi.fn()}
      />,
    );
    expect(screen.getByText('5º semestre')).toBeTruthy();
    expect(screen.getByText('4º semestre')).toBeTruthy();
    expect(screen.queryByText('3º semestre')).toBeNull();
  });

  it('não repete o CTA de virada (I3)', () => {
    render(
      <JourneyHistory journey={journey({ history: [row(5)] })} onOpenTermHistory={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: /virar o semestre/ })).toBeNull();
  });

  it('o CTA de histórico chama onOpenTermHistory', () => {
    const onOpenTermHistory = vi.fn();
    render(<JourneyHistory journey={journey()} onOpenTermHistory={onOpenTermHistory} />);
    fireEvent.click(screen.getByRole('button', { name: /histórico/ }));
    expect(onOpenTermHistory).toHaveBeenCalledTimes(1);
  });

  it('sem histórico e com período ativo, convida em vez de mostrar caixa vazia', () => {
    render(<JourneyHistory journey={journey()} onOpenTermHistory={vi.fn()} />);
    expect(screen.getByText(/quando este semestre for encerrado/)).toBeTruthy();
  });

  it('sem período ativo, aponta para o primeiro semestre', () => {
    render(
      <JourneyHistory
        journey={journey({ hasActiveTerm: false, activeTermId: undefined, history: [] })}
        onOpenTermHistory={vi.fn()}
      />,
    );
    expect(screen.getByText(/começa quando o primeiro semestre for encerrado/)).toBeTruthy();
  });

  it('usa singular quando o período fechou com uma disciplina', () => {
    render(
      <JourneyHistory
        journey={journey({ history: [row(5, { courses: 1 })] })}
        onOpenTermHistory={vi.fn()}
      />,
    );
    expect(screen.getByText('1 disciplina')).toBeTruthy();
  });
});
