import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PillGroup } from '../PillGroup';

const OPTIONS: { value: 'a' | 'b'; label: string }[] = [
  { value: 'a', label: 'opção a' },
  { value: 'b', label: 'opção b' },
];

const A: string = 'a';

describe('PillGroup', () => {
  it('renderiza as opções e marca a selecionada', () => {
    render(<PillGroup value={A} onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByRole('button', { name: 'opção a' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'opção b' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('chama onChange com o valor ao clicar', () => {
    const onChange = vi.fn();
    render(<PillGroup value={A} onChange={onChange} options={OPTIONS} />);
    fireEvent.click(screen.getByRole('button', { name: 'opção b' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
