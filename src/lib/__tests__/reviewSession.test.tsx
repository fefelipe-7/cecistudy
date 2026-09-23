import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReviewSession } from '../../components/flashcards/ReviewSession';
import { initCard } from '../fsrs';
import type { Flashcard } from '../../types';

const mkCard = (id: string, over: Partial<Flashcard> = {}): Flashcard =>
  initCard({ id, question: `q-${id}`, answer: `a-${id}`, ...over });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

interface HarnessOpts {
  allCards?: Flashcard[];
  dueCards?: Flashcard[];
  profileName?: string;
}

const renderSession = (opts: HarnessOpts = {}) => {
  const allCards = opts.allCards ?? [mkCard('c1'), mkCard('c2')];
  const dueCards = opts.dueCards ?? allCards;
  const profileName = opts.profileName ?? 'Ceci';
  const onGrade = vi.fn<(id: string, quality: number) => void>();
  const onRestore = vi.fn<(card: Flashcard) => void>();
  const onManage = vi.fn<(id: string) => void>();
  render(
    <ReviewSession
      allCards={allCards}
      dueCards={dueCards}
      profileName={profileName}
      onGrade={onGrade}
      onRestore={onRestore}
      onManage={onManage}
    />
  );
  return { onGrade, onRestore, onManage };
};

describe('ReviewSession — fluxo Anki', () => {
  it('começa com a pergunta do primeiro cartão e sem botões de veredito', () => {
    renderSession();
    expect(screen.getByText('q-c1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mostrar resposta/i })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'avaliar sua resposta' })).not.toBeInTheDocument();
  });

  it('revela resposta e mostra 4 vereditos com o próximo vencimento previsto', () => {
    renderSession();
    fireEvent.click(screen.getByRole('button', { name: /mostrar resposta/i }));
    expect(screen.getByText('a-c1')).toBeInTheDocument();
    const group = screen.getByRole('group', { name: 'avaliar sua resposta' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect(screen.getByRole('button', { name: /esqueci/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fácil/i })).toBeInTheDocument();
  });

  it('aplicar um veredito chama onGrade(id, quality) e avança', () => {
    const { onGrade } = renderSession();
    fireEvent.click(screen.getByRole('button', { name: /mostrar resposta/i }));
    fireEvent.click(screen.getByRole('button', { name: /fácil/i }));
    expect(onGrade).toHaveBeenCalledWith('c1', 3);
    // avança para o segundo cartão
    expect(screen.getByText('q-c2')).toBeInTheDocument();
  });

  it('mostra contagem de revisados no rodapé', () => {
    renderSession();
    fireEvent.click(screen.getByRole('button', { name: /mostrar resposta/i }));
    fireEvent.click(screen.getByRole('button', { name: /lembrei/i }));
    expect(screen.getByText(/revisados: 1/i)).toBeInTheDocument();
  });

  it('ao terminar a fila, celebra e mostra contagem + próxima rodada', () => {
    const { onGrade } = renderSession();
    fireEvent.click(screen.getByRole('button', { name: /mostrar resposta/i }));
    fireEvent.click(screen.getByRole('button', { name: /fácil/i }));
    fireEvent.click(screen.getByRole('button', { name: /mostrar resposta/i }));
    fireEvent.click(screen.getByRole('button', { name: /fácil/i }));
    expect(onGrade).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/revisão concluída/i)).toBeInTheDocument();
    expect(screen.getByText(/você revisou 2 cartões hoje/i)).toBeInTheDocument();
    expect(screen.getByText(/parabéns Ceci/i)).toBeInTheDocument();
  });

  it('undo restaura o snapshot (onRestore) e volta um passo', () => {
    const { onRestore } = renderSession();
    fireEvent.click(screen.getByRole('button', { name: /mostrar resposta/i }));
    fireEvent.click(screen.getByRole('button', { name: /fácil/i }));
    expect(screen.getByText('q-c2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /desfazer/i }));
    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore.mock.calls[0][0].id).toBe('c1');
    expect(screen.getByText('q-c1')).toBeInTheDocument();
  });

  it('sem cartões vencidos, mostra "revisar todos" (mas não quando não há nada)', () => {
    renderSession({ allCards: [mkCard('c1')], dueCards: [] });
    expect(screen.getByText(/tudo em dia por aqui/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /revisar todos \(1\)/i })).toBeInTheDocument();
  });
});