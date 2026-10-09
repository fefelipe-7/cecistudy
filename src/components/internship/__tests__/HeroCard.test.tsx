import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroCard } from '../../ui/HeroCard';

// SPEC-010 D2: `HeroCard` é apresentação pura — mesma assinatura e mesmo molde
// das heroes de referência (`faculdade/HeroSection.tsx`). I1 exige que cada
// superfície do Estágio renderize exatamente um `testId="hero-card"`.

describe('HeroCard', () => {
  it('renderiza eyebrow, título, resumo e testId padrão', () => {
    render(<HeroCard eyebrow="estágio" title="132h de campo" summary="meta 300h · 3 pendências ♡" />);
    const hero = screen.getByTestId('hero-card');
    expect(hero).toBeInTheDocument();
    expect(screen.getByText('estágio')).toBeInTheDocument();
    expect(screen.getByText('132h de campo')).toBeInTheDocument();
    expect(screen.getByText(/meta 300h/)).toBeInTheDocument();
  });

  it('expõe o molde do hero: serifa acadêmica e raio 26', () => {
    render(<HeroCard eyebrow="estágio" title="0h de campo" />);
    const titulo = screen.getByText('0h de campo');
    expect(titulo.className).toContain('font-serif-academic');
    expect(screen.getByTestId('hero-card').className).toContain('rounded-[26px]');
  });

  it('chama onClick da ação e usa aria-label', () => {
    const onClick = vi.fn();
    render(<HeroCard eyebrow="estágio" title="12h" action={{ label: 'anotar', onClick, ariaLabel: 'anotar no estágio' }} />);
    const botao = screen.getByLabelText('anotar no estágio');
    botao.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('usa aria-label do label quando não há ariaLabel', () => {
    render(<HeroCard eyebrow="paciente" title="M. S." action={{ label: 'nova sessão', onClick: () => {} }} />);
    expect(screen.getByRole('button', { name: 'nova sessão' })).toBeInTheDocument();
  });

  it('troca o gradiente no accent blue', () => {
    const { rerender } = render(<HeroCard eyebrow="paciente" title="M. S." accent="rose" />);
    expect(screen.getByTestId('hero-card').className).toContain('to-surface-rose');
    rerender(<HeroCard eyebrow="paciente" title="M. S." accent="blue" />);
    expect(screen.getByTestId('hero-card').className).toContain('to-surface-blue');
  });

  it('sem ação não renderiza botão, sem console.error', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<HeroCard eyebrow="estágio" title="0h" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });
});
