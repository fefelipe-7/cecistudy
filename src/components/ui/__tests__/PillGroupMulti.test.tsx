import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PillGroupMulti } from '../PillGroupMulti';

const OPTIONS: { value: 'a' | 'b'; label: string }[] = [
  { value: 'a', label: 'opção a' },
  { value: 'b', label: 'opção b' },
];

describe('PillGroupMulti', () => {
  it('marca as opções presentes no valor', () => {
    render(<PillGroupMulti value={['a'] as string[]} onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByRole('button', { name: 'opção a' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'opção b' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('adiciona uma opção não selecionada ao clicar', () => {
    const onChange = vi.fn();
    render(<PillGroupMulti value={['a'] as string[]} onChange={onChange} options={OPTIONS} />);
    fireEvent.click(screen.getByRole('button', { name: 'opção b' }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('remove a opção já selecionada ao clicar', () => {
    const onChange = vi.fn();
    render(<PillGroupMulti value={['a', 'b'] as string[]} onChange={onChange} options={OPTIONS} />);
    fireEvent.click(screen.getByRole('button', { name: 'opção a' }));
    expect(onChange).toHaveBeenCalledWith(['b']);
  });

  it('aceita label do grupo', () => {
    render(<PillGroupMulti label="multi" value={[]} onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByText('multi')).toBeInTheDocument();
  });
});