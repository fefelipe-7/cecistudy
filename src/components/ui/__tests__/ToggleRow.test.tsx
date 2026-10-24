import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToggleRow } from '../ToggleRow';

// Só o que é de `ToggleRow` mesmo está aqui: `icon` e `extra`. O comportamento do
// switch (`aria-checked`, `onChange`, `disabled`) é contrato do `Toggle` e já é
// gateado em `Toggle.test.tsx` — reafirmar aqui gastava teste sem nova garantia.

describe('ToggleRow', () => {
  it('renderiza conteúdo extra e ícone ao lado do switch', () => {
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

  it('mostra o rótulo que nomeia o switch', () => {
    render(<ToggleRow label="arquivos" checked onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'arquivos' })).toBeInTheDocument();
  });
});
