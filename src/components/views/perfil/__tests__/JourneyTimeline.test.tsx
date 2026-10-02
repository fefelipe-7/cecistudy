import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import JourneyTimeline from '../JourneyTimeline';
import type { AcademicTerm, UserProfile } from '../../../../types';

const term = (over: Partial<AcademicTerm> = {}): AcademicTerm =>
  ({
    id: 'trm-1',
    ordinal: 6,
    label: '6º semestre',
    status: 'ativo',
    startedAt: '2026-02-01',
    statusTransitionAt: '2026-02-01T00:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    ...over,
  }) as AcademicTerm;

/** Resumo só com o que a timeline lê (`summary.courses`). */
const summary = (courses: number) => ({ courses }) as AcademicTerm['summary'];

const profile = (over: Partial<UserProfile> = {}): UserProfile =>
  ({
    name: '',
    semester: 6,
    totalSemesters: 8,
    totalSemesters_placeholder: undefined,
    ...over,
  }) as unknown as UserProfile;

const renderTimeline = (academicTerms: AcademicTerm[], over: Partial<UserProfile> = {}) =>
  render(
    <JourneyTimeline
      profile={profile(over)}
      percentDegree={75}
      academicTerms={academicTerms}
      onOpenSemesterWizard={vi.fn()}
      onOpenTermHistory={vi.fn()}
    />,
  );

/**
 * F4.10: a timeline desenhava o array de slots a partir de `1..totalSemesters` e
 * buscava o período de cada slot com `academicTerms.find(t => t.ordinal === sem)`.
 * `find` devolve o **primeiro** do array, e a ordem do array não é a ordem da
 * recência (`termsByRecency` existe justamente porque o sync ordena por id). Com
 * dois períodos no mesmo `ordinal` — o que a correção de número (F3) e uma
 * virada podem produzir — o slot mostrava o resumo do período errado.
 */
describe('JourneyTimeline — resolução do período por slot', () => {
  it('com dois períodos no mesmo ordinal, mostra o mais recente', () => {
    // `termsByRecency` ordena por `endedAt ?? statusTransitionAt ?? startedAt`,
    // do mais novo ao mais velho: `trm-novo` (julho) ganha do `trm-antigo` (fev).
    renderTimeline([
      term({ id: 'trm-antigo', ordinal: 6, status: 'encerrado', summary: summary(3) }),
      term({
        id: 'trm-novo',
        ordinal: 6,
        status: 'encerrado',
        statusTransitionAt: '2026-07-01T00:00:00.000Z',
        summary: summary(7),
      }),
    ]);
    expect(screen.getByText('7 disciplinas')).toBeTruthy();
    expect(screen.queryByText('3 disciplinas')).toBeNull();
  });

  it('a ordem em que o array chega não muda o resultado', () => {
    // Mesmo par, ordem inversa no array — o resultado tem que ser o mesmo.
    renderTimeline([
      term({
        id: 'trm-novo',
        ordinal: 6,
        status: 'encerrado',
        statusTransitionAt: '2026-07-01T00:00:00.000Z',
        summary: summary(7),
      }),
      term({ id: 'trm-antigo', ordinal: 6, status: 'encerrado', summary: summary(3) }),
    ]);
    expect(screen.getByText('7 disciplinas')).toBeTruthy();
    expect(screen.queryByText('3 disciplinas')).toBeNull();
  });

  it('um slot sem período correspondente não mostra resumo', () => {
    renderTimeline([term({ id: 'trm-1', ordinal: 6 })]);
    // Só existe o 6º num curso de 8: 5 slots passados, o 6º em andamento e 2
    // "aguardando" — nenhum deles inventa número de disciplina.
    expect(screen.queryByText(/disciplinas?$/)).toBeNull();
    expect(screen.getAllByText('aguardando')).toHaveLength(2);
    expect(screen.getAllByText('✓ concluído')).toHaveLength(5);
    expect(screen.getByText('🌸 em andamento')).toBeTruthy();
  });
});
