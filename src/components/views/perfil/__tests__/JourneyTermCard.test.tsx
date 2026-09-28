import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JourneyTermCard from '../JourneyTermCard';
import type { AcademicTerm } from '../../../../types';

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

const noopToast = () => {};

/**
 * O bug que este cartão substitui (SPEC-006 D6): o Perfil tinha um input
 * "semestre atual" que gravava em `profile.semester` — campo que a UI já não lia,
 * porque a fonte de verdade é o `AcademicTerm` ativo. A usuária digitava 6,
 * apertava guardar e a tela não mudava. O número digitado aqui tem que virar o
 * ordinal do período ativo.
 */
describe('JourneyTermCard', () => {
  it('mostra o período ativo e o progresso do curso', () => {
    render(
      <JourneyTermCard
        activeTerm={term()}
        totalSemesters={10}
        onCorrectOrdinal={() => {}}
        onShowToast={noopToast}
      />
    );
    expect(screen.getByText('6º semestre')).toBeDefined();
    // a linha de progresso é um nó só: "60% do curso · faltam 4 semestres"
    expect(screen.getByText(/60% do curso/)).toBeDefined();
    expect(screen.getByText(/faltam 4 semestres/)).toBeDefined();
  });

  it('usa o singular quando falta só um semestre', () => {
    render(
      <JourneyTermCard
        activeTerm={term({ ordinal: 9, label: '9º semestre' })}
        totalSemesters={10}
        onCorrectOrdinal={() => {}}
        onShowToast={noopToast}
      />
    );
    expect(screen.getByText(/falta 1 semestre/)).toBeDefined();
  });

  it('corrige o ordinal do período ativo (o que o input fantasma não fazia)', () => {
    const onCorrectOrdinal = vi.fn();
    render(
      <JourneyTermCard
        activeTerm={term()}
        totalSemesters={10}
        onCorrectOrdinal={onCorrectOrdinal}
        onShowToast={noopToast}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /corrigir o semestre atual/i }));
    const input = screen.getByLabelText('em que semestre você está?') as HTMLInputElement;
    expect(input.value).toBe('6');

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'guardar' }));

    // o id do período vem junto: corrigir o 5º e o 6º é a mesma chamada com
    // alvo diferente, e sem o id a UI poderia corrigir o semestre errado
    expect(onCorrectOrdinal).toHaveBeenCalledWith('trm-1', 5);
  });

  it('escape cancela sem corrigir', () => {
    const onCorrectOrdinal = vi.fn();
    render(
      <JourneyTermCard
        activeTerm={term()}
        totalSemesters={10}
        onCorrectOrdinal={onCorrectOrdinal}
        onShowToast={noopToast}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /corrigir o semestre atual/i }));
    const input = screen.getByLabelText('em que semestre você está?') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onCorrectOrdinal).not.toHaveBeenCalled();
    // volta para a leitura, com o número real do período
    expect(screen.getByText('6º semestre')).toBeDefined();
  });

  it('o rascunho reseta quando o período ativo muda de id', () => {
    // sem isso, corrigir o 5º no 6º deixaria o rascunho "5" ao trocar de período
    // e a próxima gravação escreveria o número do semestre anterior
    const { rerender } = render(
      <JourneyTermCard
        activeTerm={term()}
        totalSemesters={10}
        onCorrectOrdinal={() => {}}
        onShowToast={noopToast}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /corrigir o semestre atual/i }));
    fireEvent.change(screen.getByLabelText('em que semestre você está?'), { target: { value: '5' } });

    rerender(
      <JourneyTermCard
        activeTerm={term({ id: 'trm-2', ordinal: 7, label: '7º semestre' })}
        totalSemesters={10}
        onCorrectOrdinal={() => {}}
        onShowToast={noopToast}
      />
    );

    expect(screen.getByText('7º semestre')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /corrigir o semestre atual/i }));
    expect((screen.getByLabelText('em que semestre você está?') as HTMLInputElement).value).toBe('7');
  });

  it('sem período ativo, orienta a abrir o primeiro em vez de mostrar input', () => {
    const onCorrectOrdinal = vi.fn();
    render(
      <JourneyTermCard
        activeTerm={null}
        totalSemesters={10}
        onCorrectOrdinal={onCorrectOrdinal}
        onShowToast={noopToast}
      />
    );
    expect(screen.getByText(/ainda não abriu um semestre/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /corrigir/i })).toBeNull();
  });
});
