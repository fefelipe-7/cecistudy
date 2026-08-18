import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleRow } from '../ToggleRow';

describe('ToggleRow', () => {
  it('renderiza rótulo, descrição e switch', () => {
    render(
      <ToggleRow
        label="notificações"
        description="receba lembretes"
        checked
        onChange={() => {}}
      />
    );
    expect(screen.getByText('notificações')).toBeInTheDocument();
    expect(screen.getByText('receba lembretes')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'notificações' })).toHaveAttribute('aria-checked', 'true');
  });

  it('chama onChange ao alternar o switch', () => {
    const onChange = vi.fn();
    render(<ToggleRow label="notificações" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('renderiza conteúdo extra e ícone', () => {
    render(
      <ToggleRow
        label="arquivos"
        checked
        onChange={() => {}}
        icon={<span data-testid="icone" />}
        extra={<p>não concedido</p>}
      />
    );
    expect(screen.getByTestId('icone')).toBeInTheDocument();
    expect(screen.getByText('não concedido')).toBeInTheDocument();
  });

  it('repassa disabled para o switch', () => {
    render(<ToggleRow label="arquivos" checked disabled onChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});