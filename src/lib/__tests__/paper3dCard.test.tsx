import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Paper3DCard } from '../../../src/components/flashcards/Paper3DCard';

vi.stubGlobal('IntersectionObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Paper3DCard', () => {
  it('renderiza as duas faces como chips sobre o palco 3D com data-flipped', () => {
    render(
      <Paper3DCard
        flipped={false}
        ariaLabel="cartão de estudo"
        front={<p>pergunta</p>}
        back={<p>resposta</p>}
      />
    );
    const card = screen.getByTestId('paper3d-card');
    expect(card).toHaveAttribute('data-flipped', 'false');
    expect(card).toHaveClass('aspect-[3/4]');
    expect(screen.getByText('pergunta')).toBeInTheDocument();
    expect(screen.getByText('resposta')).toBeInTheDocument();
    expect(card.querySelector('.shader-frame')).not.toBeNull();
  });

  it('chips cruzam com o flipped (aria-hidden + data-flipped)', () => {
    const { rerender } = render(
      <Paper3DCard flipped={false} front={<span>pergunta</span>} back={<span>resposta</span>} />
    );
    const chipFront = screen.getByText('pergunta').closest('div.rounded-3xl');
    const chipBack = screen.getByText('resposta').closest('div.rounded-3xl');
    // `flipped=false`: frente visível (sem aria-hidden), verso oculto para AT
    expect(chipFront?.parentElement).not.toHaveAttribute('aria-hidden');
    expect(chipBack?.parentElement).toHaveAttribute('aria-hidden', 'true');

    rerender(<Paper3DCard flipped front={<span>pergunta</span>} back={<span>resposta</span>} />);
    expect(screen.getByTestId('paper3d-card')).toHaveAttribute('data-flipped', 'true');
    // flipped=true: frente oculto para AT, verso visível
    const updatedFront = screen.getByText('pergunta').closest('div.rounded-3xl');
    const updatedBack = screen.getByText('resposta').closest('div.rounded-3xl');
    expect(updatedFront?.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(updatedBack?.parentElement).not.toHaveAttribute('aria-hidden');
  });

  it('lazy ThreeDPaper é carregado dentro do shader-frame (chunk 3d-paper)', async () => {
    render(<Paper3DCard front={<span>pergunta</span>} back={<span>resposta</span>} />);
    const card = screen.getByTestId('paper3d-card');
    expect(card.querySelector('.shader-frame')).not.toBeNull();
    await vi.waitFor(() => {
      const iframe = card.querySelector('iframe');
      expect(iframe, 'iframe do shader 3d-paper deveria estar montado').not.toBeNull();
    }, { timeout: 15000, interval: 100 });
    // O teto do teste precisa ser MAIOR que o `waitFor`: com o default de 5s, sob
    // carga paralela o import lazy estourava o externo e o `waitFor` de 15s
    // nunca chegou a ser considerado. Os dois tetos são do mesmo relógio.
  }, 20_000);
});