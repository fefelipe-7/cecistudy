import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnderlineTabBar } from '../UnderlineTabBar';

const TABS = [
  { id: 'aulas', label: 'aulas' },
  { id: 'avaliacoes', label: 'avaliações' },
  { id: 'calendario', label: 'calendário' },
];

describe('UnderlineTabBar', () => {
  it('renderiza todas as abas e marca a ativa', () => {
    render(<UnderlineTabBar tabs={TABS} active="aulas" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'aulas' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'avaliações' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'calendário' })).toBeInTheDocument();
  });

  it('chama onChange ao clicar', () => {
    const onChange = vi.fn();
    render(<UnderlineTabBar tabs={TABS} active="aulas" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'avaliações' }));
    expect(onChange).toHaveBeenCalledWith('avaliacoes');
  });

  it('aceita classe customizada', () => {
    const { container } = render(
      <UnderlineTabBar tabs={TABS} active="aulas" onChange={() => {}} className="my-custom" />
    );
    expect(container.firstChild).toHaveClass('my-custom');
  });
});