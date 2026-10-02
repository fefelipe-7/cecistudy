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

/**
 * N2b (SPEC-008 D3): o `totalSemesters` era usado como teto do `ordinal` **no
 * input e no domínio** — e o `totalSemesters` não tinha editor nenhum. Curso de
 * 8 semestres, mas a usuária está no 9º: o único número que a appknows how to
 * say é 9, e o único campo onde ela poderia digitar 9 recusava o 9. Sem saída.
 */
describe('JourneyTermCard — trava circular do ordinal (SPEC-008 N2b)', () => {
  it('aceita um ordinal acima do total configurado (o teto é o global, não o curso)', () => {
    const onCorrectOrdinal = vi.fn();
    render(
      <JourneyTermCard
        activeTerm={term({ id: 'trm-9', ordinal: 9, label: '9º semestre' })}
        totalSemesters={8}
        onCorrectOrdinal={onCorrectOrdinal}
        onShowToast={noopToast}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /corrigir/i }));
    const input = screen.getByLabelText('em que semestre você está?') as HTMLInputElement;
    // o teto é 12 (MAX_TERM_ORDINAL), não 8
    expect(input.max).toBe('12');

    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'guardar' }));
    expect(onCorrectOrdinal).toHaveBeenCalledWith('trm-9', 10);
  });

  it('avisa que o semestre está além do total, em vez de mostrar 100% calado', () => {
    render(
      <JourneyTermCard
        activeTerm={term({ id: 'trm-9', ordinal: 9, label: '9º semestre' })}
        totalSemesters={8}
        onCorrectOrdinal={() => {}}
        onShowToast={noopToast}
      />
    );
    // o número que o `degreeProgress` estácalcando (125%) não ajuda ninguém
    expect(screen.getByText(/100% do curso/)).toBeDefined();
    expect(screen.getByText(/além dos 8/)).toBeDefined();
  });
});

/** N2 (SPEC-008 D2): o total do curso não tinha editor — era a trava acima. */
describe('JourneyTermCard — total do curso', () => {
  it('edita o total com um stepper, sem passar do teto global', () => {
    const onSetTotal = vi.fn();
    render(
      <JourneyTermCard
        activeTerm={term()}
        totalSemesters={8}
        onCorrectOrdinal={() => {}}
        onSetTotalSemesters={onSetTotal}
        onShowToast={noopToast}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /aumentar o total/i }));
    expect(onSetTotal).toHaveBeenCalledWith(9);
  });

  it('não deixa passar de 12 nem abaixo de 1', () => {
    const onSetTotal = vi.fn();
    const { rerender } = render(
      <JourneyTermCard
        activeTerm={term()}
        totalSemesters={12}
        onCorrectOrdinal={() => {}}
        onSetTotalSemesters={onSetTotal}
        onShowToast={noopToast}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /aumentar o total/i }));
    // já está no teto: nada é gravado
    expect(onSetTotal).not.toHaveBeenCalled();

    rerender(
      <JourneyTermCard
        activeTerm={term()}
        totalSemesters={1}
        onCorrectOrdinal={() => {}}
        onSetTotalSemesters={onSetTotal}
        onShowToast={noopToast}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /diminuir o total/i }));
    expect(onSetTotal).not.toHaveBeenCalled();
  });
});

/**
 * N2c: o botão de corrigir era um lápis de 36px, só com `aria-label`. O nome
 * acessível existia, mas a usuária via um ícone ambíguo — e a área de toque
 * ficava abaixo dos 44px do design system.
 */
describe('JourneyTermCard — affordance de corrigir (SPEC-008 N2c)', () => {
  it('o botão de corrigir tem rótulo visível e área de toque de 44px', () => {
    render(
      <JourneyTermCard
        activeTerm={term()}
        totalSemesters={10}
        onCorrectOrdinal={() => {}}
        onShowToast={noopToast}
      />
    );
    const btn = screen.getByRole('button', { name: /corrigir/i });
    expect(btn.textContent).toMatch(/corrigir/i);
    expect(btn.className).toContain('touch-target');
  });
});

/** N4: o cartão era a superfície onde se arruma o semestre — e não tinha a virada. */
describe('JourneyTermCard — virar o semestre (SPEC-008 N4)', () => {
  it('oferece virar o semestre a partir do próprio cartão', () => {
    const onOpenWizard = vi.fn();
    render(
      <JourneyTermCard
        activeTerm={term()}
        totalSemesters={10}
        onCorrectOrdinal={() => {}}
        onOpenSemesterWizard={onOpenWizard}
        onShowToast={noopToast}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /virar o semestre/i }));
    expect(onOpenWizard).toHaveBeenCalled();
  });

  it('sem período ativo, o botão abre o primeiro (não um wizard de virada)', () => {
    const onOpenWizard = vi.fn();
    render(
      <JourneyTermCard
        activeTerm={null}
        totalSemesters={10}
        onCorrectOrdinal={() => {}}
        onOpenSemesterWizard={onOpenWizard}
        onShowToast={noopToast}
      />
    );
    const btn = screen.getByRole('button', { name: /abrir meu 1º semestre/i });
    fireEvent.click(btn);
    expect(onOpenWizard).toHaveBeenCalled();
  });
});
