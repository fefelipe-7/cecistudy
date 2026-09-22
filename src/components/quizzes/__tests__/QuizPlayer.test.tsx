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

const NO_EXPLANATION: StudyQuestion = {
  id: 'q3',
  question: 'Qual a capital do Brasil?',
  options: ['ri', 'sp', 'brasília', 'bh'],
  answer: 'brasília',
  gabarito: 'C',
  area: 'geral',
  tema: 'geral',
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

function renderPlayer(overrides?: Partial<QuizPlayState>) {
  const onAnswer = vi.fn();
  const onAdvance = vi.fn();
  const onFinish = vi.fn();
  render(
    <QuizPlayer
      state={buildState(overrides)}
      onAnswer={onAnswer}
      onAdvance={onAdvance}
      onFinish={onFinish}
    />
  );
  return { onAnswer, onAdvance, onFinish };
}

describe('QuizPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marca resposta incorreta em vermelho e libera continuação', async () => {
    const { onAnswer, onAdvance } = renderPlayer();

    const wrongButton = screen.getByText('vermelho').closest('button')!;
    expect(wrongButton).not.toBeDisabled();

    fireEvent.click(wrongButton);

    expect(onAnswer).toHaveBeenCalledTimes(1);
    const answerArg = onAnswer.mock.calls[0][0] as QuizAnswer;
    expect(answerArg.correct).toBe(false);
    expect(answerArg.userAnswer).toBe('A');

    expect(wrongButton).toHaveClass('bg-status-danger-surface');

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByText('continuar')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('avança para a próxima questão após resposta correta', async () => {
    const { onAnswer, onAdvance } = renderPlayer();

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

  it('exibe uma única barra de progresso', () => {
    renderPlayer();
    expect(screen.getAllByTestId('quiz-progress')).toHaveLength(1);
  });

  it('desabilita as opções após selecionar (sem segunda resposta no duplo toque)', () => {
    const { onAnswer } = renderPlayer();

    const button = screen.getByText('azul').closest('button')!;
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
  });

  it('mostra fallback quando a questão não tem explicação', async () => {
    const { onAnswer } = renderPlayer({ pool: [NO_EXPLANATION], currentIdx: 0, answers: [] });

    fireEvent.click(screen.getByText('brasília').closest('button')!);
    expect(onAnswer).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByText('sem explicação disponível')).toBeInTheDocument();
  });

  it('formata o timer da questão em segundos com 1 casa decimal', async () => {
    vi.setSystemTime(100_000);
    renderPlayer({ questionStartTime: 100_000 });

    expect(screen.getByText('0.0s')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('1.0s')).toBeInTheDocument();
  });

  it('chama onFinish com payload exato na última questão', async () => {
    const t = 123_456;
    vi.setSystemTime(t);
    const { onFinish } = renderPlayer({ currentIdx: 1, startTime: t, questionStartTime: t });

    fireEvent.click(screen.getByText('4').closest('button')!);

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(onFinish).toHaveBeenCalledWith([], CONFIG, t, 0, 2);
  });
});