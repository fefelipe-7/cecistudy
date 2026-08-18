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
    expect(screen.getByRole('button', { name: 'opção b' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('chama onChange com o valor ao clicar', () => {
    const onChange = vi.fn();
    render(<PillGroup value={A} onChange={onChange} options={OPTIONS} />);
    fireEvent.click(screen.getByRole('button', { name: 'opção b' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renderiza o label e o emoji da opção', () => {
    render(
      <PillGroup
        label="meu grupo"
        value={A}
        onChange={() => {}}
        options={[{ value: 'a', label: 'teste', emoji: '✨' }]}
      />
    );
    expect(screen.getByText('meu grupo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /✨ teste/ })).toBeInTheDocument();
  });

  it('aceita tamanho pequeno', () => {
    const { container } = render(<PillGroup value={A} onChange={() => {}} options={OPTIONS} size="sm" />);
    expect(container.firstChild).toBeTruthy();
  });
});