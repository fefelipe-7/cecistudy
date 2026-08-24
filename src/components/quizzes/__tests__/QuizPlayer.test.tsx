import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuizPlayer } from '../QuizPlayer';
import type { StudyQuestion, QuizConfig, QuizPlayState, QuizAnswer } from '../../../types';

const QUESTION: StudyQuestion = {
  id: 'q1',
  question: 'Qual a cor do céu?',
  options: ['vermelho', 'azul', 'verde', 'amarelo'],
  answer: 'azul',
  gabarito: 'B',
  explanation: 'o céu é azul por causa da dispersão de Rayleigh.',
  area: 'natureza',
  tema: 'ciências',
  escolaOuAbordagem: 'geral',
  dificuldade: 'basica',
};

const SECOND_QUESTION: StudyQuestion = {
  id: 'q2',
  question: '2 + 2 = ?',
  options: ['3', '4', '5', '6'],
  answer: '4',
  gabarito: 'B',
  explanation: 'é 4',
  area: 'matemática',
  tema: 'aritmética',
  escolaOuAbordagem: 'geral',
  dificuldade: 'basica',
};

const POOL = [QUESTION, SECOND_QUESTION];

const CONFIG: QuizConfig = {
  areas: ['natureza'],
  temas: ['ciências'],
  escolas: ['geral'],
  dificuldades: ['basica'],
  count: 2,
};

function buildState(overrides?: Partial<QuizPlayState>): QuizPlayState {
  return {
    pool: POOL,
    config: CONFIG,
    answers: [],
    currentIdx: 0,
    startTime: Date.now(),
    questionStartTime: Date.now(),
    ...overrides,
  };
}

describe('QuizPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marca resposta incorreta em vermelho e libera continuação', async () => {
    const onAnswer = vi.fn();
    const onAdvance = vi.fn();
    const onFinish = vi.fn();

    render(
      <QuizPlayer
        state={buildState()}
        onAnswer={onAnswer}
        onAdvance={onAdvance}
        onFinish={onFinish}
      />
    );

    const wrongButton = screen.getByText('vermelho').closest('button')!;
    expect(wrongButton).not.toBeDisabled();

    fireEvent.click(wrongButton);

    expect(onAnswer).toHaveBeenCalledTimes(1);
    const answerArg = onAnswer.mock.calls[0][0] as QuizAnswer;
    expect(answerArg.correct).toBe(false);
    expect(answerArg.userAnswer).toBe('A');

    expect(wrongButton).toHaveClass('bg-red-50');

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByText('continuar')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('avança para a próxima questão após resposta correta', async () => {
    const onAnswer = vi.fn();
    const onAdvance = vi.fn();
    const onFinish = vi.fn();

    render(
      <QuizPlayer
        state={buildState()}
        onAnswer={onAnswer}
        onAdvance={onAdvance}
        onFinish={onFinish}
      />
    );

    fireEvent.click(screen.getByText('azul').closest('button')!);

    expect(onAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true, userAnswer: 'B' })
    );

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByText('continuar')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(onAdvance).toHaveBeenCalled();
  });

  it('chama onFinish no avanço da última questão', async () => {
    const onAnswer = vi.fn();
    const onAdvance = vi.fn();
    const onFinish = vi.fn();

    render(
      <QuizPlayer
        state={buildState({ currentIdx: 1 })}
        onAnswer={onAnswer}
        onAdvance={onAdvance}
        onFinish={onFinish}
      />
    );

    expect(screen.getByText('2 + 2 = ?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('4').closest('button')!);

    expect(onAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true })
    );

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(onFinish).toHaveBeenCalled();
  });
});