import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CardCreation3D } from '../../components/flashcards/CardCreation3D';
import { CardBaúEnvelope } from '../../components/flashcards/CardBaúEnvelope';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CardCreation3D — card-form com flip', () => {
  it('renderiza o textarea da pergunta e o botão de virar', () => {
    render(
      <CardCreation3D question="" onQuestionChange={() => {}} answer="" onAnswerChange={() => {}} />
    );
    expect(screen.getByPlaceholderText('qual a pergunta do card?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /virar o card/i })).toBeInTheDocument();
    expect(screen.getByTestId('card3d')).toHaveAttribute('data-flipped', 'false');
  });

  it('digitando atualiza a pergunta; virar o card foca o verso', () => {
    const onQuestion = vi.fn();
    const onAnswer = vi.fn();
    render(
      <CardCreation3D
        question=""
        onQuestionChange={onQuestion}
        answer=""
        onAnswerChange={onAnswer}
      />
    );
    const front = screen.getByPlaceholderText('qual a pergunta do card?');
    fireEvent.change(front, { target: { value: 'o que é a Catarse?' } });
    expect(onQuestion).toHaveBeenCalledWith('o que é a Catarse?');

    fireEvent.click(screen.getByRole('button', { name: /virar o card/i }));
    // virou (sinal determinístico no palco do Card3D)
    expect(screen.getByTestId('card3d')).toHaveAttribute('data-flipped', 'true');

    const back = screen.getByPlaceholderText('a resposta, com suas palavras...');
    fireEvent.change(back, { target: { value: 'vazão de emoções.' } });
    expect(onAnswer).toHaveBeenCalledWith('vazão de emoções.');
  });

  it('Enter (sem shift) vira o card; shift+enter mantém', () => {
    render(
      <CardCreation3D question="" onQuestionChange={() => {}} answer="" onAnswerChange={() => {}} />
    );
    const front = screen.getByPlaceholderText('qual a pergunta do card?');
    fireEvent.keyDown(front, { key: 'Enter', shiftKey: false });
    expect(screen.getByTestId('card3d')).toHaveAttribute('data-flipped', 'true');

    const back = screen.getByPlaceholderText('a resposta, com suas palavras...');
    fireEvent.keyDown(back, { key: 'Enter', shiftKey: true });
    // virou de volta? não — shift+enter não vira
    expect(screen.getByTestId('card3d')).toHaveAttribute('data-flipped', 'true');

    fireEvent.keyDown(back, { key: 'Enter', shiftKey: false });
    expect(screen.getByTestId('card3d')).toHaveAttribute('data-flipped', 'false');
  });
});

describe('CardBaúEnvelope — baú de confirmação', () => {
  it('fechado não mostra o card dentro', () => {
    render(
      <CardBaúEnvelope open={false} card={{ question: 'x?', answer: 'y' }} label="guardado no baú ♡" />
    );
    expect(screen.getByText('guardado no baú ♡')).toBeInTheDocument();
    expect(screen.queryByText('x?')).not.toBeInTheDocument();
  });

  it('aberto revela o mini-card com a pergunta guardada', () => {
    render(
      <CardBaúEnvelope open card={{ question: 'o que é a Catarse?', answer: 'vazão de emoções.' }} />
    );
    expect(screen.getByText('o que é a Catarse?')).toBeInTheDocument();
  });
});