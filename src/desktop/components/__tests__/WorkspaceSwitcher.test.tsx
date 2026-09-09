import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DesktopAppProvider } from '../../../../apps/desktop/src/DesktopAppProvider';
import { DesktopAppShell } from '../../../shells/DesktopAppShell';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const renderDesktop = () => {
  localStorage.setItem(
    'cecistudy_onboarding',
    JSON.stringify({ completed: true, completedAt: new Date().toISOString() })
  );
  return render(
    <DesktopAppProvider>
      <DesktopAppShell />
    </DesktopAppProvider>
  );
};

describe('WorkspaceSwitcher (Fase 3)', () => {
  it('cria e troca para um novo workspace', () => {
    renderDesktop();

    // abre o seletor
    fireEvent.click(screen.getByLabelText('trocar workspace'));

    // cria um workspace profissional
    fireEvent.click(screen.getByText('novo workspace'));
    const input = screen.getByPlaceholderText('nome do workspace') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'clínica' } });
    fireEvent.click(screen.getByText('criar'));

    // reabre e confirma que o workspace criado está listado
    fireEvent.click(screen.getByLabelText('trocar workspace'));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('clínica')).toBeTruthy();
  });

  it('mostra o workspace atual como ativo', () => {
    renderDesktop();
    // o workspace padrão é "acadêmico"
    expect(screen.getByText(/workspace · acadêmico/)).toBeTruthy();
  });
});
