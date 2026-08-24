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

  it('mostra busca e filtra opções individualmente em listas grandes', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ value: `v${i}`, label: `matéria ${i + 1}` }));
    render(<Picker value="" onChange={() => {}} options={many} />);
    fireEvent.click(screen.getByRole('button', { name: 'escolher...' }));
    const search = screen.getByLabelText(/buscar em/i);
    fireEvent.change(search, { target: { value: 'matéria 7' } });
    expect(screen.getByRole('option', { name: 'matéria 7' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'matéria 2' })).not.toBeInTheDocument();
  });

  it('não mostra busca em listas curtas', () => {
    render(<Picker value="" onChange={() => {}} options={OPTIONS} />);
    fireEvent.click(screen.getByRole('button', { name: 'escolher...' }));
    expect(screen.queryByLabelText(/buscar em/i)).not.toBeInTheDocument();
  });

  it('oferece "sem vínculo" para limpar a seleção quando clearable', () => {
    const onChange = vi.fn();
    render(<Picker value="a" onChange={onChange} options={OPTIONS} clearable />);
    fireEvent.click(screen.getByRole('button', { name: 'opção a' }));
    fireEvent.click(screen.getByRole('button', { name: 'sem vínculo' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('empty state com onCreate exibe CTA de criação contextual', () => {
    const onCreate = vi.fn();
    render(
      <Picker
        value=""
        onChange={() => {}}
        options={[]}
        emptyMessage="ainda não há disciplinas."
        createLabel="criar matéria agora"
        onCreate={onCreate}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /criar matéria agora/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});