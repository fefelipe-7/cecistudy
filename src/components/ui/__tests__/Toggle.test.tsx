import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('marca o switch com aria-checked conforme o estado', () => {
    render(<Toggle checked label="ativar" onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'ativar' })).toHaveAttribute('aria-checked', 'true');
  });

  it('chama onChange ao clicar', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} label="ativar" onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('fica desabilitado quando disabled', () => {
    const onChange = vi.fn();
    render(<Toggle checked disabled label="ativar" onChange={onChange} />);
    const sw = screen.getByRole('switch');
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fica desabilitado quando loading', () => {
    render(<Toggle checked loading label="ativar" onChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});