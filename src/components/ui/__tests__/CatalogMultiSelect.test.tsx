import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CatalogMultiSelect, type CatalogSelectOption } from '../CatalogMultiSelect';

const OPTIONS: CatalogSelectOption[] = [
  { value: 'con-1', label: 'recalque', group: 'pessoal' },
  { value: 'acervo-c:t1', label: '✦ recalque-acervo', hint: 'do acervo', group: 'acervo' },
  { value: 'cat-1', label: 'Manual de DSM', hint: 'por APA', group: 'catalogo', badge: 'livro' },
  { value: 'con-2', label: 'transferência', group: 'pessoal' },
];

describe('CatalogMultiSelect', () => {
  it('agrupa as opções por origem com cabeçalhos', () => {
    render(<CatalogMultiSelect open onClose={() => {}} title="conceitos-chave" value={[]} onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByText('do seu cantinho')).toBeInTheDocument();
    expect(screen.getByText('do acervo ✦')).toBeInTheDocument();
    expect(screen.getByText('do catálogo')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'recalque' })).toBeInTheDocument();
  });

  it('marca os valores selecionados com check', () => {
    render(<CatalogMultiSelect open onClose={() => {}} title="conceitos-key" value={['con-1']} onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByRole('checkbox', { name: 'recalque' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'transferência' })).toHaveAttribute('aria-checked', 'false');
  });

  it('adiciona e remove ao clicar', () => {
    const onChange = vi.fn();
    render(<CatalogMultiSelect open onClose={() => {}} title="conceitos" value={['con-1']} onChange={onChange} options={OPTIONS} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'transferência' }));
    expect(onChange).toHaveBeenCalledWith(['con-1', 'con-2']);
    fireEvent.click(screen.getByRole('checkbox', { name: 'recalque' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('busca filtra por label e hint entre grupos', () => {
    render(<CatalogMultiSelect open onClose={() => {}} title="bibliografia" value={[]} onChange={() => {}} options={OPTIONS} />);
    fireEvent.change(screen.getByLabelText('buscar em bibliografia'), { target: { value: 'manual' } });
    expect(screen.getByRole('checkbox', { name: /Manual de DSM/ })).toBeInTheDocument();
    expect(screen.queryByText('recalque')).not.toBeInTheDocument();
    expect(screen.queryByText('do seu cantinho')).not.toBeInTheDocument(); // grupo inteiro some
  });

  it('chip removível aparece para opção selecionada', () => {
    const onChange = vi.fn();
    render(<CatalogMultiSelect open onClose={() => {}} title="conceitos" value={['con-1']} onChange={onChange} options={OPTIONS} />);
    fireEvent.click(screen.getByRole('button', { name: 'remover recalque' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('"limpar tudo" esvazia a seleção', () => {
    const onChange = vi.fn();
    render(<CatalogMultiSelect open onClose={() => {}} title="conceitos" value={['con-1', 'con-2']} onChange={onChange} options={OPTIONS} />);
    fireEvent.click(screen.getByRole('button', { name: 'limpar tudo' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('mostra contador de selecionados', () => {
    render(<CatalogMultiSelect open onClose={() => {}} title="conceitos" value={['con-1']} onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByText('1 selecionado')).toBeInTheDocument();
  });
});