import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Picker } from '../Picker';

const OPTIONS = [
  { value: 'a', label: 'opção a' },
  { value: 'b', label: 'opção b' },
];

describe('Picker', () => {
  it('exibe o label da opção selecionada no botão', () => {
    render(<Picker value="a" onChange={() => {}} options={OPTIONS} label="disciplina" />);
    expect(screen.getByText('disciplina')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'opção a' })).toBeInTheDocument();
  });

  it('exibe o placeholder quando não há seleção', () => {
    render(<Picker value="" onChange={() => {}} options={OPTIONS} placeholder="escolher disciplina" />);
    expect(screen.getByRole('button', { name: 'escolher disciplina' })).toBeInTheDocument();
  });

  it('abre a sheet e chama onChange ao selecionar uma opção', () => {
    const onChange = vi.fn();
    render(<Picker value="a" onChange={onChange} options={OPTIONS} />);
    fireEvent.click(screen.getByRole('button', { name: 'opção a' }));
    const option = screen.getByRole('option', { name: 'opção b' });
    fireEvent.click(option);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('mostra a mensagem de vazio quando não há opções', () => {
    render(<Picker value="" onChange={() => {}} options={[]} emptyMessage="sem opções ainda" />);
    expect(screen.getByText('sem opções ainda')).toBeInTheDocument();
  });

  it('marca a opção selecionada com aria-selected', () => {
    render(<Picker value="b" onChange={() => {}} options={OPTIONS} />);
    fireEvent.click(screen.getByRole('button', { name: 'opção b' }));
    expect(screen.getByRole('option', { name: 'opção b' })).toHaveAttribute('aria-selected', 'true');
  });
});