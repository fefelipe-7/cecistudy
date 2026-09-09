import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DesktopAppProvider } from '../../../apps/desktop/src/DesktopAppProvider';
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
      <DesktopAppProvider>
        <DesktopAppShell />
      </DesktopAppProvider>
    );

    // marca da sidebar + rodapé
    expect(screen.getAllByText('cecistudy ♡').length).toBeGreaterThanOrEqual(1);
    // grupos de navegação (JSON: cecistudy-desktop-shell.json) — aparecem na
    // sidebar e (como atalhos) na Home desktop, então checamos presença (>=1).
    expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Base de Conhecimento').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Calendário').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Projetos & TCC').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Estudos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Marketing').length).toBeGreaterThanOrEqual(1);
    // ação rápida
    expect(screen.getByText('novo registro')).toBeTruthy();
    // rodapé
    expect(screen.getByText(/seu cantinho acadêmico/)).toBeTruthy();
  });

  it('mostra onboarding em tela cheia no primeiro acesso', () => {
    render(
      <DesktopAppProvider>
        <DesktopAppShell />
      </DesktopAppProvider>
    );
    expect(screen.queryByText('cecistudy ♡')).toBeNull();
  });
});
