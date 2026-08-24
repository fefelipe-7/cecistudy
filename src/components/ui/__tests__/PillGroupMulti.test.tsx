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

  it('lista grande (>8) alterna para modo busca com contador, chips e limpar tudo', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      value: `v${i}`,
      label: `autor ${i + 1}`,
    }));
    const onChange = vi.fn();
    render(<PillGroupMulti value={['v0', 'v1'] as string[]} onChange={onChange} options={many} />);

    expect(screen.getByText('2 selecionados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'limpar tudo' })).toBeInTheDocument();

    // chip removível
    fireEvent.click(screen.getByRole('button', { name: 'remover autor 1' }));
    expect(onChange).toHaveBeenCalledWith(['v1']);

    // busca filtra individualmente
    fireEvent.change(screen.getByLabelText('buscar opções'), { target: { value: 'autor 7' } });
    expect(screen.getByRole('checkbox', { name: 'autor 7' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'autor 2' })).not.toBeInTheDocument();

    // marcar pela lista
    fireEvent.click(screen.getByRole('checkbox', { name: 'autor 7' }));
    expect(onChange).toHaveBeenCalledWith(['v0', 'v1', 'v6']);
  });

  it('"limpar tudo" esvazia a seleção', () => {
    const onChange = vi.fn();
    const many = Array.from({ length: 10 }, (_, i) => ({ value: `v${i}`, label: `opção ${i}` }));
    render(<PillGroupMulti value={['v0'] as string[]} onChange={onChange} options={many} />);
    fireEvent.click(screen.getByRole('button', { name: 'limpar tudo' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('searchThreshold=false mantém pills mesmo em listas grandes', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ value: `v${i}`, label: `opção ${i}` }));
    render(
      <PillGroupMulti value={[]} onChange={() => {}} options={many} searchThreshold={false} />
    );
    expect(screen.queryByLabelText(/buscar em/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(12);
  });
});