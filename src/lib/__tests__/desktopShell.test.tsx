import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { DesktopAppShell } from '../../shells/DesktopAppShell';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('DesktopAppShell (smoke)', () => {
  it('renderiza sidebar + topbar quando onboarding concluído', () => {
    localStorage.setItem(
      'cecistudy_onboarding',
      JSON.stringify({ completed: true, completedAt: new Date().toISOString() })
    );
    render(
      <AppProvider>
        <DesktopAppShell />
      </AppProvider>
    );

    // marca da sidebar + rodapé
    expect(screen.getAllByText('cecistudy ♡').length).toBeGreaterThanOrEqual(1);
    // abas principais
    expect(screen.getByText('faculdade')).toBeTruthy();
    expect(screen.getByText('estudos')).toBeTruthy();
    expect(screen.getByText('biblioteca')).toBeTruthy();
    // ação rápida
    expect(screen.getByText('novo registro')).toBeTruthy();
    // rodapé
    expect(screen.getByText(/seu cantinho acadêmico/)).toBeTruthy();
  });

  it('mostra onboarding em tela cheia no primeiro acesso', () => {
    render(
      <AppProvider>
        <DesktopAppShell />
      </AppProvider>
    );
    expect(screen.queryByText('cecistudy ♡')).toBeNull();
  });
});
