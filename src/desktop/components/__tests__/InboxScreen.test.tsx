import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DesktopAppProvider } from '../../../../apps/desktop/src/DesktopAppProvider';
import { DesktopAppShell } from '../../../shells/DesktopAppShell';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const seedSuggestion = () => {
  localStorage.setItem(
    'cecistudy_onboarding',
    JSON.stringify({ completed: true, completedAt: new Date().toISOString() })
  );
  localStorage.setItem(
    'cecistudy_suggestions',
    JSON.stringify([
      {
        id: 'sgt-1',
        workspaceId: 'ws-academico',
        type: 'relation',
        payload: { sourceId: 'doc-a', targetId: 'doc-b' },
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ])
  );
};

describe('InboxScreen (Fase 6)', () => {
  it('mostra sugestão pendente e aceita', async () => {
    seedSuggestion();
    render(
      <DesktopAppProvider>
        <DesktopAppShell />
      </DesktopAppProvider>
    );

    fireEvent.click(screen.getByLabelText('abrir inbox de conhecimento'));

    await waitFor(() => {
      expect(screen.getByText('relação entre doc-a e doc-b')).toBeTruthy();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('relação entre doc-a e doc-b'));
    fireEvent.click(screen.getByText('aceitar'));

    await waitFor(() => {
      expect(screen.getByText('tudo em dia')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('recusa a sugestão', async () => {
    seedSuggestion();
    render(
      <DesktopAppProvider>
        <DesktopAppShell />
      </DesktopAppProvider>
    );

    fireEvent.click(screen.getByLabelText('abrir inbox de conhecimento'));

    await waitFor(() => {
      expect(screen.getByText('relação entre doc-a e doc-b')).toBeTruthy();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('relação entre doc-a e doc-b'));
    fireEvent.click(screen.getByText('rejeitar'));

    await waitFor(() => {
      expect(screen.getByText('tudo em dia')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('estado vazio quando não há sugestões', async () => {
    localStorage.setItem(
      'cecistudy_onboarding',
      JSON.stringify({ completed: true, completedAt: new Date().toISOString() })
    );
    render(
      <DesktopAppProvider>
        <DesktopAppShell />
      </DesktopAppProvider>
    );
    fireEvent.click(screen.getByLabelText('abrir inbox de conhecimento'));

    await waitFor(() => {
      expect(screen.getByText('pendente')).toBeTruthy();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByText('pendente'));

    await waitFor(() => {
      expect(screen.getByText(/tudo tranquilo/)).toBeTruthy();
    }, { timeout: 3000 });
  });
});
