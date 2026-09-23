import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Card3D } from '../../components/flashcards/Card3D';
import { RatingBar, DEFAULT_RATING_OPTIONS } from '../../components/flashcards/RatingBar';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches,
      media: q,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Card3D', () => {
  it('mostra as duas faces e expõe o estado do flip via data-flipped', () => {
    render(
      <Card3D
        flipped={false}
        front={<span>pergunta</span>}
        back={<span>resposta</span>}
        ariaLabel="cartão de estudo"
      />
    );
    expect(screen.getByTestId('card3d')).toHaveAttribute('data-flipped', 'false');
    expect(screen.getByText('pergunta')).toBeInTheDocument();
    expect(screen.getByText('resposta')).toBeInTheDocument();
  });

  it('toque dispara onFlipChange com o estado oposto (controle no pai)', () => {
    const spy = vi.fn();
    render(
      <Card3D
        flipped={false}
        onFlipChange={spy}
        front={<span>pergunta</span>}
        back={<span>resposta</span>}
        ariaLabel="cartão de estudo"
      />
    );
    const card = screen.getByRole('button', { name: 'cartão de estudo' });
    fireEvent.click(card);
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('Enter (teclado) também vira o card', () => {
    const spy = vi.fn();
    render(
      <Card3D
        flipped={false}
        onFlipChange={spy}
        front={<span>pergunta</span>}
        back={<span>resposta</span>}
        ariaLabel="cartão de estudo"
      />
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'cartão de estudo' }), { key: 'Enter' });
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('com prefers-reduced-motion usa crossfade (data-reduced + opacity nas faces)', () => {
    mockMatchMedia(true);
    const { rerender } = render(
      <Card3D flipped={false} front={<span>pergunta</span>} back={<span>resposta</span>} />
    );
    expect(screen.getByTestId('card3d')).toHaveAttribute('data-reduced', 'true');

    const faces = screen.getByTestId('card3d').children;
    // dom order: front, back
    expect(faces[0]).toHaveClass('opacity-100');
    expect(faces[1]).toHaveClass('opacity-0');
    // no modo reduzido a face de trás NÃO usa pré-rotação 3D (crossfade puro)
    const backClasses = [...faces[1].classList].join(' ');
    expect(backClasses).not.toContain('rotateY');

    rerender(<Card3D flipped front={<span>pergunta</span>} back={<span>resposta</span>} />);
    expect(screen.getByTestId('card3d')).toHaveAttribute('data-flipped', 'true');
    const updatedFaces = screen.getByTestId('card3d').children;
    expect(updatedFaces[0]).toHaveClass('opacity-0');
    expect(updatedFaces[1]).toHaveClass('opacity-100');
  });
});

describe('RatingBar', () => {
  it('renderiza as 4 opções com rótulo e intervalo', () => {
    render(<RatingBar options={DEFAULT_RATING_OPTIONS} onGrade={() => {}} />);
    const group = screen.getByRole('group', { name: 'avaliar sua resposta' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'esqueci · volta em agora' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'fácil · volta em 1sem' })).toBeInTheDocument();
  });

  it('dispara onGrade com a qualidade certa em cada botão', () => {
    const spy = vi.fn();
    render(<RatingBar options={DEFAULT_RATING_OPTIONS} onGrade={spy} />);
    for (const opt of DEFAULT_RATING_OPTIONS) {
      fireEvent.click(screen.getByRole('button', { name: `${opt.label} · volta em ${opt.interval}` }));
    }
    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy.mock.calls.flat()).toEqual([0, 1, 2, 3]);
  });

  it('respeita disabled', () => {
    const spy = vi.fn();
    render(<RatingBar options={DEFAULT_RATING_OPTIONS} onGrade={spy} disabled />);
    fireEvent.click(screen.getByRole('button', { name: 'lembrei · volta em 1d' }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('intervalo opcional: sem interval, aria-label só com o rótulo', () => {
    render(<RatingBar options={[{ quality: 0, label: 'esqueci' }]} onGrade={() => {}} />);
    expect(screen.getByRole('button', { name: 'esqueci' })).toBeInTheDocument();
  });
});