import React, { useState } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuizPlayer } from '../QuizPlayer';
import type { StudyQuestion, QuizConfig, QuizPlayState } from '../../../types';

function makeQuestion(no: number): StudyQuestion {
  return {
    id: `q${no}`,
    question: `pergunta ${no}`,
    options: ['opcao a', 'opcao b', 'opcao c', 'opcao d'],
    answer: 'opcao b',
    gabarito: 'B',
    explanation: `explicação ${no}`,
    area: 'geral',
    tema: 'geral',
    escolaOuAbordagem: 'geral',
    dificuldade: 'basica',
  };
}

const POOL = Array.from({ length: 20 }, (_, i) => makeQuestion(i + 1));

const CONFIG: QuizConfig = {
  areas: ['geral'],
  temas: ['geral'],
  escolas: ['geral'],
  dificuldades: ['basica'],
  count: 20,
};

const buildState = (): QuizPlayState => ({
  pool: POOL,
  config: CONFIG,
  answers: [],
  currentIdx: 0,
  startTime: Date.now(),
  questionStartTime: Date.now(),
});

/**
 * Harness que espelha o pai real (SharedScreenLayers): `onAnswer` faz append
 * de resposta, `onAdvance` soma no `currentIdx`. Sessão de 20 questões.
 */
function Harness() {
  const [state, setState] = useState<QuizPlayState>(buildState);
  const [finished, setFinished] = useState(false);

  return (
    <>
      <QuizPlayer
        state={state}
        onAnswer={(answer) => setState((s) => ({ ...s, answers: [...s.answers, answer] }))}
        onAdvance={() =>
          setState((s) => ({ ...s, currentIdx: s.currentIdx + 1, questionStartTime: Date.now() }))
        }
        onFinish={() => setFinished(true)}
      />
      <div data-testid="finished">{finished ? 'yes' : 'no'}</div>
    </>
  );
}

/** Responde a questão atual com 'opcao b' e avança pela explicação. */
async function answerAndAdvance() {
  fireEvent.click(screen.getByText('opcao b').closest('button')!);
  await act(async () => {
    vi.advanceTimersByTime(350);
  });
  fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
}

describe('QuizPlayer (regressão: fluxo de sessão 20 questões)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('responde as 20 questões até o fim sem travar (bug da 2ª questão em diante)', async () => {
    render(<Harness />);

    for (let n = 1; n <= 20; n += 1) {
      expect(screen.getByText(`pergunta ${n}`)).toBeInTheDocument();
      const button = screen.getByText('opcao b').closest('button')!;
      fireEvent.click(button);
      // A resposta precisa registrar de verdade (botão desabilita na hora).
      expect(screen.getByText('opcao b').closest('button')).toBeDisabled();
      await act(async () => {
        vi.advanceTimersByTime(350);
      });
      expect(screen.getByText('continuar')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
      if (n < 20) {
        expect(screen.getByText(`pergunta ${n + 1}`)).toBeInTheDocument();
      }
    }

    expect(screen.getByTestId('finished').textContent).toBe('yes');
  }, 20000);
});